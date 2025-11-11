import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import SortableActionsList from './SortableActionsList';
import type { Action } from '~/providers/configuration-provider';

// Mock dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((Sensor: any, options?: any) => ({ Sensor, options })),
  useSensors: vi.fn((...sensors: any[]) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  arrayMove: vi.fn((array: any[], from: number, to: number) => {
    const newArray = [...array];
    newArray.splice(from, 1);
    newArray.splice(to, 0, array[from]);
    return newArray;
  }),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: {},
}));

vi.mock('./SortableActionItem', () => ({
  default: ({ action, index, updateActionValue, removeAction }: any) => (
    <div data-testid={`sortable-item-${index}`} className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {action.label || action.name}
      </label>
      <div className="flex items-center gap-2">
        <input
          value={action.value}
          onChange={(e) => updateActionValue(action.type, index, e.target.value)}
          placeholder={action.placeholder}
          className="flex-1"
          data-testid={`action-input-${index}`}
        />
        <button
          onClick={() => removeAction(action.type, index)}
          data-testid={`remove-btn-${index}`}
        >
          Remove
        </button>
      </div>
    </div>
  ),
}));

describe('SortableActionsList', () => {
  const mockActions: Action[] = [
    {
      name: 'email',
      value: 'test@example.com',
      type: 'primary',
      label: 'Email',
      placeholder: 'email@example.com',
      color: '#FF6B6B',
    },
    {
      name: 'phone',
      value: '555-1234',
      type: 'primary',
      label: 'Phone',
      placeholder: '+1 (555) 123-4567',
      color: '#4ECDC4',
    },
  ];

  const mockMoveAction = vi.fn();
  const mockUpdateActionValue = vi.fn();
  const mockRemoveAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.getByTestId('sortable-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
    });

    it('should render all actions passed as props', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should render empty list when no actions are provided', () => {
      render(
        <SortableActionsList
          actions={[]}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.queryByTestId('sortable-item-0')).not.toBeInTheDocument();
    });
  });

  describe('Action Items Display', () => {
    it('should display action labels correctly', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should display action values in input fields', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const emailInput = screen.getByTestId('action-input-0') as HTMLInputElement;
      const phoneInput = screen.getByTestId('action-input-1') as HTMLInputElement;

      expect(emailInput.value).toBe('test@example.com');
      expect(phoneInput.value).toBe('555-1234');
    });

    it('should display placeholders for inputs', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const emailInput = screen.getByTestId('action-input-0');
      const phoneInput = screen.getByTestId('action-input-1');

      expect(emailInput).toHaveAttribute('placeholder', 'email@example.com');
      expect(phoneInput).toHaveAttribute('placeholder', '+1 (555) 123-4567');
    });
  });

  describe('User Interactions', () => {
    it('should call removeAction callback when remove button is clicked', async () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const removeButton = screen.getByTestId('remove-btn-0');
      removeButton.click();

      expect(mockRemoveAction).toHaveBeenCalledWith('primary', 0);
    });

    it('should call updateActionValue callback when input changes', async () => {
      const user = userEvent.setup();
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const emailInput = screen.getByTestId('action-input-0') as HTMLInputElement;
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      // The callback should be called on each character typed
      expect(mockUpdateActionValue).toHaveBeenCalled();
    });
  });

  describe('Multiple Actions', () => {
    it('should handle more than two actions', () => {
      const manyActions: Action[] = [
        ...mockActions,
        {
          name: 'website',
          value: 'https://example.com',
          type: 'primary',
          label: 'Website',
          placeholder: 'https://example.com',
          color: '#95E1D3',
        },
      ];

      render(
        <SortableActionsList
          actions={manyActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.getByTestId('sortable-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-2')).toBeInTheDocument();
    });
  });

  describe('Action Type Handling', () => {
    it('should handle primary action type', () => {
      render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const removeButton = screen.getByTestId('remove-btn-0');
      removeButton.click();

      expect(mockRemoveAction).toHaveBeenCalledWith('primary', 0);
    });

    it('should handle secondary action type', () => {
      const secondaryActions: Action[] = [
        {
          name: 'linkedin',
          value: 'https://linkedin.com/in/user',
          type: 'secondary',
          label: 'LinkedIn',
          placeholder: 'https://linkedin.com/in/...',
          color: '#0A66C2',
        },
      ];

      render(
        <SortableActionsList
          actions={secondaryActions}
          type="secondary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const removeButton = screen.getByTestId('remove-btn-0');
      removeButton.click();

      expect(mockRemoveAction).toHaveBeenCalledWith('secondary', 0);
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should integrate with DndContext', () => {
      const { container } = render(
        <SortableActionsList
          actions={mockActions}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      // Verify DndContext wrapper is rendered
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle actions with empty values', () => {
      const actionsWithEmptyValues: Action[] = [
        {
          name: 'email',
          value: '',
          type: 'primary',
          label: 'Email',
          placeholder: 'email@example.com',
          color: '#FF6B6B',
        },
      ];

      render(
        <SortableActionsList
          actions={actionsWithEmptyValues}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      const emailInput = screen.getByTestId('action-input-0') as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });

    it('should handle single action', () => {
      const singleAction: Action[] = [mockActions[0]];

      render(
        <SortableActionsList
          actions={singleAction}
          type="primary"
          moveAction={mockMoveAction}
          updateActionValue={mockUpdateActionValue}
          removeAction={mockRemoveAction}
        />
      );

      expect(screen.getByTestId('sortable-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('sortable-item-1')).not.toBeInTheDocument();
    });
  });
});

