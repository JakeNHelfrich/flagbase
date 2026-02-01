import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useFlag, useDeleteFlag } from '~/hooks/use-flags';
import { useEnvironments } from '~/hooks/use-environments';
import { useFlagConfig, useUpdateFlagConfig } from '~/hooks/use-flag-config';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '~/components/ui/alert-dialog';
import { TargetingRulesEditor } from '~/components/flags/targeting/targeting-rules-editor';
import { FlagValueEditor } from '~/components/flags/targeting/flag-value-editor';
import { useToast } from '~/hooks/use-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { TargetingRule, FlagType } from '@flagbase/types';

export const Route = createFileRoute('/_authenticated/projects/$projectId/flags/$flagId')({
  component: FlagDetailPage,
});

function FlagDetailPage() {
  const { projectId, flagId } = Route.useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: flag, isLoading: flagLoading, error: flagError } = useFlag(projectId, flagId);
  const { data: environmentsData, isLoading: envsLoading } = useEnvironments(projectId);
  const deleteFlag = useDeleteFlag(projectId);

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  const environments = environmentsData?.data || [];
  const activeEnvId = selectedEnvId || environments[0]?.id;

  const handleDelete = async () => {
    try {
      await deleteFlag.mutateAsync(flagId);
      toast({
        title: 'Flag deleted',
        description: 'The flag has been deleted successfully.',
      });
      navigate({
        to: '/projects/$projectId/flags',
        params: { projectId },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete flag',
        variant: 'destructive',
      });
    }
  };

  if (flagError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load flag</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{flagError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    boolean: 'bg-green-500/10 text-green-500 border-green-500/20',
    string: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    number: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    json: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects/$projectId/flags" params={{ projectId }}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            {flagLoading ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{flag?.name}</h1>
                  <Badge variant="outline" className={typeColors[flag?.type || 'boolean']}>
                    {flag?.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-mono text-sm">{flag?.key}</p>
              </>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Flag
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Flag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this flag? This action cannot be undone
                and will affect all environments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {flag?.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{flag.description}</p>
          </CardContent>
        </Card>
      )}

      {envsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ) : environments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No environments configured. Create an environment to configure this flag.
            </p>
            <Button asChild>
              <Link to="/projects/$projectId/environments" params={{ projectId }}>
                Manage Environments
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeEnvId} onValueChange={setSelectedEnvId}>
          <TabsList>
            {environments.map((env) => (
              <TabsTrigger key={env.id} value={env.id}>
                {env.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {environments.map((env) => (
            <TabsContent key={env.id} value={env.id}>
              {flag && (
                <EnvironmentConfigPanel
                  projectId={projectId}
                  flagId={flagId}
                  environmentId={env.id}
                  flagType={flag.type}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function EnvironmentConfigPanel({
  projectId,
  flagId,
  environmentId,
  flagType,
}: {
  projectId: string;
  flagId: string;
  environmentId: string;
  flagType: FlagType;
}) {
  const { toast } = useToast();
  const { data: config, isLoading } = useFlagConfig(projectId, flagId, environmentId);
  const updateConfig = useUpdateFlagConfig(projectId, flagId, environmentId);

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateConfig.mutateAsync({ enabled });
      toast({
        title: enabled ? 'Flag enabled' : 'Flag disabled',
        description: `The flag has been ${enabled ? 'enabled' : 'disabled'} for this environment.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update flag',
        variant: 'destructive',
      });
    }
  };

  const handleValueChange = async (value: unknown) => {
    try {
      await updateConfig.mutateAsync({ value: value as any });
      toast({
        title: 'Value updated',
        description: 'The flag value has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update value',
        variant: 'destructive',
      });
    }
  };

  const handleRulesChange = async (rules: TargetingRule[]) => {
    try {
      await updateConfig.mutateAsync({ targetingRules: rules });
      toast({
        title: 'Rules updated',
        description: 'The targeting rules have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update rules',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Flag Status</CardTitle>
          <CardDescription>
            Enable or disable the flag for this environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={config?.enabled ?? false}
              onCheckedChange={handleToggle}
              disabled={updateConfig.isPending}
            />
            <Label htmlFor="enabled">
              {config?.enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Value</CardTitle>
          <CardDescription>
            The value returned when no targeting rules match
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlagValueEditor
            type={flagType}
            value={config?.value}
            onChange={handleValueChange}
            disabled={updateConfig.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Targeting Rules</CardTitle>
          <CardDescription>
            Define rules to serve different values to specific users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TargetingRulesEditor
            rules={config?.targetingRules ?? []}
            flagType={flagType}
            onChange={handleRulesChange}
            disabled={updateConfig.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
