import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ActionIcon } from '~/components/Icon';
import type { Action } from '~/providers/configuration-provider';

interface SortableActionItemProps {
  action: Action;
  index: number;
  type: 'primary' | 'secondary';
  updateActionValue: (type: 'primary' | 'secondary', index: number, value: string) => void;
  removeAction: (type: 'primary' | 'secondary', index: number) => void;
}

export default function SortableActionItem({
  action,
  index,
  type,
  updateActionValue,
  removeAction
}: SortableActionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${action.name}-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start space-x-3 p-3 bg-gray-50 rounded-lg ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-col space-y-1 cursor-grab active:cursor-grabbing hover:bg-gray-200 p-1 rounded mt-2"
      >
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
      
      {/* Action Icon */}
      <div
        className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 mt-2"
        style={{ backgroundColor: action.color }}
      >
        <ActionIcon name={action.name} className="w-5 h-5 text-white" />
      </div>
      
      {/* Input Field with Label */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {action.label || action.name}
        </label>
        <Input
          value={action.value}
          onChange={(e) => updateActionValue(type, index, e.target.value)}
          placeholder={action.placeholder}
        />
      </div>
      
      {/* Remove Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => removeAction(type, index)}
        className="w-8 h-8 p-0 mt-2"
      >
        ✕
      </Button>
    </div>
  );
}
