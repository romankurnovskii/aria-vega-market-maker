/**
 * @file condition-decision-step.ts
 * @description Generic configurable decision block that reads a computed context value,
 *              applies a comparison operator, and emits a signal based on the result.
 *
 * @features
 * - Reads any context field by key (e.g. 'rsi', 'isInRange', 'volatility')
 * - Applies configurable operator: gt, lt, eq, gte, lte, truthy, falsy
 * - Writes _signal and _reason to context based on the comparison outcome
 * - Respects prior signals: if a previous step already set _signal, this step can override or pass through
 *
 * @dependencies IStep, PipelineContext, StepDescriptor (from @lp-system/core)
 * @sideEffects None — pure decision logic
 */
import { IStep, PipelineContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('condition-decision-step');

export interface RuleCondition {
  field: string;
  operator: string;
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export interface DecisionRule {
  conditions: RuleCondition[];
  signal: string;
}

export interface ConditionDecisionParams {
  // Logic expression rules (JSON AST array)
  rules?: DecisionRule[];
  defaultSignal?: 'skip' | 'close' | 'open' | 'close+open';
}

const DEFAULT_PARAMS: ConditionDecisionParams = {
  rules: [],
  defaultSignal: 'skip',
};

export class ConditionDecisionStep implements IStep {
  public name = 'ConditionDecisionStep';

  public readonly descriptor: StepDescriptor = {
    id: 'condition-decision',
    name: 'Condition Decision',
    description:
      'Evaluates conditions against context values and emits trading signals. Supports a visual condition builder.',
    category: 'decision',
    inputs: [{ key: 'field', type: 'dynamic', description: 'The context key(s) to evaluate' }],
    outputs: [
      { key: '_signal', type: 'string', description: 'Trading signal: skip, close, open, or close+open' },
      { key: '_reason', type: 'string', description: 'Human-readable explanation of the decision' },
    ],
    params: [
      {
        key: 'rules',
        type: 'condition-builder',
        description: 'Visual condition rules.',
        default: [],
      },
      {
        key: 'defaultSignal',
        type: 'select',
        description: 'Default signal if no rule matches',
        options: ['skip', 'close', 'open', 'close+open'],
        default: 'skip',
      },
    ],
  };

  private params: ConditionDecisionParams;

  constructor(params: Partial<ConditionDecisionParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Evaluates dynamic conditions against the pipeline context.
   *
   * @param {PipelineContext} context - Pipeline context with computed values from prior steps.
   * @returns {Promise<PipelineContext>} Updated context with _signal and _reason set.
   */
  public async execute(context: PipelineContext): Promise<PipelineContext> {
    const { rules, defaultSignal } = this.params;

    if (rules && rules.length > 0) {
      logger.info(`[${this.name}] Evaluating rules...`);
      const { signal, reason } = this.evaluateRules(rules, defaultSignal || 'skip', context);
      logger.info(`[${this.name}] Multi-rule decision: ${reason}`);
      return {
        ...context,
        _signal: signal,
        _reason: reason,
      };
    }

    logger.warn(`[${this.name}] No rules configured. Skipping decision.`);
    return {
      ...context,
      _signal: 'skip',
      _reason: 'ConditionDecisionStep: no rules configured',
    };
  }

  /**
   * Evaluates the rules JSON AST array.
   */
  private evaluateRules(
    rules: DecisionRule[],
    defaultSignal: string,
    context: PipelineContext
  ): { signal: string; reason: string } {
    for (const rule of rules) {
      if (!rule.conditions || rule.conditions.length === 0) continue;

      // A single rule's conditions are evaluated sequentially.
      // We group them by AND/OR with left-to-right evaluation.
      let ruleResult = true;
      let i = 0;

      while (i < rule.conditions.length) {
        const cond = rule.conditions[i];
        const condResult = this.evaluateSingleConditionNode(cond, context);

        if (i === 0) {
          ruleResult = condResult;
        } else {
          const logicalOp = cond.logicalOperator === 'OR' ? 'OR' : 'AND';
          if (logicalOp === 'AND') {
            ruleResult = ruleResult && condResult;
          } else {
            ruleResult = ruleResult || condResult;
          }
        }
        i++;
      }

      if (ruleResult) {
        return {
          signal: rule.signal,
          reason: `Matched JSON rule with ${rule.conditions.length} condition(s)`,
        };
      }
    }

    return {
      signal: defaultSignal,
      reason: `No rules matched. Fell back to default signal: "${defaultSignal}"`,
    };
  }

  /**
   * Evaluates a single structured condition node against the context.
   */
  private evaluateSingleConditionNode(cond: RuleCondition, context: PipelineContext): boolean {
    const contextVal = context[cond.field];

    const numContext = Number(contextVal);
    const numCond = Number(cond.value);
    const isNum = !isNaN(numContext) && !isNaN(numCond);

    switch (cond.operator) {
      case 'truthy':
        return Boolean(contextVal);
      case 'falsy':
        return !contextVal;
      case 'gt':
      case '>':
        return isNum ? numContext > numCond : false;
      case 'lt':
      case '<':
        return isNum ? numContext < numCond : false;
      case 'eq':
      case '==':
      case '===':
        return contextVal === cond.value || String(contextVal) === String(cond.value);
      case '!=':
      case '!==':
        return contextVal !== cond.value && String(contextVal) !== String(cond.value);
      case 'gte':
      case '>=':
        return isNum ? numContext >= numCond : false;
      case 'lte':
      case '<=':
        return isNum ? numContext <= numCond : false;
      default:
        return false;
    }
  }
}
