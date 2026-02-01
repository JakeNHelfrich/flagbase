import { describe, it, expect } from 'vitest';
import {
  calculatePercentageBucket,
  isInPercentage,
} from '../../evaluator/percentage-calculator.js';

describe('PercentageCalculator', () => {
  // ============================================================================
  // calculatePercentageBucket
  // ============================================================================

  describe('calculatePercentageBucket', () => {
    describe('return value range', () => {
      it('should return a value between 0 and 99 inclusive', () => {
        const testCases = [
          { flagKey: 'test-flag', userId: 'user-1' },
          { flagKey: 'test-flag', userId: 'user-2' },
          { flagKey: 'another-flag', userId: 'user-1' },
          { flagKey: 'flag-with-long-name', userId: 'user-with-long-id-12345' },
          { flagKey: 'a', userId: 'b' },
        ];

        for (const { flagKey, userId } of testCases) {
          const bucket = calculatePercentageBucket(flagKey, userId);
          expect(bucket).toBeGreaterThanOrEqual(0);
          expect(bucket).toBeLessThanOrEqual(99);
        }
      });

      it('should return an integer', () => {
        const bucket = calculatePercentageBucket('test-flag', 'user-123');
        expect(Number.isInteger(bucket)).toBe(true);
      });

      it('should always return a number', () => {
        const bucket = calculatePercentageBucket('flag', 'user');
        expect(typeof bucket).toBe('number');
        expect(Number.isNaN(bucket)).toBe(false);
      });
    });

    describe('determinism', () => {
      it('should return the same bucket for the same inputs', () => {
        const flagKey = 'feature-flag';
        const userId = 'user-12345';

        const bucket1 = calculatePercentageBucket(flagKey, userId);
        const bucket2 = calculatePercentageBucket(flagKey, userId);
        const bucket3 = calculatePercentageBucket(flagKey, userId);

        expect(bucket1).toBe(bucket2);
        expect(bucket2).toBe(bucket3);
      });

      it('should return consistent results across many calls', () => {
        const flagKey = 'test-flag';
        const userId = 'consistent-user';
        const expectedBucket = calculatePercentageBucket(flagKey, userId);

        for (let i = 0; i < 100; i++) {
          expect(calculatePercentageBucket(flagKey, userId)).toBe(expectedBucket);
        }
      });

      it('should produce different buckets for different users', () => {
        const flagKey = 'test-flag';
        const buckets = new Set<number>();

        // With enough different users, we should get different buckets
        for (let i = 0; i < 100; i++) {
          const bucket = calculatePercentageBucket(flagKey, `user-${i}`);
          buckets.add(bucket);
        }

        // Should have more than 1 unique bucket (very likely to have many different ones)
        expect(buckets.size).toBeGreaterThan(1);
      });

      it('should produce different buckets for the same user across different flags', () => {
        const userId = 'user-123';
        const bucket1 = calculatePercentageBucket('flag-a', userId);
        const bucket2 = calculatePercentageBucket('flag-b', userId);

        // While it's possible for these to be equal by chance, it's unlikely
        // We're mainly testing that the flag key is part of the hash
        // Let's test with a larger sample to ensure variation
        const buckets = new Set<number>();
        for (let i = 0; i < 50; i++) {
          buckets.add(calculatePercentageBucket(`flag-${i}`, userId));
        }

        expect(buckets.size).toBeGreaterThan(1);
      });
    });

    describe('distribution', () => {
      it('should produce a reasonably uniform distribution', () => {
        const flagKey = 'distribution-test';
        const numUsers = 10000;
        const bucketCounts = new Array(100).fill(0);

        for (let i = 0; i < numUsers; i++) {
          const bucket = calculatePercentageBucket(flagKey, `user-${i}`);
          bucketCounts[bucket]++;
        }

        // Each bucket should have roughly 100 users (10000/100)
        // Allow for some variance: each bucket should have between 50 and 150 users
        const expectedAverage = numUsers / 100;
        const minAllowed = expectedAverage * 0.5;
        const maxAllowed = expectedAverage * 1.5;

        for (let i = 0; i < 100; i++) {
          expect(bucketCounts[i]).toBeGreaterThan(minAllowed);
          expect(bucketCounts[i]).toBeLessThan(maxAllowed);
        }
      });

      it('should distribute users roughly 50/50 for 50% rollout', () => {
        const flagKey = 'fifty-fifty';
        const numUsers = 10000;
        let inRollout = 0;

        for (let i = 0; i < numUsers; i++) {
          const bucket = calculatePercentageBucket(flagKey, `user-${i}`);
          if (bucket < 50) {
            inRollout++;
          }
        }

        // Should be roughly 50% (between 45% and 55%)
        const percentage = (inRollout / numUsers) * 100;
        expect(percentage).toBeGreaterThan(45);
        expect(percentage).toBeLessThan(55);
      });
    });

    describe('edge cases', () => {
      it('should handle empty userId', () => {
        const bucket = calculatePercentageBucket('flag', '');
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThanOrEqual(99);
      });

      it('should handle empty flagKey', () => {
        const bucket = calculatePercentageBucket('', 'user');
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThanOrEqual(99);
      });

      it('should handle special characters in inputs', () => {
        const specialCases = [
          { flagKey: 'flag-with-dash', userId: 'user@email.com' },
          { flagKey: 'flag_with_underscore', userId: 'user+tag' },
          { flagKey: 'flag.with.dots', userId: 'user/path' },
          { flagKey: 'flag:with:colons', userId: 'user#hash' },
        ];

        for (const { flagKey, userId } of specialCases) {
          const bucket = calculatePercentageBucket(flagKey, userId);
          expect(bucket).toBeGreaterThanOrEqual(0);
          expect(bucket).toBeLessThanOrEqual(99);
        }
      });

      it('should handle unicode characters', () => {
        const bucket = calculatePercentageBucket('flag', 'user-cafe');
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThanOrEqual(99);
      });

      it('should handle very long inputs', () => {
        const longFlagKey = 'f'.repeat(1000);
        const longUserId = 'u'.repeat(1000);
        const bucket = calculatePercentageBucket(longFlagKey, longUserId);
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThanOrEqual(99);
      });
    });
  });

  // ============================================================================
  // isInPercentage
  // ============================================================================

  describe('isInPercentage', () => {
    describe('basic functionality', () => {
      it('should return true when bucket is less than percentage', () => {
        // If percentage is 50, buckets 0-49 should be included
        const flagKey = 'test-flag';

        // Find a user that falls in a low bucket
        let foundLowBucketUser = false;
        for (let i = 0; i < 1000; i++) {
          const userId = `user-${i}`;
          const bucket = calculatePercentageBucket(flagKey, userId);
          if (bucket < 50) {
            expect(isInPercentage(flagKey, userId, 50)).toBe(true);
            foundLowBucketUser = true;
            break;
          }
        }
        expect(foundLowBucketUser).toBe(true);
      });

      it('should return false when bucket is greater than or equal to percentage', () => {
        const flagKey = 'test-flag';

        // Find a user that falls in a high bucket
        let foundHighBucketUser = false;
        for (let i = 0; i < 1000; i++) {
          const userId = `user-${i}`;
          const bucket = calculatePercentageBucket(flagKey, userId);
          if (bucket >= 50) {
            expect(isInPercentage(flagKey, userId, 50)).toBe(false);
            foundHighBucketUser = true;
            break;
          }
        }
        expect(foundHighBucketUser).toBe(true);
      });
    });

    describe('edge cases - 0% rollout', () => {
      it('should always return false for 0% rollout', () => {
        const flagKey = 'zero-percent-flag';
        const userIds = ['user-1', 'user-2', 'user-100', 'user-abc', 'admin@test.com'];

        for (const userId of userIds) {
          expect(isInPercentage(flagKey, userId, 0)).toBe(false);
        }
      });

      it('should return false for 0% even with many users', () => {
        const flagKey = 'zero-percent';
        for (let i = 0; i < 100; i++) {
          expect(isInPercentage(flagKey, `user-${i}`, 0)).toBe(false);
        }
      });
    });

    describe('edge cases - 100% rollout', () => {
      it('should always return true for 100% rollout', () => {
        const flagKey = 'hundred-percent-flag';
        const userIds = ['user-1', 'user-2', 'user-100', 'user-abc', 'admin@test.com'];

        for (const userId of userIds) {
          expect(isInPercentage(flagKey, userId, 100)).toBe(true);
        }
      });

      it('should return true for 100% even with many users', () => {
        const flagKey = 'hundred-percent';
        for (let i = 0; i < 100; i++) {
          expect(isInPercentage(flagKey, `user-${i}`, 100)).toBe(true);
        }
      });
    });

    describe('edge cases - 50% rollout', () => {
      it('should include roughly half the users', () => {
        const flagKey = 'half-rollout';
        let includedCount = 0;
        const totalUsers = 1000;

        for (let i = 0; i < totalUsers; i++) {
          if (isInPercentage(flagKey, `user-${i}`, 50)) {
            includedCount++;
          }
        }

        // Should be roughly 50% (between 45% and 55%)
        const percentage = (includedCount / totalUsers) * 100;
        expect(percentage).toBeGreaterThan(45);
        expect(percentage).toBeLessThan(55);
      });
    });

    describe('various percentages', () => {
      it('should correctly handle 1% rollout', () => {
        const flagKey = 'one-percent';
        let includedCount = 0;
        const totalUsers = 10000;

        for (let i = 0; i < totalUsers; i++) {
          if (isInPercentage(flagKey, `user-${i}`, 1)) {
            includedCount++;
          }
        }

        // Should be roughly 1% (between 0.5% and 2%)
        const percentage = (includedCount / totalUsers) * 100;
        expect(percentage).toBeGreaterThan(0.5);
        expect(percentage).toBeLessThan(2);
      });

      it('should correctly handle 99% rollout', () => {
        const flagKey = 'ninety-nine-percent';
        let includedCount = 0;
        const totalUsers = 10000;

        for (let i = 0; i < totalUsers; i++) {
          if (isInPercentage(flagKey, `user-${i}`, 99)) {
            includedCount++;
          }
        }

        // Should be roughly 99% (between 98% and 100%)
        const percentage = (includedCount / totalUsers) * 100;
        expect(percentage).toBeGreaterThan(98);
        expect(percentage).toBeLessThanOrEqual(100);
      });

      it('should correctly handle 25% rollout', () => {
        const flagKey = 'quarter';
        let includedCount = 0;
        const totalUsers = 4000;

        for (let i = 0; i < totalUsers; i++) {
          if (isInPercentage(flagKey, `user-${i}`, 25)) {
            includedCount++;
          }
        }

        // Should be roughly 25% (between 22% and 28%)
        const percentage = (includedCount / totalUsers) * 100;
        expect(percentage).toBeGreaterThan(22);
        expect(percentage).toBeLessThan(28);
      });

      it('should correctly handle 75% rollout', () => {
        const flagKey = 'three-quarters';
        let includedCount = 0;
        const totalUsers = 4000;

        for (let i = 0; i < totalUsers; i++) {
          if (isInPercentage(flagKey, `user-${i}`, 75)) {
            includedCount++;
          }
        }

        // Should be roughly 75% (between 72% and 78%)
        const percentage = (includedCount / totalUsers) * 100;
        expect(percentage).toBeGreaterThan(72);
        expect(percentage).toBeLessThan(78);
      });
    });

    describe('determinism for isInPercentage', () => {
      it('should return consistent results for the same inputs', () => {
        const flagKey = 'determinism-test';
        const userId = 'stable-user';
        const percentage = 50;

        const result1 = isInPercentage(flagKey, userId, percentage);
        const result2 = isInPercentage(flagKey, userId, percentage);
        const result3 = isInPercentage(flagKey, userId, percentage);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });

      it('should maintain stable cohorts when percentage increases', () => {
        const flagKey = 'cohort-stability';
        const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);

        // Users included at 30% should also be included at 50%
        const includedAt30 = users.filter((u) => isInPercentage(flagKey, u, 30));
        const includedAt50 = users.filter((u) => isInPercentage(flagKey, u, 50));

        for (const user of includedAt30) {
          expect(includedAt50).toContain(user);
        }
      });

      it('should maintain stable cohorts - users never drop out as percentage increases', () => {
        const flagKey = 'monotonic-test';
        const userId = 'test-user-123';

        // Find the first percentage where user is included
        let firstIncludedAt = -1;
        for (let p = 1; p <= 100; p++) {
          if (isInPercentage(flagKey, userId, p)) {
            firstIncludedAt = p;
            break;
          }
        }

        // User should remain included for all higher percentages
        if (firstIncludedAt > 0) {
          for (let p = firstIncludedAt; p <= 100; p++) {
            expect(isInPercentage(flagKey, userId, p)).toBe(true);
          }
        }
      });
    });

    describe('missing userId', () => {
      it('should handle empty userId gracefully', () => {
        // When no userId is provided, should still return a consistent result
        const result = isInPercentage('flag', '', 50);
        expect(typeof result).toBe('boolean');
      });

      it('should return false for 0% even with empty userId', () => {
        expect(isInPercentage('flag', '', 0)).toBe(false);
      });

      it('should return true for 100% even with empty userId', () => {
        expect(isInPercentage('flag', '', 100)).toBe(true);
      });
    });
  });
});
