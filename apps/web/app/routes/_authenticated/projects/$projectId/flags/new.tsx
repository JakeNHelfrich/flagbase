import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useCreateFlag } from '~/hooks/use-flags';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { useToast } from '~/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import type { FlagType, FlagValue } from '@flagbase/types';

export const Route = createFileRoute('/_authenticated/projects/$projectId/flags/new')({
  component: NewFlagPage,
});

function NewFlagPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createFlag = useCreateFlag(projectId);
  const [flagType, setFlagType] = useState<FlagType>('boolean');

  const form = useForm({
    defaultValues: {
      name: '',
      key: '',
      description: '',
      defaultValue: false as FlagValue,
    },
    onSubmit: async ({ value }) => {
      try {
        const flag = await createFlag.mutateAsync({
          name: value.name,
          key: value.key,
          description: value.description || undefined,
          type: flagType,
          defaultValue: value.defaultValue,
        });
        toast({
          title: 'Flag created',
          description: `${flag.name} has been created successfully.`,
        });
        navigate({
          to: '/projects/$projectId/flags/$flagId',
          params: { projectId, flagId: flag.id },
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create flag',
          variant: 'destructive',
        });
      }
    },
  });

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getDefaultValueForType = (type: FlagType): FlagValue => {
    switch (type) {
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return {};
    }
  };

  const handleTypeChange = (type: FlagType) => {
    setFlagType(type);
    form.setFieldValue('defaultValue', getDefaultValueForType(type));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/projects/$projectId/flags" params={{ projectId }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Flag</h1>
          <p className="text-muted-foreground">
            Create a new feature flag
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flag Details</CardTitle>
          <CardDescription>
            Enter the details for your new flag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Name is required' : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="New Feature"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      if (!form.getFieldValue('key')) {
                        form.setFieldValue('key', generateKey(e.target.value));
                      }
                    }}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="key"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return 'Key is required';
                  if (!/^[a-z0-9-]+$/.test(value)) {
                    return 'Key must only contain lowercase letters, numbers, and hyphens';
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    placeholder="new-feature"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier used in SDK calls
                  </p>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of your flag"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={3}
                  />
                </div>
              )}
            </form.Field>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={flagType} onValueChange={(v) => handleTypeChange(v as FlagType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The type of value this flag returns
              </p>
            </div>

            <form.Field name="defaultValue">
              {(field) => (
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  {flagType === 'boolean' ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.state.value as boolean}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label className="text-sm text-muted-foreground">
                        {field.state.value ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  ) : flagType === 'string' ? (
                    <Input
                      placeholder="Default string value"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  ) : flagType === 'number' ? (
                    <Input
                      type="number"
                      placeholder="0"
                      value={field.state.value as number}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                  ) : (
                    <Textarea
                      placeholder="{}"
                      value={JSON.stringify(field.state.value, null, 2)}
                      onChange={(e) => {
                        try {
                          field.handleChange(JSON.parse(e.target.value));
                        } catch {
                          // Invalid JSON, keep current value
                        }
                      }}
                      className="font-mono"
                      rows={4}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    The value returned when the flag is disabled or no targeting rules match
                  </p>
                </div>
              )}
            </form.Field>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createFlag.isPending}
              >
                {createFlag.isPending ? 'Creating...' : 'Create Flag'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/projects/$projectId/flags" params={{ projectId }}>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
