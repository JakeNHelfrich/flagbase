import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flagConfigsApi } from '~/lib/api-client';
import { queryKeys } from '~/lib/query-keys';
import type { UpdateFlagConfigRequest } from '@flagbase/types';

export function useFlagConfig(
  projectId: string,
  flagId: string,
  environmentId: string,
) {
  return useQuery({
    queryKey: queryKeys.flagConfigs.detail(projectId, flagId, environmentId),
    queryFn: () => flagConfigsApi.get(projectId, flagId, environmentId),
    enabled: !!projectId && !!flagId && !!environmentId,
  });
}

export function useUpdateFlagConfig(
  projectId: string,
  flagId: string,
  environmentId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFlagConfigRequest) =>
      flagConfigsApi.update(projectId, flagId, environmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.flagConfigs.detail(projectId, flagId, environmentId),
      });
    },
  });
}
