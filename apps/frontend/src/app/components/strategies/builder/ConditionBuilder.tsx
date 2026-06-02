/**
 * @file ConditionBuilder.tsx
 * @description A visual, n8n-style Condition Builder component styled with a Brutalist layout.
 *
 * @features
 * - Renders a list of rules
 * - Replaces text field inputs with dropdown selectors populated from simulated variables
 * - Supports adding multiple AND/OR conditions within each rule
 * - Emits a structured JSON AST representing the rules
 */
'use client';

import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

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
  variables?: { value: string; label: string }[];
}

const OPERATORS = [
  { value: 'gt', label: 'GREATER THAN (>)' },
  { value: 'lt', label: 'LESS THAN (<)' },
  { value: 'eq', label: 'EQUALS (==)' },
  { value: 'gte', label: 'GREATER OR EQUAL (>=)' },
  { value: 'lte', label: 'LESS OR EQUAL (<=)' },
  { value: 'truthy', label: 'IS TRUTHY' },
  { value: 'falsy', label: 'IS FALSY' },
];

const SIGNALS = ['skip', 'close', 'open', 'close+open'];

const EXPOSED_VARIABLES = [
  { value: 'RSI_14', label: 'RSI VALUE (RSI_14)' },
  { value: 'Price_SOL', label: 'SOL RATE (Price_SOL)' },
  { value: 'MA_50', label: '50 SMA (MA_50)' },
  { value: 'MA_200', label: '200 SMA (MA_200)' },
  { value: 'Signal', label: 'CROSSOVER (Signal)' },
  { value: 'UserBalanceUSDC', label: 'USDC BALANCE' },
  { value: 'UserBalanceETH', label: 'ETH BALANCE' },
];

export function ConditionBuilder({ value, onChange, variables }: Props) {
  // Ensure value is an array
  const rules: DecisionRule[] = Array.isArray(value) ? value : [];
  const variablesList = variables || EXPOSED_VARIABLES;

  const updateRule = (ruleIndex: number, newRule: DecisionRule) => {
    const newRules = [...rules];
    newRules[ruleIndex] = newRule;
    onChange(newRules);
  };

  const addRule = () => {
    onChange([
      ...rules,
      {
        conditions: [{ field: 'RSI_14', operator: 'eq', value: '' }],
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
    rule.conditions = [...rule.conditions, { field: 'RSI_14', operator: 'eq', value: '', logicalOperator }];
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
    <div className="space-y-4 font-mono-jb w-full">
      {rules.length === 0 && (
        <div className="text-[11px] text-[#0D0D0D]/50 italic">No conditional rules defined. Action defaults to SKIP.</div>
      )}

      {rules.map((rule, ruleIndex) => (
        <div
          key={ruleIndex}
          className="bg-white border-2 border-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D] p-3 flex flex-col gap-3 relative"
        >
          <div className="flex justify-between items-center border-b border-[#0D0D0D]/10 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
              Evaluation Rule #{ruleIndex + 1}
            </span>
            <button
              onClick={() => removeRule(ruleIndex)}
              className="text-[#0D0D0D] hover:text-[#FF4500] transition-colors p-1 border border-transparent hover:border-[#0D0D0D]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {rule.conditions.map((cond, condIndex) => (
              <div key={condIndex} className="flex flex-col gap-1.5 border-l-2 border-[#0D0D0D] pl-2 py-1">
                {condIndex > 0 && (
                  <div className="inline-block self-start">
                    <select
                      value={cond.logicalOperator || 'AND'}
                      onChange={(e) =>
                        updateCondition(ruleIndex, condIndex, { ...cond, logicalOperator: e.target.value as 'AND' | 'OR' })
                      }
                      className="bg-[#0D0D0D] border-2 border-[#0D0D0D] px-1 py-0.5 text-[9px] font-bold text-white focus:outline-none appearance-none text-center cursor-pointer"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold bg-[#0D0D0D] text-white px-1.5 py-0.5 uppercase">
                    {condIndex === 0 ? 'IF' : 'VAL'}
                  </span>

                  {/* Dynamic Variable Selection Dropdown */}
                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(ruleIndex, condIndex, { ...cond, field: e.target.value })}
                    className="bg-[#F4F4F0] border-2 border-[#0D0D0D] px-2 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none appearance-none flex-1 min-w-[120px] uppercase"
                  >
                    {variablesList.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(ruleIndex, condIndex, { ...cond, operator: e.target.value })}
                    className="bg-white border-2 border-[#0D0D0D] px-2 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none cursor-pointer appearance-none uppercase"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {cond.operator !== 'truthy' && cond.operator !== 'falsy' && (
                    <input
                      type="text"
                      placeholder="VALUE"
                      value={String(cond.value)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
                        updateCondition(ruleIndex, condIndex, { ...cond, value: parsed });
                      }}
                      className="bg-white border-2 border-[#0D0D0D] px-2 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none w-20 uppercase"
                    />
                  )}

                  {rule.conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(ruleIndex, condIndex)}
                      className="p-1 text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white border-2 border-transparent hover:border-[#0D0D0D] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Logical Connector Buttons */}
          <div className="flex gap-2 border-t border-[#0D0D0D]/10 pt-2">
            <button
              onClick={() => addCondition(ruleIndex, 'AND')}
              className="text-[9px] font-bold bg-[#F4F4F0] border-2 border-[#0D0D0D] px-2.5 py-1 flex items-center gap-1 hover:bg-[#0D0D0D] hover:text-white transition-all shadow-[1px_1px_0_#0D0D0D] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              + ADD AND
            </button>
            <button
              onClick={() => addCondition(ruleIndex, 'OR')}
              className="text-[9px] font-bold bg-[#F4F4F0] border-2 border-[#0D0D0D] px-2.5 py-1 flex items-center gap-1 hover:bg-[#0D0D0D] hover:text-white transition-all shadow-[1px_1px_0_#0D0D0D] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              + ADD OR
            </button>
          </div>

          {/* Outcome Signal Indicator (Skip / Close / Rebalance) */}
          <div className="bg-[#F4F4F0] p-2 flex items-center gap-2 border-2 border-[#0D0D0D] mt-1.5">
            <span className="text-[10px] font-bold bg-[#0D0D0D] text-white px-2 py-1 uppercase">THEN ACTION</span>
            <div className="relative flex-1">
              <select
                value={rule.signal}
                onChange={(e) => updateRule(ruleIndex, { ...rule, signal: e.target.value })}
                className="w-full bg-white border border-[#0D0D0D] px-2.5 py-1 text-[11px] font-bold text-[#0D0D0D] focus:outline-none appearance-none cursor-pointer uppercase"
              >
                {SIGNALS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'close+open' ? 'REBALANCE (CLOSE+OPEN)' : s.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0D0D0D] text-[9px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addRule}
        className="text-[11px] font-bold bg-[#FF4500] text-white border-2 border-[#0D0D0D] px-3 py-2 flex items-center gap-2 hover:bg-[#E03E00] transition-colors w-full justify-center shadow-[3px_3px_0_#0D0D0D] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
      >
        <Plus className="w-3.5 h-3.5" /> ADD NEW EVALUATION RULE
      </button>
    </div>
  );
}
