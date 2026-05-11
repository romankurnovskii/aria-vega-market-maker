import { IOrchestrator, IStrategy, Position, MarketSnapshot, StrategyResult } from '@lp-system/core';

export class StrategyOrchestrator implements IOrchestrator {
  public id: string;

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

  public async tick(position: Position, market: MarketSnapshot): Promise<StrategyResult> {
    console.log(`[StrategyOrchestrator] Ticking orchestrator ${this.id} for position ${this.positionId}. Mode: ${this.mode}`);
    return await this.strategy.execute(position, market, this.params);
  }
}
