/**
 * @file hummingbot-provider.ts
 * @description IPositionProvider implementation that fetches position data from the Meteora DLMM
 *              Datapi and manages wallets via the Hummingbot Gateway API.
 *
 * @features
 * - getPositions(wallet) — fetches open positions for a given wallet via Meteora Datapi
 * - getWalletPositions() — iterates all known wallets and aggregates their positions
 * - getPoolInfo(poolAddress) — fetches pool metadata (token pair, fee, bin step)
 * - Integrates with HummingbotWalletManager for wallet lifecycle
 *
 * @dependencies @lp-system/core (IPositionProvider), @lp-system/logger, meteora-api-provider, wallet-manager
 * @sideEffects Makes HTTP requests to Hummingbot Gateway and Meteora Datapi
 */

import { IPositionProvider, Position, PoolInfo } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { HummingbotWalletManager } from './wallet-manager.js';
import { GatewayWallet } from './types.js';
import { meteoraProvider } from '../meteora/meteora-api-provider.js';

const logger = getLogger('hummingbot-provider');

/**
 * Hummingbot API provider for pool and market data.
 * Implements IPositionProvider by calling Meteora Datapi for reads
 * and Hummingbot Gateway API for writes.
 */
export class HummingbotProvider implements IPositionProvider {
  private apiUrl: string;
  private walletManager: HummingbotWalletManager;
  private authHeaders: Record<string, string>;

  /**
   * @param {string} apiUrl - Hummingbot API base URL (e.g., http://localhost:8000).
   */
  constructor(apiUrl: string = 'http://localhost:8000') {
    this.apiUrl = apiUrl;

    const username = process.env.HUMMINGBOT_API_USERNAME || 'admin';
    const password = process.env.HUMMINGBOT_API_PASSWORD || 'admin';
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this.authHeaders = { Authorization: `Basic ${encoded}`, Accept: 'application/json' };

    this.walletManager = new HummingbotWalletManager(this.apiUrl, this.authHeaders);
    logger.info(`[HummingbotProvider] Initialized with API URL: ${this.apiUrl}`);
  }

  /**
   * Fetches pool info via Meteora Provider.
   */
  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    return meteoraProvider.getPoolInfo(poolAddress);
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

  public async getPositions(walletAddress: string, poolAddress?: string): Promise<Position[]> {
    return meteoraProvider.getPositions(walletAddress, poolAddress);
  }

  public async getPosition(positionId: string, poolAddress?: string): Promise<Position> {
    const walletAddress = await this.getWalletAddress();
    return meteoraProvider.getPosition(positionId, poolAddress, walletAddress);
  }
}

export const hummingbotProvider = new HummingbotProvider();
