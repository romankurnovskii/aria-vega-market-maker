import { IPositionProvider, Position, PoolInfo, MarketSnapshot, ProtocolType } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { HummingbotWalletManager } from './wallet-manager.js';
import { GatewayWallet } from '@lp-system/core';
import { getBinIdFromPrice } from '../meteora/meteora.utils.js';
import { PoolResponse } from '../meteora/types.js';

const logger = getLogger('hummingbot-provider');
const METEORA_DATAPI_URL = 'https://dlmm.datapi.meteora.ag';

/**
 * Hummingbot API provider for pool and market data.
 * Implements IPositionProvider by calling Meteora Datapi for reads
 * and Hummingbot Gateway API for writes.
 */
export class HummingbotProvider implements IPositionProvider {
  private apiUrl: string;
  private walletManager: HummingbotWalletManager;
  private authHeaders: Record<string, string>;
  private poolDataCache = new Map<string, { data: PoolResponse; timestamp: number }>();

  /**
   * @param {string} apiUrl - Hummingbot API base URL (e.g., http://localhost:8000).
   */
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl || 'http://localhost:8000';

    const username = process.env.HUMMINGBOT_API_USERNAME || 'admin';
    const password = process.env.HUMMINGBOT_API_PASSWORD || 'admin';
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this.authHeaders = { Authorization: `Basic ${encoded}`, Accept: 'application/json' };

    this.walletManager = new HummingbotWalletManager(this.apiUrl, this.authHeaders);
    logger.info(`[HummingbotProvider] Initialized with API URL: ${this.apiUrl}`);
  }

  /**
   * Fetches full pool data from Meteora Datapi with shared 10s cache.
   */
  private async fetchPoolData(poolAddress: string): Promise<PoolResponse> {
    const cached = this.poolDataCache.get(poolAddress);
    const now = Date.now();
    if (cached && now - cached.timestamp < 10000) {
      return cached.data;
    }

    const response = await fetch(`${METEORA_DATAPI_URL}/pools/${poolAddress}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'HummingbotProvider/1.0' },
    });

    if (!response.ok) {
      throw new Error(`[HummingbotProvider] Failed to fetch pool data for ${poolAddress}: HTTP ${response.status}`);
    }

    const data = (await response.json()) as PoolResponse;
    this.poolDataCache.set(poolAddress, { data, timestamp: now });
    return data;
  }

  /**
   * Lists all registered Hummingbot wallets.
   */
  public async listWallets(): Promise<{ chain: string; address: string; is_default: boolean }[]> {
    try {
      return await this.walletManager.listWallets();
    } catch (error) {
      logger.error(`[HummingbotProvider] Failed to list wallets: ${error}`);
      throw error;
    }
  }

  /**
   * Returns the default wallet address for the system.
   */
  public async getWalletAddress(chain: string = 'solana'): Promise<string> {
    try {
      const address = await this.walletManager.getDefaultWallet(chain);
      if (!address) {
        logger.info(`[HummingbotProvider] No default wallet found for ${chain}. Creating new one...`);
        return await this.walletManager.createWallet(chain);
      }
      return address;
    } catch (error) {
      logger.error(`[HummingbotProvider] Error getting wallet address for chain ${chain}: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches static pool metadata for a given pool address via Meteora Datapi.
   */
  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    logger.info(`[HummingbotProvider] Fetching pool info for ${poolAddress}`);

    const data = await this.fetchPoolData(poolAddress);

    const activeBinId = getBinIdFromPrice(
      data.current_price,
      data.pool_config.bin_step,
      data.token_x.decimals,
      data.token_y.decimals
    );

    const feeRate = data.dynamic_fee_pct > 0 ? data.dynamic_fee_pct : data.pool_config.base_fee_pct / 100;

    return {
      poolAddress: data.address,
      chain: 'solana',
      protocol: 'meteora_dlmm' as ProtocolType,
      feeRate,
      activeBound: activeBinId,
      price: data.current_price,
      tokenXAddress: data.token_x.address,
      tokenYAddress: data.token_y.address,
      binStep: data.pool_config.bin_step,
      activeBinId,
      tokenXMint: data.token_x.address,
      tokenYMint: data.token_y.address,
      tokenXDecimals: data.token_x.decimals,
      tokenYDecimals: data.token_y.decimals,
    };
  }

  /**
   * Fetches wallet balances for specific tokens.
   * Calls GET /accounts/gateway/wallets
   */
  public async getWalletBalances(
    walletAddress: string,
    tokenX: string,
    tokenY: string
  ): Promise<{ amountX: string; amountY: string }> {
    logger.info(`[HummingbotProvider] Fetching wallet balances for ${walletAddress}`);

    const url = `${this.apiUrl}/accounts/gateway/wallets`;

    try {
      const response = await fetch(url, {
        headers: this.authHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const wallet = data.find((w: GatewayWallet) => w.address === walletAddress || w.is_default);

        if (wallet && wallet.balances) {
          return {
            amountX: wallet.balances[tokenX] || '0',
            amountY: wallet.balances[tokenY] || '0',
          };
        }
        return { amountX: '0', amountY: '0' };
      } else {
        throw new Error('Cannot parse wallet balances: Unexpected API response format.');
      }
    } catch (error) {
      logger.error(`[HummingbotProvider] Error fetching wallet balances: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches positions owned by a wallet via Meteora Datapi.
   * Discovers pools via /portfolio/open, then fetches position details per pool.
   */
  public async getPositions(walletAddress: string, poolAddress?: string): Promise<Position[]> {
    const poolsToQuery: string[] = [];

    if (poolAddress) {
      poolsToQuery.push(poolAddress);
    } else {
      try {
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), 8000);
        const portRes = await fetch(`${METEORA_DATAPI_URL}/portfolio/open?user=${walletAddress}`, {
          signal: abort.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timer);
        if (portRes.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const portData = (await portRes.json()) as any;
          const pools = portData.pools || portData.data || [];
          for (const p of pools) {
            const addr = typeof p === 'string' ? p : p.poolAddress || p.address || p.pool_address;
            if (addr) poolsToQuery.push(addr);
          }
        }
      } catch (err) {
        logger.warn(`[HummingbotProvider] Failed to discover pools: ${err}`);
      }

      if (poolsToQuery.length === 0) {
        logger.info(`[HummingbotProvider] No pools discovered for wallet ${walletAddress}.`);
        return [];
      }
    }

    const allPositions: Position[] = [];

    for (const pool of poolsToQuery) {
      const url = `${METEORA_DATAPI_URL}/positions/${pool}/pnl?user=${walletAddress}&status=open`;

      try {
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), 10000);
        const res = await fetch(url, {
          signal: abort.signal,
          headers: { Accept: 'application/json', 'User-Agent': 'HummingbotProvider/1.0' },
        });
        clearTimeout(timer);

        if (!res.ok) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        const positionsList = Array.isArray(data.positions) ? data.positions : [];
        const dec = await this.resolvePoolDecimals(pool);

        for (const pos of positionsList) {
          const toRaw = (amt: string, decimals: number) =>
            String(Math.round(parseFloat(amt || '0') * Math.pow(10, decimals)));

          allPositions.push({
            id: pos.positionAddress,
            poolAddress: pool,
            chain: 'solana' as const,
            protocol: 'meteora_dlmm' as const,
            lowerBound: pos.lowerBinId ?? 0,
            upperBound: pos.upperBinId ?? 0,
            lowerBinId: pos.lowerBinId ?? 0,
            upperBinId: pos.upperBinId ?? 0,
            tokenX: {
              amount: toRaw(pos.allTimeDeposits?.tokenX?.amount, dec.decimalsX),
              decimals: dec.decimalsX,
              mint: data.tokenX,
              tokenAddress: data.tokenX,
            },
            tokenY: {
              amount: toRaw(pos.allTimeDeposits?.tokenY?.amount, dec.decimalsY),
              decimals: dec.decimalsY,
              mint: data.tokenY,
              tokenAddress: data.tokenY,
            },
            isInRange: !pos.isOutOfRange,
            openedAt: (pos.createdAt || Date.now()) * 1000,
            metadata: {
              leverage: 1,
              feeX: pos.allTimeFees?.tokenX?.amount || '0',
              feeY: pos.allTimeFees?.tokenY?.amount || '0',
              pnl: {
                pnlUsd: pos.pnlUsd,
                pnlPctChange: pos.pnlPctChange,
                poolActivePrice: pos.poolActivePrice,
                feePerTvl24h: pos.feePerTvl24h,
                allTimeFees: pos.allTimeFees,
                ...(pos.unrealizedPnl ? { unrealizedPnl: pos.unrealizedPnl } : {}),
              },
            },
          });
        }
      } catch (err) {
        logger.error(`[HummingbotProvider] Error fetching positions for pool ${pool}: ${err}`);
      }
    }

    return allPositions;
  }

  /**
   * Resolves token decimals via Meteora Datapi pools endpoint.
   */
  private poolDecimalsCache = new Map<string, { decimalsX: number; decimalsY: number }>();

  private async resolvePoolDecimals(poolAddress: string): Promise<{ decimalsX: number; decimalsY: number }> {
    const cached = this.poolDecimalsCache.get(poolAddress);
    if (cached) return cached;

    try {
      const data = await this.fetchPoolData(poolAddress);
      const decimals = { decimalsX: data.token_x.decimals, decimalsY: data.token_y.decimals };
      this.poolDecimalsCache.set(poolAddress, decimals);
      return decimals;
    } catch {
      const defaults = { decimalsX: 9, decimalsY: 6 };
      this.poolDecimalsCache.set(poolAddress, defaults);
      return defaults;
    }
  }

  public async getPosition(positionId: string, poolAddress?: string): Promise<Position> {
    const url = `${METEORA_DATAPI_URL}/position/${positionId}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'HummingbotProvider/1.0' },
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        return {
          id: data.address || positionId,
          poolAddress: data.pool_address || poolAddress || '',
          chain: 'solana' as const,
          protocol: 'meteora_dlmm' as const,
          lowerBound: data.lower_bin_id ?? 0,
          upperBound: data.upper_bin_id ?? 0,
          lowerBinId: data.lower_bin_id ?? 0,
          upperBinId: data.upper_bin_id ?? 0,
          tokenX: {
            amount: data.total_x_amount || '0',
            decimals: data.token_x?.decimals ?? 9,
            mint: data.token_x?.mint || '',
          },
          tokenY: {
            amount: data.total_y_amount || '0',
            decimals: data.token_y?.decimals ?? 6,
            mint: data.token_y?.mint || '',
          },
          isInRange: !data.is_out_of_range,
          openedAt: (data.created_at || Date.now()) * 1000,
          metadata: { leverage: 1 },
        };
      }
    } catch {
      // fall through to getPositions
    }

    const wallet = await this.getWalletAddress();
    const positions = await this.getPositions(wallet, poolAddress);
    const pos = positions.find((p) => p.id === positionId);
    if (pos) return pos;
    throw new Error(`Position ${positionId} not found`);
  }

  /**
   * Fetches a market snapshot for a pool via Meteora Datapi.
   * Includes price history from OHLCV endpoint.
   */
  public async getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot> {
    logger.info(`[HummingbotProvider] Fetching market snapshot for ${poolAddress}`);

    const poolData = await this.fetchPoolData(poolAddress);

    const activeBinId = getBinIdFromPrice(
      poolData.current_price,
      poolData.pool_config.bin_step,
      poolData.token_x.decimals,
      poolData.token_y.decimals
    );

    const feeRate = poolData.dynamic_fee_pct > 0 ? poolData.dynamic_fee_pct : poolData.pool_config.base_fee_pct / 100;

    let priceHistory: { price: number; timestamp: number }[] = [];

    try {
      const ohlcvUrl = `${METEORA_DATAPI_URL}/pools/${poolAddress}/ohlcv?timeframe=1h`;
      const ohlcvResponse = await fetch(ohlcvUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'HummingbotProvider/1.0' },
      });

      if (ohlcvResponse.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ohlcvData = (await ohlcvResponse.json()) as any;
        if (ohlcvData && Array.isArray(ohlcvData.data)) {
          priceHistory = ohlcvData.data
            .map((candle: { close: number; timestamp: number }) => ({
              price: candle.close,
              timestamp: candle.timestamp * 1000,
            }))
            .slice(-24);
        }
      }
    } catch {
      logger.warn(`[HummingbotProvider] Failed to fetch OHLCV for ${poolAddress}, using current price only`);
    }

    if (priceHistory.length === 0) {
      priceHistory = [{ price: poolData.current_price, timestamp: Date.now() }];
    }

    return {
      poolAddress: poolData.address,
      chain: 'solana',
      protocol: 'meteora_dlmm' as ProtocolType,
      activeBound: activeBinId,
      activeBinId,
      price: poolData.current_price,
      priceHistory,
      feeRate,
      capturedAt: Date.now(),
    };
  }
}
