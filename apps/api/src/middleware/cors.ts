import { cors } from 'hono/cors';
import { isDevelopment } from '../config/index.js';

export function createCorsMiddleware() {
  return cors({
    origin: isDevelopment() ? '*' : ['http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  });
}
