import { z } from 'zod';

export const environmentKeySchema = z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, {
  message: 'Key must contain only lowercase letters, numbers, hyphens, and underscores',
});

export const createEnvironmentSchema = z.object({
  key: environmentKeySchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const environmentIdParamSchema = z.object({
  projectId: z.string().uuid(),
  envId: z.string().uuid(),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
export type EnvironmentIdParam = z.infer<typeof environmentIdParamSchema>;
