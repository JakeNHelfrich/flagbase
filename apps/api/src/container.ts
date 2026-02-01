import {
  createDb,
  type Database,
  projects,
  environments,
  flags,
  flagEnvironmentConfigs,
  sdkKeys,
  users,
  sessions,
} from '@flagbase/database';
import { config } from './config/index.js';
import {
  PostgresProjectRepository,
  PostgresEnvironmentRepository,
  PostgresFlagRepository,
  PostgresFlagConfigRepository,
  PostgresSDKKeyRepository,
  PostgresUserRepository,
  PostgresSessionRepository,
  type ProjectRepository,
  type EnvironmentRepository,
  type FlagRepository,
  type FlagConfigRepository,
  type SDKKeyRepository,
  type UserRepository,
  type SessionRepository,
} from './repositories/index.js';
import {
  AuthService,
  ProjectService,
  EnvironmentService,
  FlagService,
  SDKKeyService,
  SDKEvaluationService,
} from './services/index.js';
import pino from 'pino';

export interface Container {
  // Database
  db: Database;

  // Repositories
  projectRepo: ProjectRepository;
  environmentRepo: EnvironmentRepository;
  flagRepo: FlagRepository;
  flagConfigRepo: FlagConfigRepository;
  sdkKeyRepo: SDKKeyRepository;
  userRepo: UserRepository;
  sessionRepo: SessionRepository;

  // Services
  authService: AuthService;
  projectService: ProjectService;
  environmentService: EnvironmentService;
  flagService: FlagService;
  sdkKeyService: SDKKeyService;
  sdkEvaluationService: SDKEvaluationService;

  // Logger
  logger: pino.Logger;
}

export function createContainer(): Container {
  // Create logger
  const loggerOptions: pino.LoggerOptions = {
    level: config.LOG_LEVEL,
  };

  if (config.NODE_ENV === 'development') {
    loggerOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    };
  }

  const logger = pino(loggerOptions);

  // Create database connection
  const db = createDb(config.DATABASE_URL);

  // Create repositories
  const projectRepo = new PostgresProjectRepository(db, projects);
  const environmentRepo = new PostgresEnvironmentRepository(db, environments);
  const flagRepo = new PostgresFlagRepository(db, flags);
  const flagConfigRepo = new PostgresFlagConfigRepository(db, flagEnvironmentConfigs);
  const sdkKeyRepo = new PostgresSDKKeyRepository(db, sdkKeys);
  const userRepo = new PostgresUserRepository(db, users);
  const sessionRepo = new PostgresSessionRepository(db, sessions);

  // Create services
  const authService = new AuthService(userRepo, sessionRepo);
  const projectService = new ProjectService(projectRepo);
  const environmentService = new EnvironmentService(environmentRepo, flagRepo, flagConfigRepo);
  const flagService = new FlagService(flagRepo, flagConfigRepo, environmentRepo);
  const sdkKeyService = new SDKKeyService(sdkKeyRepo);
  const sdkEvaluationService = new SDKEvaluationService(flagRepo, flagConfigRepo);

  return {
    db,
    projectRepo,
    environmentRepo,
    flagRepo,
    flagConfigRepo,
    sdkKeyRepo,
    userRepo,
    sessionRepo,
    authService,
    projectService,
    environmentService,
    flagService,
    sdkKeyService,
    sdkEvaluationService,
    logger,
  };
}
