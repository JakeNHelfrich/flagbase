import { Result, ok, err } from '@flagbase/types';

/**
 * Pattern for valid flag keys:
 * - Must start with a lowercase letter
 * - Can contain lowercase letters, numbers, and hyphens
 * - Must be between 2 and 64 characters total
 */
const FLAG_KEY_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

/**
 * FlagKey value object representing a unique identifier for a feature flag.
 * Immutable and validated on creation.
 */
export class FlagKey {
  private constructor(private readonly value: string) {}

  /**
   * Creates a new FlagKey from a string value.
   * @param value - The string value to create a FlagKey from
   * @returns A Result containing either a valid FlagKey or an Error
   */
  static create(value: string): Result<FlagKey, Error> {
    if (typeof value !== 'string') {
      return err(new Error('Flag key must be a string'));
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return err(new Error('Flag key cannot be empty'));
    }

    if (trimmed.length < 2) {
      return err(new Error('Flag key must be at least 2 characters long'));
    }

    if (trimmed.length > 64) {
      return err(new Error('Flag key cannot exceed 64 characters'));
    }

    if (!/^[a-z]/.test(trimmed)) {
      return err(new Error('Flag key must start with a lowercase letter'));
    }

    if (!FLAG_KEY_PATTERN.test(trimmed)) {
      return err(
        new Error(
          'Flag key can only contain lowercase letters, numbers, and hyphens'
        )
      );
    }

    return ok(new FlagKey(trimmed));
  }

  /**
   * Returns the string representation of the FlagKey.
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks equality with another FlagKey.
   * @param other - The FlagKey to compare with
   * @returns true if both FlagKeys have the same value
   */
  equals(other: FlagKey): boolean {
    return this.value === other.value;
  }
}
