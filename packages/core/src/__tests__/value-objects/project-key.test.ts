import { describe, it, expect } from 'vitest';
import { ProjectKey } from '../../value-objects/project-key.js';

describe('ProjectKey', () => {
  describe('create', () => {
    describe('valid keys', () => {
      it('should create a valid project key with lowercase letters', () => {
        const result = ProjectKey.create('myproject');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('myproject');
        }
      });

      it('should create a valid project key with hyphens', () => {
        const result = ProjectKey.create('my-project-name');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-project-name');
        }
      });

      it('should create a valid project key with numbers after first character', () => {
        const result = ProjectKey.create('project123');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('project123');
        }
      });

      it('should create a valid project key with mixed lowercase, numbers, and hyphens', () => {
        const result = ProjectKey.create('my-project-2-test');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-project-2-test');
        }
      });

      it('should create a valid project key with minimum length (2 characters)', () => {
        const result = ProjectKey.create('ab');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('ab');
        }
      });

      it('should create a valid project key with maximum length (64 characters)', () => {
        const longKey = 'a' + 'b'.repeat(63);
        const result = ProjectKey.create(longKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(longKey);
        }
      });

      it('should trim whitespace from valid keys', () => {
        const result = ProjectKey.create('  my-project  ');
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe('my-project');
        }
      });

      it('should accept keys starting with any lowercase letter', () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        for (const letter of letters) {
          const result = ProjectKey.create(`${letter}project`);
          expect(result.ok).toBe(true);
        }
      });
    });

    describe('invalid keys', () => {
      it('should reject empty string', () => {
        const result = ProjectKey.create('');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key cannot be empty');
        }
      });

      it('should reject whitespace-only string', () => {
        const result = ProjectKey.create('   ');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key cannot be empty');
        }
      });

      it('should reject key that is too short (1 character)', () => {
        const result = ProjectKey.create('a');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must be at least 2 characters long');
        }
      });

      it('should reject key that is too long (65 characters)', () => {
        const longKey = 'a' + 'b'.repeat(64);
        const result = ProjectKey.create(longKey);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key cannot exceed 64 characters');
        }
      });

      it('should reject key starting with a number', () => {
        const result = ProjectKey.create('1project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must start with a lowercase letter');
        }
      });

      it('should reject key starting with a hyphen', () => {
        const result = ProjectKey.create('-project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must start with a lowercase letter');
        }
      });

      it('should reject key with uppercase letters', () => {
        const result = ProjectKey.create('myProject');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Project key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key starting with uppercase letter', () => {
        const result = ProjectKey.create('MyProject');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must start with a lowercase letter');
        }
      });

      it('should reject key with special characters (underscore)', () => {
        const result = ProjectKey.create('my_project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Project key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (dot)', () => {
        const result = ProjectKey.create('my.project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Project key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (space in middle)', () => {
        const result = ProjectKey.create('my project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Project key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject key with special characters (at sign)', () => {
        const result = ProjectKey.create('my@project');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'Project key can only contain lowercase letters, numbers, and hyphens'
          );
        }
      });

      it('should reject non-string values', () => {
        const result = ProjectKey.create(123 as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must be a string');
        }
      });

      it('should reject null', () => {
        const result = ProjectKey.create(null as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must be a string');
        }
      });

      it('should reject undefined', () => {
        const result = ProjectKey.create(undefined as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('Project key must be a string');
        }
      });
    });
  });

  describe('equals', () => {
    it('should return true for project keys with the same value', () => {
      const result1 = ProjectKey.create('my-project');
      const result2 = ProjectKey.create('my-project');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for project keys with different values', () => {
      const result1 = ProjectKey.create('project-one');
      const result2 = ProjectKey.create('project-two');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should handle equality after trimming', () => {
      const result1 = ProjectKey.create('  my-project  ');
      const result2 = ProjectKey.create('my-project');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('should return the string value of the project key', () => {
      const result = ProjectKey.create('my-project');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-project');
      }
    });

    it('should return trimmed value', () => {
      const result = ProjectKey.create('  my-project  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-project');
      }
    });

    it('should work with complex valid keys', () => {
      const result = ProjectKey.create('my-complex-project-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('my-complex-project-123');
      }
    });
  });
});
