import {
  createDb,
  type Database,
  projects,
  environments,
  flags,
  flagEnvironmentConfigs,
  sdkKeys,
} from '@flagbase/database';
import { config } from './config/index.js';
import {
  PostgresProjectRepository,
  PostgresEnvironmentRepository,
  PostgresFlagRepository,
  PostgresFlagConfigRepository,
  PostgresSDKKeyRepository,
  type ProjectRepository,
  type EnvironmentRepository,
  type FlagRepository,
  type FlagConfigRepository,
  type SDKKeyRepository,
} from './repositories/index.js';
import {
  ProjectService,
  EnvironmentService,
  FlagService,
  SDKKeyService,
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

  // Services
  projectService: ProjectService;
  environmentService: EnvironmentService;
  flagService: FlagService;
  sdkKeyService: SDKKeyService;

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

  // Create services
  const projectService = new ProjectService(projectRepo);
  const environmentService = new EnvironmentService(environmentRepo, flagRepo, flagConfigRepo);
  const flagService = new FlagService(flagRepo, flagConfigRepo, environmentRepo);
  const sdkKeyService = new SDKKeyService(sdkKeyRepo);

  return {
    db,
    projectRepo,
    environmentRepo,
    flagRepo,
    flagConfigRepo,
    sdkKeyRepo,
    projectService,
    environmentService,
    flagService,
    sdkKeyService,
    logger,
  };
}
