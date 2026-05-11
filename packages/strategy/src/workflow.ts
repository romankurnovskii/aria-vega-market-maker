import { IStep, StepContext } from '@lp-system/core';

export class Workflow {
  constructor(private steps: IStep[]) {}

  public async run(initialContext: StepContext): Promise<StepContext> {
    let context = { ...initialContext };
    for (const step of this.steps) {
      console.log(`[Workflow] Running step: ${step.name}`);
      context = await step.execute(context);
    }
    return context;
  }
}
