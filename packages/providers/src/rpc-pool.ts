import { Connection } from '@solana/web3.js';
import { IRpcProvider } from '@lp-system/core';

export class RpcPool implements IRpcProvider {
  private currentIndex = 0;
  private fibonacciBackoffs = [1000, 2000, 3000, 5000, 8000];

  constructor(private providers: IRpcProvider[]) {
    if (!providers || providers.length === 0) {
      throw new Error('RpcPool requires at least one IRpcProvider');
    }
  }

  public getConnection(): Connection {
    return this.providers[this.currentIndex].getConnection();
  }

  public async execute<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    let tryCount = 0;

    while (tryCount < this.providers.length) {
      const provider = this.providers[this.currentIndex];
      try {
        return await provider.execute(fn);
      } catch (error: any) {
        console.warn(
          `[RpcPool] Provider at index ${this.currentIndex} failed. Rotating. Error: ${error.message || error}`
        );
        
        // Rotate to the next provider
        this.currentIndex = (this.currentIndex + 1) % this.providers.length;
        tryCount++;

        if (tryCount < this.providers.length) {
          const backoffMs = this.fibonacciBackoffs[Math.min(tryCount - 1, this.fibonacciBackoffs.length - 1)];
          console.log(`[RpcPool] Waiting for Fibonacci backoff of ${backoffMs}ms before rotating execute...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw new Error('All RPC providers in the pool have been exhausted and failed execution');
  }
}
