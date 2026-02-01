import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { createAuthRoutes } from './auth.js';
import { createProjectRoutes } from './projects.js';
import { createEnvironmentRoutes } from './environments.js';
import { createFlagRoutes } from './flags.js';
import { createSDKKeyRoutes } from './sdk-keys.js';
import { createSDKRoutes } from './sdk.js';

export function createV1Routes(container: Container) {
  const app = new Hono();

  // Auth routes
  app.route('/auth', createAuthRoutes(container));

  // Project routes
  app.route('/projects', createProjectRoutes(container));

  // Environment routes (nested under projects)
  app.route('/projects/:projectId/environments', createEnvironmentRoutes(container));

  // Flag routes (nested under projects)
  app.route('/projects/:projectId/flags', createFlagRoutes(container));

  // SDK key routes (both nested and top-level)
  app.route('/', createSDKKeyRoutes(container));

  // SDK evaluation routes
  app.route('/sdk', createSDKRoutes(container));

  return app;
}
