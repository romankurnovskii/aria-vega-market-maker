/**
 * @file PipelineCanvas.tsx
 * @description Drag-and-drop sortable canvas containing the strategy steps.
 */
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StepDescriptor } from '@lp-system/core';
import { PipelineStepCard } from './PipelineStepCard';

interface StepInstance {
  instanceId: string;
  stepId: string;
  params: Record<string, unknown>;
}

interface Props {
  steps: StepInstance[];
  availableDescriptors: StepDescriptor[];
  onMoveStep: (oldIndex: number, newIndex: number) => void;
  onRemoveStep: (instanceId: string) => void;
  onUpdateStepParams: (instanceId: string, params: Record<string, unknown>) => void;
}

export function PipelineCanvas({ steps, availableDescriptors, onMoveStep, onRemoveStep, onUpdateStepParams }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.instanceId === active.id);
      const newIndex = steps.findIndex((s) => s.instanceId === over.id);
      onMoveStep(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex-1 bg-[#F4F4F0] p-8 overflow-y-auto relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 border-b border-[#0D0D0D] pb-4">
          <h1 className="font-syne text-2xl font-bold text-[#0D0D0D] uppercase">Execution Pipeline</h1>
          <p className="text-[#0D0D0D]/60 text-sm font-mono-jb mt-2">Steps are executed sequentially from top to bottom.</p>
        </div>

        {steps.length === 0 ? (
          <div className="border-2 border-dashed border-[#0D0D0D]/30 bg-white p-12 text-center text-[#0D0D0D]/50 font-mono-jb shadow-[4px_4px_0_rgba(13,13,13,0.1)]">
            Drag and drop steps from the library to build your strategy.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s.instanceId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {steps.map((step) => {
                  const descriptor = availableDescriptors.find((d) => d.id === step.stepId);
                  if (!descriptor) return null; // Defensive check
                  return (
                    <PipelineStepCard
                      key={step.instanceId}
                      instanceId={step.instanceId}
                      descriptor={descriptor}
                      params={step.params}
                      onRemove={() => onRemoveStep(step.instanceId)}
                      onUpdateParams={(p) => onUpdateStepParams(step.instanceId, p)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
