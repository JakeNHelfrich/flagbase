import type {
  Flag,
  FlagEnvironmentConfig,
  EvaluationContext,
  FlagValue,
} from '@flagbase/types';
import { matchAllConditions } from './condition-matcher.js';
import { isInPercentage } from './percentage-calculator.js';

/**
 * The reason a particular flag value was returned
 */
export type EvaluationReason =
  | 'DISABLED'
  | 'TARGETING_MATCH'
  | 'PERCENTAGE_ROLLOUT'
  | 'DEFAULT'
  | 'FLAG_NOT_FOUND';

/**
 * Result of evaluating a flag for a given context
 */
export interface EvaluationResult<T = unknown> {
  value: T;
  reason: EvaluationReason;
  ruleId?: string;
}

/**
 * Default values for each flag type when flag is not found
 */
const DEFAULT_VALUES: Record<string, FlagValue> = {
  boolean: false,
  string: '',
  number: 0,
  json: {},
};

/**
 * FlagEvaluator handles the evaluation of feature flags
 *
 * Evaluation order:
 * 1. If flag or config is null -> FLAG_NOT_FOUND with default value
 * 2. If config.enabled is false -> DISABLED with config.value (defaultValue)
 * 3. Check targeting rules (sorted by priority ascending - lower priority first)
 *    - For each rule: if all conditions match -> TARGETING_MATCH with rule.value
 * 4. Check percentage rollout: if rule.percentage > 0 and context.userId exists
 *    - If isInPercentage -> PERCENTAGE_ROLLOUT with rule.value
 * 5. Otherwise -> DEFAULT with config.value
 */
export class FlagEvaluator {
  /**
   * Evaluates a flag and returns the result
   */
  evaluate(
    flag: Flag | null,
    config: FlagEnvironmentConfig | null,
    context: EvaluationContext
  ): EvaluationResult {
    // 1. If flag or config is null -> FLAG_NOT_FOUND
    if (!flag || !config) {
      const defaultValue = flag
        ? DEFAULT_VALUES[flag.type]
        : DEFAULT_VALUES['boolean'];
      return {
        value: defaultValue,
        reason: 'FLAG_NOT_FOUND',
      };
    }

    // 2. If config.enabled is false -> DISABLED
    if (!config.enabled) {
      return {
        value: config.value,
        reason: 'DISABLED',
      };
    }

    // 3. Check targeting rules (sorted by priority ascending)
    const sortedRules = [...config.targetingRules].sort(
      (a, b) => a.priority - b.priority
    );

    for (const rule of sortedRules) {
      // Check if all conditions match
      if (matchAllConditions(rule.conditions, context)) {
        // Check percentage if rule has one
        if (rule.percentage < 100) {
          // Rule requires percentage check
          if (context.userId && isInPercentage(flag.key, context.userId, rule.percentage)) {
            return {
              value: rule.value,
              reason: 'TARGETING_MATCH',
              ruleId: rule.id,
            };
          }
          // User not in percentage, continue to next rule
          continue;
        }

        // 100% rollout for this rule
        return {
          value: rule.value,
          reason: 'TARGETING_MATCH',
          ruleId: rule.id,
        };
      }
    }

    // 4. No rules matched -> DEFAULT
    return {
      value: config.value,
      reason: 'DEFAULT',
    };
  }

  /**
   * Evaluates a boolean flag
   */
  evaluateBoolean(
    flag: Flag | null,
    config: FlagEnvironmentConfig | null,
    context: EvaluationContext
  ): EvaluationResult<boolean> {
    const result = this.evaluate(flag, config, context);
    return {
      ...result,
      value: Boolean(result.value),
    };
  }

  /**
   * Evaluates a string flag
   */
  evaluateString(
    flag: Flag | null,
    config: FlagEnvironmentConfig | null,
    context: EvaluationContext
  ): EvaluationResult<string> {
    const result = this.evaluate(flag, config, context);
    return {
      ...result,
      value: String(result.value),
    };
  }

  /**
   * Evaluates a number flag
   */
  evaluateNumber(
    flag: Flag | null,
    config: FlagEnvironmentConfig | null,
    context: EvaluationContext
  ): EvaluationResult<number> {
    const result = this.evaluate(flag, config, context);
    return {
      ...result,
      value: Number(result.value),
    };
  }

  /**
   * Evaluates a JSON flag
   */
  evaluateJson(
    flag: Flag | null,
    config: FlagEnvironmentConfig | null,
    context: EvaluationContext
  ): EvaluationResult<Record<string, unknown>> {
    const result = this.evaluate(flag, config, context);
    const value =
      typeof result.value === 'object' && result.value !== null
        ? (result.value as Record<string, unknown>)
        : {};
    return {
      ...result,
      value,
    };
  }
}
