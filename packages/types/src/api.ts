import type {
  Flag,
  FlagValue,
  FlagType,
  FlagEnvironmentConfig,
  TargetingRule,
  Project,
  Environment,
  User,
  SDKKey,
  SDKKeyType,
  EvaluationContext,
  EvaluationResult,
} from './entities.js';

// ============================================================================
// Pagination
// ============================================================================

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata in list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Auth API
// ============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response with session token
 */
export interface LoginResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: Omit<User, 'passwordHash'>;
}

// ============================================================================
// Project API
// ============================================================================

/**
 * Create project request
 */
export interface CreateProjectRequest {
  key: string;
  name: string;
  description?: string;
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
}

/**
 * Project response (same as entity)
 */
export type ProjectResponse = Project;

/**
 * List projects response
 */
export type ListProjectsResponse = PaginatedResponse<Project>;

// ============================================================================
// Environment API
// ============================================================================

/**
 * Create environment request
 */
export interface CreateEnvironmentRequest {
  key: string;
  name: string;
  description?: string;
}

/**
 * Update environment request
 */
export interface UpdateEnvironmentRequest {
  name?: string;
  description?: string | null;
}

/**
 * Environment response (same as entity)
 */
export type EnvironmentResponse = Environment;

/**
 * List environments response
 */
export type ListEnvironmentsResponse = PaginatedResponse<Environment>;

// ============================================================================
// Flag API
// ============================================================================

/**
 * Create flag request
 */
export interface CreateFlagRequest {
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  defaultValue: FlagValue;
}

/**
 * Update flag request
 */
export interface UpdateFlagRequest {
  name?: string;
  description?: string | null;
  defaultValue?: FlagValue;
}

/**
 * Flag response (same as entity)
 */
export type FlagResponse = Flag;

/**
 * List flags response
 */
export type ListFlagsResponse = PaginatedResponse<Flag>;

/**
 * Flag with environment configurations
 */
export interface FlagWithConfigs extends Flag {
  configs: FlagEnvironmentConfig[];
}

// ============================================================================
// Flag Environment Config API
// ============================================================================

/**
 * Update flag environment config request
 */
export interface UpdateFlagConfigRequest {
  enabled?: boolean;
  value?: FlagValue;
  targetingRules?: TargetingRule[];
}

/**
 * Flag environment config response
 */
export type FlagConfigResponse = FlagEnvironmentConfig;

// ============================================================================
// SDK Key API
// ============================================================================

/**
 * Create SDK key request
 */
export interface CreateSDKKeyRequest {
  name: string;
  type: SDKKeyType;
}

/**
 * Create SDK key response - includes the full key (only returned on creation)
 */
export interface CreateSDKKeyResponse {
  sdkKey: SDKKey;
  key: string; // Full key - only returned on creation
}

/**
 * SDK key response (without the actual key)
 */
export type SDKKeyResponse = SDKKey;

/**
 * List SDK keys response
 */
export type ListSDKKeysResponse = PaginatedResponse<SDKKey>;

// ============================================================================
// Evaluation API (SDK endpoints)
// ============================================================================

/**
 * Evaluate single flag request
 */
export interface EvaluateFlagRequest {
  flagKey: string;
  context?: EvaluationContext;
}

/**
 * Evaluate single flag response
 */
export type EvaluateFlagResponse = EvaluationResult;

/**
 * Evaluate all flags request
 */
export interface EvaluateAllFlagsRequest {
  context?: EvaluationContext;
}

/**
 * Evaluate all flags response
 */
export interface EvaluateAllFlagsResponse {
  flags: EvaluationResult[];
}

// ============================================================================
// User API
// ============================================================================

/**
 * Get current user response
 */
export type GetCurrentUserResponse = Omit<User, 'passwordHash'>;

/**
 * Update current user request
 */
export interface UpdateCurrentUserRequest {
  name?: string;
  email?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
