import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkKeysApi } from '~/lib/api-client';
import { queryKeys } from '~/lib/query-keys';
import type { CreateSDKKeyRequest, SDKKeyType } from '@flagbase/types';

export function useSDKKeys(
  projectId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: queryKeys.sdkKeys.list(projectId, params),
    queryFn: () => sdkKeysApi.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useCreateSDKKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { environmentId: string; name: string; type: SDKKeyType }) =>
      sdkKeysApi.create(projectId, data.environmentId, {
        name: data.name,
        type: data.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sdkKeys.lists(projectId),
      });
    },
  });
}

export function useRevokeSDKKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sdkKeysApi.revoke(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sdkKeys.lists(projectId),
      });
    },
  });
}
