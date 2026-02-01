import { Link, useParams, useMatchRoute } from '@tanstack/react-router';
import { Flag, Layers, Key, FolderOpen, ChevronDown, Plus } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useProjects } from '~/hooks/use-projects';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Skeleton } from '~/components/ui/skeleton';

export function Sidebar() {
  const params = useParams({ strict: false });
  const projectId = params.projectId as string | undefined;
  const matchRoute = useMatchRoute();
  const { data: projectsData, isLoading } = useProjects();

  const currentProject = projectsData?.data.find((p) => p.id === projectId);

  const navItems = projectId
    ? [
        {
          label: 'Flags',
          href: `/projects/${projectId}/flags`,
          icon: Flag,
          match: '/_authenticated/projects/$projectId/flags',
        },
        {
          label: 'Environments',
          href: `/projects/${projectId}/environments`,
          icon: Layers,
          match: '/_authenticated/projects/$projectId/environments',
        },
        {
          label: 'SDK Keys',
          href: `/projects/${projectId}/sdk-keys`,
          icon: Key,
          match: '/_authenticated/projects/$projectId/sdk-keys',
        },
      ]
    : [];

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <Link to="/projects" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Flag className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Flagbase</span>
        </Link>
      </div>

      <div className="p-4 border-b">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <span className="truncate">
                  {currentProject?.name || 'Select Project'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {projectsData?.data.map((project) => (
                <DropdownMenuItem key={project.id} asChild>
                  <Link
                    to="/projects/$projectId/flags"
                    params={{ projectId: project.id }}
                    className="cursor-pointer"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {project.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              {projectsData && projectsData.data.length > 0 && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem asChild>
                <Link to="/projects/new" className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/projects" className="cursor-pointer">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  All Projects
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = matchRoute({ to: item.match, fuzzy: true });
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {!projectId && (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            Select a project to see navigation
          </p>
        )}
      </nav>
    </aside>
  );
}
