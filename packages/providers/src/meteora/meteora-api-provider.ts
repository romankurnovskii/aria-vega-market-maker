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
import { IPositionProvider, Position, PoolInfo, MarketSnapshot } from '@lp-system/core';
import { PoolResponse, OhlcvResponse, PositionsPnlResponse } from './types';
import { getBinIdFromPrice, parseDecimalToRaw } from './meteora.utils';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('meteora-api-provider');

/**
 * Meteora API provider for position and market data.
 * Currently uses mock data; replace with real API calls in production.
 */
export class MeteoraApiProvider implements IPositionProvider {
  private poolTokenMetadataCache = new Map<
    string,
    Promise<{ decimalsX: number; decimalsY: number; tokenXMint: string; tokenYMint: string }>
  >();

  private getPositionsCache = new Map<string, { data: Position[]; timestamp: number }>();
  private poolInfoCache = new Map<string, { data: PoolInfo; timestamp: number }>();
  private marketSnapshotCache = new Map<string, { data: MarketSnapshot; timestamp: number }>();

  /**
   * Constructs the provider with the Meteora API base URL.
   *
   * @param {string} apiUrl - Meteora API endpoint (defaults to dlmm.datapi.meteora.ag).
   * @param {string} [walletAddress] - Optional cached operational wallet address.
   */
  constructor(
    private apiUrl: string,
    private walletAddress?: string
  ) {
    this.apiUrl = apiUrl || 'https://dlmm.datapi.meteora.ag';
  }

  /**
   * Fetches full token metadata (decimals and addresses) for a given pool address dynamically.
   * Caches results to prevent redundant API queries.
   */
  private async getPoolTokenMetadata(poolAddress: string): Promise<{
    decimalsX: number;
    decimalsY: number;
    tokenXMint: string;
    tokenYMint: string;
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
      const data = (await response.json()) as PoolResponse;
      return {
        decimalsX: data.token_x.decimals,
        decimalsY: data.token_y.decimals,
        tokenXMint: data.token_x.address,
        tokenYMint: data.token_y.address,
      };
    });

    this.poolTokenMetadataCache.set(poolAddress, metadataPromise);
    return metadataPromise;
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
    }

    const allPositions: Position[] = [];

    for (const pool of poolsToQuery) {
      const url = `${this.apiUrl}/positions/${pool}/pnl?user=${walletAddress}&status=open&pageSize=200&page=1`;
      logger.info(`[MeteoraApiProvider] Fetching positions PnL from Datapi for pool ${pool}`);

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

          allPositions.push({
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
              leverage: 10,
              feeX: pos.fee_x || '0',
              feeY: pos.fee_y || '0',
            },
          });
        }
      }
    }

    this.getPositionsCache.set(cacheKey, { data: allPositions, timestamp: Date.now() });

    // LRU: Cleanup old cache entries if it grows too large
    if (this.getPositionsCache.size > 50) {
      const oldestKey = this.getPositionsCache.keys().next().value;
      if (oldestKey) this.getPositionsCache.delete(oldestKey);
    }

    return allPositions;
  }

  /**
   * Fetches a single position by its on-chain identifier.
   * Reuses getPositions under the hood.
   *
   * @param {string} positionId - Unique position ID (pubkey on Solana).
   * @param {string} [poolAddress] - Optional specific pool address to query.
   * @returns {Promise<Position>} The position object.
   */
  public async getPosition(positionId: string, poolAddress?: string): Promise<Position> {
    logger.info(`[MeteoraApiProvider] Fetching position details for ${positionId}`);

    const walletAddress = this.walletAddress || process.env.WALLET_PUBKEY;
    if (!walletAddress) {
      throw new Error('Cannot fetch position: walletAddress is not configured');
    }

    const positions = await this.getPositions(walletAddress, poolAddress);

    const position = positions.find((p) => p.id === positionId);
    if (position) {
      return position;
    }

    throw new Error(`Position ${positionId} not found on-chain for wallet ${walletAddress}`);
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
    const url = `${this.apiUrl}/pools/${poolAddress}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    if (!response.ok) {
      const errorMsg = `Failed to fetch pool info from Datapi: ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as PoolResponse;

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
    };

    this.poolInfoCache.set(poolAddress, { data: poolInfo, timestamp: now });
    return poolInfo;
  }

  /**
   * Fetches current market snapshot: price, history, active bin, and fee rate.
   *
   * @param {string} poolAddress - The pool's on-chain address.
   * @returns {Promise<MarketSnapshot>} Live market data including price history.
   */
  public async getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot> {
    const cached = this.marketSnapshotCache.get(poolAddress);
    const now = Date.now();

    if (cached && now - cached.timestamp < 10000) {
      return cached.data;
    }

    logger.info(`[MeteoraApiProvider] Assembling Market Snapshot for pool ${poolAddress}`);

    const poolInfoUrl = `${this.apiUrl}/pools/${poolAddress}`;
    const poolResponse = await fetch(poolInfoUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    if (!poolResponse.ok) {
      throw new Error(`Failed to fetch pool info for market snapshot: ${poolResponse.status} ${poolResponse.statusText}`);
    }

    const poolData = (await poolResponse.json()) as PoolResponse;

    const activeBinId = getBinIdFromPrice(
      poolData.current_price,
      poolData.pool_config.bin_step,
      poolData.token_x.decimals,
      poolData.token_y.decimals
    );

    const feeRate = poolData.dynamic_fee_pct > 0 ? poolData.dynamic_fee_pct : poolData.pool_config.base_fee_pct / 100;

    const ohlcvUrl = `${this.apiUrl}/pools/${poolAddress}/ohlcv?timeframe=1h`;
    const ohlcvResponse = await fetch(ohlcvUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    let priceHistory: { price: number; timestamp: number }[] = [];

    if (ohlcvResponse.ok) {
      try {
        const ohlcvData = (await ohlcvResponse.json()) as OhlcvResponse;
        if (ohlcvData && Array.isArray(ohlcvData.data)) {
          priceHistory = ohlcvData.data
            .map((candle) => ({
              price: candle.close,
              timestamp: candle.timestamp * 1000,
            }))
            .slice(-24);
        }
      } catch (err) {
        logger.warn(`[MeteoraApiProvider] Failed to parse OHLCV data for pool ${poolAddress}: ${err}`);
      }
    } else {
      logger.warn(`[MeteoraApiProvider] Failed to fetch OHLCV data: ${ohlcvResponse.status} ${ohlcvResponse.statusText}`);
    }

    if (priceHistory.length === 0) {
      priceHistory = [{ price: poolData.current_price, timestamp: Date.now() }];
    }

    logger.info(
      `[MeteoraApiProvider] Assembling Market Snapshot for pool ${poolAddress} - price=${poolData.current_price}, activeBinId=${activeBinId}, feeRate=${feeRate}`
    );

    const snapshot: MarketSnapshot = {
      poolAddress: poolData.address,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      activeBinId,
      activeBound: activeBinId,
      price: poolData.current_price,
      priceHistory,
      feeRate,
      capturedAt: Date.now(),
    };

    this.marketSnapshotCache.set(poolAddress, { data: snapshot, timestamp: now });
    return snapshot;
  }
}
