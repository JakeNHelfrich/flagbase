import { describe, it, expect } from 'vitest';
import { FlagKey } from '../../value-objects/flag-key.js';

describe('FlagKey', () => {
  describe('create', () => {
    describe('valid keys', () => {
      it('should create a valid flag key with lowercase letters', () => {
        const result = FlagKey.create('myfeature');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('myfeature');
        }
      });

      it('should create a valid flag key with hyphens', () => {
        const result = FlagKey.create('my-feature-flag');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-feature-flag');
        }
      });

      it('should create a valid flag key with numbers after first character', () => {
        const result = FlagKey.create('feature123');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('feature123');
        }
      });

      it('should create a valid flag key with mixed lowercase, numbers, and hyphens', () => {
        const result = FlagKey.create('my-feature-2-test');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-feature-2-test');
        }
      });

      it('should create a valid flag key with minimum length (2 characters)', () => {
        const result = FlagKey.create('ab');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('ab');
        }
      });

      it('should create a valid flag key with maximum length (64 characters)', () => {
        const longKey = 'a' + 'b'.repeat(63);
        const result = FlagKey.create(longKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(longKey);
        }
      });

      it('should trim whitespace from valid keys', () => {
        const result = FlagKey.create('  my-feature  ');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-feature');
        }
      });

      it('should accept keys starting with any lowercase letter', () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        for (const letter of letters) {
          const result = FlagKey.create(`${letter}feature`);
          expect(result.ok).toBe(true);
        }
      });
    });

    describe('invalid keys', () => {
      it('should reject empty string', () => {
        const result = FlagKey.create('');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key cannot be empty');
        }
      });

      it('should reject whitespace-only string', () => {
        const result = FlagKey.create('   ');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key cannot be empty');
        }
      });

      it('should reject key that is too short (1 character)', () => {
        const result = FlagKey.create('a');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must be at least 2 characters long');
        }
      });

      it('should reject key that is too long (65 characters)', () => {
        const longKey = 'a' + 'b'.repeat(64);
        const result = FlagKey.create(longKey);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key cannot exceed 64 characters');
        }
      });

      it('should reject key starting with a number', () => {
        const result = FlagKey.create('1feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must start with a lowercase letter');
        }
      });

      it('should reject key starting with a hyphen', () => {
        const result = FlagKey.create('-feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must start with a lowercase letter');
        }
      });

      it('should reject key with uppercase letters', () => {
        const result = FlagKey.create('myFeature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Flag key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key starting with uppercase letter', () => {
        const result = FlagKey.create('MyFeature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must start with a lowercase letter');
        }
      });

      it('should reject key with special characters (underscore)', () => {
        const result = FlagKey.create('my_feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Flag key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (dot)', () => {
        const result = FlagKey.create('my.feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Flag key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (space in middle)', () => {
        const result = FlagKey.create('my feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Flag key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (at sign)', () => {
        const result = FlagKey.create('my@feature');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Flag key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject non-string values', () => {
        const result = FlagKey.create(123 as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must be a string');
        }
      });

      it('should reject null', () => {
        const result = FlagKey.create(null as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must be a string');
        }
      });

      it('should reject undefined', () => {
        const result = FlagKey.create(undefined as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Flag key must be a string');
        }
      });
    });
  });

  describe('equals', () => {
    it('should return true for flag keys with the same value', () => {
      const result1 = FlagKey.create('my-feature');
      const result2 = FlagKey.create('my-feature');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for flag keys with different values', () => {
      const result1 = FlagKey.create('feature-one');
      const result2 = FlagKey.create('feature-two');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should handle equality after trimming', () => {
      const result1 = FlagKey.create('  my-feature  ');
      const result2 = FlagKey.create('my-feature');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('should return the string value of the flag key', () => {
      const result = FlagKey.create('my-feature');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-feature');
      }
    });

    it('should return trimmed value', () => {
      const result = FlagKey.create('  my-feature  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-feature');
      }
    });

    it('should work with complex valid keys', () => {
      const result = FlagKey.create('my-complex-feature-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-complex-feature-123');
      }
    });
  });
});
