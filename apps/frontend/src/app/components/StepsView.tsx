/**
 * @file StepsView.tsx
 * @description Dumb component rendering the available pipeline steps in a two-column grid.
 *
 * @features
 * - Displays each step with its type badge, ID, and description
 * - Large numbered index watermark in background
 * - Empty state when no steps are registered
 *
 * @sideEffects None
 */

interface StepsViewProps {
  steps: any[];
}

export const StepsView = ({ steps }: StepsViewProps): JSX.Element => {
  if (steps.length === 0) return <div className="text-gray-500 italic text-xs">No active pipeline steps registered.</div>;

  return (
    <div className="flex-1 overflow-auto pr-2 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
      {steps.map((step: any, idx: number) => (
        <div
          key={step.id}
          className="flex gap-3 border border-[#0D0D0D] bg-white p-4 relative overflow-hidden h-28 hover:bg-[#F4F4F0] transition-colors"
        >
          <div className="absolute -right-2 -bottom-4 text-7xl font-syne text-gray-100 select-none z-0">{idx + 1}</div>
          <div className="relative z-10">
            <div className="text-[9px] bg-[#0D0D0D] text-[#F4F4F0] px-1.5 py-0.5 inline-block mb-2 uppercase">
              {step.type}
            </div>
            <h4 className="font-bold text-sm mb-1 truncate">{step.id}</h4>
            <p className="text-xs text-gray-600 max-w-[85%]">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};