import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import * as React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { QueryProvider } from '~/providers/query-provider';
import { ThemeProvider } from '~/providers/theme-provider';
import { Toaster } from '~/components/ui/toaster';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <QueryProvider>
        <Outlet />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
