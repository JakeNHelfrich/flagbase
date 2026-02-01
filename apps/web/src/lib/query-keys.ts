export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params?: { page?: number; limit?: number }) =>
      [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Environments
  environments: {
    all: (projectId: string) => ['projects', projectId, 'environments'] as const,
    lists: (projectId: string) =>
      [...queryKeys.environments.all(projectId), 'list'] as const,
    list: (projectId: string, params?: { page?: number; limit?: number }) =>
      [...queryKeys.environments.lists(projectId), params] as const,
    details: (projectId: string) =>
      [...queryKeys.environments.all(projectId), 'detail'] as const,
    detail: (projectId: string, id: string) =>
      [...queryKeys.environments.details(projectId), id] as const,
  },

  // Flags
  flags: {
    all: (projectId: string) => ['projects', projectId, 'flags'] as const,
    lists: (projectId: string) =>
      [...queryKeys.flags.all(projectId), 'list'] as const,
    list: (projectId: string, params?: { page?: number; limit?: number }) =>
      [...queryKeys.flags.lists(projectId), params] as const,
    details: (projectId: string) =>
      [...queryKeys.flags.all(projectId), 'detail'] as const,
    detail: (projectId: string, id: string) =>
      [...queryKeys.flags.details(projectId), id] as const,
  },

  // Flag Configs
  flagConfigs: {
    all: (projectId: string, flagId: string) =>
      ['projects', projectId, 'flags', flagId, 'configs'] as const,
    detail: (projectId: string, flagId: string, environmentId: string) =>
      [...queryKeys.flagConfigs.all(projectId, flagId), environmentId] as const,
  },

  // SDK Keys
  sdkKeys: {
    all: (projectId: string) => ['projects', projectId, 'sdk-keys'] as const,
    lists: (projectId: string) =>
      [...queryKeys.sdkKeys.all(projectId), 'list'] as const,
    list: (projectId: string, params?: { page?: number; limit?: number }) =>
      [...queryKeys.sdkKeys.lists(projectId), params] as const,
  },
};
