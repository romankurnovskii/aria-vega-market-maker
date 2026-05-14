/**
 * @file provider.base.ts
 * @description Base RPC provider class providing Solana Connection with retry logic and fault tolerance.
 *
 * @features
 * - Wraps @solana/web3.js Connection with automatic retry mechanism
 * - Provides execute<T>() helper for safe RPC call execution with exponential backoff
 * - Falls back to mock mainnet endpoint for compilable safety when RPC URL is missing
 *
 * @dependencies @solana/web3.js (Connection)
 * @sideEffects None — pure wrapper class
 */
import { Connection } from '@solana/web3.js';
import { IRpcProvider } from '@lp-system/core';

export class SolanaRpcProvider implements IRpcProvider {
  protected connection: Connection;

  constructor(protected rpcUrl: string) {
    const url = rpcUrl || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(url, 'confirmed');
  }

  /**
   * Returns the underlying Solana Connection instance.
   *
   * @returns {Connection} The initialized Connection object.
   */
  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Executes a function against the RPC connection with retry logic.
   * Retries up to 3 times with exponential backoff (200ms, 400ms, 800ms) on failure.
   *
   * @param {<T>(conn: Connection) => Promise<T>} fn - Async function to execute with the connection.
   * @returns {Promise<T>} The resolved result from the provided function.
   * @throws {Error} If all retry attempts fail.
   */
  public async execute<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 200;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        return await fn(this.connection);
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        const delayMs = baseDelayMs * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('RPC execution failed after retries');
  }
}
