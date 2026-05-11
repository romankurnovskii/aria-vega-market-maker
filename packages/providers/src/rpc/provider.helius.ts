/**
 * @file provider.helius.ts
 * @description Helius-specific RPC provider extending the base Solana RPC provider.
 *
 * @features
 * - Inherits all SolanaRpcProvider capabilities (retry logic, Connection pooling)
 * - Pre configured to use Helius mainnet endpoint with optional API key support
 *
 * @dependencies SolanaRpcProvider (base class)
 * @sideEffects None — pure configuration subclass
 */
import { SolanaRpcProvider } from './provider.base.js';

/**
 * Helius RPC provider with default mainnet URL fallback.
 */
export class HeliusRpcProvider extends SolanaRpcProvider {
  /**
   * Constructs a HeliusRpcProvider with optional custom RPC URL.
   * Falls back to Helius mainnet with mock API key if not provided.
   *
   * @param {string} rpcUrl - The Helius RPC endpoint URL.
   */
  constructor(rpcUrl: string) {
    // Falls back to a default Helius mainnet URL if not provided.
    const url = rpcUrl || 'https://mainnet.helius-rpc.com/?api-key=mock-api-key';
    super(url);
  }
}
