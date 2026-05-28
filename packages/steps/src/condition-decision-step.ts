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

type ComparisonOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'truthy' | 'falsy';

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
  // Legacy / simple single-condition fields
  field?: string;
  operator?: ComparisonOperator;
  threshold?: number;
  signalOnTrue?: string;
  signalOnFalse?: string;

  // Logic expression rules (either multi-line string or JSON AST array)
  rules?: string | DecisionRule[];
  defaultSignal?: 'skip' | 'close' | 'open' | 'close+open';
}

const DEFAULT_PARAMS: ConditionDecisionParams = {
  field: '',
  operator: 'truthy',
  threshold: 0,
  signalOnTrue: 'close+open',
  signalOnFalse: 'skip',
  rules: '',
  defaultSignal: 'skip',
};

export class ConditionDecisionStep implements IStep {
  public name = 'ConditionDecisionStep';

  public readonly descriptor: StepDescriptor = {
    id: 'condition-decision',
    name: 'Condition Decision',
    description:
      'Evaluates conditions against context values and emits trading signals. Supports a visual condition builder, a multi-line logic expression block, or a simple single-condition configuration.',
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
        description: 'Visual condition rules or Multi-line logic rules.',
        default: [],
      },
      {
        key: 'defaultSignal',
        type: 'select',
        description: 'Default signal if no rule matches',
        options: ['skip', 'close', 'open', 'close+open'],
        default: 'skip',
      },
      {
        key: 'field',
        type: 'string',
        description: '[Legacy/Simple] Context key to read (e.g. "rsi", "isInRange")',
        default: '',
      },
      {
        key: 'operator',
        type: 'select',
        description: '[Legacy/Simple] Comparison operator',
        options: ['gt', 'lt', 'eq', 'gte', 'lte', 'truthy', 'falsy'],
        default: 'truthy',
      },
      { key: 'threshold', type: 'number', description: '[Legacy/Simple] Value to compare against', default: 0 },
      {
        key: 'signalOnTrue',
        type: 'select',
        description: '[Legacy/Simple] Signal if TRUE',
        options: ['skip', 'close', 'open', 'close+open'],
        default: 'close+open',
      },
      {
        key: 'signalOnFalse',
        type: 'select',
        description: '[Legacy/Simple] Signal if FALSE',
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
    const { field, operator, threshold, signalOnTrue, signalOnFalse, rules, defaultSignal } = this.params;

    // 1. If rules are configured (AST JSON array or multi-line string), evaluate them
    if (rules && (Array.isArray(rules) ? rules.length > 0 : rules.trim().length > 0)) {
      logger.info(`[${this.name}] Evaluating rules...`);
      const { signal, reason } = this.evaluateRules(rules, defaultSignal || 'skip', context);
      logger.info(`[${this.name}] Multi-rule decision: ${reason}`);
      return {
        ...context,
        _signal: signal,
        _reason: reason,
      };
    }

    // 2. Fall back to legacy simple single-field comparison
    if (!field) {
      logger.warn(`[${this.name}] No field or rules configured. Skipping decision.`);
      return {
        ...context,
        _signal: 'skip',
        _reason: 'ConditionDecisionStep: no rules or field configured',
      };
    }

    const value = context[field];
    const op = operator || 'truthy';
    const thresh = threshold ?? 0;
    const sigTrue = signalOnTrue || 'close+open';
    const sigFalse = signalOnFalse || 'skip';

    logger.info(
      `[${this.name}] Evaluating legacy: context.${field} = ${JSON.stringify(value)}, operator = ${op}, threshold = ${thresh}`
    );

    const conditionMet = this.evaluate(value, op, thresh);
    const signal = conditionMet ? sigTrue : sigFalse;
    const reason = `Condition ${field} ${op} ${thresh}: ${conditionMet ? 'TRUE' : 'FALSE'} (value=${JSON.stringify(value)}) → signal=${signal}`;

    logger.info(`[${this.name}] Legacy decision: ${reason}`);

    return {
      ...context,
      _signal: signal,
      _reason: reason,
    };
  }

  /**
   * Evaluates the rules (either JSON AST or multi-line string).
   */
  private evaluateRules(
    rules: string | DecisionRule[],
    defaultSignal: string,
    context: PipelineContext
  ): { signal: string; reason: string } {
    if (Array.isArray(rules)) {
      // Evaluate JSON AST array of rules
      for (const rule of rules) {
        if (!rule.conditions || rule.conditions.length === 0) continue;

        // A single rule's conditions are evaluated sequentially.
        // We group them by AND/OR. (A simple left-to-right evaluation without precedence,
        // or just assuming standard precedence. Let's do simple left-to-right state tracking.)
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
    } else {
      // Evaluate multi-line string rules (legacy fallback)
      const rulesStr = rules as string;
      const lines = rulesStr
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));

      for (const line of lines) {
        const parts = line.split('->');
        if (parts.length !== 2) {
          logger.warn(`[${this.name}] Invalid rule format (missing "->"): ${line}`);
          continue;
        }

        const conditionStr = parts[0].trim();
        const signal = parts[1].trim();

        if (!['skip', 'close', 'open', 'close+open'].includes(signal)) {
          logger.warn(`[${this.name}] Invalid signal "${signal}" in rule: ${line}`);
          continue;
        }

        if (conditionStr.toLowerCase() === 'default' || conditionStr.toLowerCase() === 'true') {
          return {
            signal,
            reason: `Matched fallback/default rule: "${line}"`,
          };
        }

        const isMatched = this.evaluateExpression(conditionStr, context);
        if (isMatched) {
          return {
            signal,
            reason: `Condition matched rule: "${line}" (evaluated true)`,
          };
        }
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

    // Some legacy operators might be passed, or string operators like "==", ">"
    switch (cond.operator) {
      case 'truthy':
        return Boolean(contextVal);
      case 'falsy':
        return !contextVal;
      case 'gt':
      case '>':
        return typeof contextVal === 'number' && typeof cond.value === 'number' && contextVal > cond.value;
      case 'lt':
      case '<':
        return typeof contextVal === 'number' && typeof cond.value === 'number' && contextVal < cond.value;
      case 'eq':
      case '==':
      case '===':
        return contextVal === cond.value || String(contextVal) === String(cond.value);
      case '!=':
      case '!==':
        return contextVal !== cond.value && String(contextVal) !== String(cond.value);
      case 'gte':
      case '>=':
        return typeof contextVal === 'number' && typeof cond.value === 'number' && contextVal >= cond.value;
      case 'lte':
      case '<=':
        return typeof contextVal === 'number' && typeof cond.value === 'number' && contextVal <= cond.value;
      default:
        return false;
    }
  }

  /**
   * Parses and evaluates a compound logical expression supporting && and || operations.
   */
  private evaluateExpression(expr: string, context: PipelineContext): boolean {
    const orTerms = expr.split('||').map((t) => t.trim());
    for (const orTerm of orTerms) {
      if (this.evaluateAndExpression(orTerm, context)) {
        return true;
      }
    }
    return false;
  }

  private evaluateAndExpression(expr: string, context: PipelineContext): boolean {
    const andTerms = expr.split('&&').map((t) => t.trim());
    for (const andTerm of andTerms) {
      if (!this.evaluateSingleCondition(andTerm, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateSingleCondition(cond: string, context: PipelineContext): boolean {
    cond = cond.trim();
    if (!cond) return false;

    // Handle negation: !field
    if (cond.startsWith('!')) {
      const field = cond.slice(1).trim();
      return !context[field];
    }

    // Pattern for comparison: field operator value
    const match = cond.match(/^([a-zA-Z0-9_]+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
    if (!match) {
      // If it's just a field name, evaluate as truthy
      return Boolean(context[cond]);
    }

    const field = match[1].trim();
    const op = match[2].trim();
    let rawValue = match[3].trim();

    // Strip optional quotes
    if ((rawValue.startsWith("'") && rawValue.endsWith("'")) || (rawValue.startsWith('"') && rawValue.endsWith('"'))) {
      rawValue = rawValue.slice(1, -1);
    }

    const contextVal = context[field];

    // Parse comparison value to match context type (number, boolean, or string)
    let typedVal: string | number | boolean = rawValue;
    if (rawValue.toLowerCase() === 'true') {
      typedVal = true;
    } else if (rawValue.toLowerCase() === 'false') {
      typedVal = false;
    } else if (!isNaN(Number(rawValue)) && rawValue !== '') {
      typedVal = Number(rawValue);
    }

    switch (op) {
      case '>':
        return typeof contextVal === 'number' && typeof typedVal === 'number' && contextVal > typedVal;
      case '<':
        return typeof contextVal === 'number' && typeof typedVal === 'number' && contextVal < typedVal;
      case '>=':
        return typeof contextVal === 'number' && typeof typedVal === 'number' && contextVal >= typedVal;
      case '<=':
        return typeof contextVal === 'number' && typeof typedVal === 'number' && contextVal <= typedVal;
      case '==':
        return contextVal === typedVal || String(contextVal) === String(typedVal);
      case '!=':
        return contextVal !== typedVal && String(contextVal) !== String(typedVal);
      default:
        return false;
    }
  }

  /**
   * Applies the comparison operator to the legacy context value and threshold.
   */
  private evaluate(value: unknown, operator: ComparisonOperator, threshold: number): boolean {
    switch (operator) {
      case 'truthy':
        return Boolean(value);
      case 'falsy':
        return !value;
      case 'gt':
        return typeof value === 'number' && value > threshold;
      case 'lt':
        return typeof value === 'number' && value < threshold;
      case 'eq':
        return value === threshold || value === String(threshold);
      case 'gte':
        return typeof value === 'number' && value >= threshold;
      case 'lte':
        return typeof value === 'number' && value <= threshold;
      default:
        return false;
    }
  }
}
