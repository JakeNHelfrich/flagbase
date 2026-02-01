import { describe, it, expect } from 'vitest';
import { FlagEvaluator } from '../../evaluator/flag-evaluator.js';
import type {
  Flag,
  FlagEnvironmentConfig,
  TargetingRule,
  EvaluationContext,
} from '@flagbase/types';

// ============================================================================
// Test Helpers
// ============================================================================

function createFlag(overrides: Partial<Flag> = {}): Flag {
  return {
    id: 'flag-1',
    projectId: 'project-1',
    key: 'test-flag',
    name: 'Test Flag',
    description: null,
    type: 'boolean',
    defaultValue: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createConfig(overrides: Partial<FlagEnvironmentConfig> = {}): FlagEnvironmentConfig {
  return {
    id: 'config-1',
    flagId: 'flag-1',
    environmentId: 'env-1',
    enabled: true,
    value: true,
    targetingRules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createTargetingRule(overrides: Partial<TargetingRule> = {}): TargetingRule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    conditions: [],
    percentage: 100,
    value: true,
    priority: 1,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('FlagEvaluator', () => {
  // ============================================================================
  // FLAG_NOT_FOUND
  // ============================================================================

  describe('FLAG_NOT_FOUND reason', () => {
    it('should return FLAG_NOT_FOUND when flag is null', () => {
      const evaluator = new FlagEvaluator();
      const result = evaluator.evaluate(null, null, {});

      expect(result.reason).toBe('FLAG_NOT_FOUND');
    });

    it('should return FLAG_NOT_FOUND when config is null', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag();
      const result = evaluator.evaluate(flag, null, {});

      expect(result.reason).toBe('FLAG_NOT_FOUND');
    });

    it('should return type-appropriate default value for boolean flag when not found', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'boolean', defaultValue: true });
      const result = evaluator.evaluate(flag, null, {});

      // Returns the default for the type (false for boolean), not the flag's defaultValue
      expect(result.value).toBe(false);
    });

    it('should return type-appropriate default value for string flag when not found', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'custom-default' });
      const result = evaluator.evaluate(flag, null, {});

      // Returns the default for the type (empty string), not the flag's defaultValue
      expect(result.value).toBe('');
    });

    it('should return type-appropriate default value for number flag when not found', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: 42 });
      const result = evaluator.evaluate(flag, null, {});

      // Returns the default for the type (0), not the flag's defaultValue
      expect(result.value).toBe(0);
    });

    it('should return type-appropriate default value for json flag when not found', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'json', defaultValue: { theme: 'dark' } });
      const result = evaluator.evaluate(flag, null, {});

      // Returns the default for the type (empty object), not the flag's defaultValue
      expect(result.value).toEqual({});
    });

    it('should return boolean default when both flag and config are null', () => {
      const evaluator = new FlagEvaluator();
      const result = evaluator.evaluate(null, null, {});

      expect(result.reason).toBe('FLAG_NOT_FOUND');
      expect(result.value).toBe(false);
    });
  });

  // ============================================================================
  // DISABLED
  // ============================================================================

  describe('DISABLED reason', () => {
    it('should return DISABLED when config.enabled is false', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag();
      const config = createConfig({ enabled: false, value: true });
      const result = evaluator.evaluate(flag, config, {});

      expect(result.reason).toBe('DISABLED');
    });

    it('should return config value when disabled', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const config = createConfig({ enabled: false, value: true });
      const result = evaluator.evaluate(flag, config, {});

      // When disabled, returns config.value (not the flag's defaultValue)
      expect(result.value).toBe(true);
    });

    it('should ignore targeting rules when disabled', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
        value: 'rule-value',
      });
      const config = createConfig({
        enabled: false,
        value: 'disabled-value',
        targetingRules: [rule],
      });
      const context: EvaluationContext = { attributes: { country: 'US' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.reason).toBe('DISABLED');
      // Should return config.value, not the rule value
      expect(result.value).toBe('disabled-value');
    });
  });

  // ============================================================================
  // TARGETING_MATCH
  // ============================================================================

  describe('TARGETING_MATCH reason', () => {
    it('should return TARGETING_MATCH when rule conditions match', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
        value: true,
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        targetingRules: [rule],
      });
      const context: EvaluationContext = { attributes: { country: 'US' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.reason).toBe('TARGETING_MATCH');
      expect(result.value).toBe(true);
    });

    it('should match rule with multiple conditions (AND logic)', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [
          { attribute: 'country', operator: 'eq', value: 'US' },
          { attribute: 'age', operator: 'gte', value: 18 },
        ],
        value: true,
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        targetingRules: [rule],
      });

      // Both conditions match
      const context1: EvaluationContext = { attributes: { country: 'US', age: 25 } };
      const result1 = evaluator.evaluate(flag, config, context1);
      expect(result1.reason).toBe('TARGETING_MATCH');
      expect(result1.value).toBe(true);

      // Only one condition matches
      const context2: EvaluationContext = { attributes: { country: 'US', age: 15 } };
      const result2 = evaluator.evaluate(flag, config, context2);
      expect(result2.reason).not.toBe('TARGETING_MATCH');
    });

    it('should return rule value when matched', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'control' });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: 'experiment',
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        value: 'control',
        targetingRules: [rule],
      });
      const context: EvaluationContext = { attributes: { beta: true } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.value).toBe('experiment');
    });
  });

  // ============================================================================
  // Rule Priority
  // ============================================================================

  describe('rule priority', () => {
    it('should evaluate rules by priority (lower number = higher priority)', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'default' });

      const lowPriorityRule = createTargetingRule({
        id: 'rule-low',
        name: 'Low Priority',
        conditions: [{ attribute: 'user', operator: 'eq', value: true }],
        value: 'low-priority-value',
        percentage: 100,
        priority: 10,
      });

      const highPriorityRule = createTargetingRule({
        id: 'rule-high',
        name: 'High Priority',
        conditions: [{ attribute: 'user', operator: 'eq', value: true }],
        value: 'high-priority-value',
        percentage: 100,
        priority: 1,
      });

      // Add rules in wrong order to ensure sorting happens
      const config = createConfig({
        enabled: true,
        targetingRules: [lowPriorityRule, highPriorityRule],
      });

      const context: EvaluationContext = { attributes: { user: true } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.value).toBe('high-priority-value');
    });

    it('should use first matching rule when multiple rules match', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'default' });

      const rule1 = createTargetingRule({
        id: 'rule-1',
        conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
        value: 'us-value',
        priority: 1,
      });

      const rule2 = createTargetingRule({
        id: 'rule-2',
        conditions: [{ attribute: 'premium', operator: 'eq', value: true }],
        value: 'premium-value',
        priority: 2,
      });

      const config = createConfig({
        enabled: true,
        targetingRules: [rule2, rule1], // Intentionally out of order
      });

      // Context matches both rules
      const context: EvaluationContext = { attributes: { country: 'US', premium: true } };
      const result = evaluator.evaluate(flag, config, context);

      // Should match rule1 (priority 1) first
      expect(result.value).toBe('us-value');
    });

    it('should skip to next rule when conditions dont match', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'default' });

      const rule1 = createTargetingRule({
        id: 'rule-1',
        conditions: [{ attribute: 'country', operator: 'eq', value: 'UK' }],
        value: 'uk-value',
        priority: 1,
      });

      const rule2 = createTargetingRule({
        id: 'rule-2',
        conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
        value: 'us-value',
        priority: 2,
      });

      const config = createConfig({
        enabled: true,
        targetingRules: [rule1, rule2],
      });

      const context: EvaluationContext = { attributes: { country: 'US' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.value).toBe('us-value');
    });
  });

  // ============================================================================
  // PERCENTAGE_ROLLOUT
  // ============================================================================

  describe('PERCENTAGE_ROLLOUT reason', () => {
    it('should include user when conditions match and user is in rollout percentage', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ key: 'percentage-test', defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: true,
        percentage: 50, // 50% rollout
      });
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: [rule],
      });

      // Test with multiple users to find one in the rollout
      let foundUserInRollout = false;
      for (let i = 0; i < 100; i++) {
        const context: EvaluationContext = {
          userId: `user-${i}`,
          attributes: { beta: true },
        };
        const result = evaluator.evaluate(flag, config, context);

        if (result.reason === 'TARGETING_MATCH' && result.value === true) {
          foundUserInRollout = true;
          break;
        }
      }

      expect(foundUserInRollout).toBe(true);
    });

    it('should exclude user when conditions match but user is outside rollout percentage', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ key: 'percentage-exclude-test', defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: true,
        percentage: 50,
      });
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: [rule],
      });

      // Test with multiple users to find one outside the rollout
      let foundUserOutsideRollout = false;
      for (let i = 0; i < 100; i++) {
        const context: EvaluationContext = {
          userId: `user-${i}`,
          attributes: { beta: true },
        };
        const result = evaluator.evaluate(flag, config, context);

        // User matched conditions but fell outside percentage, so falls to DEFAULT
        if (result.reason === 'DEFAULT') {
          foundUserOutsideRollout = true;
          break;
        }
      }

      expect(foundUserOutsideRollout).toBe(true);
    });

    it('should include all users when percentage is 100', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: true,
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        targetingRules: [rule],
      });

      for (let i = 0; i < 50; i++) {
        const context: EvaluationContext = {
          userId: `user-${i}`,
          attributes: { beta: true },
        };
        const result = evaluator.evaluate(flag, config, context);

        expect(result.value).toBe(true);
        expect(result.reason).toBe('TARGETING_MATCH');
      }
    });

    it('should exclude all users when percentage is 0', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: true,
        percentage: 0,
      });
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: [rule],
      });

      for (let i = 0; i < 50; i++) {
        const context: EvaluationContext = {
          userId: `user-${i}`,
          attributes: { beta: true },
        };
        const result = evaluator.evaluate(flag, config, context);

        // Should fall through to DEFAULT since 0% rollout
        expect(result.reason).toBe('DEFAULT');
      }
    });

    it('should maintain consistent rollout for same user', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ key: 'consistency-test', defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'beta', operator: 'eq', value: true }],
        value: true,
        percentage: 50,
      });
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: [rule],
      });

      const context: EvaluationContext = {
        userId: 'consistent-user',
        attributes: { beta: true },
      };

      const result1 = evaluator.evaluate(flag, config, context);
      const result2 = evaluator.evaluate(flag, config, context);
      const result3 = evaluator.evaluate(flag, config, context);

      expect(result1.value).toBe(result2.value);
      expect(result2.value).toBe(result3.value);
      expect(result1.reason).toBe(result2.reason);
      expect(result2.reason).toBe(result3.reason);
    });

    it('should fall through to next rule when user is outside percentage', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ key: 'fallthrough-test', defaultValue: false });

      const restrictiveRule = createTargetingRule({
        id: 'restrictive',
        conditions: [{ attribute: 'enrolled', operator: 'eq', value: true }],
        value: 'restricted-value',
        percentage: 1, // Very low percentage
        priority: 1,
      });

      const catchAllRule = createTargetingRule({
        id: 'catch-all',
        conditions: [{ attribute: 'enrolled', operator: 'eq', value: true }],
        value: 'catch-all-value',
        percentage: 100,
        priority: 2,
      });

      const config = createConfig({
        enabled: true,
        value: 'default',
        targetingRules: [restrictiveRule, catchAllRule],
      });

      // Most users should fall through to the catch-all rule
      let caughtBySecondRule = 0;
      for (let i = 0; i < 100; i++) {
        const context: EvaluationContext = {
          userId: `user-${i}`,
          attributes: { enrolled: true },
        };
        const result = evaluator.evaluate(flag, config, context);

        if (result.value === 'catch-all-value') {
          caughtBySecondRule++;
        }
      }

      // Most should be caught by second rule since first is only 1%
      expect(caughtBySecondRule).toBeGreaterThan(90);
    });
  });

  // ============================================================================
  // DEFAULT
  // ============================================================================

  describe('DEFAULT reason', () => {
    it('should return DEFAULT when no rules match', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
        value: true,
      });
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: [rule],
      });
      const context: EvaluationContext = { attributes: { country: 'CA' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.reason).toBe('DEFAULT');
    });

    it('should return config value when no rules match', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'flag-default' });
      const config = createConfig({
        enabled: true,
        value: 'config-value',
        targetingRules: [],
      });
      const result = evaluator.evaluate(flag, config, {});

      expect(result.value).toBe('config-value');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should return DEFAULT when targeting rules array is empty', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag();
      const config = createConfig({
        enabled: true,
        value: true,
        targetingRules: [],
      });
      const result = evaluator.evaluate(flag, config, {});

      expect(result.reason).toBe('DEFAULT');
      expect(result.value).toBe(true);
    });

    it('should return DEFAULT when context does not match any rule', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rules = [
        createTargetingRule({
          id: 'rule-1',
          conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }],
          value: 'us',
          priority: 1,
        }),
        createTargetingRule({
          id: 'rule-2',
          conditions: [{ attribute: 'country', operator: 'eq', value: 'UK' }],
          value: 'uk',
          priority: 2,
        }),
      ];
      const config = createConfig({
        enabled: true,
        value: false,
        targetingRules: rules,
      });
      const context: EvaluationContext = { attributes: { country: 'DE' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.reason).toBe('DEFAULT');
    });
  });

  // ============================================================================
  // Type-Specific Methods
  // ============================================================================

  describe('evaluateBoolean', () => {
    it('should return boolean value for boolean flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'boolean', defaultValue: true });
      const config = createConfig({ enabled: true, value: true });
      const result = evaluator.evaluateBoolean(flag, config, {});

      expect(typeof result.value).toBe('boolean');
      expect(result.value).toBe(true);
    });

    it('should return config value for disabled boolean flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'boolean', defaultValue: false });
      const config = createConfig({ enabled: false, value: true });
      const result = evaluator.evaluateBoolean(flag, config, {});

      // When disabled, returns config.value (not the flag's defaultValue)
      expect(result.value).toBe(true);
    });

    it('should coerce non-boolean to boolean', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'boolean', defaultValue: false });
      const config = createConfig({ enabled: true, value: 'truthy' as unknown as boolean });
      const result = evaluator.evaluateBoolean(flag, config, {});

      expect(typeof result.value).toBe('boolean');
    });
  });

  describe('evaluateString', () => {
    it('should return string value for string flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'default' });
      const config = createConfig({ enabled: true, value: 'test-value' });
      const result = evaluator.evaluateString(flag, config, {});

      expect(typeof result.value).toBe('string');
      expect(result.value).toBe('test-value');
    });

    it('should return config value for disabled string flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'default' });
      const config = createConfig({ enabled: false, value: 'disabled-value' });
      const result = evaluator.evaluateString(flag, config, {});

      // When disabled, returns config.value (not the flag's defaultValue)
      expect(result.value).toBe('disabled-value');
    });

    it('should handle empty string values', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: '' });
      const config = createConfig({ enabled: true, value: '' });
      const result = evaluator.evaluateString(flag, config, {});

      expect(result.value).toBe('');
    });
  });

  describe('evaluateNumber', () => {
    it('should return number value for number flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: 0 });
      const config = createConfig({ enabled: true, value: 42 });
      const result = evaluator.evaluateNumber(flag, config, {});

      expect(typeof result.value).toBe('number');
      expect(result.value).toBe(42);
    });

    it('should return config value for disabled number flag', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: 10 });
      const config = createConfig({ enabled: false, value: 50 });
      const result = evaluator.evaluateNumber(flag, config, {});

      // When disabled, returns config.value (not the flag's defaultValue)
      expect(result.value).toBe(50);
    });

    it('should handle zero', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: 0 });
      const config = createConfig({ enabled: true, value: 0 });
      const result = evaluator.evaluateNumber(flag, config, {});

      expect(result.value).toBe(0);
    });

    it('should handle negative numbers', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: -1 });
      const config = createConfig({ enabled: true, value: -100 });
      const result = evaluator.evaluateNumber(flag, config, {});

      expect(result.value).toBe(-100);
    });

    it('should handle decimal numbers', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'number', defaultValue: 0.5 });
      const config = createConfig({ enabled: true, value: 3.14159 });
      const result = evaluator.evaluateNumber(flag, config, {});

      expect(result.value).toBe(3.14159);
    });
  });

  describe('evaluateJson', () => {
    it('should return json value for json flag', () => {
      const evaluator = new FlagEvaluator();
      const defaultJson = { theme: 'light' };
      const configJson = { theme: 'dark', fontSize: 14 };
      const flag = createFlag({ type: 'json', defaultValue: defaultJson });
      const config = createConfig({ enabled: true, value: configJson });
      const result = evaluator.evaluateJson(flag, config, {});

      expect(result.value).toEqual(configJson);
    });

    it('should return config value for disabled json flag', () => {
      const evaluator = new FlagEvaluator();
      const defaultJson = { feature: false };
      const configJson = { feature: true };
      const flag = createFlag({ type: 'json', defaultValue: defaultJson });
      const config = createConfig({ enabled: false, value: configJson });
      const result = evaluator.evaluateJson(flag, config, {});

      // When disabled, returns config.value (not the flag's defaultValue)
      expect(result.value).toEqual(configJson);
    });

    it('should handle nested json objects', () => {
      const evaluator = new FlagEvaluator();
      const nestedJson = {
        ui: {
          theme: 'dark',
          sidebar: {
            collapsed: false,
            width: 250,
          },
        },
        features: ['a', 'b', 'c'],
      };
      const flag = createFlag({ type: 'json', defaultValue: {} });
      const config = createConfig({ enabled: true, value: nestedJson });
      const result = evaluator.evaluateJson(flag, config, {});

      expect(result.value).toEqual(nestedJson);
    });

    it('should handle empty json object', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'json', defaultValue: {} });
      const config = createConfig({ enabled: true, value: {} });
      const result = evaluator.evaluateJson(flag, config, {});

      expect(result.value).toEqual({});
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    it('should handle complex targeting scenario', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ type: 'string', defaultValue: 'control' });

      const betaRule = createTargetingRule({
        id: 'beta-rule',
        name: 'Beta Users',
        conditions: [
          { attribute: 'beta', operator: 'eq', value: true },
          { attribute: 'country', operator: 'in', value: ['US', 'CA'] },
        ],
        value: 'beta-experience',
        percentage: 100,
        priority: 1,
      });

      const premiumRule = createTargetingRule({
        id: 'premium-rule',
        name: 'Premium Users',
        conditions: [{ attribute: 'plan', operator: 'eq', value: 'premium' }],
        value: 'premium-experience',
        percentage: 100,
        priority: 2,
      });

      const rolloutRule = createTargetingRule({
        id: 'rollout-rule',
        name: 'Gradual Rollout',
        conditions: [{ attribute: 'enrolled', operator: 'eq', value: true }],
        value: 'new-experience',
        percentage: 25,
        priority: 3,
      });

      const config = createConfig({
        enabled: true,
        value: 'control',
        targetingRules: [premiumRule, betaRule, rolloutRule],
      });

      // Beta user in US should get beta experience
      const betaContext: EvaluationContext = {
        userId: 'beta-user',
        attributes: { beta: true, country: 'US', enrolled: true },
      };
      const betaResult = evaluator.evaluate(flag, config, betaContext);
      expect(betaResult.value).toBe('beta-experience');

      // Premium user (not beta) should get premium experience
      const premiumContext: EvaluationContext = {
        userId: 'premium-user',
        attributes: { beta: false, plan: 'premium', enrolled: true },
      };
      const premiumResult = evaluator.evaluate(flag, config, premiumContext);
      expect(premiumResult.value).toBe('premium-experience');

      // Regular enrolled user might be in rollout
      const regularContext: EvaluationContext = {
        userId: 'regular-user',
        attributes: { beta: false, plan: 'free', enrolled: true },
      };
      const regularResult = evaluator.evaluate(flag, config, regularContext);
      // Could be 'new-experience' or 'control' depending on percentage bucket
      expect(['new-experience', 'control']).toContain(regularResult.value);
    });

    it('should handle flag evaluation without userId', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [{ attribute: 'env', operator: 'eq', value: 'production' }],
        value: true,
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        targetingRules: [rule],
      });

      const context: EvaluationContext = { attributes: { env: 'production' } };
      const result = evaluator.evaluate(flag, config, context);

      expect(result.value).toBe(true);
    });

    it('should handle flag with no conditions in rule', () => {
      const evaluator = new FlagEvaluator();
      const flag = createFlag({ defaultValue: false });
      const rule = createTargetingRule({
        conditions: [], // No conditions means always matches
        value: true,
        percentage: 100,
      });
      const config = createConfig({
        enabled: true,
        targetingRules: [rule],
      });

      const result = evaluator.evaluate(flag, config, {});
      expect(result.value).toBe(true);
    });
  });
});
