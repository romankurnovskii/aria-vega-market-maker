import { Connection } from '@solana/web3.js';
import { IRpcProvider } from '@lp-system/core';

export class SolanaRpcProvider implements IRpcProvider {
  protected connection: Connection;

  constructor(protected rpcUrl: string) {
    // Falls back to a mock mainnet endpoint if not provided, for compilable safety.
    const url = rpcUrl || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(url, 'confirmed');
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public async execute<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    let attempts = 0;
    const maxAttempts = 3;
    const delayMs = 200;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        return await fn(this.connection);
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('RPC execution failed after retries');
  }
}
