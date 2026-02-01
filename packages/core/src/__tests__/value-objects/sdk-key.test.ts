import { describe, it, expect } from 'vitest';
import { SDKKey } from '../../value-objects/sdk-key.js';

describe('SDKKey', () => {
  // Helper to generate a valid base64url string of given length
  const generateBase64Url = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  describe('create', () => {
    describe('valid keys', () => {
      it('should create a valid SDK key with live prefix', () => {
        const validKey = `fb_live_${generateBase64Url(16)}`;
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should create a valid SDK key with test prefix', () => {
        const validKey = `fb_test_${generateBase64Url(16)}`;
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should create a valid SDK key with minimum base64url length (16 characters)', () => {
        const validKey = 'fb_live_1234567890123456';
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should create a valid SDK key with longer base64url portion', () => {
        const validKey = `fb_test_${generateBase64Url(32)}`;
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should accept all valid base64url characters', () => {
        // Base64URL characters: A-Z, a-z, 0-9, -, _
        const validKey = 'fb_live_ABCDabcd01234567-_';
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
      });

      it('should trim whitespace from valid keys', () => {
        const validKey = 'fb_live_1234567890123456';
        const result = SDKKey.create(`  ${validKey}  `);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should handle base64url with underscores in it', () => {
        const validKey = 'fb_live_1234_5678_9012_3456';
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });

      it('should handle base64url with hyphens in it', () => {
        const validKey = 'fb_test_1234-5678-9012-3456';
        const result = SDKKey.create(validKey);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toString()).toBe(validKey);
        }
      });
    });

    describe('invalid keys', () => {
      it('should reject empty string', () => {
        const result = SDKKey.create('');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key cannot be empty');
        }
      });

      it('should reject whitespace-only string', () => {
        const result = SDKKey.create('   ');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key cannot be empty');
        }
      });

      it('should reject key without fb_ prefix', () => {
        const result = SDKKey.create('live_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must start with "fb_" prefix');
        }
      });

      it('should reject key with wrong prefix', () => {
        const result = SDKKey.create('ab_live_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must start with "fb_" prefix');
        }
      });

      it('should reject key with uppercase prefix', () => {
        const result = SDKKey.create('FB_live_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must start with "fb_" prefix');
        }
      });

      it('should reject key missing type part', () => {
        const result = SDKKey.create('fb_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          // The implementation checks format first (splits by _ and checks length)
          // 'fb_1234567890123456' splits to ['fb', '1234567890123456'] which has length 2
          // So it fails at the format check before the type check
          expect(result.error.message).toBe('SDK key must be in format: fb_{live|test}_{base64url}');
        }
      });

      it('should reject key with invalid type', () => {
        const result = SDKKey.create('fb_prod_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key type must be either "live" or "test"');
        }
      });

      it('should reject key with uppercase type', () => {
        const result = SDKKey.create('fb_LIVE_1234567890123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key type must be either "live" or "test"');
        }
      });

      it('should reject key without base64url part', () => {
        const result = SDKKey.create('fb_live');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must be in format: fb_{live|test}_{base64url}');
        }
      });

      it('should reject key with only prefix and type', () => {
        const result = SDKKey.create('fb_live_');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key base64url portion must be at least 16 characters'
          );
        }
      });

      it('should reject key with too short base64url (less than 16 characters)', () => {
        const result = SDKKey.create('fb_live_123456789012345'); // 15 chars
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key base64url portion must be at least 16 characters'
          );
        }
      });

      it('should reject key with invalid base64url characters (plus sign)', () => {
        const result = SDKKey.create('fb_live_123456789012345+');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key contains invalid characters. Base64URL portion can only contain letters, numbers, hyphens, and underscores'
          );
        }
      });

      it('should reject key with invalid base64url characters (slash)', () => {
        const result = SDKKey.create('fb_live_123456789012345/');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key contains invalid characters. Base64URL portion can only contain letters, numbers, hyphens, and underscores'
          );
        }
      });

      it('should reject key with invalid base64url characters (equals)', () => {
        const result = SDKKey.create('fb_live_1234567890123456=');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key contains invalid characters. Base64URL portion can only contain letters, numbers, hyphens, and underscores'
          );
        }
      });

      it('should reject key with invalid base64url characters (space)', () => {
        const result = SDKKey.create('fb_live_12345678 0123456');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(
            'SDK key contains invalid characters. Base64URL portion can only contain letters, numbers, hyphens, and underscores'
          );
        }
      });

      it('should reject non-string values', () => {
        const result = SDKKey.create(123 as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must be a string');
        }
      });

      it('should reject null', () => {
        const result = SDKKey.create(null as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must be a string');
        }
      });

      it('should reject undefined', () => {
        const result = SDKKey.create(undefined as unknown as string);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe('SDK key must be a string');
        }
      });
    });
  });

  describe('getType', () => {
    it('should return "live" for live SDK keys', () => {
      const validKey = 'fb_live_1234567890123456';
      const result = SDKKey.create(validKey);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getType()).toBe('live');
      }
    });

    it('should return "test" for test SDK keys', () => {
      const validKey = 'fb_test_1234567890123456';
      const result = SDKKey.create(validKey);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getType()).toBe('test');
      }
    });

    it('should correctly identify type with complex base64url part', () => {
      const liveKey = `fb_live_${generateBase64Url(32)}`;
      const testKey = `fb_test_${generateBase64Url(32)}`;

      const liveResult = SDKKey.create(liveKey);
      const testResult = SDKKey.create(testKey);

      expect(liveResult.ok).toBe(true);
      expect(testResult.ok).toBe(true);

      if (liveResult.ok && testResult.ok) {
        expect(liveResult.value.getType()).toBe('live');
        expect(testResult.value.getType()).toBe('test');
      }
    });

    it('should handle base64url with underscores correctly', () => {
      const validKey = 'fb_live_test_1234_5678_9012';
      const result = SDKKey.create(validKey);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getType()).toBe('live');
      }
    });
  });

  describe('equals', () => {
    it('should return true for SDK keys with the same value', () => {
      const key = 'fb_live_1234567890123456';
      const result1 = SDKKey.create(key);
      const result2 = SDKKey.create(key);
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for SDK keys with different values', () => {
      const result1 = SDKKey.create('fb_live_1234567890123456');
      const result2 = SDKKey.create('fb_live_abcdefghijklmnop');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return false for SDK keys with different types', () => {
      const result1 = SDKKey.create('fb_live_1234567890123456');
      const result2 = SDKKey.create('fb_test_1234567890123456');
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should handle equality after trimming', () => {
      const key = 'fb_test_1234567890123456';
      const result1 = SDKKey.create(`  ${key}  `);
      const result2 = SDKKey.create(key);
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('should return the string value of the SDK key', () => {
      const key = 'fb_live_1234567890123456';
      const result = SDKKey.create(key);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(key);
      }
    });

    it('should return trimmed value', () => {
      const key = 'fb_test_1234567890123456';
      const result = SDKKey.create(`  ${key}  `);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(key);
      }
    });

    it('should preserve the full key including base64url part', () => {
      const key = `fb_live_${generateBase64Url(32)}`;
      const result = SDKKey.create(key);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(key);
      }
    });
  });
});
