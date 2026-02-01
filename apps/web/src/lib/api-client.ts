import type {
  ListProjectsResponse,
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ListEnvironmentsResponse,
  EnvironmentResponse,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
  ListFlagsResponse,
  FlagResponse,
  CreateFlagRequest,
  UpdateFlagRequest,
  FlagConfigResponse,
  UpdateFlagConfigRequest,
  ListSDKKeysResponse,
  CreateSDKKeyRequest,
  CreateSDKKeyResponse,
} from '@flagbase/types';

const API_BASE = 'http://localhost:3001/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Projects
export const projectsApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<ListProjectsResponse>(`/projects${query ? `?${query}` : ''}`);
  },

  get: (id: string) => fetchApi<ProjectResponse>(`/projects/${id}`),

  create: (data: CreateProjectRequest) =>
    fetchApi<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProjectRequest) =>
    fetchApi<ProjectResponse>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/projects/${id}`, { method: 'DELETE' }),
};

// Environments
export const environmentsApi = {
  list: (projectId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<ListEnvironmentsResponse>(
      `/projects/${projectId}/environments${query ? `?${query}` : ''}`,
    );
  },

  get: (projectId: string, id: string) =>
    fetchApi<EnvironmentResponse>(`/projects/${projectId}/environments/${id}`),

  create: (projectId: string, data: CreateEnvironmentRequest) =>
    fetchApi<EnvironmentResponse>(`/projects/${projectId}/environments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateEnvironmentRequest) =>
    fetchApi<EnvironmentResponse>(`/projects/${projectId}/environments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (projectId: string, id: string) =>
    fetchApi<void>(`/projects/${projectId}/environments/${id}`, {
      method: 'DELETE',
    }),
};

// Flags
export const flagsApi = {
  list: (projectId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<ListFlagsResponse>(
      `/projects/${projectId}/flags${query ? `?${query}` : ''}`,
    );
  },

  get: (projectId: string, id: string) =>
    fetchApi<FlagResponse>(`/projects/${projectId}/flags/${id}`),

  create: (projectId: string, data: CreateFlagRequest) =>
    fetchApi<FlagResponse>(`/projects/${projectId}/flags`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateFlagRequest) =>
    fetchApi<FlagResponse>(`/projects/${projectId}/flags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (projectId: string, id: string) =>
    fetchApi<void>(`/projects/${projectId}/flags/${id}`, { method: 'DELETE' }),
};

// Flag Configs
export const flagConfigsApi = {
  get: (projectId: string, flagId: string, environmentId: string) =>
    fetchApi<FlagConfigResponse>(
      `/projects/${projectId}/flags/${flagId}/environments/${environmentId}`,
    ),

  update: (
    projectId: string,
    flagId: string,
    environmentId: string,
    data: UpdateFlagConfigRequest,
  ) =>
    fetchApi<FlagConfigResponse>(
      `/projects/${projectId}/flags/${flagId}/environments/${environmentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
};

// SDK Keys
export const sdkKeysApi = {
  list: (projectId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<ListSDKKeysResponse>(
      `/projects/${projectId}/sdk-keys${query ? `?${query}` : ''}`,
    );
  },

  create: (projectId: string, environmentId: string, data: CreateSDKKeyRequest) =>
    fetchApi<CreateSDKKeyResponse>(
      `/projects/${projectId}/environments/${environmentId}/sdk-keys`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  revoke: (projectId: string, id: string) =>
    fetchApi<void>(`/projects/${projectId}/sdk-keys/${id}`, {
      method: 'DELETE',
    }),
};
