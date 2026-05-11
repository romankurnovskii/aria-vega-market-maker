/**
 * @file rpc-pool.ts
 * @description Connection pool aggregating multiple IRpcProvider endpoints for resilience and load balancing.
 *
 * @features
 * - Holds an array of IRpcProvider instances (e.g., Helius + public Solana)
 * - Placeholder implementation: currently a stub; full load-balancing/failover logic to be implemented
 *
 * @dependencies IRpcProvider (from @lp-system/core)
 * @sideEffects None — in-memory aggregation layer
 */
import { IRpcProvider } from '@lp-system/core';

/**
 * RpcPool: aggregates multiple RPC providers for failover and load distribution.
 * Currently implements basic constructor only; full pooling logic pending.
 */
export class RpcPool implements IRpcProvider {
  private providers: IRpcProvider[];

  /**
   * Constructs the pool with a list of RPC providers.
   *
   * @param {IRpcProvider[]} providers - Array of provider instances to pool.
   */
  constructor(providers: IRpcProvider[]) {
    this.providers = providers;
  }

  /**
   * Returns the connection of the first provider (placeholder).
   *
   * @returns {any} Connection placeholder from first provider.
   */
  public getConnection(): any {
    return this.providers[0]?.getConnection();
  }

  /**
   * Executes function against provider pool (round-robin or failover strategy placeholder).
   *
   * @param {<T>(conn: any) => Promise<T>} fn - Async function to execute.
   * @returns {Promise<T>} Result from the provider execution.
   */
  public async execute<T>(fn: (conn: any) => Promise<T>): Promise<T> {
    // TODO: Implement round-robin or failover across providers
    return fn(this.getConnection());
  }
}