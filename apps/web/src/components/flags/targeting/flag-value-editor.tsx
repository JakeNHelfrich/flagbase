import { useState, useEffect } from 'react';
import { Switch } from '~/components/ui/switch';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import type { FlagType, FlagValue } from '@flagbase/types';

interface FlagValueEditorProps {
  type: FlagType;
  value: FlagValue | undefined;
  onChange: (value: FlagValue) => void;
  disabled?: boolean;
}

export function FlagValueEditor({
  type,
  value,
  onChange,
  disabled,
}: FlagValueEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'json' && value !== undefined) {
      setJsonText(JSON.stringify(value, null, 2));
      setJsonError(null);
    }
  }, [type, value]);

  switch (type) {
    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value as boolean}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={disabled}
          />
          <Label className="text-sm text-muted-foreground">
            {value ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      );

    case 'string':
      return (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter string value"
          disabled={disabled}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder="Enter number value"
          disabled={disabled}
        />
      );

    case 'json':
      return (
        <div className="space-y-2">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
                setJsonError(null);
              } catch {
                setJsonError('Invalid JSON');
              }
            }}
            placeholder="{}"
            className="font-mono text-sm"
            rows={4}
            disabled={disabled}
          />
          {jsonError && (
            <p className="text-sm text-destructive">{jsonError}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
