import type { Result, FlagEnvironmentConfig, FlagValue, TargetingRule, ErrorCode } from '@flagbase/types';

export interface FlagConfigRepository {
  findById(id: string): Promise<Result<FlagEnvironmentConfig | null, ErrorCode>>;
  findByFlagIdAndEnvironmentId(flagId: string, environmentId: string): Promise<Result<FlagEnvironmentConfig | null, ErrorCode>>;
  findAllByFlagId(flagId: string): Promise<Result<FlagEnvironmentConfig[], ErrorCode>>;
  create(data: {
    flagId: string;
    environmentId: string;
    enabled?: boolean;
    value: FlagValue;
    targetingRules?: TargetingRule[];
  }): Promise<Result<FlagEnvironmentConfig, ErrorCode>>;
  update(id: string, data: {
    enabled?: boolean;
    value?: FlagValue;
    targetingRules?: TargetingRule[];
  }): Promise<Result<FlagEnvironmentConfig, ErrorCode>>;
  createManyForFlag(flagId: string, environmentIds: string[], defaultValue: FlagValue): Promise<Result<FlagEnvironmentConfig[], ErrorCode>>;
}
