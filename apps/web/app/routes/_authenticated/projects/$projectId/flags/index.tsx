import { createFileRoute, Link } from '@tanstack/react-router';
import { useFlags } from '~/hooks/use-flags';
import { useProject } from '~/hooks/use-projects';
import { useEnvironments } from '~/hooks/use-environments';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Plus, Flag, ToggleLeft } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/projects/$projectId/flags/')({
  component: FlagsPage,
});

function FlagsPage() {
  const { projectId } = Route.useParams();
  const { data: project } = useProject(projectId);
  const { data: flagsData, isLoading, error } = useFlags(projectId);
  const { data: environmentsData } = useEnvironments(projectId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load flags</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground">
            {project?.name ? `Manage flags for ${project.name}` : 'Manage your feature flags'}
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/$projectId/flags/new" params={{ projectId }}>
            <Plus className="mr-2 h-4 w-4" />
            New Flag
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : flagsData?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flags yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first feature flag
            </p>
            <Button asChild>
              <Link to="/projects/$projectId/flags/new" params={{ projectId }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Flag
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flagsData?.data.map((flag) => (
            <Link
              key={flag.id}
              to="/projects/$projectId/flags/$flagId"
              params={{ projectId, flagId: flag.id }}
              className="block"
            >
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <ToggleLeft className="h-5 w-5" />
                        {flag.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {flag.key}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={typeColors[flag.type]}>
                      {flag.type}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {flag.description}
                    </p>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
