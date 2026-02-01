import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createContainer } from './container.js';
import { config } from './config/index.js';

const container = createContainer();
const app = createApp(container);
const { logger } = container;

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    logger.info(`Server running at http://localhost:${info.port}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`API available at http://localhost:${info.port}/api/v1`);
  }
);
