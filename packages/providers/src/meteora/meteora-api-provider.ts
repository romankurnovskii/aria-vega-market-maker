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
import { PoolResponse, OhlcvResponse } from './types';


/**
 * Meteora API provider for position and market data.
 * Currently uses mock data; replace with real API calls in production.
 */
export class MeteoraApiProvider implements IPositionProvider {
  /**
   * Constructs the provider with the Meteora API base URL.
   *
   * @param {string} apiUrl - Meteora API endpoint (defaults to dlmm.datapi.meteora.ag).
   */
  constructor(private apiUrl: string) {
    this.apiUrl = apiUrl || 'https://dlmm.datapi.meteora.ag';
  }

  /**
   * Fetches all positions for a given wallet address.
   * Currently returns a single mock SOL-USDC CLMM position.
   *
   * @param {string} walletAddress - Solana wallet public key.
   * @returns {Promise<Position[]>} Array of position objects.
   */
  public async getPositions(walletAddress: string): Promise<Position[]> {
    console.log(`[MeteoraApiProvider] Querying positions for wallet ${walletAddress} from API: ${this.apiUrl}`);

    // Return mock SOL-USDC position
    return [
      {
        id: '9tA6m91FvP35G9A7eS982Yhd6pE35Z678WjLmoB67Pqr',
        poolAddress: 'ArU2v79K6E489A7eS982Yhd6pE35Z678WjLmoB67USDC',
        chain: 'solana',
        protocol: 'meteora_dlmm',
        lowerBinId: 212000,
        upperBinId: 212200,
        lowerBound: 212000,
        upperBound: 212200,
        tokenX: {
          amount: '1500000000', // 1.5 SOL
          decimals: 9,
          mint: 'So11111111111111111111111111111111111111112',
          tokenAddress: 'So11111111111111111111111111111111111111112'
        },
        tokenY: {
          amount: '200000000', // 200 USDC
          decimals: 6,
          mint: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo',
          tokenAddress: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo'
        },
        isInRange: true,
        openedAt: Date.now() - 3600000, // 1 hour ago
        metadata: {
          strategy: 'trailing-usdc',
          leverage: 10
        }
      }
    ];
  }

  /**
   * Fetches a single position by its on-chain identifier.
   *
   * @param {string} positionId - Unique position ID (pubkey on Solana).
   * @returns {Promise<Position>} The position object.
   */
  public async getPosition(positionId: string): Promise<Position> {
    console.log(`[MeteoraApiProvider] Fetching position details for ${positionId}`);
    return {
      id: positionId,
      poolAddress: 'ArU2v79K6E489A7eS982Yhd6pE35Z678WjLmoB67USDC',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBinId: 212000,
      upperBinId: 212200,
      lowerBound: 212000,
      upperBound: 212200,
      tokenX: {
        amount: '1500000000',
        decimals: 9,
        mint: 'So11111111111111111111111111111111111111112',
        tokenAddress: 'So11111111111111111111111111111111111111112'
      },
      tokenY: {
        amount: '200000000',
        decimals: 6,
        mint: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo',
        tokenAddress: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo'
      },
      isInRange: true,
      openedAt: Date.now() - 3600000,
      metadata: {
        strategy: 'trailing-usdc',
        leverage: 10
      }
    };
  }

  /**
   * Calculates the active bin ID (boundary) from the current price.
   * Formula: Price = (1 + binStep / 10000) ^ (binId - 8388608) * 10 ^ (decimalsY - decimalsX)
   * Solving for binId:
   * binId = 8388608 + ln(Price / 10 ^ (decimalsY - decimalsX)) / ln(1 + binStep / 10000)
   */
  private getBinIdFromPrice(
    price: number,
    binStep: number,
    decimalsX: number,
    decimalsY: number
  ): number {
    if (!price || price <= 0) {
      return 8388608; // default neutral bin ID
    }
    const decimalFactor = Math.pow(10, decimalsY - decimalsX);
    const ratio = price / decimalFactor;
    const binStepFactor = 1 + binStep / 10000;
    const binOffset = Math.log(ratio) / Math.log(binStepFactor);
    return Math.round(8388608 + binOffset);
  }

  /**
   * Fetches static pool metadata for a given pool address.
   *
   * @param {string} poolAddress - The pool's on-chain address.
   * @returns {Promise<PoolInfo>} Pool configuration and token addresses.
   */
  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    console.log(`[MeteoraApiProvider] Fetching pool metadata for ${poolAddress}`);
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

    const activeBinId = this.getBinIdFromPrice(
      data.current_price,
      data.pool_config.bin_step,
      data.token_x.decimals,
      data.token_y.decimals
    );

    const feeRate = data.dynamic_fee_pct > 0
      ? data.dynamic_fee_pct
      : data.pool_config.base_fee_pct / 100;

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
    console.log(`[MeteoraApiProvider] Assembling Market Snapshot for pool ${poolAddress}`);

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

    const activeBinId = this.getBinIdFromPrice(
      poolData.current_price,
      poolData.pool_config.bin_step,
      poolData.token_x.decimals,
      poolData.token_y.decimals
    );

    const feeRate = poolData.dynamic_fee_pct > 0
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
          priceHistory = ohlcvData.data.map((candle) => ({
            price: candle.close,
            timestamp: candle.timestamp * 1000,
          })).slice(-24);
        }
      } catch (err) {
        console.warn(`[MeteoraApiProvider] Failed to parse OHLCV data for pool ${poolAddress}:`, err);
      }
    } else {
      console.warn(`[MeteoraApiProvider] Failed to fetch OHLCV data: ${ohlcvResponse.status} ${ohlcvResponse.statusText}`);
    }

    if (priceHistory.length === 0) {
      priceHistory = [
        { price: poolData.current_price, timestamp: Date.now() }
      ];
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


