import { Result, ok, err } from '@flagbase/types';

/**
 * SDK Key type - either live (for production use) or test (for testing)
 */
export type SDKKeyType = 'live' | 'test';

/**
 * Pattern for valid SDK keys:
 * - Format: fb_{live|test}_{base64url}
 * - Prefix: "fb_"
 * - Type: "live" or "test"
 * - Separator: "_"
 * - Base64URL encoded string: at least 16 characters
 * - Base64URL characters: A-Z, a-z, 0-9, -, _
 */
const SDK_KEY_PATTERN = /^fb_(live|test)_[A-Za-z0-9_-]{16,}$/;

/**
 * SDKKey value object representing an SDK authentication key.
 * Format: fb_{live|test}_{base64url}
 * Immutable and validated on creation.
 */
export class SDKKey {
  private constructor(private readonly value: string) {}

  /**
   * Creates a new SDKKey from a string value.
   * @param value - The string value to create an SDKKey from
   * @returns A Result containing either a valid SDKKey or an Error
   */
  static create(value: string): Result<SDKKey, Error> {
    if (typeof value !== 'string') {
      return err(new Error('SDK key must be a string'));
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return err(new Error('SDK key cannot be empty'));
    }

    if (!trimmed.startsWith('fb_')) {
      return err(new Error('SDK key must start with "fb_" prefix'));
    }

    const parts = trimmed.split('_');
    if (parts.length < 3) {
      return err(
        new Error('SDK key must be in format: fb_{live|test}_{base64url}')
      );
    }

    const keyType = parts[1];
    if (keyType !== 'live' && keyType !== 'test') {
      return err(
        new Error('SDK key type must be either "live" or "test"')
      );
    }

    // The base64url part is everything after "fb_{type}_"
    const base64Part = parts.slice(2).join('_');
    if (base64Part.length < 16) {
      return err(
        new Error('SDK key base64url portion must be at least 16 characters')
      );
    }

    if (!SDK_KEY_PATTERN.test(trimmed)) {
      return err(
        new Error(
          'SDK key contains invalid characters. Base64URL portion can only contain letters, numbers, hyphens, and underscores'
        )
      );
    }

    return ok(new SDKKey(trimmed));
  }

  /**
   * Extracts and returns the type of the SDK key.
   * @returns 'live' for production keys or 'test' for testing keys
   */
  getType(): SDKKeyType {
    const parts = this.value.split('_');
    return parts[1] as SDKKeyType;
  }

  /**
   * Returns the string representation of the SDKKey.
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks equality with another SDKKey.
   * @param other - The SDKKey to compare with
   * @returns true if both SDKKeys have the same value
   */
  equals(other: SDKKey): boolean {
    return this.value === other.value;
  }
}
