/**
 * Simple deterministic string hash function
 * Uses djb2 algorithm for consistent hashing across platforms
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode
    hash = (hash << 5) + hash + str.charCodeAt(i);
    // Keep as 32-bit integer
    hash = hash >>> 0;
  }
  return hash;
}

/**
 * Calculates a deterministic percentage bucket (0-99) for a given flag key and identifier
 * The same flag key + identifier combination will always return the same bucket
 *
 * @param flagKey - The unique key of the feature flag
 * @param identifier - The user identifier (usually userId)
 * @returns A number between 0 and 99 (inclusive)
 */
export function calculatePercentageBucket(
  flagKey: string,
  identifier: string
): number {
  const combined = `${flagKey}:${identifier}`;
  const hash = hashString(combined);
  return hash % 100;
}

/**
 * Determines if a user is included in a percentage rollout
 *
 * @param flagKey - The unique key of the feature flag
 * @param identifier - The user identifier (usually userId)
 * @param percentage - The rollout percentage (0-100)
 * @returns true if the user should receive the rollout value
 */
export function isInPercentage(
  flagKey: string,
  identifier: string,
  percentage: number
): boolean {
  if (percentage <= 0) {
    return false;
  }
  if (percentage >= 100) {
    return true;
  }

  const bucket = calculatePercentageBucket(flagKey, identifier);
  return bucket < percentage;
}
