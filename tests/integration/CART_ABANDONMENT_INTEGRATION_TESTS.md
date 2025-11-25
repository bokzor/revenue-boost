# Cart Abandonment - Integration Test Coverage

## Overview

Comprehensive integration tests for cart abandonment popup functionality covering API routes, database operations, and end-to-end workflows.

---

## Test Files

### 1. Email Recovery API Integration Tests

**File**: `tests/integration/api/cart-abandonment-email-recovery.integration.test.ts`

#### Basic Email Recovery Flow
- ✅ Successfully capture email and issue discount code
- ✅ Capture email with cart subtotal for tiered discounts
- ✅ Verify lead creation in database
- ✅ Pass cart subtotal to discount code generation

#### Email-Locked Discounts
- ✅ Issue email-locked discount with authorized email
- ✅ Enrich discount config with email authorization
- ✅ Verify `authorizedEmail` and `requireEmailMatch` are set

**Tests**: 3 test scenarios covering happy path flows

---

### 2. Validation & Error Handling Integration Tests

**File**: `tests/integration/api/cart-abandonment-validation.integration.test.ts`

#### Session Validation
- ✅ Return 401 when session is invalid (no shop)
- ✅ Verify authentication middleware

#### Campaign Validation
- ✅ Return 404 when campaign not found
- ✅ Return 404 when campaign is not active (PAUSED, DRAFT, ARCHIVED)
- ✅ Verify campaign status checks

#### Discount Configuration Validation
- ✅ Return 400 when discount is disabled
- ✅ Verify discount config parsing

#### Rate Limiting
- ✅ Return 429 when rate limit is exceeded
- ✅ Call rate limiter with correct email+campaign key
- ✅ Verify rate limit parameters (cart_recovery type)
- ✅ Test rate limit metadata

#### Input Validation
- ✅ Return 400 for invalid email format
- ✅ Return 400 for missing required fields (campaignId, email)
- ✅ Accept valid email formats (various formats tested)
- ✅ Zod schema validation for request body

**Tests**: 11 test scenarios covering error cases and validation

---

### 3. Campaign CRUD Integration Tests

**File**: `tests/integration/campaigns/cart-abandonment-crud.integration.test.ts`

#### Campaign Creation
- ✅ Create campaign with minimal cart abandonment configuration
- ✅ Verify default values are applied (showCartItems, maxItemsToShow, etc.)
- ✅ Create campaign with complete configuration (all options)
- ✅ Validate content configuration on creation (reject invalid)
- ✅ Validate discount configuration on creation (reject negative values)

#### Campaign Updates
- ✅ Update cart abandonment content configuration
- ✅ Update urgency settings (timer, message)
- ✅ Update discount configuration (enable/disable, change values)
- ✅ Update email recovery settings (enable, configure placeholders)
- ✅ Verify updated fields persist correctly

#### Campaign Retrieval
- ✅ Retrieve campaign with all configurations
- ✅ Verify contentConfig, designConfig, discountConfig are present

**Tests**: 11 test scenarios covering database operations

---

## Integration Test Patterns

### Mocking Strategy

```typescript
// Mock external dependencies
vi.mock('~/shopify.server');
vi.mock('~/domains/commerce/services/discount.server');
vi.mock('~/domains/security/services/rate-limit.server');

// Use mocked Prisma from setup.ts
import prisma from '~/db.server';
```

### Response Extraction Helper

```typescript
async function extractResponse(response: any): Promise<{ data: any; status: number }> {
  if (response instanceof Response) {
    const data = await response.json();
    return { data, status: response.status };
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return { data: response.data, status: response.status || 200 };
  }
  return { data: response, status: 200 };
}
```

### Test Structure

```typescript
describe('Feature - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario Group', () => {
    it('should test specific behavior', async () => {
      // Arrange: Setup mocks and data
      // Act: Call the function/route
      // Assert: Verify results
    });
  });
});
```

---

## What's Tested

### API Routes
- ✅ `/api/cart/email-recovery` (POST)
  - Email capture
  - Discount code issuance
  - Lead creation
  - Rate limiting
  - Validation
  - Error handling

### Database Operations
- ✅ Campaign creation with cart abandonment template
- ✅ Campaign updates (content, discount, email recovery)
- ✅ Campaign retrieval
- ✅ Lead creation
- ✅ Configuration validation

### Business Logic
- ✅ Email-locked discount generation
- ✅ Cart subtotal-based discount selection
- ✅ Rate limiting per email+campaign
- ✅ Discount config enrichment (authorizedEmail)
- ✅ Default value application

### Security
- ✅ Session validation
- ✅ Challenge token validation (via rate limiter)
- ✅ Rate limiting enforcement
- ✅ Campaign status checks

### Validation
- ✅ Zod schema validation (CartAbandonmentContentSchema)
- ✅ Zod schema validation (DiscountConfigSchema)
- ✅ Email format validation
- ✅ Required field validation
- ✅ Range validation (urgencyTimer, maxItemsToShow)

---

## Running Integration Tests

⚠️ **Note**: These integration tests are currently structured as **mock-based integration tests** that test the integration between different modules while using mocked dependencies. They validate:
- API route handlers with mocked Shopify authentication
- Service layer integration with mocked database
- Business logic flow across multiple modules
- Error handling and validation chains

These tests can be run as unit tests (which includes mocks):

```bash
# Run as unit tests (with mocks from setup.ts)
npm run test:run -- tests/integration

# Run specific test file
npm run test:run -- tests/integration/api/cart-abandonment-email-recovery.test.ts
```

### Converting to True Integration Tests

To convert these to true integration tests with a real database:

1. Remove all `vi.mock()` calls
2. Use real Prisma client
3. Set up test database with migrations
4. Add cleanup in `afterEach` hooks
5. Use transaction rollback for isolation

Example:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterEach(async () => {
  await prisma.campaign.deleteMany();
  await prisma.lead.deleteMany();
});
```

---

## Test Coverage Summary

**Total Integration Tests**: 25 tests across 3 files

### By Category
- **API Routes**: 14 tests
- **Database CRUD**: 11 tests

### By Feature
- **Email Recovery**: 3 tests
- **Validation & Errors**: 11 tests
- **Campaign CRUD**: 11 tests

### Coverage Areas
- ✅ Happy path flows
- ✅ Error scenarios
- ✅ Edge cases
- ✅ Security checks
- ✅ Rate limiting
- ✅ Input validation
- ✅ Database operations
- ✅ Configuration persistence

---

## Next Steps

### Potential Additional Tests
1. **Lead Management**: Test lead deduplication, updates
2. **Analytics**: Test event tracking for cart recovery
3. **Discount Code Generation**: Test Shopify API integration
4. **Email Sending**: Test email delivery (if implemented)
5. **Multi-currency**: Test currency handling
6. **A/B Testing**: Test variant selection for cart abandonment

### E2E Tests
For full end-to-end testing including browser interactions, see:
- `tests/e2e/staging/storefront-cart-abandonment.spec.ts`

