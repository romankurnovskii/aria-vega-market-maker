/**
 * @file meteora-api-provider.ts
 * @description Meteora DLMM API provider implementing IPositionProvider for on-chain position data.
 *
 * @features
 * - Fetches user positions via Meteora public API
 * - Returns pool metadata and market snapshots (price, bin data)
 * - Currently returns mock/simulated data for development (hard-coded SOL-USDC position)
 *
 * @dependencies @lp-system/core (IPositionProvider interface types)
 * @sideEffects None — all methods are pure data fetchers with no local state mutation
 */
import { IPositionProvider, Position, PoolInfo } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { PoolResponse, PositionsPnlResponse } from './types';
import { getBinIdFromPrice, parseDecimalToRaw } from './meteora.utils';

const logger = getLogger('meteora-api-provider');

/**
 * Meteora API provider for position and market data.
 * Currently uses mock data; replace with real API calls in production.
 */
export class MeteoraApiProvider implements IPositionProvider {
  private apiUrl: string;

  private poolTokenMetadataCache = new Map<
    string,
    Promise<{ decimalsX: number; decimalsY: number; tokenXMint: string; tokenYMint: string; binStep: number }>
  >();

  private getPositionsCache = new Map<string, { data: Position[]; timestamp: number }>();
  private poolInfoCache = new Map<string, { data: PoolInfo; timestamp: number }>();
  private poolDataCache = new Map<string, { data: PoolResponse; timestamp: number }>();

  /**
   * Constructs the provider with the Meteora API base URL.
   *
   * @param {string} apiUrl - Meteora API endpoint (defaults to dlmm.datapi.meteora.ag).
   * @param {string} [walletAddress] - Optional cached operational wallet address.
   */
  constructor(
    private walletAddress?: string,
    private options?: { leverage?: number }
  ) {
    this.apiUrl = 'https://dlmm.datapi.meteora.ag';
  }

  /**
   * Fetches full token metadata (decimals and addresses) for a given pool address dynamically.
   * Caches results to prevent redundant API queries.
   */
  public async getPoolTokenMetadata(poolAddress: string): Promise<{
    decimalsX: number;
    decimalsY: number;
    tokenXMint: string;
    tokenYMint: string;
    binStep: number;
  }> {
    if (this.poolTokenMetadataCache.has(poolAddress)) {
      return this.poolTokenMetadataCache.get(poolAddress)!;
    }

    const metadataPromise = fetch(`${this.apiUrl}/pools/${poolAddress}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `[MeteoraApiProvider] Failed to fetch token metadata for pool ${poolAddress}: HTTP ${response.status} ${response.statusText}`
        );
      }

      logger.info(`[Meteora API] Received request to open position in pool ${poolAddress}`);

      const data = (await response.json()) as PoolResponse;

      return {
        decimalsX: data.token_x.decimals,
        decimalsY: data.token_y.decimals,
        tokenXMint: data.token_x.address,
        tokenYMint: data.token_y.address,
        binStep: data.pool_config.bin_step,
      };
    });

    this.poolTokenMetadataCache.set(poolAddress, metadataPromise);
    return metadataPromise;
  }

  /**
   * Fetches full pool data from /pools/{address} with shared cache.
   * Used by getPoolInfo, getMarketSnapshot, and internally.
   */
  private async fetchPoolData(poolAddress: string): Promise<PoolResponse> {
    const cached = this.poolDataCache.get(poolAddress);
    const now = Date.now();
    if (cached && now - cached.timestamp < 10000) {
      return cached.data;
    }

    const response = await fetch(`${this.apiUrl}/pools/${poolAddress}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `[MeteoraApiProvider] Failed to fetch pool data for ${poolAddress}: HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as PoolResponse;
    this.poolDataCache.set(poolAddress, { data, timestamp: now });
    return data;
  }

  public async getWalletBalances(
    walletAddress: string,
    tokenX: string,
    tokenY: string
  ): Promise<{ amountX: string; amountY: string }> {
    const { hummingbotProvider } = await import('../hummingbot/hummingbot-provider.js');
    return hummingbotProvider.getWalletBalances(walletAddress, tokenX, tokenY);
  }

  /**
   * Fetches all positions for a given wallet address.
   * Can accept an optional poolAddress parameter. If not provided, it attempts
   * to fetch open portfolio information to discover the pools.
   *
   * Implements a 30-second LRU cache to prevent redundant requests during batch calls.
   *
   * @param {string} walletAddress - Solana wallet public key.
   * @param {string} [poolAddress] - Optional specific pool address to query.
   * @returns {Promise<Position[]>} Array of position objects.
   */
  public async getPositions(walletAddress: string, poolAddress?: string): Promise<Position[]> {
    const cacheKey = `${walletAddress}:${poolAddress || 'all'}`;
    const cached = this.getPositionsCache.get(cacheKey);
    const now = Date.now();

    // Cache TTL: 30 seconds
    if (cached && now - cached.timestamp < 30000) {
      return cached.data;
    }

    logger.info(`[MeteoraApiProvider] Querying positions for wallet ${walletAddress} from API: ${this.apiUrl}`);

    const poolsToQuery: string[] = [];

    if (poolAddress) {
      poolsToQuery.push(poolAddress);
    } else {
      // Try to discover active pools via the /portfolio/open endpoint
      const portfolioUrl = `${this.apiUrl}/portfolio/open?user=${walletAddress}`;
      const portfolioResponse = await fetch(portfolioUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MeteoraLPBot/1.0',
        },
      });

      if (!portfolioResponse.ok) {
        throw new Error(
          `[MeteoraApiProvider] Failed to fetch open portfolio: HTTP ${portfolioResponse.status} ${portfolioResponse.statusText}`
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const portfolioData = (await portfolioResponse.json()) as any;
      const pools = Array.isArray(portfolioData) ? portfolioData : portfolioData.data || portfolioData.pools || [];

      for (const p of pools) {
        const addr = typeof p === 'string' ? p : p.address || p.pool_address || p.poolAddress;
        if (addr) {
          poolsToQuery.push(addr);
        }
      }

      if (poolsToQuery.length === 0) {
        logger.warn(`[MeteoraApiProvider] No pools found in portfolio response for wallet ${walletAddress}`);
      }
    }

    const leverage = this.options?.leverage ?? 10;

    // Fetch all pools concurrently
    const poolResults = await Promise.all(
      poolsToQuery.map(async (pool) => {
        const results: Position[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const url = `${this.apiUrl}/positions/${pool}/pnl?user=${walletAddress}&status=open&pageSize=200&page=${page}`;
          logger.info(`[MeteoraApiProvider] Fetching positions PnL from Datapi for pool ${pool} (page ${page})`);

          const response = await fetch(url, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'MeteoraLPBot/1.0',
            },
          });

          if (!response.ok) {
            throw new Error(
              `[MeteoraApiProvider] Failed to fetch positions PnL from Datapi for pool ${pool}: HTTP ${response.status} ${response.statusText}`
            );
          }

          const result = (await response.json()) as PositionsPnlResponse;
          const { decimalsX, decimalsY, tokenXMint, tokenYMint } = await this.getPoolTokenMetadata(pool);

          if (result && Array.isArray(result.positions)) {
            for (const pos of result.positions) {
              const lowerBinId = pos.lower_bin_id !== undefined ? pos.lower_bin_id : (pos.lowerBinId ?? 0);
              const upperBinId = pos.upper_bin_id !== undefined ? pos.upper_bin_id : (pos.upperBinId ?? 0);
              const isInRange =
                pos.is_in_range !== undefined
                  ? pos.is_in_range
                  : pos.isInRange !== undefined
                    ? pos.isInRange
                    : pos.isOutOfRange !== undefined
                      ? !pos.isOutOfRange
                      : true;
              const openedAt = pos.opened_at || (pos.createdAt ? pos.createdAt * 1000 : undefined) || Date.now() - 3600000;

              const positionId = pos.address || pos.positionAddress || pos.position_address || '';

              let amtX = '0';
              let amtY = '0';

              if (pos.unrealizedPnl?.balanceTokenX?.amount !== undefined) {
                amtX = parseDecimalToRaw(pos.unrealizedPnl.balanceTokenX.amount, decimalsX);
              } else if (pos.amount_x !== undefined) {
                amtX = pos.amount_x;
              } else if (pos.amountX !== undefined) {
                amtX = pos.amountX;
              }

              if (pos.unrealizedPnl?.balanceTokenY?.amount !== undefined) {
                amtY = parseDecimalToRaw(pos.unrealizedPnl.balanceTokenY.amount, decimalsY);
              } else if (pos.amount_y !== undefined) {
                amtY = pos.amount_y;
              } else if (pos.amountY !== undefined) {
                amtY = pos.amountY;
              }

              results.push({
                id: positionId,
                poolAddress: pos.pool_address || pool,
                chain: 'solana',
                protocol: 'meteora_dlmm',
                lowerBound: lowerBinId,
                upperBound: upperBinId,
                lowerBinId,
                upperBinId,
                tokenX: {
                  amount: amtX,
                  decimals: decimalsX,
                  mint: tokenXMint,
                  tokenAddress: tokenXMint,
                },
                tokenY: {
                  amount: amtY,
                  decimals: decimalsY,
                  mint: tokenYMint,
                  tokenAddress: tokenYMint,
                },
                isInRange,
                openedAt,
                pnlData: pos,
                state: pos.isClosed ? 'CLOSED' : 'OPEN',
                closedAt: pos.closedAt || undefined,
                metadata: {
                  leverage,
                  feeX: pos.fee_x || '0',
                  feeY: pos.fee_y || '0',
                },
              });
            }
          }

          hasNext = result.hasNext && result.totalCount > page * result.pageSize;
          page++;
        }

        return results;
      })
    );

    const allPositions = poolResults.flat();

    this.getPositionsCache.set(cacheKey, { data: allPositions, timestamp: Date.now() });

    // LRU: Cleanup old cache entries if cache grows too large
    if (this.getPositionsCache.size > 50) {
      const keysToDelete: string[] = [];
      for (const key of this.getPositionsCache.keys()) {
        if (keysToDelete.length < 10 && key !== cacheKey) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        this.getPositionsCache.delete(key);
      }
    }

    return allPositions;
  }

  /**
   * Fetches a single position by its on-chain identifier.
   * Reuses getPositions under the hood.
   *
   * @param {string} positionId - Unique position ID (pubkey on Solana).
   * @param {string} [poolAddress] - Optional specific pool address to query.
   * @param {string} [walletAddress] - Optional wallet address to override configured wallet.
   * @returns {Promise<Position>} The position object.
   */
  public async getPosition(positionId: string, poolAddress?: string, walletAddress?: string): Promise<Position> {
    logger.info(`[MeteoraApiProvider] Fetching position details for ${positionId}`);

    const targetWallet = walletAddress || this.walletAddress || process.env.WALLET_PUBKEY;
    if (!targetWallet) {
      throw new Error('Cannot fetch position: walletAddress is not configured');
    }

    const positions = await this.getPositions(targetWallet, poolAddress);

    const position = positions.find((p) => p.id === positionId);
    if (position) {
      return position;
    }

    throw new Error(`Position ${positionId} not found on-chain for wallet ${targetWallet}`);
  }

  /**
   * Fetches static pool metadata for a given pool address.
   *
   * @param {string} poolAddress - The pool's on-chain address.
   * @returns {Promise<PoolInfo>} Pool configuration and token addresses.
   */
  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    const cached = this.poolInfoCache.get(poolAddress);
    const now = Date.now();

    if (cached && now - cached.timestamp < 10000) {
      return cached.data;
    }

    logger.info(`[MeteoraApiProvider] Fetching pool metadata for ${poolAddress}`);

    const data = await this.fetchPoolData(poolAddress);

    const activeBinId = getBinIdFromPrice(
      data.current_price,
      data.pool_config.bin_step,
      data.token_x.decimals,
      data.token_y.decimals
    );

    const feeRate = data.dynamic_fee_pct > 0 ? data.dynamic_fee_pct : data.pool_config.base_fee_pct / 100;

    const poolInfo: PoolInfo = {
      poolAddress: data.address,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      feeRate,
      activeBound: activeBinId,
      tokenXAddress: data.token_x.address,
      tokenYAddress: data.token_y.address,
      binStep: data.pool_config.bin_step,
      activeBinId,
      tokenXMint: data.token_x.address,
      tokenYMint: data.token_y.address,
      tokenXDecimals: data.token_x.decimals,
      tokenYDecimals: data.token_y.decimals,
    };

    this.poolInfoCache.set(poolAddress, { data: poolInfo, timestamp: now });
    return poolInfo;
  }

  // ---------------------------------------------------------------------------
  // Wallet methods (Meteora API does not manage wallets; stub implementations)
  // ---------------------------------------------------------------------------

  public async getWalletAddress(chain?: string): Promise<string> {
    void chain;
    return this.walletAddress || '';
  }

  public async listWallets(): Promise<{ chain: string; address: string; is_default: boolean }[]> {
    const addr = await this.getWalletAddress();
    return addr ? [{ chain: 'solana', address: addr, is_default: true }] : [];
  }

  /**
   * Fetches the open portfolio for a wallet address from Meteora Datapi.
   */
  public async getPortfolio(walletAddress: string): Promise<Record<string, unknown>> {
    const portfolioUrl = `${this.apiUrl}/portfolio/open?user=${walletAddress}`;
    const response = await fetch(portfolioUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`[MeteoraApiProvider] Failed to fetch portfolio: HTTP ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const meteoraProvider = new MeteoraApiProvider();
