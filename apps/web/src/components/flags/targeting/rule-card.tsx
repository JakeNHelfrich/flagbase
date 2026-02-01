import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ConditionBuilder } from './condition-builder';
import { PercentageSlider } from './percentage-slider';
import { FlagValueEditor } from './flag-value-editor';
import type { TargetingRule, FlagType, Condition } from '@flagbase/types';

interface RuleCardProps {
  rule: TargetingRule;
  flagType: FlagType;
  onUpdate: (updates: Partial<TargetingRule>) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function RuleCard({
  rule,
  flagType,
  onUpdate,
  onDelete,
  disabled,
}: RuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleConditionsChange = (conditions: Condition[]) => {
    onUpdate({ conditions });
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <button
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
            disabled={disabled}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <Input
              value={rule.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="font-semibold text-lg h-auto py-1 px-2 border-transparent hover:border-input focus:border-input"
              disabled={disabled}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Conditions</Label>
          <ConditionBuilder
            conditions={rule.conditions}
            onChange={handleConditionsChange}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            All conditions must match (AND logic)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Percentage Rollout</Label>
          <PercentageSlider
            value={rule.percentage}
            onChange={(percentage) => onUpdate({ percentage })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Value to Serve</Label>
          <FlagValueEditor
            type={flagType}
            value={rule.value}
            onChange={(value) => onUpdate({ value })}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
