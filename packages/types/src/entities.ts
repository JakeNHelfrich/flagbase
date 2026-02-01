// ============================================================================
// Flag Types
// ============================================================================

/**
 * Supported flag value types
 */
export type FlagType = 'boolean' | 'string' | 'number' | 'json';

/**
 * Possible values a flag can hold
 */
export type FlagValue = boolean | string | number | Record<string, unknown>;

/**
 * A feature flag definition
 */
export interface Flag {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  type: FlagType;
  defaultValue: FlagValue;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Environment-specific configuration for a flag
 */
export interface FlagEnvironmentConfig {
  id: string;
  flagId: string;
  environmentId: string;
  enabled: boolean;
  value: FlagValue;
  targetingRules: TargetingRule[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A targeting rule that determines flag values for specific users
 */
export interface TargetingRule {
  id: string;
  name: string;
  conditions: Condition[];
  percentage: number; // 0-100
  value: FlagValue;
  priority: number;
}

/**
 * Operators for targeting rule conditions
 */
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in';

/**
 * A single condition within a targeting rule
 */
export interface Condition {
  attribute: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

// ============================================================================
// Project
// ============================================================================

/**
 * A project that contains flags and environments
 */
export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Environment
// ============================================================================

/**
 * An environment within a project (e.g., development, staging, production)
 */
export interface Environment {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// User
// ============================================================================

/**
 * A user of the Flagbase dashboard
 */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Session
// ============================================================================

/**
 * An authenticated user session
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// SDK Key
// ============================================================================

/**
 * Type of SDK key - live for production, test for development
 */
export type SDKKeyType = 'live' | 'test';

/**
 * An SDK key used for authenticating SDK requests
 */
export interface SDKKey {
  id: string;
  projectId: string;
  environmentId: string;
  name: string;
  keyHash: string; // Store only hash
  keyPrefix: string; // Store prefix for display (e.g., "fb_live_abc...")
  type: SDKKeyType;
  createdAt: Date;
  revokedAt: Date | null;
}

// ============================================================================
// Evaluation
// ============================================================================

/**
 * Context provided during flag evaluation
 */
export interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * The reason a particular flag value was returned
 */
export type EvaluationReason =
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'PERCENTAGE_ROLLOUT'
  | 'DISABLED'
  | 'FLAG_NOT_FOUND';

/**
 * Result of evaluating a flag for a given context
 */
export interface EvaluationResult {
  flagKey: string;
  value: FlagValue;
  reason: EvaluationReason;
}
