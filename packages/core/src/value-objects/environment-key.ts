import { Result, ok, err } from '@flagbase/types';

/**
 * Pattern for valid environment keys:
 * - Must start with a lowercase letter
 * - Can contain lowercase letters, numbers, and hyphens
 * - Must be between 2 and 64 characters total
 */
const ENVIRONMENT_KEY_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

/**
 * EnvironmentKey value object representing a unique identifier for an environment.
 * Immutable and validated on creation.
 */
export class EnvironmentKey {
  private constructor(private readonly value: string) {}

  /**
   * Creates a new EnvironmentKey from a string value.
   * @param value - The string value to create an EnvironmentKey from
   * @returns A Result containing either a valid EnvironmentKey or an Error
   */
  static create(value: string): Result<EnvironmentKey, Error> {
    if (typeof value !== 'string') {
      return err(new Error('Environment key must be a string'));
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return err(new Error('Environment key cannot be empty'));
    }

    if (trimmed.length < 2) {
      return err(new Error('Environment key must be at least 2 characters long'));
    }

    if (trimmed.length > 64) {
      return err(new Error('Environment key cannot exceed 64 characters'));
    }

    if (!/^[a-z]/.test(trimmed)) {
      return err(new Error('Environment key must start with a lowercase letter'));
    }

    if (!ENVIRONMENT_KEY_PATTERN.test(trimmed)) {
      return err(
        new Error(
          'Environment key can only contain lowercase letters, numbers, and hyphens'
        )
      );
    }

    return ok(new EnvironmentKey(trimmed));
  }

  /**
   * Returns the string representation of the EnvironmentKey.
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks equality with another EnvironmentKey.
   * @param other - The EnvironmentKey to compare with
   * @returns true if both EnvironmentKeys have the same value
   */
  equals(other: EnvironmentKey): boolean {
    return this.value === other.value;
  }
}
