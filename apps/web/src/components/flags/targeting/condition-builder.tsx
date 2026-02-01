import { Plus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import type { Condition, ConditionOperator } from '@flagbase/types';

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  disabled?: boolean;
}

const operators: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'in', label: 'in list' },
  { value: 'not_in', label: 'not in list' },
];

export function ConditionBuilder({
  conditions,
  onChange,
  disabled,
}: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { attribute: '', operator: 'eq', value: '' },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    onChange(
      conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <ConditionRow
          key={index}
          condition={condition}
          onChange={(updates) => updateCondition(index, updates)}
          onRemove={() => removeCondition(index)}
          canRemove={conditions.length > 1}
          disabled={disabled}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCondition}
        disabled={disabled}
      >
        <Plus className="mr-2 h-3 w-3" />
        Add Condition
      </Button>
    </div>
  );
}

interface ConditionRowProps {
  condition: Condition;
  onChange: (updates: Partial<Condition>) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  canRemove,
  disabled,
}: ConditionRowProps) {
  const isListOperator = condition.operator === 'in' || condition.operator === 'not_in';

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="attribute"
        value={condition.attribute}
        onChange={(e) => onChange({ attribute: e.target.value })}
        className="flex-1 font-mono text-sm"
        disabled={disabled}
      />
      <Select
        value={condition.operator}
        onValueChange={(value) => onChange({ operator: value as ConditionOperator })}
        disabled={disabled}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder={isListOperator ? 'value1, value2, ...' : 'value'}
        value={
          Array.isArray(condition.value)
            ? condition.value.join(', ')
            : String(condition.value)
        }
        onChange={(e) => {
          const value = e.target.value;
          if (isListOperator) {
            onChange({ value: value.split(',').map((v) => v.trim()) });
          } else {
            onChange({ value });
          }
        }}
        className="flex-1"
        disabled={disabled}
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
