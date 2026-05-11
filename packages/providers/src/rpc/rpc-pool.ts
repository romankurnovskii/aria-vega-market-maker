/**
 * @file rpc-pool.ts
 * @description Load-balanced RPC pool for high-availability Solana interactions.
 * * @features
 * - Round-robin provider selection to distribute request load.
 * - Automatic failover: If a provider fails, it tries the next one in the pool.
 * - Seamless integration with SolanaExecutor for transaction submission and verification.
 */
import { Connection } from '@solana/web3.js';
import { IRpcProvider } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('rpc-pool');

export class RpcPool implements IRpcProvider {
  private providers: IRpcProvider[];
  private currentIndex: number = 0;

  constructor(providers: IRpcProvider[]) {
    if (providers.length === 0) {
      throw new Error('[RpcPool] Cannot initialize with an empty provider list.');
    }
    this.providers = providers;
  }

  /**
   * Returns the connection from the currently active provider in the rotation.
   */
  public getConnection(): Connection {
    return this.providers[this.currentIndex].getConnection();
  }

  /**
   * Executes an RPC call with built-in failover across the pool.
   * If the current provider fails, it automatically rotates to the next available one.
   */
  public async execute<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    let lastError: any;

    // Attempt to execute the call, potentially trying every provider in the pool once
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentIndex];

      try {
        const result = await provider.execute(fn);

        // On success, we move the index forward for the NEXT call (Round-Robin)
        this.rotate();
        return result;
      } catch (error: any) {
        lastError = error;
        logger.warn(`[RpcPool] Provider ${this.currentIndex} failed. Rotating to next... Error: ${error.message}`);
        this.rotate();
      }
    }

    logger.error('[RpcPool] All providers in the pool failed to execute the request.');
    throw lastError;
  }

  /**
   * Moves the internal pointer to the next provider in a circular fashion.
   */
  private rotate(): void {
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
  }
}