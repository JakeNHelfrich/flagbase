import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { createRequireSdkAuth } from '../../middleware/require-sdk-auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/api-error.js';
import { evaluateAllFlagsRequestSchema } from '../../schemas/index.js';
import { SDKEvaluationService } from '../../services/sdk-evaluation-service.js';
import { ErrorCode, type EvaluationContext } from '@flagbase/types';

export function createSDKRoutes(container: Container) {
  const app = new Hono();
  const { sdkKeyService, flagRepo, flagConfigRepo } = container;

  // Create SDK evaluation service
  const sdkEvaluationService = new SDKEvaluationService(flagRepo, flagConfigRepo);

  // Create SDK auth middleware
  const requireSdkAuth = createRequireSdkAuth(sdkKeyService);

  // List all flags for the environment
  app.get('/:sdkKey/flags', requireSdkAuth, async (c) => {
    const sdkKeyInfo = c.get('sdkKeyInfo');

    const result = await sdkEvaluationService.getFlagsForEnvironment(
      sdkKeyInfo.projectId,
      sdkKeyInfo.environmentId
    );

    if (!result.ok) {
      throw ApiError.internal('Failed to fetch flags');
    }

    // Return flags in a simple format for SDK consumption
    const flags = result.value.map(({ flag, config }) => ({
      key: flag.key,
      type: flag.type,
      enabled: config.enabled,
      value: config.value,
      targetingRules: config.targetingRules,
    }));

    return c.json({ flags });
  });

  // Evaluate all flags with context
  app.post(
    '/:sdkKey/evaluate',
    requireSdkAuth,
    validate('json', evaluateAllFlagsRequestSchema),
    async (c) => {
      const sdkKeyInfo = c.get('sdkKeyInfo');
      const body = c.req.valid('json');

      const result = await sdkEvaluationService.evaluateAllFlags(
        sdkKeyInfo.projectId,
        sdkKeyInfo.environmentId,
        body.context as EvaluationContext | undefined
      );

      if (!result.ok) {
        throw ApiError.internal('Failed to evaluate flags');
      }

      return c.json({ flags: result.value });
    }
  );

  // Evaluate a single flag with context
  app.post(
    '/:sdkKey/evaluate/:flagKey',
    requireSdkAuth,
    validate('json', evaluateAllFlagsRequestSchema),
    async (c) => {
      const sdkKeyInfo = c.get('sdkKeyInfo');
      const flagKey = c.req.param('flagKey');
      const body = c.req.valid('json');

      if (!flagKey) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Flag key is required');
      }

      const result = await sdkEvaluationService.evaluateFlag(
        sdkKeyInfo.projectId,
        sdkKeyInfo.environmentId,
        flagKey,
        body.context as EvaluationContext | undefined
      );

      if (!result.ok) {
        throw ApiError.internal('Failed to evaluate flag');
      }

      return c.json(result.value);
    }
  );

  return app;
}
