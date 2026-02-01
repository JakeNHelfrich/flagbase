import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flagsApi } from '~/lib/api-client';
import { queryKeys } from '~/lib/query-keys';
import type { CreateFlagRequest, UpdateFlagRequest } from '@flagbase/types';

export function useFlags(
  projectId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: queryKeys.flags.list(projectId, params),
    queryFn: () => flagsApi.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useFlag(projectId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.flags.detail(projectId, id),
    queryFn: () => flagsApi.get(projectId, id),
    enabled: !!projectId && !!id,
  });
}

export function useCreateFlag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFlagRequest) => flagsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.flags.lists(projectId),
      });
    },
  });
}

export function useUpdateFlag(projectId: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFlagRequest) => flagsApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.flags.detail(projectId, id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.flags.lists(projectId),
      });
    },
  });
}

export function useDeleteFlag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => flagsApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.flags.lists(projectId),
      });
    },
  });
}
