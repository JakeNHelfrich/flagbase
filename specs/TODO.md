# Flagbase MVP Implementation Plan

## Overview

Implementation order follows dependency chain:
1. **Foundation** - Monorepo setup, database schema, shared types
2. **Core Domain** - Flag evaluation engine, business logic
3. **API Layer** - REST endpoints for dashboard & SDK
4. **Authentication** - User auth + SDK key management
5. **Web Dashboard** - Management UI

---

## Phase 1: Foundation

### 1.1 Monorepo Setup
- [ ] Initialize pnpm workspace with `pnpm-workspace.yaml`
- [ ] Configure Turborepo (`turbo.json`) for build/test/lint pipelines
- [ ] Create shared tsconfig (`packages/config/tsconfig.base.json`)
- [ ] Create shared ESLint config (`packages/config/eslint.config.js`)
- [ ] Setup Vitest workspace configuration

### 1.2 Shared Types Package (`packages/types`)
- [ ] Define `Result<T, E>` type with `ok()` and `err()` helpers
- [ ] Define core entity interfaces:
  - `Flag`, `FlagValue`, `FlagType`
  - `Project`
  - `Environment`
  - `FlagEnvironmentConfig`
  - `TargetingRule`, `Condition`
  - `EvaluationContext`, `EvaluationResult`
- [ ] Define API request/response types
- [ ] Define error code enums

### 1.3 Database Package (`packages/database`)
- [ ] Setup Drizzle ORM with PostgreSQL
- [ ] Create schema tables:
  - `users` - user accounts
  - `projects` - top-level organization
  - `environments` - dev/staging/prod per project
  - `flags` - feature flag definitions
  - `flag_environment_configs` - per-environment flag settings
  - `sdk_keys` - API keys for SDK access
  - `sessions` - user sessions
- [ ] Create initial migration
- [ ] Setup `drizzle-kit` for migration generation
- [ ] Add seed script for development data

### 1.4 Docker Setup
- [ ] Create `docker/docker-compose.yml` with PostgreSQL + Redis
- [ ] Create `docker/docker-compose.test.yml` for integration tests
- [ ] Add `.env.example` with required variables

---

## Phase 2: Core Domain (`packages/core`)

### 2.1 Value Objects
- [ ] `FlagKey` - validated flag key (lowercase, hyphens, 2-64 chars)
- [ ] `ProjectKey` - validated project key
- [ ] `EnvironmentKey` - validated environment key
- [ ] `SDKKey` - validated SDK key format

### 2.2 Domain Services
- [ ] `FlagEvaluator` - core evaluation logic
  - [ ] Boolean flag evaluation
  - [ ] Targeting rule matching (conditions)
  - [ ] Percentage rollout calculation (deterministic hash)
  - [ ] Kill switch handling (enabled/disabled)
  - [ ] Default value fallback
- [ ] Unit tests for all evaluation scenarios

### 2.3 Port Interfaces
- [ ] `FlagRepository` - flag CRUD operations
- [ ] `ProjectRepository` - project CRUD operations
- [ ] `EnvironmentRepository` - environment CRUD operations
- [ ] `SDKKeyRepository` - SDK key management
- [ ] `UserRepository` - user management
- [ ] `SessionRepository` - session management

### 2.4 Use Cases
- [ ] **Flags**
  - [ ] `CreateFlag`
  - [ ] `UpdateFlag`
  - [ ] `DeleteFlag`
  - [ ] `GetFlag`
  - [ ] `ListFlags`
  - [ ] `UpdateFlagEnvironmentConfig`
- [ ] **Projects**
  - [ ] `CreateProject`
  - [ ] `UpdateProject`
  - [ ] `DeleteProject`
  - [ ] `ListProjects`
- [ ] **Environments**
  - [ ] `CreateEnvironment`
  - [ ] `ListEnvironments`
- [ ] **SDK**
  - [ ] `EvaluateFlags` - bulk evaluation for SDK
  - [ ] `EvaluateSingleFlag`
- [ ] **SDK Keys**
  - [ ] `CreateSDKKey`
  - [ ] `RevokeSDKKey`
  - [ ] `ListSDKKeys`

---

## Phase 3: API Service (`apps/api`)

### 3.1 Setup
- [ ] Initialize Hono app with TypeScript
- [ ] Setup Zod validation middleware
- [ ] Setup error handling middleware
- [ ] Setup request logging (pino)
- [ ] Setup CORS configuration
- [ ] Create config loader with Zod schema

### 3.2 Repository Implementations
- [ ] `PostgresFlagRepository`
- [ ] `PostgresProjectRepository`
- [ ] `PostgresEnvironmentRepository`
- [ ] `PostgresSDKKeyRepository`
- [ ] `PostgresUserRepository`
- [ ] `RedisSessionRepository`
- [ ] Integration tests with Testcontainers

### 3.3 Management API Routes
```
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId

POST   /api/v1/projects/:projectId/environments
GET    /api/v1/projects/:projectId/environments
PATCH  /api/v1/projects/:projectId/environments/:envId
DELETE /api/v1/projects/:projectId/environments/:envId

POST   /api/v1/projects/:projectId/flags
GET    /api/v1/projects/:projectId/flags
GET    /api/v1/projects/:projectId/flags/:flagId
PATCH  /api/v1/projects/:projectId/flags/:flagId
DELETE /api/v1/projects/:projectId/flags/:flagId
PATCH  /api/v1/projects/:projectId/flags/:flagId/environments/:envId
```

### 3.4 SDK API Routes (High Performance)
```
GET    /api/v1/sdk/:sdkKey/flags      # Get all flags for environment
POST   /api/v1/sdk/:sdkKey/evaluate   # Evaluate with context
```
- [ ] Implement Redis caching layer
- [ ] Add cache invalidation on flag updates
- [ ] Optimize for low latency (<50ms p99)

### 3.5 SDK Key Management Routes
```
POST   /api/v1/projects/:projectId/environments/:envId/sdk-keys
GET    /api/v1/projects/:projectId/sdk-keys
DELETE /api/v1/sdk-keys/:keyId
```

---

## Phase 4: Authentication

### 4.1 User Authentication
- [ ] Password hashing with bcrypt/argon2
- [ ] `POST /api/v1/auth/register` - create account
- [ ] `POST /api/v1/auth/login` - email/password login
- [ ] `POST /api/v1/auth/logout` - invalidate session
- [ ] `GET /api/v1/auth/me` - get current user
- [ ] Session-based auth with secure cookies
- [ ] CSRF protection

### 4.2 Auth Middleware
- [ ] `requireAuth` - validate session, attach user to context
- [ ] `requireProjectAccess` - verify user has access to project
- [ ] Apply to all management API routes

### 4.3 SDK Key Authentication
- [ ] SDK key format: `fb_live_<random>` / `fb_test_<random>`
- [ ] Hash SDK keys in database (store only hash)
- [ ] `validateSDKKey` middleware for SDK routes
- [ ] Rate limiting per SDK key

---

## Phase 5: Web Dashboard (`apps/web`)

### 5.1 Setup
- [ ] Initialize TanStack Start project
- [ ] Configure TanStack Router with type-safe routes
- [ ] Setup TanStack Query for server state
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui components
- [ ] Setup TanStack Form with Zod validation

### 5.2 Layout & Navigation
- [ ] App shell with sidebar navigation
- [ ] Project selector dropdown
- [ ] Environment switcher
- [ ] User menu (profile, logout)
- [ ] Responsive mobile layout

### 5.3 Auth Pages
- [ ] `/login` - login form
- [ ] `/register` - registration form
- [ ] `/forgot-password` - password reset (stretch)
- [ ] Auth state management
- [ ] Protected route wrapper

### 5.4 Project Management
- [ ] `/projects` - list all projects
- [ ] `/projects/new` - create project form
- [ ] `/projects/:id/settings` - project settings

### 5.5 Flag Management (Core Dashboard)
- [ ] `/projects/:id/flags` - flag list view
  - [ ] Search/filter flags
  - [ ] Quick toggle (enable/disable)
  - [ ] Flag type badges
  - [ ] Last updated timestamp
- [ ] `/projects/:id/flags/new` - create flag form
  - [ ] Flag key input (auto-format)
  - [ ] Flag type selector
  - [ ] Default value input
  - [ ] Description
- [ ] `/projects/:id/flags/:flagId` - flag detail view
  - [ ] Environment tabs
  - [ ] Enable/disable toggle per environment
  - [ ] Value editor per environment
  - [ ] Targeting rules editor
    - [ ] Add/remove rules
    - [ ] Condition builder (attribute, operator, value)
    - [ ] Percentage rollout slider
    - [ ] Rule priority reordering

### 5.6 Environment Management
- [ ] `/projects/:id/environments` - environment list
- [ ] Create environment modal
- [ ] Environment settings

### 5.7 SDK Key Management
- [ ] `/projects/:id/sdk-keys` - list SDK keys
- [ ] Create SDK key modal (shows key once)
- [ ] Revoke SDK key confirmation

### 5.8 Onboarding
- [ ] First-project creation wizard
- [ ] SDK integration code snippets
- [ ] "Test your integration" helper

---

## Phase 6: SDK Package (`packages/sdk-js`)

### 6.1 Core Client
- [ ] `FlagbaseClient` class implementation
- [ ] Configuration options (sdkKey, baseUrl, pollingInterval)
- [ ] `initialize()` - fetch initial flags
- [ ] `identify(context)` - set evaluation context
- [ ] `getFlag(key, defaultValue)` - get flag value
- [ ] `getAllFlags()` - get all flags
- [ ] Event emitter (`flagsUpdated`, `error`)
- [ ] `close()` - cleanup

### 6.2 Polling & Caching
- [ ] Configurable polling interval (default 30s)
- [ ] LocalStorage cache for offline resilience
- [ ] Cache TTL management
- [ ] Background refresh

### 6.3 TypeScript Support
- [ ] Generic types for flag values
- [ ] Strict type exports
- [ ] JSDoc comments

### 6.4 Build & Distribution
- [ ] Rollup/tsup build for ESM + CJS
- [ ] Browser bundle (<5KB gzipped target)
- [ ] Source maps
- [ ] npm package config

---

## Testing Milestones

### Unit Tests
- [ ] `packages/core` - 100% coverage on domain services
- [ ] `packages/core` - use case tests with mocked ports

### Integration Tests
- [ ] `apps/api` - all REST endpoints
- [ ] `packages/database` - repository implementations

### E2E Tests (Playwright)
- [ ] User registration & login
- [ ] Create project → create flag → toggle flag
- [ ] SDK key creation → SDK fetch flags

---

## Infrastructure & DevOps

- [ ] GitHub Actions CI pipeline (lint, test, build)
- [ ] Docker build for `apps/api`
- [ ] Docker build for `apps/web`
- [ ] `docker-compose.prod.yml` for self-hosted deployment
- [ ] Health check endpoints (`/healthz`, `/readyz`)

---

## Definition of Done (MVP)

MVP is complete when:
1. User can register, login, and manage their session
2. User can create a project with multiple environments
3. User can create boolean flags with targeting rules
4. User can generate SDK keys per environment
5. SDK can fetch flags and evaluate with context
6. All critical paths have E2E test coverage
7. Docker compose setup works for self-hosted deployment
