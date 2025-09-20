import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableActionItem from './SortableActionItem';
import type { Action } from '~/providers/configuration-provider';

interface SortableActionsListProps {
  actions: Action[];
  type: 'primary' | 'secondary';
  moveAction: (type: 'primary' | 'secondary', activeId: string, overId: string) => void;
  updateActionValue: (type: 'primary' | 'secondary', index: number, value: string) => void;
  removeAction: (type: 'primary' | 'secondary', index: number) => void;
}

export default function SortableActionsList({
  actions,
  type,
  moveAction,
  updateActionValue,
  removeAction
}: SortableActionsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      moveAction(type, active.id as string, over.id as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={actions.map((action, index) => `${action.name}-${index}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {actions.map((action, index) => (
            <SortableActionItem
              key={`${action.name}-${index}`}
              action={action}
              index={index}
              type={type}
              updateActionValue={updateActionValue}
              removeAction={removeAction}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
