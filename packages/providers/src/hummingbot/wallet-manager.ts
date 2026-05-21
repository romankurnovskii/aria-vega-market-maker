/**
 * @file wallet-manager.ts
 * @description Manages Hummingbot Gateway wallet addresses — fetches registered wallets
 *              from the Gateway API and caches them for the provider layer.
 *
 * @features
 * - getWallets() — fetches all wallets from Hummingbot Gateway /wallet endpoint
 * - getDefaultWalletAddress() — returns the first/default wallet address
 * - Caches wallet list in-memory to reduce API calls
 *
 * @dependencies @lp-system/logger
 * @sideEffects Makes HTTP requests to Hummingbot Gateway; maintains in-memory wallet cache
 */

import { getLogger } from '@lp-system/logger';

const logger = getLogger('hummingbot-wallet-manager');

export interface HummingbotWallet {
  chain: string;
  address: string;
  is_default: boolean;
}

/** Raw response from GET /accounts/gateway/wallets */
interface GatewayWalletsResponse {
  chain: string;
  walletAddresses: string[];
  default_address: string;
}

/**
 * Manages Hummingbot Gateway wallets via API.
 */
export class HummingbotWalletManager {
  private apiUrl: string;
  private authHeaders: Record<string, string>;

  constructor(apiUrl: string, authHeaders?: Record<string, string>) {
    this.apiUrl = apiUrl || 'http://localhost:8000';
    this.authHeaders = authHeaders || { Accept: 'application/json' };
  }

  /**
   * Lists all wallets registered in Hummingbot Gateway.
   */
  public async listWallets(): Promise<HummingbotWallet[]> {
    const url = `${this.apiUrl}/accounts/gateway/wallets`;
    try {
      const response = await fetch(url, { headers: this.authHeaders });
      if (!response.ok) {
        throw new Error(`Failed to list wallets: ${response.status} ${response.statusText}`);
      }
      const raw = (await response.json()) as GatewayWalletsResponse[];
      const result: HummingbotWallet[] = [];
      for (const entry of raw) {
        for (const addr of entry.walletAddresses || []) {
          result.push({
            chain: entry.chain,
            address: addr,
            is_default: addr === entry.default_address,
          });
        }
      }
      return result;
    } catch (error) {
      logger.error(`[WalletManager] Error listing wallets: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the default wallet for a specific chain.
   */
  public async getDefaultWallet(chain: string = 'solana'): Promise<string | null> {
    const wallets = await this.listWallets();
    const wallet = wallets.find((w) => w.chain === chain && w.is_default);
    return wallet ? wallet.address : null;
  }

  /**
   * Creates a new wallet for a specific chain.
   */
  public async createWallet(chain: string = 'solana'): Promise<string> {
    const url = `${this.apiUrl}/gateway/wallets/create`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, set_default: true }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create wallet: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.address;
    } catch (error) {
      logger.error(`[WalletManager] Error creating wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Adds an existing wallet using a private key.
   */
  public async addWallet(privateKey: string, chain: string = 'solana'): Promise<string> {
    const url = `${this.apiUrl}/accounts/gateway/add-wallet`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, private_key: privateKey, set_default: true }),
      });
      if (!response.ok) {
        throw new Error(`Failed to add wallet: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.address;
    } catch (error) {
      logger.error(`[WalletManager] Error adding wallet: ${error}`);
      throw error;
    }
  }
}
