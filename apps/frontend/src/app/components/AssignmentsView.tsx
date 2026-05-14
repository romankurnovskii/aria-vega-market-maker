/**
 * @file AssignmentsView.tsx
 * @description Dumb component rendering the assignments table with strategy and mode details.
 *              Provides a revoke button for each assignment.
 *
 * @features
 * - Renders a table of assignments with ID, position, strategy, mode columns
 * - Displays "No active assignments" empty state
 * - Revoke button per row triggers onDelete callback
 *
 * @sideEffects None
 */

import { Trash2 } from 'lucide-react';

interface AssignmentsViewProps {
  assignments: any[];
  onDelete: (id: string) => Promise<void>;
}

export const AssignmentsView = ({ assignments, onDelete }: AssignmentsViewProps) => {
  if (assignments.length === 0)
    return <div className="text-gray-500 italic text-xs">No active assignments found. Use positions pane to create.</div>;

  return (
    <div className="flex-1 border border-[#0D0D0D] bg-white overflow-auto">
      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
        <thead className="sticky top-0 bg-[#0D0D0D] text-[#F4F4F0] z-10">
          <tr>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Assignment ID</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Target Position</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Strategy</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Mode</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">Revoke</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((asg: any) => (
            <tr key={asg.id} className="border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors group">
              <td className="py-2 px-3 font-bold border-r border-gray-200 font-mono text-[11px]">{asg.id}</td>
              <td
                className="py-2 px-3 border-r border-gray-200 text-gray-700 font-mono text-[11px] truncate max-w-[200px]"
                title={asg.positionId}
              >
                {asg.positionId}
              </td>
              <td className="py-2 px-3 border-r border-gray-200">
                <span className="bg-[#0D0D0D] text-[#F4F4F0] px-1.5 py-0.5 text-[10px] font-mono">{asg.strategyId}</span>
              </td>
              <td className="py-2 px-3 border-r border-gray-200">
                <span
                  className={`px-1.5 py-0.5 text-[10px] border font-bold ${asg.mode === 'active' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}`}
                >
                  {asg.mode.toUpperCase()}
                </span>
              </td>
              <td className="py-1 px-3 text-right">
                <button
                  onClick={() => onDelete(asg.id)}
                  className="text-gray-400 hover:text-[#FF4500] transition-colors p-1"
                  title="Delete Assignment"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};