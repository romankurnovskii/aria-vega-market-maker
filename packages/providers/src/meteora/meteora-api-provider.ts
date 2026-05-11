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
import { getBinIdFromPrice } from './meteora.utils';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('meteora-api-provider');

/**
 * Meteora API provider for position and market data.
 * Currently uses mock data; replace with real API calls in production.
 */
export class MeteoraApiProvider implements IPositionProvider {
  private poolTokenMetadataCache = new Map<
    string,
    { decimalsX: number; decimalsY: number; tokenXMint: string; tokenYMint: string }
  >();

  /**
   * Constructs the provider with the Meteora API base URL.
   *
   * @param {string} apiUrl - Meteora API endpoint (defaults to dlmm.datapi.meteora.ag).
   */
  constructor(private apiUrl: string) {
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
    const cached = this.poolTokenMetadataCache.get(poolAddress);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/pools/${poolAddress}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MeteoraLPBot/1.0',
        },
      });
      if (response.ok) {
        const data = (await response.json()) as PoolResponse;
        const metadata = {
          decimalsX: data.token_x.decimals,
          decimalsY: data.token_y.decimals,
          tokenXMint: data.token_x.address,
          tokenYMint: data.token_y.address,
        };
        this.poolTokenMetadataCache.set(poolAddress, metadata);
        return metadata;
      }
    } catch (err) {
      logger.warn(
        `[MeteoraApiProvider] Failed to fetch token metadata for pool ${poolAddress}: ${err}`
      );
    }

    throw new Error(`Failed to retrieve token metadata for pool ${poolAddress}`);
  }

  /**
   * Fetches all positions for a given wallet address.
   * Can accept an optional poolAddress parameter. If not provided, it attempts
   * to fetch open portfolio information to discover the pools.
   *
   * @param {string} walletAddress - Solana wallet public key.
   * @param {string} [poolAddress] - Optional specific pool address to query.
   * @returns {Promise<Position[]>} Array of position objects.
   */
  public async getPositions(walletAddress: string, poolAddress?: string): Promise<Position[]> {
    logger.info(
      `[MeteoraApiProvider] Querying positions for wallet ${walletAddress} from API: ${this.apiUrl}`
    );

    const poolsToQuery: string[] = [];

    if (poolAddress) {
      poolsToQuery.push(poolAddress);
    } else {
      // Try to discover active pools via the /portfolio/open endpoint
      try {
        const portfolioUrl = `${this.apiUrl}/portfolio/open?user=${walletAddress}`;
        const portfolioResponse = await fetch(portfolioUrl, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MeteoraLPBot/1.0',
          },
        });

        if (portfolioResponse.ok) {
          const portfolioData = (await portfolioResponse.json()) as any;
          const pools = Array.isArray(portfolioData)
            ? portfolioData
            : portfolioData.data || portfolioData.pools || [];

          for (const p of pools) {
            const addr =
              typeof p === 'string' ? p : p.address || p.pool_address || p.poolAddress;
            if (addr) {
              poolsToQuery.push(addr);
            }
          }
        }
      } catch (err) {
        logger.warn(
          `[MeteoraApiProvider] Failed to fetch open portfolio for ${walletAddress}: ${err}`
        );
      }
    }

    const allPositions: Position[] = [];

    for (const pool of poolsToQuery) {
      try {
        const metadataPromise = this.getPoolTokenMetadata(pool);
        const url = `${this.apiUrl}/positions/${pool}/pnl?user=${walletAddress}&status=open&pageSize=200&page=1`;
        logger.info(`[MeteoraApiProvider] Fetching positions PnL from Datapi for pool ${pool}`);

        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MeteoraLPBot/1.0',
          },
        });

        if (!response.ok) {
          logger.warn(
            `[MeteoraApiProvider] Failed to fetch positions PnL from Datapi: ${response.status} ${response.statusText}`
          );
          continue;
        }

        const result = (await response.json()) as PositionsPnlResponse;
        const { decimalsX, decimalsY, tokenXMint, tokenYMint } = await metadataPromise;

        if (result && Array.isArray(result.positions)) {
          for (const pos of result.positions) {
            const lowerBinId =
              pos.lower_bin_id !== undefined ? pos.lower_bin_id : (pos.lowerBinId ?? 0);
            const upperBinId =
              pos.upper_bin_id !== undefined ? pos.upper_bin_id : (pos.upperBinId ?? 0);
            const isInRange =
              pos.is_in_range !== undefined ? pos.is_in_range : (pos.isInRange ?? true);
            const openedAt = pos.opened_at || Date.now() - 3600000;

            allPositions.push({
              id: pos.address,
              poolAddress: pos.pool_address || pool,
              chain: 'solana',
              protocol: 'meteora_dlmm',
              lowerBound: lowerBinId,
              upperBound: upperBinId,
              lowerBinId,
              upperBinId,
              tokenX: {
                amount: pos.amount_x || pos.amountX || '0',
                decimals: decimalsX,
                mint: tokenXMint,
                tokenAddress: tokenXMint,
              },
              tokenY: {
                amount: pos.amount_y || pos.amountY || '0',
                decimals: decimalsY,
                mint: tokenYMint,
                tokenAddress: tokenYMint,
              },
              isInRange,
              openedAt,
              metadata: {
                strategy: 'trailing-usdc',
                leverage: 10,
              },
            });
          }
        }
      } catch (err) {
        logger.warn(`[MeteoraApiProvider] Failed to fetch positions for pool ${pool}: ${err}`);
      }
    }

    return allPositions;
  }

  /**
   * Fetches a single position by its on-chain identifier.
   * Reuses getPositions under the hood.
   *
   * @param {string} positionId - Unique position ID (pubkey on Solana).
   * @returns {Promise<Position>} The position object.
   */
  public async getPosition(positionId: string): Promise<Position> {
    logger.info(`[MeteoraApiProvider] Fetching position details for ${positionId}`);

    const walletAddress = process.env.WALLET_PUBKEY;
    if (!walletAddress) {
      throw new Error(
        'Cannot fetch position: WALLET_PUBKEY is not configured in process environment'
      );
    }

    const positions = await this.getPositions(walletAddress);

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

    const feeRate =
      data.dynamic_fee_pct > 0 ? data.dynamic_fee_pct : data.pool_config.base_fee_pct / 100;

    return {
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
  }

  /**
   * Fetches current market snapshot: price, history, active bin, and fee rate.
   *
   * @param {string} poolAddress - The pool's on-chain address.
   * @returns {Promise<MarketSnapshot>} Live market data including price history.
   */
  public async getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot> {
    logger.info(`[MeteoraApiProvider] Assembling Market Snapshot for pool ${poolAddress}`);

    const poolInfoUrl = `${this.apiUrl}/pools/${poolAddress}`;
    const poolResponse = await fetch(poolInfoUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoraLPBot/1.0',
      },
    });

    if (!poolResponse.ok) {
      throw new Error(
        `Failed to fetch pool info for market snapshot: ${poolResponse.status} ${poolResponse.statusText}`
      );
    }

    const poolData = (await poolResponse.json()) as PoolResponse;

    const activeBinId = getBinIdFromPrice(
      poolData.current_price,
      poolData.pool_config.bin_step,
      poolData.token_x.decimals,
      poolData.token_y.decimals
    );

    const feeRate =
      poolData.dynamic_fee_pct > 0
        ? poolData.dynamic_fee_pct
        : poolData.pool_config.base_fee_pct / 100;

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
        logger.warn(
          `[MeteoraApiProvider] Failed to parse OHLCV data for pool ${poolAddress}: ${err}`
        );
      }
    } else {
      logger.warn(
        `[MeteoraApiProvider] Failed to fetch OHLCV data: ${ohlcvResponse.status} ${ohlcvResponse.statusText}`
      );
    }

    if (priceHistory.length === 0) {
      priceHistory = [{ price: poolData.current_price, timestamp: Date.now() }];
    }

    return {
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
  }
}
