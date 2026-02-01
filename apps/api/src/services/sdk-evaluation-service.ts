import type { FlagRepository } from '../repositories/interfaces/flag-repository.js';
import type { FlagConfigRepository } from '../repositories/interfaces/flag-config-repository.js';
import type {
  Result,
  ErrorCode,
  Flag,
  FlagEnvironmentConfig,
  EvaluationContext,
  EvaluationResult,
  EvaluationReason,
  FlagValue,
  TargetingRule,
} from '@flagbase/types';
import { ok } from '@flagbase/types';
import { matchAllConditions } from '@flagbase/core';
import { isInPercentage } from '@flagbase/core';

export interface FlagWithConfig {
  flag: Flag;
  config: FlagEnvironmentConfig;
}

export class SDKEvaluationService {
  constructor(
    private readonly flagRepo: FlagRepository,
    private readonly flagConfigRepo: FlagConfigRepository
  ) {}

  /**
   * Get all flags with their configs for a specific environment
   */
  async getFlagsForEnvironment(
    projectId: string,
    environmentId: string
  ): Promise<Result<FlagWithConfig[], ErrorCode>> {
    // Get all flags for the project
    const flagsResult = await this.flagRepo.findAllByProjectId(projectId, {
      page: 1,
      limit: 1000, // Get all flags
    });

    if (!flagsResult.ok) {
      return flagsResult;
    }

    const flags = flagsResult.value.data;
    const flagsWithConfigs: FlagWithConfig[] = [];

    // Get config for each flag in this environment
    for (const flag of flags) {
      const configResult = await this.flagConfigRepo.findByFlagIdAndEnvironmentId(
        flag.id,
        environmentId
      );

      if (configResult.ok && configResult.value) {
        flagsWithConfigs.push({
          flag,
          config: configResult.value,
        });
      }
    }

    return ok(flagsWithConfigs);
  }

  /**
   * Evaluate a single flag for a given context
   */
  async evaluateFlag(
    projectId: string,
    environmentId: string,
    flagKey: string,
    context?: EvaluationContext
  ): Promise<Result<EvaluationResult, ErrorCode>> {
    // Find the flag by key
    const flagResult = await this.flagRepo.findByProjectIdAndKey(projectId, flagKey);

    if (!flagResult.ok) {
      return flagResult;
    }

    if (!flagResult.value) {
      return ok({
        flagKey,
        value: false,
        reason: 'FLAG_NOT_FOUND' as EvaluationReason,
      });
    }

    const flag = flagResult.value;

    // Get the config for this environment
    const configResult = await this.flagConfigRepo.findByFlagIdAndEnvironmentId(
      flag.id,
      environmentId
    );

    if (!configResult.ok) {
      return configResult;
    }

    if (!configResult.value) {
      // No config found, return default value
      return ok({
        flagKey,
        value: flag.defaultValue,
        reason: 'DEFAULT' as EvaluationReason,
      });
    }

    const config = configResult.value;

    // Evaluate the flag
    return ok(this.evaluate(flag, config, context));
  }

  /**
   * Evaluate all flags for a given context
   */
  async evaluateAllFlags(
    projectId: string,
    environmentId: string,
    context?: EvaluationContext
  ): Promise<Result<EvaluationResult[], ErrorCode>> {
    const flagsResult = await this.getFlagsForEnvironment(projectId, environmentId);

    if (!flagsResult.ok) {
      return flagsResult;
    }

    const results: EvaluationResult[] = flagsResult.value.map(({ flag, config }) =>
      this.evaluate(flag, config, context)
    );

    return ok(results);
  }

  /**
   * Core evaluation logic
   */
  private evaluate(
    flag: Flag,
    config: FlagEnvironmentConfig,
    context?: EvaluationContext
  ): EvaluationResult {
    // If flag is disabled, return the config value
    if (!config.enabled) {
      return {
        flagKey: flag.key,
        value: config.value,
        reason: 'DISABLED',
      };
    }

    // If no context provided, return the config value as default
    if (!context) {
      return {
        flagKey: flag.key,
        value: config.value,
        reason: 'DEFAULT',
      };
    }

    // Sort targeting rules by priority (lower priority number = higher precedence)
    const sortedRules = [...config.targetingRules].sort((a, b) => a.priority - b.priority);

    // Check each targeting rule
    for (const rule of sortedRules) {
      const matchResult = this.evaluateRule(flag.key, rule, context);
      if (matchResult !== null) {
        return {
          flagKey: flag.key,
          value: matchResult.value,
          reason: matchResult.reason,
        };
      }
    }

    // No rules matched, return config value
    return {
      flagKey: flag.key,
      value: config.value,
      reason: 'DEFAULT',
    };
  }

  /**
   * Evaluate a single targeting rule
   */
  private evaluateRule(
    flagKey: string,
    rule: TargetingRule,
    context: EvaluationContext
  ): { value: FlagValue; reason: EvaluationReason } | null {
    // Check if all conditions match
    const conditionsMatch = matchAllConditions(rule.conditions, context);

    if (!conditionsMatch) {
      return null;
    }

    // If percentage is 100%, return the rule value directly
    if (rule.percentage >= 100) {
      return {
        value: rule.value,
        reason: 'TARGETING_MATCH',
      };
    }

    // Check percentage rollout
    // Need a user identifier for percentage calculation
    const identifier = context.userId || 'anonymous';
    const inPercentage = isInPercentage(flagKey, identifier, rule.percentage);

    if (inPercentage) {
      return {
        value: rule.value,
        reason: 'PERCENTAGE_ROLLOUT',
      };
    }

    // User is not in the percentage rollout
    return null;
  }
}
