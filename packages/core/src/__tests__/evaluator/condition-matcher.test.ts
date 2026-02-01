import { describe, it, expect } from 'vitest';
import { matchCondition } from '../../evaluator/condition-matcher.js';
import type { Condition, EvaluationContext } from '@flagbase/types';

describe('ConditionMatcher', () => {
  // ============================================================================
  // Equality Operators: eq, neq
  // ============================================================================

  describe('eq operator', () => {
    it('should match equal strings', () => {
      const condition: Condition = { attribute: 'country', operator: 'eq', value: 'US' };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match unequal strings', () => {
      const condition: Condition = { attribute: 'country', operator: 'eq', value: 'US' };
      const context: EvaluationContext = { attributes: { country: 'CA' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should match equal numbers', () => {
      const condition: Condition = { attribute: 'age', operator: 'eq', value: 25 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match unequal numbers', () => {
      const condition: Condition = { attribute: 'age', operator: 'eq', value: 25 };
      const context: EvaluationContext = { attributes: { age: 30 } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should match equal booleans', () => {
      const condition: Condition = { attribute: 'premium', operator: 'eq', value: true };
      const context: EvaluationContext = { attributes: { premium: true } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should handle case-sensitive string comparison', () => {
      const condition: Condition = { attribute: 'name', operator: 'eq', value: 'John' };
      const context: EvaluationContext = { attributes: { name: 'john' } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('neq operator', () => {
    it('should match unequal strings', () => {
      const condition: Condition = { attribute: 'country', operator: 'neq', value: 'US' };
      const context: EvaluationContext = { attributes: { country: 'CA' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match equal strings', () => {
      const condition: Condition = { attribute: 'country', operator: 'neq', value: 'US' };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should match unequal numbers', () => {
      const condition: Condition = { attribute: 'age', operator: 'neq', value: 25 };
      const context: EvaluationContext = { attributes: { age: 30 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match equal numbers', () => {
      const condition: Condition = { attribute: 'age', operator: 'neq', value: 25 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  // ============================================================================
  // Numeric Comparison Operators: gt, gte, lt, lte
  // ============================================================================

  describe('gt operator', () => {
    it('should match when attribute is greater than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute equals value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 18 } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should not match when attribute is less than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 15 } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should handle decimal numbers', () => {
      const condition: Condition = { attribute: 'score', operator: 'gt', value: 4.5 };
      const context: EvaluationContext = { attributes: { score: 4.6 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const condition: Condition = { attribute: 'temperature', operator: 'gt', value: -10 };
      const context: EvaluationContext = { attributes: { temperature: -5 } };

      expect(matchCondition(condition, context)).toBe(true);
    });
  });

  describe('gte operator', () => {
    it('should match when attribute is greater than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should match when attribute equals value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 18 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute is less than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'gte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 15 } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('lt operator', () => {
    it('should match when attribute is less than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 15 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute equals value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 18 } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should not match when attribute is greater than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lt', value: 18 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('lte operator', () => {
    it('should match when attribute is less than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 15 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should match when attribute equals value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 18 } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute is greater than value', () => {
      const condition: Condition = { attribute: 'age', operator: 'lte', value: 18 };
      const context: EvaluationContext = { attributes: { age: 25 } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  // ============================================================================
  // String Operators: contains, not_contains, starts_with, ends_with
  // ============================================================================

  describe('contains operator', () => {
    it('should match when attribute contains substring', () => {
      const condition: Condition = { attribute: 'email', operator: 'contains', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@company.com' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute does not contain substring', () => {
      const condition: Condition = { attribute: 'email', operator: 'contains', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@gmail.com' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const condition: Condition = { attribute: 'name', operator: 'contains', value: 'John' };
      const context: EvaluationContext = { attributes: { name: 'john doe' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should match full string', () => {
      const condition: Condition = { attribute: 'status', operator: 'contains', value: 'active' };
      const context: EvaluationContext = { attributes: { status: 'active' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should match empty string in any string', () => {
      const condition: Condition = { attribute: 'name', operator: 'contains', value: '' };
      const context: EvaluationContext = { attributes: { name: 'anything' } };

      expect(matchCondition(condition, context)).toBe(true);
    });
  });

  describe('not_contains operator', () => {
    it('should match when attribute does not contain substring', () => {
      const condition: Condition = { attribute: 'email', operator: 'not_contains', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@gmail.com' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute contains substring', () => {
      const condition: Condition = { attribute: 'email', operator: 'not_contains', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@company.com' } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('starts_with operator', () => {
    it('should match when attribute starts with prefix', () => {
      const condition: Condition = { attribute: 'email', operator: 'starts_with', value: 'admin' };
      const context: EvaluationContext = { attributes: { email: 'admin@company.com' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute does not start with prefix', () => {
      const condition: Condition = { attribute: 'email', operator: 'starts_with', value: 'admin' };
      const context: EvaluationContext = { attributes: { email: 'user@company.com' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should handle empty prefix', () => {
      const condition: Condition = { attribute: 'name', operator: 'starts_with', value: '' };
      const context: EvaluationContext = { attributes: { name: 'anything' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const condition: Condition = { attribute: 'name', operator: 'starts_with', value: 'Admin' };
      const context: EvaluationContext = { attributes: { name: 'admin' } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('ends_with operator', () => {
    it('should match when attribute ends with suffix', () => {
      const condition: Condition = { attribute: 'email', operator: 'ends_with', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@company.com' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute does not end with suffix', () => {
      const condition: Condition = { attribute: 'email', operator: 'ends_with', value: '@company.com' };
      const context: EvaluationContext = { attributes: { email: 'user@gmail.com' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should handle empty suffix', () => {
      const condition: Condition = { attribute: 'name', operator: 'ends_with', value: '' };
      const context: EvaluationContext = { attributes: { name: 'anything' } };

      expect(matchCondition(condition, context)).toBe(true);
    });
  });

  // ============================================================================
  // Array Membership Operators: in, not_in
  // ============================================================================

  describe('in operator', () => {
    it('should match when attribute value is in the array', () => {
      const condition: Condition = { attribute: 'country', operator: 'in', value: ['US', 'CA', 'UK'] };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute value is not in the array', () => {
      const condition: Condition = { attribute: 'country', operator: 'in', value: ['US', 'CA', 'UK'] };
      const context: EvaluationContext = { attributes: { country: 'DE' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should handle empty array', () => {
      const condition: Condition = { attribute: 'country', operator: 'in', value: [] };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should handle single-element array', () => {
      const condition: Condition = { attribute: 'country', operator: 'in', value: ['US'] };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should be case-sensitive for string values', () => {
      const condition: Condition = { attribute: 'status', operator: 'in', value: ['Active', 'Pending'] };
      const context: EvaluationContext = { attributes: { status: 'active' } };

      expect(matchCondition(condition, context)).toBe(false);
    });
  });

  describe('not_in operator', () => {
    it('should match when attribute value is not in the array', () => {
      const condition: Condition = { attribute: 'country', operator: 'not_in', value: ['US', 'CA', 'UK'] };
      const context: EvaluationContext = { attributes: { country: 'DE' } };

      expect(matchCondition(condition, context)).toBe(true);
    });

    it('should not match when attribute value is in the array', () => {
      const condition: Condition = { attribute: 'country', operator: 'not_in', value: ['US', 'CA', 'UK'] };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(false);
    });

    it('should match for empty array', () => {
      const condition: Condition = { attribute: 'country', operator: 'not_in', value: [] };
      const context: EvaluationContext = { attributes: { country: 'US' } };

      expect(matchCondition(condition, context)).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    describe('missing attribute in context', () => {
      it('should return false for eq when attribute is missing', () => {
        const condition: Condition = { attribute: 'country', operator: 'eq', value: 'US' };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should return false for eq when attributes object is undefined', () => {
        const condition: Condition = { attribute: 'country', operator: 'eq', value: 'US' };
        const context: EvaluationContext = {};

        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should return true for neq when attribute is missing', () => {
        const condition: Condition = { attribute: 'country', operator: 'neq', value: 'US' };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(true);
      });

      it('should return false for numeric operators when attribute is missing', () => {
        const condition: Condition = { attribute: 'age', operator: 'gt', value: 18 };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should return false for contains when attribute is missing', () => {
        const condition: Condition = { attribute: 'email', operator: 'contains', value: '@test.com' };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should return false for in when attribute is missing', () => {
        const condition: Condition = { attribute: 'country', operator: 'in', value: ['US', 'CA'] };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should return true for not_in when attribute is missing', () => {
        const condition: Condition = { attribute: 'country', operator: 'not_in', value: ['US', 'CA'] };
        const context: EvaluationContext = { attributes: {} };

        expect(matchCondition(condition, context)).toBe(true);
      });
    });

    describe('type mismatches', () => {
      it('should handle string attribute with numeric condition value for eq', () => {
        const condition: Condition = { attribute: 'id', operator: 'eq', value: 123 };
        const context: EvaluationContext = { attributes: { id: '123' } };

        // Strict equality should fail with type mismatch
        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should handle numeric attribute with string condition value for gt', () => {
        const condition: Condition = { attribute: 'age', operator: 'gt', value: 18 };
        const context: EvaluationContext = { attributes: { age: '25' } };

        // Should return false due to type mismatch (string is not a number)
        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should handle boolean attribute with string operator', () => {
        const condition: Condition = { attribute: 'active', operator: 'contains', value: 'true' };
        const context: EvaluationContext = { attributes: { active: true } };

        // contains expects string, should return false for boolean
        expect(matchCondition(condition, context)).toBe(false);
      });

      it('should handle number attribute with string operator starts_with', () => {
        const condition: Condition = { attribute: 'phone', operator: 'starts_with', value: '+1' };
        const context: EvaluationContext = { attributes: { phone: 12025551234 } };

        // starts_with expects string, should return false for number
        expect(matchCondition(condition, context)).toBe(false);
      });
    });

    describe('special values', () => {
      it('should handle zero as a valid number', () => {
        const condition: Condition = { attribute: 'count', operator: 'eq', value: 0 };
        const context: EvaluationContext = { attributes: { count: 0 } };

        expect(matchCondition(condition, context)).toBe(true);
      });

      it('should handle empty string as a valid string', () => {
        const condition: Condition = { attribute: 'name', operator: 'eq', value: '' };
        const context: EvaluationContext = { attributes: { name: '' } };

        expect(matchCondition(condition, context)).toBe(true);
      });

      it('should handle false as a valid boolean', () => {
        const condition: Condition = { attribute: 'enabled', operator: 'eq', value: false };
        const context: EvaluationContext = { attributes: { enabled: false } };

        expect(matchCondition(condition, context)).toBe(true);
      });

      it('should handle very large numbers', () => {
        const condition: Condition = { attribute: 'id', operator: 'gt', value: Number.MAX_SAFE_INTEGER - 1 };
        const context: EvaluationContext = { attributes: { id: Number.MAX_SAFE_INTEGER } };

        expect(matchCondition(condition, context)).toBe(true);
      });

      it('should handle unicode strings', () => {
        const condition: Condition = { attribute: 'name', operator: 'contains', value: 'cafe' };
        const context: EvaluationContext = { attributes: { name: 'Le cafe' } };

        expect(matchCondition(condition, context)).toBe(true);
      });
    });
  });
});
