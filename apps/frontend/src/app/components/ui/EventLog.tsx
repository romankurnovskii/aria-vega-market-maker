/**
 * @file EventLog.tsx
 * @description Orchestrator component for the strategy event log panel.
 *              Manages collapsed/expanded state and delegates rendering to
 *              EventLogHeader and EventLogEntry sub-components.
 *
 * @features
 * - Collapse/expand toggle via EventLogHeader
 * - Empty state when no logs recorded
 * - Delegates individual log entry rendering to EventLogEntry
 *
 * @sideEffects None
 */

'use client';

import React, { useState } from 'react';
import type { EvalLogEntry } from '../../types/api';
import { EventLogHeader } from './EventLogHeader';
import { EventLogEntry } from './EventLogEntry';

interface EventLogProps {
  logs: EvalLogEntry[];
  onApplySuggestion?: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => void;
}

export const EventLog = ({ logs, onApplySuggestion }: EventLogProps) => {
  const [collapsed, setCollapsed] = useState(true);

  if (collapsed) {
    return <EventLogHeader collapsed onToggle={() => setCollapsed(false)} />;
  }

  return (
    <div className="flex-1 border border-[#0D0D0D] bg-[#0D0D0D] text-[#F4F4F0] p-4 font-mono text-[13px] overflow-hidden flex flex-col min-h-0 relative min-w-0">
      <EventLogHeader collapsed={false} onToggle={() => setCollapsed(true)} />

      <div className="flex-1 overflow-auto flex flex-col gap-1 custom-scrollbar min-w-0">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic opacity-50">
            No events recorded. Click &quot;Evaluate Ad-Hoc&quot; to trigger.
          </div>
        ) : (
          logs.map((log) => <EventLogEntry key={log.id} log={log} onApplySuggestion={onApplySuggestion} />)
        )}
      </div>
    </div>
  );
};
