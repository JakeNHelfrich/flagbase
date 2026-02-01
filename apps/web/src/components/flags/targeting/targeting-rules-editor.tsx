import { useState } from 'react';
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
import { RuleCard } from './rule-card';
import { Button } from '~/components/ui/button';
import { Plus } from 'lucide-react';
import type { TargetingRule, FlagType, Condition } from '@flagbase/types';

interface TargetingRulesEditorProps {
  rules: TargetingRule[];
  flagType: FlagType;
  onChange: (rules: TargetingRule[]) => void;
  disabled?: boolean;
}

export function TargetingRulesEditor({
  rules,
  flagType,
  onChange,
  disabled,
}: TargetingRulesEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      const newRules = arrayMove(rules, oldIndex, newIndex).map(
        (rule, index) => ({
          ...rule,
          priority: index,
        }),
      );
      onChange(newRules);
    }
  };

  const addRule = () => {
    const newRule: TargetingRule = {
      id: crypto.randomUUID(),
      name: `Rule ${rules.length + 1}`,
      conditions: [
        {
          attribute: '',
          operator: 'eq',
          value: '',
        },
      ],
      percentage: 100,
      value: getDefaultValue(flagType),
      priority: rules.length,
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<TargetingRule>) => {
    onChange(
      rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule,
      ),
    );
  };

  const deleteRule = (id: string) => {
    const newRules = rules
      .filter((rule) => rule.id !== id)
      .map((rule, index) => ({ ...rule, priority: index }));
    onChange(newRules);
  };

  return (
    <div className="space-y-4">
      {rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">No targeting rules defined</p>
          <Button onClick={addRule} disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rules.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    flagType={flagType}
                    onUpdate={(updates) => updateRule(rule.id, updates)}
                    onDelete={() => deleteRule(rule.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button onClick={addRule} variant="outline" disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </>
      )}
    </div>
  );
}

function getDefaultValue(type: FlagType) {
  switch (type) {
    case 'boolean':
      return true;
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'json':
      return {};
  }
}
