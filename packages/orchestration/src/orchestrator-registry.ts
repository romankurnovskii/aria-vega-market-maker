import { IOrchestratorRegistry, IOrchestrator } from '@lp-system/core';

export class OrchestratorRegistry implements IOrchestratorRegistry {
  private registry = new Map<string, IOrchestrator>();

  public register(orchestrator: IOrchestrator): void {
    console.log(`[OrchestratorRegistry] Registering orchestrator ${orchestrator.id} for position ${orchestrator.positionId}`);
    this.registry.set(orchestrator.id, orchestrator);
  }

  public deregister(id: string): void {
    const existing = this.registry.get(id);
    if (existing) {
      console.log(`[OrchestratorRegistry] Deregistering orchestrator ${id} from position ${existing.positionId}`);
      this.registry.delete(id);
    }
  }

  public getForPosition(positionId: string): IOrchestrator[] {
    const list: IOrchestrator[] = [];
    for (const orch of this.registry.values()) {
      if (orch.positionId === positionId) {
        list.push(orch);
      }
    }
    return list;
  }

  public get(id: string): IOrchestrator | undefined {
    return this.registry.get(id);
  }

  public getAll(): IOrchestrator[] {
    return Array.from(this.registry.values());
  }
}
