# Flagbase Technical Architecture

## Guiding Principles

**Priority Order:**
1. Testability — All business logic must be unit testable without infrastructure
2. Simplicity — Prefer explicit over clever; avoid premature abstraction
3. Type Safety — Leverage TypeScript strictly; no `any` types in production code

## Architecture Pattern: Hexagonal (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│                      Primary Adapters                        │
│              (HTTP Controllers, CLI, GraphQL)                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Ports (Interfaces)                   │
│                    (Input/Output Boundaries)                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain / Core                           │
│            (Business Logic, Entities, Use Cases)             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Ports (Interfaces)                   │
│                    (Repository Contracts)                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Secondary Adapters                        │
│            (PostgreSQL, Redis, External APIs)                │
└─────────────────────────────────────────────────────────────┘
```

### Layer Rules

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| Domain | Nothing external | Adapters, Infrastructure, Frameworks |
| Ports | Domain types only | Adapters, Infrastructure |
| Adapters | Ports, Domain | Other adapters directly |

### Directory Convention Per Package

```
src/
├── domain/           # Pure business logic, entities, value objects
│   ├── entities/
│   ├── value-objects/
│   └── services/     # Domain services (pure functions)
├── application/      # Use cases, orchestration
│   ├── use-cases/
│   └── ports/        # Interface definitions
├── infrastructure/   # Secondary adapters (DB, cache, external)
│   ├── repositories/
│   └── services/
└── interfaces/       # Primary adapters (HTTP, CLI, GraphQL)
    ├── http/
    └── cli/
```

## Monorepo Structure

**Tool:** pnpm workspaces + Turborepo

```
flagbase/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
│   ├── api/                    # Main API service
│   ├── web/                    # Dashboard (TanStack Start)
│   └── cli/                    # CLI tool
├── packages/
│   ├── core/                   # Domain logic, shared across services
│   ├── database/               # Database adapters, migrations, Drizzle schema
│   ├── sdk-js/                 # JavaScript/TypeScript SDK
│   ├── sdk-react/              # React SDK (hooks)
│   ├── sdk-node/               # Node.js SDK
│   ├── config/                 # Shared configs (tsconfig, eslint)
│   └── types/                  # Shared TypeScript types
├── specs/                      # Specifications and documentation
└── docker/                     # Docker configs for local dev
```

### Package Dependency Rules

```
sdk-react → sdk-js
sdk-node → sdk-js
api → core, database
web → types
cli → sdk-js, types
core → types
database → core, types
```

## Technology Stack

### Backend Services

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| Runtime | Node.js 20+ | LTS, native TypeScript support via tsx |
| Language | TypeScript 5.x (strict mode) | Type safety, DX |
| HTTP Framework | Hono | Lightweight, fast, good TypeScript support |
| Database | PostgreSQL 15+ | Reliability, JSON support, full-text search |
| ORM | Drizzle | Type-safe, lightweight, good DX |
| Cache | Redis | Flag evaluation caching, session storage |
| Validation | Zod | Runtime validation, TypeScript inference |
| Testing | Vitest | Fast, native TypeScript, good DX |

### Web Dashboard

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| Framework | TanStack Start | Full-stack TypeScript, RSC-like patterns |
| Routing | TanStack Router | Type-safe routing |
| State | TanStack Query | Server state management |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Components | shadcn/ui | Accessible, customizable |
| Forms | TanStack Form + Zod | Type-safe forms |

### SDKs

| SDK | Target | Key Features |
|-----|--------|--------------|
| sdk-js | Browser, universal | Core evaluation, polling, caching |
| sdk-react | React apps | Hooks: `useFlag`, `useFlags`, `FlagbaseProvider` |
| sdk-node | Node.js servers | Server-side evaluation, no DOM dependencies |

## Testing Strategy

### Test Pyramid

```
         ┌─────────┐
         │   E2E   │  ← Few, critical paths only (Playwright)
         └────┬────┘
        ┌─────┴─────┐
        │Integration│  ← API routes, DB queries (Vitest + Testcontainers)
        └─────┬─────┘
    ┌─────────┴─────────┐
    │      Unit         │  ← Domain logic, use cases (Vitest)
    └───────────────────┘
```

### Testing Rules

1. **Domain layer:** 100% unit test coverage, no mocks of domain code
2. **Use cases:** Unit tests with mocked ports (repositories, external services)
3. **Adapters:** Integration tests with real dependencies (Testcontainers)
4. **HTTP routes:** Integration tests against running server
5. **E2E:** Critical user journeys only (auth, flag creation, SDK integration)

### Test File Convention

```
src/
├── domain/
│   └── services/
│       ├── flag-evaluator.ts
│       └── flag-evaluator.test.ts    # Co-located unit test
├── application/
│   └── use-cases/
│       ├── create-flag.ts
│       └── create-flag.test.ts       # Unit test with mocked ports
└── infrastructure/
    └── repositories/
        ├── postgres-flag-repository.ts
        └── postgres-flag-repository.integration.test.ts
```

### Dependency Injection for Testability

```typescript
// Port definition (interface)
// packages/core/src/application/ports/flag-repository.port.ts
export interface FlagRepository {
  findById(id: string): Promise<Flag | null>;
  findByKey(projectId: string, key: string): Promise<Flag | null>;
  save(flag: Flag): Promise<void>;
}

// Use case with injected dependencies
// packages/core/src/application/use-cases/evaluate-flag.ts
export function createEvaluateFlagUseCase(deps: {
  flagRepository: FlagRepository;
  evaluationLogger: EvaluationLogger;
}) {
  return async (input: EvaluateFlagInput): Promise<EvaluationResult> => {
    const flag = await deps.flagRepository.findByKey(input.projectId, input.flagKey);
    // ... business logic
  };
}

// Test with mock
// packages/core/src/application/use-cases/evaluate-flag.test.ts
describe('evaluateFlag', () => {
  it('returns default value when flag not found', async () => {
    const mockRepo: FlagRepository = {
      findById: vi.fn(),
      findByKey: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const evaluateFlag = createEvaluateFlagUseCase({
      flagRepository: mockRepo,
      evaluationLogger: mockLogger,
    });

    const result = await evaluateFlag({ projectId: 'p1', flagKey: 'unknown', context: {} });
    expect(result.value).toBe(false);
  });
});
```

## Core Domain Model

### Entities

```typescript
// Flag
interface Flag {
  id: string;
  projectId: string;
  key: string;                    // unique within project, e.g., "show-new-dashboard"
  name: string;                   // display name
  description: string | null;
  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: FlagValue;
  enabled: boolean;               // kill switch
  createdAt: Date;
  updatedAt: Date;
}

// Environment
interface Environment {
  id: string;
  projectId: string;
  key: string;                    // "development" | "staging" | "production"
  name: string;
  createdAt: Date;
}

// FlagEnvironmentConfig (flag settings per environment)
interface FlagEnvironmentConfig {
  id: string;
  flagId: string;
  environmentId: string;
  enabled: boolean;
  value: FlagValue;
  targetingRules: TargetingRule[];
}

// TargetingRule
interface TargetingRule {
  id: string;
  priority: number;               // lower = evaluated first
  conditions: Condition[];        // AND logic within rule
  value: FlagValue;               // value if rule matches
  percentage: number | null;      // optional percentage rollout (0-100)
}

// Condition
interface Condition {
  attribute: string;              // e.g., "userId", "country", "plan"
  operator: 'equals' | 'notEquals' | 'contains' | 'in' | 'notIn';
  value: string | string[];
}

// EvaluationContext (provided by SDK)
interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, string | number | boolean>;
}
```

### Value Objects

```typescript
// FlagKey - validated, immutable
class FlagKey {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<FlagKey, ValidationError> {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return err(new ValidationError('Flag key must be lowercase alphanumeric with hyphens'));
    }
    if (value.length < 2 || value.length > 64) {
      return err(new ValidationError('Flag key must be 2-64 characters'));
    }
    return ok(new FlagKey(value));
  }

  toString(): string {
    return this.value;
  }
}
```

## API Design

### REST Endpoints (v1)

```
# Projects
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId

# Environments
GET    /api/v1/projects/:projectId/environments
POST   /api/v1/projects/:projectId/environments
PATCH  /api/v1/projects/:projectId/environments/:envId
DELETE /api/v1/projects/:projectId/environments/:envId

# Flags
GET    /api/v1/projects/:projectId/flags
POST   /api/v1/projects/:projectId/flags
GET    /api/v1/projects/:projectId/flags/:flagId
PATCH  /api/v1/projects/:projectId/flags/:flagId
DELETE /api/v1/projects/:projectId/flags/:flagId

# Flag Environment Config
GET    /api/v1/projects/:projectId/flags/:flagId/environments/:envId
PATCH  /api/v1/projects/:projectId/flags/:flagId/environments/:envId

# SDK Endpoint (high-performance, cached)
GET    /api/v1/sdk/:sdkKey/flags
POST   /api/v1/sdk/:sdkKey/evaluate
```

### SDK API Response Format

```typescript
// GET /api/v1/sdk/:sdkKey/flags
interface SDKFlagsResponse {
  flags: {
    [key: string]: {
      value: FlagValue;
      type: FlagType;
    };
  };
  evaluatedAt: string;  // ISO timestamp
}

// POST /api/v1/sdk/:sdkKey/evaluate
interface EvaluateRequest {
  context: EvaluationContext;
  flags?: string[];  // optional: specific flags to evaluate
}

interface EvaluateResponse {
  evaluations: {
    [key: string]: {
      value: FlagValue;
      reason: 'DEFAULT' | 'TARGETING_MATCH' | 'PERCENTAGE_ROLLOUT' | 'DISABLED';
    };
  };
}
```

## Database Schema (PostgreSQL + Drizzle)

```typescript
// packages/database/src/schema.ts
import { pgTable, text, boolean, timestamp, jsonb, integer, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const environments = pgTable('environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flags = pgTable('flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['boolean', 'string', 'number', 'json'] }).notNull(),
  defaultValue: jsonb('default_value').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const flagEnvironmentConfigs = pgTable('flag_environment_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagId: uuid('flag_id').references(() => flags.id).notNull(),
  environmentId: uuid('environment_id').references(() => environments.id).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  value: jsonb('value').notNull(),
  targetingRules: jsonb('targeting_rules').default([]).notNull(),
});

export const sdkKeys = pgTable('sdk_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  environmentId: uuid('environment_id').references(() => environments.id).notNull(),
  key: text('key').notNull().unique(),  // hashed or prefixed key
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});
```

## Error Handling

### Result Type Pattern

```typescript
// packages/types/src/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage in use cases
async function createFlag(input: CreateFlagInput): Promise<Result<Flag, CreateFlagError>> {
  const keyResult = FlagKey.create(input.key);
  if (!keyResult.ok) {
    return err({ code: 'INVALID_KEY', message: keyResult.error.message });
  }
  // ...
}
```

### HTTP Error Responses

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Example responses
// 400: { code: "VALIDATION_ERROR", message: "Invalid flag key format", details: { field: "key" } }
// 404: { code: "NOT_FOUND", message: "Flag not found" }
// 409: { code: "CONFLICT", message: "Flag with this key already exists" }
```

## Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/flagbase
REDIS_URL=redis://localhost:6379

# Optional
PORT=3000
LOG_LEVEL=info
NODE_ENV=development

# API Security
API_KEY_SALT=<random-string>
JWT_SECRET=<random-string>
```

### Config Loading Pattern

```typescript
// packages/config/src/index.ts
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    logLevel: process.env.LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV,
  });
}
```

## Local Development

### Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 8+, Docker

# Clone and install
git clone https://github.com/flagbase/flagbase.git
cd flagbase
pnpm install

# Start infrastructure
docker compose up -d  # PostgreSQL, Redis

# Run migrations
pnpm db:migrate

# Start development
pnpm dev  # Runs API + Web concurrently
```

### Docker Compose (Local Dev)

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: flagbase
      POSTGRES_PASSWORD: flagbase
      POSTGRES_DB: flagbase
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## SDK Design

### Core SDK (sdk-js)

```typescript
// packages/sdk-js/src/index.ts
export interface FlagbaseConfig {
  sdkKey: string;
  baseUrl?: string;
  pollingInterval?: number;  // ms, default 30000
  enableLocalCache?: boolean;
}

export class FlagbaseClient {
  private flags: Map<string, FlagValue> = new Map();
  private context: EvaluationContext = {};

  constructor(private config: FlagbaseConfig) {}

  async initialize(): Promise<void>;

  identify(context: EvaluationContext): void;

  getFlag<T extends FlagValue>(key: string, defaultValue: T): T;

  getAllFlags(): Record<string, FlagValue>;

  on(event: 'flagsUpdated' | 'error', callback: Function): void;

  close(): void;
}
```

### React SDK (sdk-react)

```typescript
// packages/sdk-react/src/index.ts
export function FlagbaseProvider({
  sdkKey,
  children,
  context,
}: {
  sdkKey: string;
  children: ReactNode;
  context?: EvaluationContext;
}): JSX.Element;

export function useFlag<T extends FlagValue>(key: string, defaultValue: T): {
  value: T;
  loading: boolean;
};

export function useFlags(): {
  flags: Record<string, FlagValue>;
  loading: boolean;
};

export function useFlagbaseContext(): {
  identify: (context: EvaluationContext) => void;
  client: FlagbaseClient;
};
```

---

## Implementation Checklist

When implementing a feature, verify:

- [ ] Domain logic has no infrastructure dependencies
- [ ] Use cases accept dependencies via injection
- [ ] All public functions have corresponding tests
- [ ] Errors use Result type, not thrown exceptions (in domain/application layers)
- [ ] Database queries go through repository interfaces
- [ ] HTTP handlers are thin (delegate to use cases)
- [ ] Types are strict (no `any`, explicit return types)
