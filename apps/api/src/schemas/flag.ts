import { z } from 'zod';

export const flagKeySchema = z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, {
  message: 'Key must contain only lowercase letters, numbers, hyphens, and underscores',
});

export const flagTypeSchema = z.enum(['boolean', 'string', 'number', 'json']);

export const flagValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.record(z.unknown()),
]);

export const conditionOperatorSchema = z.enum([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'contains', 'not_contains', 'starts_with', 'ends_with',
  'in', 'not_in',
]);

export const conditionSchema = z.object({
  attribute: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const targetingRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  conditions: z.array(conditionSchema),
  percentage: z.number().min(0).max(100),
  value: flagValueSchema,
  priority: z.number().int(),
});

export const createFlagSchema = z.object({
  key: flagKeySchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: flagTypeSchema,
  defaultValue: flagValueSchema,
});

export const updateFlagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  defaultValue: flagValueSchema.optional(),
});

export const updateFlagConfigSchema = z.object({
  enabled: z.boolean().optional(),
  value: flagValueSchema.optional(),
  targetingRules: z.array(targetingRuleSchema).optional(),
});

export const flagIdParamSchema = z.object({
  projectId: z.string().uuid(),
  flagId: z.string().uuid(),
});

export const flagEnvConfigParamSchema = z.object({
  projectId: z.string().uuid(),
  flagId: z.string().uuid(),
  envId: z.string().uuid(),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;
export type UpdateFlagConfigInput = z.infer<typeof updateFlagConfigSchema>;
export type FlagIdParam = z.infer<typeof flagIdParamSchema>;
export type FlagEnvConfigParam = z.infer<typeof flagEnvConfigParamSchema>;
