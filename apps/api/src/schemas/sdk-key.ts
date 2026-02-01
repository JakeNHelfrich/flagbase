import { z } from 'zod';

export const sdkKeyTypeSchema = z.enum(['live', 'test']);

export const createSDKKeySchema = z.object({
  name: z.string().min(1).max(255),
  type: sdkKeyTypeSchema,
});

export const sdkKeyIdParamSchema = z.object({
  keyId: z.string().uuid(),
});

export const sdkKeyEnvParamSchema = z.object({
  projectId: z.string().uuid(),
  envId: z.string().uuid(),
});

export const sdkKeyProjectParamSchema = z.object({
  projectId: z.string().uuid(),
});

export type CreateSDKKeyInput = z.infer<typeof createSDKKeySchema>;
export type SDKKeyIdParam = z.infer<typeof sdkKeyIdParamSchema>;
export type SDKKeyEnvParam = z.infer<typeof sdkKeyEnvParamSchema>;
export type SDKKeyProjectParam = z.infer<typeof sdkKeyProjectParamSchema>;
