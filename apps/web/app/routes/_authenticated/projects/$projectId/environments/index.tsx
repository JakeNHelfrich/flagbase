import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useEnvironments, useCreateEnvironment, useDeleteEnvironment } from '~/hooks/use-environments';
import { useProject } from '~/hooks/use-projects';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '~/components/ui/alert-dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { useToast } from '~/hooks/use-toast';
import { Plus, Layers, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/projects/$projectId/environments/')({
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const { projectId } = Route.useParams();
  const { data: project } = useProject(projectId);
  const { data: environmentsData, isLoading, error } = useEnvironments(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load environments</CardDescription>
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
          <h1 className="text-3xl font-bold tracking-tight">Environments</h1>
          <p className="text-muted-foreground">
            {project?.name ? `Manage environments for ${project.name}` : 'Manage your environments'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Environment
            </Button>
          </DialogTrigger>
          <CreateEnvironmentDialog
            projectId={projectId}
            onSuccess={() => setDialogOpen(false)}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : environmentsData?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No environments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create environments like Development, Staging, and Production
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Environment
                </Button>
              </DialogTrigger>
              <CreateEnvironmentDialog
                projectId={projectId}
                onSuccess={() => setDialogOpen(false)}
              />
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environmentsData?.data.map((env) => (
            <EnvironmentCard key={env.id} environment={env} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnvironmentCard({ environment, projectId }: { environment: any; projectId: string }) {
  const { toast } = useToast();
  const deleteEnvironment = useDeleteEnvironment(projectId);

  const handleDelete = async () => {
    try {
      await deleteEnvironment.mutateAsync(environment.id);
      toast({
        title: 'Environment deleted',
        description: `${environment.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete environment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{environment.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {environment.key}
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Environment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {environment.name}? This will also
                  delete all flag configurations for this environment.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {environment.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {environment.description}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

function CreateEnvironmentDialog({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const createEnvironment = useCreateEnvironment(projectId);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEnvironment.mutateAsync({
        name,
        key,
        description: description || undefined,
      });
      toast({
        title: 'Environment created',
        description: `${name} has been created successfully.`,
      });
      setName('');
      setKey('');
      setDescription('');
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create environment',
        variant: 'destructive',
      });
    }
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New Environment</DialogTitle>
          <DialogDescription>
            Create a new environment for your project
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="env-name">Name</Label>
            <Input
              id="env-name"
              placeholder="Production"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key) {
                  setKey(generateKey(e.target.value));
                }
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-key">Key</Label>
            <Input
              id="env-key"
              placeholder="production"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
              required
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier used in SDK calls
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-description">Description (optional)</Label>
            <Textarea
              id="env-description"
              placeholder="Production environment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={createEnvironment.isPending}>
            {createEnvironment.isPending ? 'Creating...' : 'Create Environment'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
