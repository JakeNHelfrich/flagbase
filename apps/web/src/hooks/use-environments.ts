import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentsApi } from '~/lib/api-client';
import { queryKeys } from '~/lib/query-keys';
import type { CreateEnvironmentRequest, UpdateEnvironmentRequest } from '@flagbase/types';

export function useEnvironments(
  projectId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: queryKeys.environments.list(projectId, params),
    queryFn: () => environmentsApi.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useEnvironment(projectId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.environments.detail(projectId, id),
    queryFn: () => environmentsApi.get(projectId, id),
    enabled: !!projectId && !!id,
  });
}

export function useCreateEnvironment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnvironmentRequest) =>
      environmentsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.environments.lists(projectId),
      });
    },
  });
}

export function useUpdateEnvironment(projectId: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEnvironmentRequest) =>
      environmentsApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.environments.detail(projectId, id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.environments.lists(projectId),
      });
    },
  });
}

export function useDeleteEnvironment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => environmentsApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.environments.lists(projectId),
      });
    },
  });
}
