/**
 * @file ConditionBuilder.tsx
 * @description A visual, n8n-style Condition Builder component that replaces the raw text area for rules.
 *
 * @features
 * - Renders a list of rules
 * - Supports adding multiple AND/OR conditions within each rule
 * - Emits a structured JSON AST representing the rules
 */
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface RuleCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface DecisionRule {
  conditions: RuleCondition[];
  signal: string;
}

interface Props {
  value: DecisionRule[] | string;
  onChange: (value: DecisionRule[]) => void;
}

const OPERATORS = [
  { value: 'gt', label: 'Greater Than (>)' },
  { value: 'lt', label: 'Less Than (<)' },
  { value: 'eq', label: 'Equals (==)' },
  { value: 'gte', label: 'Greater or Equal (>=)' },
  { value: 'lte', label: 'Less or Equal (<=)' },
  { value: 'truthy', label: 'Is Truthy' },
  { value: 'falsy', label: 'Is Falsy' },
];

const SIGNALS = ['skip', 'close', 'open', 'close+open'];

export function ConditionBuilder({ value, onChange }: Props) {
  // Ensure value is an array
  const rules: DecisionRule[] = Array.isArray(value) ? value : [];

  const updateRule = (ruleIndex: number, newRule: DecisionRule) => {
    const newRules = [...rules];
    newRules[ruleIndex] = newRule;
    onChange(newRules);
  };

  const addRule = () => {
    onChange([
      ...rules,
      {
        conditions: [{ field: '', operator: 'eq', value: '' }],
        signal: 'close+open',
      },
    ]);
  };

  const removeRule = (ruleIndex: number) => {
    const newRules = rules.filter((_, i) => i !== ruleIndex);
    onChange(newRules);
  };

  const updateCondition = (ruleIndex: number, condIndex: number, newCond: RuleCondition) => {
    const rule = { ...rules[ruleIndex] };
    const newConditions = [...rule.conditions];
    newConditions[condIndex] = newCond;
    rule.conditions = newConditions;
    updateRule(ruleIndex, rule);
  };

  const addCondition = (ruleIndex: number, logicalOperator: 'AND' | 'OR') => {
    const rule = { ...rules[ruleIndex] };
    rule.conditions = [...rule.conditions, { field: '', operator: 'eq', value: '', logicalOperator }];
    updateRule(ruleIndex, rule);
  };

  const removeCondition = (ruleIndex: number, condIndex: number) => {
    const rule = { ...rules[ruleIndex] };
    rule.conditions = rule.conditions.filter((_, i) => i !== condIndex);
    if (rule.conditions.length > 0 && condIndex === 0) {
      delete rule.conditions[0].logicalOperator; // First condition cannot have a logical operator
    }
    updateRule(ruleIndex, rule);
  };

  return (
    <div className="space-y-4 font-mono-jb">
      {rules.length === 0 && (
        <div className="text-[11px] text-[#0D0D0D]/60 italic">No rules defined. Default signal will be used.</div>
      )}

      {rules.map((rule, ruleIndex) => (
        <div key={ruleIndex} className="bg-white border border-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D] p-3 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[#0D0D0D]/10 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D]">Rule {ruleIndex + 1}</span>
            <button onClick={() => removeRule(ruleIndex)} className="text-[#0D0D0D] hover:text-[#FF4500] transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {rule.conditions.map((cond, condIndex) => (
              <div key={condIndex} className="flex items-center gap-2">
                {condIndex > 0 ? (
                  <select
                    value={cond.logicalOperator || 'AND'}
                    onChange={(e) =>
                      updateCondition(ruleIndex, condIndex, { ...cond, logicalOperator: e.target.value as 'AND' | 'OR' })
                    }
                    className="bg-[#F4F4F0] border border-[#0D0D0D] px-1.5 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] w-16 appearance-none text-center"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                ) : (
                  <span className="text-[11px] font-bold bg-[#0D0D0D] text-white px-1.5 py-1 w-16 text-center inline-block">
                    IF
                  </span>
                )}

                <input
                  type="text"
                  placeholder="Field (e.g. rsi)"
                  value={cond.field}
                  onChange={(e) => updateCondition(ruleIndex, condIndex, { ...cond, field: e.target.value })}
                  className="bg-white border border-[#0D0D0D] px-2 py-1 text-[11px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] flex-1 min-w-0"
                />

                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(ruleIndex, condIndex, { ...cond, operator: e.target.value })}
                  className="bg-white border border-[#0D0D0D] px-2 py-1 text-[11px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] appearance-none"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {cond.operator !== 'truthy' && cond.operator !== 'falsy' && (
                  <input
                    type="text"
                    placeholder="Value"
                    value={String(cond.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
                      updateCondition(ruleIndex, condIndex, { ...cond, value: parsed });
                    }}
                    className="bg-white border border-[#0D0D0D] px-2 py-1 text-[11px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] w-20"
                  />
                )}

                <button
                  onClick={() => removeCondition(ruleIndex, condIndex)}
                  disabled={rule.conditions.length === 1}
                  className="p-1 text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white border border-transparent hover:border-[#0D0D0D] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#0D0D0D]"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => addCondition(ruleIndex, 'AND')}
              className="text-[10px] font-bold bg-[#F4F4F0] border border-[#0D0D0D] px-2 py-1 flex items-center gap-1 hover:bg-[#0D0D0D] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> AND
            </button>
            <button
              onClick={() => addCondition(ruleIndex, 'OR')}
              className="text-[10px] font-bold bg-[#F4F4F0] border border-[#0D0D0D] px-2 py-1 flex items-center gap-1 hover:bg-[#0D0D0D] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> OR
            </button>
          </div>

          <div className="bg-[#F4F4F0] p-2 flex items-center gap-2 border border-[#0D0D0D] mt-1">
            <span className="text-[11px] font-bold bg-[#0D0D0D] text-white px-2 py-1">THEN</span>
            <select
              value={rule.signal}
              onChange={(e) => updateRule(ruleIndex, { ...rule, signal: e.target.value })}
              className="bg-white border border-[#0D0D0D] px-2 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] appearance-none"
            >
              {SIGNALS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <button
        onClick={addRule}
        className="text-[11px] font-bold bg-[#0D0D0D] text-white px-3 py-1.5 flex items-center gap-2 hover:bg-[#FF4500] transition-colors w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> ADD RULE
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
