import { IPositionProvider, Position, PoolInfo, MarketSnapshot } from '@lp-system/core';

export class MeteoraApiProvider implements IPositionProvider {
  constructor(private apiUrl: string) {
    this.apiUrl = apiUrl || 'https://dlmm.datapi.meteora.ag';
  }

  public async getPositions(walletAddress: string): Promise<Position[]> {
    console.log(`[MeteoraApiProvider] Querying positions for wallet ${walletAddress} from API: ${this.apiUrl}`);

    // Return mock SOL-USDC position
    return [
      {
        id: '9tA6m91FvP35G9A7eS982Yhd6pE35Z678WjLmoB67Pqr',
        poolAddress: 'ArU2v79K6E489A7eS982Yhd6pE35Z678WjLmoB67USDC',
        lowerBinId: 212000,
        upperBinId: 212200,
        tokenX: {
          amount: '1500000000', // 1.5 SOL
          decimals: 9,
          mint: 'So11111111111111111111111111111111111111112'
        },
        tokenY: {
          amount: '200000000', // 200 USDC
          decimals: 6,
          mint: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo'
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

  public async getPosition(positionId: string): Promise<Position> {
    console.log(`[MeteoraApiProvider] Fetching position details for ${positionId}`);
    return {
      id: positionId,
      poolAddress: 'ArU2v79K6E489A7eS982Yhd6pE35Z678WjLmoB67USDC',
      lowerBinId: 212000,
      upperBinId: 212200,
      tokenX: {
        amount: '1500000000',
        decimals: 9,
        mint: 'So11111111111111111111111111111111111111112'
      },
      tokenY: {
        amount: '200000000',
        decimals: 6,
        mint: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo'
      },
      isInRange: true,
      openedAt: Date.now() - 3600000,
      metadata: {
        strategy: 'trailing-usdc',
        leverage: 10
      }
    };
  }

  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    console.log(`[MeteoraApiProvider] Fetching pool metadata for ${poolAddress}`);
    return {
      poolAddress,
      binStep: 20,
      feeRate: 0.002, // 0.2%
      activeBinId: 212100,
      tokenXMint: 'So11111111111111111111111111111111111111112',
      tokenYMint: 'EPjFW3dpdG7t3WY5ja1DN6qV7mN4H65A5Lxh63m3Ugo'
    };
  }

  public async getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot> {
    console.log(`[MeteoraApiProvider] Assembling Market Snapshot for pool ${poolAddress}`);

    // Simulate current active bin id around 212100 with SOL price at ~150 USDC
    const activeBinId = 212100;
    const currentPrice = 150.0;

    return {
      poolAddress,
      activeBinId,
      price: currentPrice,
      priceHistory: [
        { price: 149.5, timestamp: Date.now() - 120000 },
        { price: 149.8, timestamp: Date.now() - 60000 },
        { price: currentPrice, timestamp: Date.now() }
      ],
      feeRate: 0.002,
      capturedAt: Date.now()
    };
  }
}
