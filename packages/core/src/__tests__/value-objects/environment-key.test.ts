import { describe, it, expect } from 'vitest';
import { EnvironmentKey } from '../../value-objects/environment-key.js';

describe('EnvironmentKey', () => {
  describe('create', () => {
    describe('valid keys', () => {
      it('should create a valid environment key with lowercase letters', () => {
        const result = EnvironmentKey.create('production');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('production');
        }
      });

      it('should create a valid environment key with hyphens', () => {
        const result = EnvironmentKey.create('staging-env');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('staging-env');
        }
      });

      it('should create a valid environment key with numbers after first character', () => {
        const result = EnvironmentKey.create('staging2');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('staging2');
        }
      });

      it('should create a valid environment key with mixed lowercase, numbers, and hyphens', () => {
        const result = EnvironmentKey.create('staging-2-env');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('staging-2-env');
        }
      });

      it('should create a valid environment key with minimum length (2 characters)', () => {
        const result = EnvironmentKey.create('ab');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('ab');
        }
      });

      it('should create a valid environment key with maximum length (64 characters)', () => {
        const longKey = 'a' + 'b'.repeat(63);
        const result = EnvironmentKey.create(longKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(longKey);
        }
      });

      it('should trim whitespace from valid keys', () => {
        const result = EnvironmentKey.create('  production  ');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('production');
        }
      });

      it('should accept keys starting with any lowercase letter', () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        for (const letter of letters) {
          const result = EnvironmentKey.create(`${letter}env`);
          expect(result.ok).toBe(true);
        }
      });

      it('should accept common environment names', () => {
        const envNames = ['development', 'staging', 'production', 'testing', 'qa', 'uat'];
        for (const envName of envNames) {
          const result = EnvironmentKey.create(envName);
          expect(result.ok).toBe(true);
        }
      });
    });

    describe('invalid keys', () => {
      it('should reject empty string', () => {
        const result = EnvironmentKey.create('');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key cannot be empty');
        }
      });

      it('should reject whitespace-only string', () => {
        const result = EnvironmentKey.create('   ');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key cannot be empty');
        }
      });

      it('should reject key that is too short (1 character)', () => {
        const result = EnvironmentKey.create('a');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must be at least 2 characters long');
        }
      });

      it('should reject key that is too long (65 characters)', () => {
        const longKey = 'a' + 'b'.repeat(64);
        const result = EnvironmentKey.create(longKey);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key cannot exceed 64 characters');
        }
      });

      it('should reject key starting with a number', () => {
        const result = EnvironmentKey.create('1production');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must start with a lowercase letter');
        }
      });

      it('should reject key starting with a hyphen', () => {
        const result = EnvironmentKey.create('-production');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must start with a lowercase letter');
        }
      });

      it('should reject key with uppercase letters', () => {
        const result = EnvironmentKey.create('Production');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must start with a lowercase letter');
        }
      });

      it('should reject key with uppercase letters in middle', () => {
        const result = EnvironmentKey.create('myProduction');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Environment key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (underscore)', () => {
        const result = EnvironmentKey.create('staging_env');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Environment key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (dot)', () => {
        const result = EnvironmentKey.create('staging.env');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Environment key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (space in middle)', () => {
        const result = EnvironmentKey.create('staging env');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Environment key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (at sign)', () => {
        const result = EnvironmentKey.create('staging@env');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Environment key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject non-string values', () => {
        const result = EnvironmentKey.create(123 as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must be a string');
        }
      });

      it('should reject null', () => {
        const result = EnvironmentKey.create(null as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must be a string');
        }
      });

      it('should reject undefined', () => {
        const result = EnvironmentKey.create(undefined as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Environment key must be a string');
        }
      });
    });
  });

  describe('equals', () => {
    it('should return true for environment keys with the same value', () => {
      const result1 = EnvironmentKey.create('production');
      const result2 = EnvironmentKey.create('production');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for environment keys with different values', () => {
      const result1 = EnvironmentKey.create('production');
      const result2 = EnvironmentKey.create('staging');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should handle equality after trimming', () => {
      const result1 = EnvironmentKey.create('  production  ');
      const result2 = EnvironmentKey.create('production');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('should return the string value of the environment key', () => {
      const result = EnvironmentKey.create('production');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('production');
      }
    });

    it('should return trimmed value', () => {
      const result = EnvironmentKey.create('  production  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('production');
      }
    });

    it('should work with complex valid keys', () => {
      const result = EnvironmentKey.create('staging-2-environment');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('staging-2-environment');
      }
    });
  });
});
