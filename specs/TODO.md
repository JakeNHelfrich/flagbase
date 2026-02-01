# Flagbase MVP Implementation Plan

## Overview

**Goal:** Get a functional Web UI as fast as possible, backfill complex features later.

Implementation order prioritizes UI visibility:
1. **Minimal Foundation** - Just enough infrastructure to start building
2. **API + Web UI** - Parallel tracks for CRUD API and dashboard shell
3. **Integration + Auth** - Wire them together with basic authentication
4. **Backfill** - Evaluation engine, SDK, caching, polish

---

## Phase 1: Minimal Foundation

> Everything here is required before Phase 2 can start.

### 1.1 Monorepo Setup
- [ ] Initialize pnpm workspace with `pnpm-workspace.yaml`
- [ ] Configure Turborepo (`turbo.json`) for build/test/lint pipelines
- [ ] Create shared tsconfig (`packages/config/tsconfig.base.json`)
- [ ] Create shared ESLint config (`packages/config/eslint.config.js`)

### 1.2 Shared Types Package (`packages/types`)
- [ ] Define `Result<T, E>` type with `ok()` and `err()` helpers
- [ ] Define core entity interfaces:
  - `Flag`, `FlagValue`, `FlagType`
  - `Project`
  - `Environment`
  - `FlagEnvironmentConfig`
  - `TargetingRule`, `Condition` (structure only, evaluation later)
- [ ] Define API request/response types for CRUD operations
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
- [ ] Create `docker/docker-compose.yml` with PostgreSQL (Redis optional for now)
- [ ] Add `.env.example` with required variables

---

## Phase 2: API + Web UI (Parallel Tracks)

> These two tracks can be developed simultaneously by different people or interleaved.

### Track A: API Shell (`apps/api`)

#### 2A.1 Setup
- [ ] Initialize Hono app with TypeScript
- [ ] Setup Zod validation middleware
- [ ] Setup error handling middleware
- [ ] Setup request logging (pino)
- [ ] Setup CORS configuration
- [ ] Create config loader with Zod schema

#### 2A.2 Stub Auth Middleware
- [ ] Create `requireAuth` middleware that:
  - For now: accepts any request with a valid session cookie OR
  - Hardcoded dev user for local development
  - Later: proper session validation
- [ ] Create `requireProjectAccess` middleware (stub: allow all)

#### 2A.3 Repository Implementations
- [ ] `PostgresProjectRepository`
- [ ] `PostgresEnvironmentRepository`
- [ ] `PostgresFlagRepository` (CRUD only, no evaluation)
- [ ] `PostgresUserRepository`
- [ ] `PostgresSessionRepository`
- [ ] `PostgresSDKKeyRepository`

#### 2A.4 Management API Routes (CRUD Focus)
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

POST   /api/v1/projects/:projectId/environments/:envId/sdk-keys
GET    /api/v1/projects/:projectId/sdk-keys
DELETE /api/v1/sdk-keys/:keyId
```

---

### Track B: Web UI Shell (`apps/web`)

#### 2B.1 Setup
- [ ] Initialize TanStack Start project
- [ ] Configure TanStack Router with type-safe routes
- [ ] Setup TanStack Query for server state
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui components
- [ ] Setup TanStack Form with Zod validation
- [ ] Create API client (typed fetch wrapper)

#### 2B.2 Layout & Navigation
- [ ] App shell with sidebar navigation
- [ ] Project selector dropdown
- [ ] Environment switcher
- [ ] User menu (profile, logout) - stub for now
- [ ] Responsive mobile layout

#### 2B.3 Project Management Pages
- [ ] `/projects` - list all projects
- [ ] `/projects/new` - create project form
- [ ] `/projects/:id/settings` - project settings

#### 2B.4 Flag Management Pages (Core Dashboard)
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
  - [ ] Targeting rules editor (UI only, saves JSON)
    - [ ] Add/remove rules
    - [ ] Condition builder (attribute, operator, value)
    - [ ] Percentage rollout slider
    - [ ] Rule priority reordering

#### 2B.5 Environment Management Pages
- [ ] `/projects/:id/environments` - environment list
- [ ] Create environment modal
- [ ] Environment settings

#### 2B.6 SDK Key Management Pages
- [ ] `/projects/:id/sdk-keys` - list SDK keys
- [ ] Create SDK key modal (shows key once)
- [ ] Revoke SDK key confirmation

---

## Phase 3: Integration + Basic Auth

> Wire the UI to the API and add real authentication.

### 3.1 User Authentication
- [ ] Password hashing with bcrypt/argon2
- [ ] `POST /api/v1/auth/register` - create account
- [ ] `POST /api/v1/auth/login` - email/password login
- [ ] `POST /api/v1/auth/logout` - invalidate session
- [ ] `GET /api/v1/auth/me` - get current user
- [ ] Session-based auth with secure cookies

### 3.2 Auth Pages (Web)
- [ ] `/login` - login form
- [ ] `/register` - registration form
- [ ] Auth state management
- [ ] Protected route wrapper
- [ ] Redirect unauthenticated users to login

### 3.3 Replace Auth Stubs
- [ ] Update `requireAuth` middleware with real session validation
- [ ] Update `requireProjectAccess` with real ownership checks
- [ ] Wire user menu to real logout

### 3.4 Integration Testing
- [ ] Test full flows: register → login → create project → create flag → toggle

---

## Phase 4: Backfill Core Features

> Now that the UI works, add the sophisticated backend features.

### 4.1 Core Domain Package (`packages/core`)

#### Value Objects
- [ ] `FlagKey` - validated flag key (lowercase, hyphens, 2-64 chars)
- [ ] `ProjectKey` - validated project key
- [ ] `EnvironmentKey` - validated environment key
- [ ] `SDKKey` - validated SDK key format

#### Flag Evaluator
- [ ] `FlagEvaluator` - core evaluation logic
  - [ ] Boolean flag evaluation
  - [ ] Targeting rule matching (conditions)
  - [ ] Percentage rollout calculation (deterministic hash)
  - [ ] Kill switch handling (enabled/disabled)
  - [ ] Default value fallback
- [ ] Unit tests for all evaluation scenarios

### 4.2 SDK API Routes
```
GET    /api/v1/sdk/:sdkKey/flags      # Get all flags for environment
POST   /api/v1/sdk/:sdkKey/evaluate   # Evaluate with context
```
- [ ] Implement SDK key validation middleware
- [ ] Wire to FlagEvaluator

### 4.3 Performance & Caching
- [ ] Add Redis to docker-compose
- [ ] Implement Redis caching layer for flag configs
- [ ] Add cache invalidation on flag updates
- [ ] Optimize for low latency (<50ms p99)

### 4.4 SDK Package (`packages/sdk-js`)
- [ ] `FlagbaseClient` class implementation
- [ ] Configuration options (sdkKey, baseUrl, pollingInterval)
- [ ] `initialize()` - fetch initial flags
- [ ] `identify(context)` - set evaluation context
- [ ] `getFlag(key, defaultValue)` - get flag value
- [ ] `getAllFlags()` - get all flags
- [ ] Event emitter (`flagsUpdated`, `error`)
- [ ] `close()` - cleanup
- [ ] Polling & LocalStorage cache
- [ ] Build for ESM + CJS (<5KB gzipped)

### 4.5 Security Hardening
- [ ] CSRF protection
- [ ] Rate limiting per SDK key
- [ ] Hash SDK keys in database (store only hash)

---

## Phase 5: Polish & Production

### 5.1 Testing
- [ ] Unit tests: `packages/core` - 100% coverage on evaluator
- [ ] Integration tests: all API endpoints
- [ ] E2E tests (Playwright):
  - [ ] User registration & login
  - [ ] Create project → create flag → toggle flag
  - [ ] SDK key creation → SDK fetch flags

### 5.2 Infrastructure
- [ ] GitHub Actions CI pipeline (lint, test, build)
- [ ] Docker build for `apps/api`
- [ ] Docker build for `apps/web`
- [ ] `docker-compose.prod.yml` for self-hosted deployment
- [ ] Health check endpoints (`/healthz`, `/readyz`)

### 5.3 Onboarding UX
- [ ] First-project creation wizard
- [ ] SDK integration code snippets
- [ ] "Test your integration" helper

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

---

## Parallelization Notes

```
Phase 1:  [Foundation]──────────────────────────►
Phase 2:  ├─[Track A: API]────────────────►
          └─[Track B: Web UI]─────────────►     (parallel)
Phase 3:      [Integration + Auth]────────►
Phase 4:          [Backfill: Core, SDK, Cache]──────►
Phase 5:              [Polish + Production]──────────►
```

**Key insight:** The Web UI and API tracks in Phase 2 can be developed in parallel. The Web UI can use mock data or a local JSON file initially, then switch to the real API as endpoints become available.
