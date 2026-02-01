import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppShell } from '~/components/layout/app-shell';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async () => {
    // For now, we're not implementing authentication
    // In a real app, you'd check for a valid session here
    // and redirect to login if not authenticated
  },
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
