/**
 * @file strategy-orchestrator.ts
 * @description Per-position orchestrator that delegates strategy execution on each tick.
 *
 * @features
 * - Bridges IOrchestrator contract: holds assignment metadata and delegates to IStrategy.execute()
 * - Stores merged strategy params from factory defaults + custom overrides
 * - Supports active/monitoring modes (active = execute, monitoring = log-only)
 *
 * @dependencies IOrchestrator, IStrategy, Position, MarketSnapshot, StrategyResult (from @lp-system/core)
 * @sideEffects None — pure delegation, state held externally in registry
 */
import { IOrchestrator, IStrategy, Position, MarketSnapshot, StrategyResult } from '@lp-system/core';

/**
 * StrategyOrchestrator: per-assignment runtime that ticks a strategy against a position.
 */
export class StrategyOrchestrator implements IOrchestrator {
  public id: string;

  /**
   * Constructs an orchestrator bound to a specific assignment and strategy.
   *
   * @param {string} assignmentId - Unique assignment identifier.
   * @param {string} positionId - On-chain position pubkey/ID.
   * @param {string} strategyId - Registered strategy key.
   * @param {'active' | 'monitoring'} mode - Execution mode (active dispatches decisions).
   * @param {IStrategy} strategy - Strategy instance to delegate to.
   * @param {Record<string, unknown>} [params={}] - Strategy-specific configuration parameters.
   */
  constructor(
    public assignmentId: string,
    public positionId: string,
    public strategyId: string,
    public mode: 'active' | 'monitoring',
    private strategy: IStrategy,
    private params: Record<string, unknown> = {}
  ) {
    this.id = `orch_${assignmentId}`;
  }

  /**
   * Tick callback: delegates to strategy.execute() and returns the StrategyResult.
   *
   * @param {Position} position - Current position state.
   * @param {MarketSnapshot} market - Current market data snapshot.
   * @returns {Promise<StrategyResult>} Strategy's recommendation (skip/close/open/close+open).
   */
  public async tick(position: Position, market: MarketSnapshot): Promise<StrategyResult> {
    console.log(`[StrategyOrchestrator] Ticking orchestrator ${this.id} for position ${this.positionId}. Mode: ${this.mode}`);
    return await this.strategy.execute(position, market, this.params);
  }
}
