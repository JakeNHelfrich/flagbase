// Result type utilities
export {
  type Result,
  ok,
  err,
  isOk,
  isErr,
} from './result.js';

// Entity types
export {
  type FlagType,
  type FlagValue,
  type Flag,
  type FlagEnvironmentConfig,
  type TargetingRule,
  type ConditionOperator,
  type Condition,
  type Project,
  type Environment,
  type User,
  type Session,
  type SDKKeyType,
  type SDKKey,
  type EvaluationContext,
  type EvaluationReason,
  type EvaluationResult,
} from './entities.js';

// Error types
export { ErrorCode, type ErrorResponse } from './errors.js';

// API types
export {
  // Pagination
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResponse,
  // Auth
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  // Projects
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type ProjectResponse,
  type ListProjectsResponse,
  // Environments
  type CreateEnvironmentRequest,
  type UpdateEnvironmentRequest,
  type EnvironmentResponse,
  type ListEnvironmentsResponse,
  // Flags
  type CreateFlagRequest,
  type UpdateFlagRequest,
  type FlagResponse,
  type ListFlagsResponse,
  type FlagWithConfigs,
  // Flag Configs
  type UpdateFlagConfigRequest,
  type FlagConfigResponse,
  // SDK Keys
  type CreateSDKKeyRequest,
  type CreateSDKKeyResponse,
  type SDKKeyResponse,
  type ListSDKKeysResponse,
  // Evaluation
  type EvaluateFlagRequest,
  type EvaluateFlagResponse,
  type EvaluateAllFlagsRequest,
  type EvaluateAllFlagsResponse,
  // User
  type GetCurrentUserResponse,
  type UpdateCurrentUserRequest,
  type ChangePasswordRequest,
} from './api.js';
