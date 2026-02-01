import { z } from 'zod';

export const evaluationContextSchema = z.object({
  userId: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const evaluateFlagRequestSchema = z.object({
  flagKey: z.string().min(1),
  context: evaluationContextSchema.optional(),
});

export const evaluateAllFlagsRequestSchema = z.object({
  context: evaluationContextSchema.optional(),
});

// Export types
export type EvaluationContext = z.infer<typeof evaluationContextSchema>;
export type EvaluateFlagRequest = z.infer<typeof evaluateFlagRequestSchema>;
export type EvaluateAllFlagsRequest = z.infer<typeof evaluateAllFlagsRequestSchema>;
