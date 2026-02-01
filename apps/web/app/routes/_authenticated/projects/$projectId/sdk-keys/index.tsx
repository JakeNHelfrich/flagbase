import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useSDKKeys, useCreateSDKKey, useRevokeSDKKey } from '~/hooks/use-sdk-keys';
import { useProject } from '~/hooks/use-projects';
import { useEnvironments } from '~/hooks/use-environments';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '~/components/ui/alert-dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useToast } from '~/hooks/use-toast';
import { Plus, Key, Copy, Check, Ban } from 'lucide-react';
import type { SDKKeyType } from '@flagbase/types';

export const Route = createFileRoute('/_authenticated/projects/$projectId/sdk-keys/')({
  component: SDKKeysPage,
});

function SDKKeysPage() {
  const { projectId } = Route.useParams();
  const { data: project } = useProject(projectId);
  const { data: keysData, isLoading, error } = useSDKKeys(projectId);
  const { data: environmentsData } = useEnvironments(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const environments = environmentsData?.data || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load SDK keys</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SDK Keys</h1>
          <p className="text-muted-foreground">
            {project?.name ? `Manage SDK keys for ${project.name}` : 'Manage your SDK keys'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setNewKey(null);
        }}>
          <DialogTrigger asChild>
            <Button disabled={environments.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New SDK Key
            </Button>
          </DialogTrigger>
          {newKey ? (
            <NewKeyCreatedDialog
              sdkKey={newKey}
              onClose={() => {
                setDialogOpen(false);
                setNewKey(null);
              }}
            />
          ) : (
            <CreateSDKKeyDialog
              projectId={projectId}
              environments={environments}
              onSuccess={(key) => setNewKey(key)}
            />
          )}
        </Dialog>
      </div>

      {environments.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              Create an environment before creating SDK keys.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : keysData?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SDK keys yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create SDK keys to authenticate your applications
            </p>
            {environments.length > 0 && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create SDK Key
                  </Button>
                </DialogTrigger>
                {newKey ? (
                  <NewKeyCreatedDialog
                    sdkKey={newKey}
                    onClose={() => {
                      setDialogOpen(false);
                      setNewKey(null);
                    }}
                  />
                ) : (
                  <CreateSDKKeyDialog
                    projectId={projectId}
                    environments={environments}
                    onSuccess={(key) => setNewKey(key)}
                  />
                )}
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keysData?.data.map((sdkKey) => (
            <SDKKeyCard
              key={sdkKey.id}
              sdkKey={sdkKey}
              projectId={projectId}
              environments={environments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SDKKeyCard({
  sdkKey,
  projectId,
  environments,
}: {
  sdkKey: any;
  projectId: string;
  environments: any[];
}) {
  const { toast } = useToast();
  const revokeKey = useRevokeSDKKey(projectId);
  const environment = environments.find((e) => e.id === sdkKey.environmentId);
  const isRevoked = sdkKey.revokedAt !== null;

  const handleRevoke = async () => {
    try {
      await revokeKey.mutateAsync(sdkKey.id);
      toast({
        title: 'SDK key revoked',
        description: 'The SDK key has been revoked and can no longer be used.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke SDK key',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={isRevoked ? 'opacity-60' : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {sdkKey.name}
              </CardTitle>
              <Badge variant={sdkKey.type === 'live' ? 'default' : 'secondary'}>
                {sdkKey.type}
              </Badge>
              {isRevoked && (
                <Badge variant="destructive">Revoked</Badge>
              )}
            </div>
            <CardDescription>
              {environment?.name || 'Unknown environment'} - {sdkKey.keyPrefix}...
            </CardDescription>
          </div>
          {!isRevoked && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  Revoke
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke SDK Key</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to revoke this SDK key? This action cannot be
                    undone and any applications using this key will stop working.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevoke}>
                    Revoke Key
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function CreateSDKKeyDialog({
  projectId,
  environments,
  onSuccess,
}: {
  projectId: string;
  environments: any[];
  onSuccess: (key: string) => void;
}) {
  const { toast } = useToast();
  const createKey = useCreateSDKKey(projectId);
  const [name, setName] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [type, setType] = useState<SDKKeyType>('live');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createKey.mutateAsync({
        environmentId,
        name,
        type,
      });
      onSuccess(result.key);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create SDK key',
        variant: 'destructive',
      });
    }
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New SDK Key</DialogTitle>
          <DialogDescription>
            Create a new SDK key for authenticating your applications
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              placeholder="My API Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-environment">Environment</Label>
            <Select value={environmentId} onValueChange={setEnvironmentId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SDKKeyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use live keys for production, test keys for development
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={createKey.isPending || !environmentId}>
            {createKey.isPending ? 'Creating...' : 'Create SDK Key'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function NewKeyCreatedDialog({
  sdkKey,
  onClose,
}: {
  sdkKey: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sdkKey);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'SDK key copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>SDK Key Created</DialogTitle>
        <DialogDescription>
          Copy your SDK key now. You won't be able to see it again!
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <div className="flex items-center gap-2">
          <Input
            value={sdkKey}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-destructive mt-2">
          This key will only be shown once. Make sure to copy it now.
        </p>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </DialogContent>
  );
}
