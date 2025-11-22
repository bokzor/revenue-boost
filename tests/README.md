# Testing Guide

This project has three types of tests: **Unit Tests**, **Integration Tests**, and **E2E Tests**.

## Test Types

### 1. Unit Tests
Unit tests run with mocked dependencies (Prisma, Redis, etc.) and don't require external services.

**Location**: `tests/unit/**/*.test.ts` (excluding `*.integration.test.ts`)

**Run locally**:
```bash
npm run test          # Watch mode
npm run test:run      # Run once
npm run test:ui       # UI mode
```

**What's mocked**:
- Prisma database client
- Redis client
- Shopify API calls
- Environment variables (via `tests/setup.ts`)

### 2. Integration Tests
Integration tests use a real PostgreSQL database to test database operations and data flows.

**Location**: `tests/unit/**/*.integration.test.ts`

**Setup**:
1. Start PostgreSQL (Docker recommended):
   ```bash
   docker run --name postgres-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=revenue_boost_test -p 5432:5432 -d postgres:15
   ```

2. Run migrations:
   ```bash
   DATABASE_URL='postgresql://postgres:postgres@localhost:5432/revenue_boost_test' npx prisma migrate deploy
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

**Run locally**:
```bash
# Set environment variables
export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/revenue_boost_test'
export SHOPIFY_API_KEY='test_api_key_12345'
export SHOPIFY_API_SECRET='test_api_secret_12345'
export SCOPES='write_products,write_customers,read_orders'
export SESSION_SECRET='test_session_secret_minimum_32_chars_long_for_validation'
export INTERNAL_API_SECRET='test_internal_api_secret_minimum_32_chars_long_validation'
export SHOPIFY_APP_URL='http://localhost:3000'

# Run integration tests
npm run test:integration          # Run once
npm run test:integration:watch    # Watch mode
```

**Reset test database**:
```bash
npm run test:db:reset
```

### 3. E2E Tests (Playwright)
End-to-end tests run in a real browser and test the full application flow.

**Location**: `tests/e2e/**/*.spec.ts`

**Setup**:
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

**Run locally** (in a separate terminal):
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:admin        # Admin tests only
npm run test:e2e:storefront   # Storefront tests only
```

## CI/CD

### GitHub Actions Workflows

#### 1. Unit and Integration Tests (`unit-and-storefront-tests.yml`)
Runs on every push and PR to `main` and `epic/goal-first` branches.

**Jobs**:
- **Lint and Typecheck**: Code quality checks
- **Unit Tests**: Fast tests with mocked dependencies
- **Integration Tests**: Tests with PostgreSQL service container

#### 2. Deploy to Staging (`deploy-staging.yml`)
Runs on manual trigger (workflow_dispatch).

**Jobs**:
- **Unit Tests**: Quick validation
- **Integration Tests**: Database validation with PostgreSQL
- **Deploy**: Deploys to Google Cloud Run (only if tests pass)

### PostgreSQL in CI
Both workflows use GitHub Actions service containers to provide PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: revenue_boost_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

## Test Configuration Files

- **`vitest.config.ts`**: Unit tests configuration (excludes integration tests)
- **`vitest.integration.config.ts`**: Integration tests configuration (includes only `*.integration.test.ts`)
- **`playwright.config.ts`**: E2E tests configuration
- **`tests/setup.ts`**: Unit test setup (mocks and environment variables)

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';

// Mocks are automatically provided by tests/setup.ts
describe('MyService', () => {
  it('should do something', () => {
    // Test with mocked dependencies
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '~/db.server'; // Real Prisma client

describe('MyService Integration Tests', () => {
  beforeEach(async () => {
    // Setup test data
    await prisma.store.create({ data: { ... } });
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.store.deleteMany();
  });

  it('should interact with database', async () => {
    // Test with real database
  });
});
```

## Troubleshooting

### Integration tests fail with "DATABASE_URL not found"
Make sure you've set the `DATABASE_URL` environment variable and PostgreSQL is running.

### Integration tests fail with "relation does not exist"
Run migrations: `DATABASE_URL='...' npx prisma migrate deploy`

### Unit tests import integration test mocks
Make sure your test file doesn't end with `.integration.test.ts` if it's a unit test.

### E2E tests timeout
Make sure the dev server is running on the correct port (check `playwright.config.ts` for the base URL).

