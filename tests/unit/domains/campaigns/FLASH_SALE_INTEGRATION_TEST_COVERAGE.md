# Flash Sale Integration Tests - Coverage Report

## Overview
Comprehensive integration tests for Flash Sale campaign configurations with schema validation.

**Test File**: `tests/unit/domains/campaigns/flash-sale-integration.test.ts`  
**Total Tests**: 17 tests  
**Status**: ✅ All passing

---

## Test Coverage by Category

### 1. Timer Mode Configurations (4 tests)
Tests for all timer behavior modes with complete validation:

- ✅ **Duration Mode** - Fixed countdown from view
  - Validates `durationSeconds`, `timezone`, `onExpire`
  
- ✅ **Fixed End Mode** - Absolute end time
  - Validates `endTimeISO`, `timezone`, `onExpire`, `expiredMessage`
  
- ✅ **Personal Mode** - Per-visitor countdown
  - Validates `personalWindowSeconds`, `timezone`, `onExpire`
  
- ✅ **Stock Limited Mode** - Countdown until sold out
  - Validates `timezone`, `onExpire`

### 2. Inventory Mode Configurations (2 tests)
Tests for stock tracking modes:

- ✅ **Pseudo Inventory Mode** - Simulated stock counter
  - Validates `pseudoMax`, `showOnlyXLeft`, `showThreshold`, `soldOutBehavior`
  
- ✅ **Real Inventory Mode** - Live Shopify inventory
  - Validates `productIds`, `showOnlyXLeft`, `showThreshold`, `soldOutBehavior`, `soldOutMessage`

### 3. Reservation Timer Configurations (2 tests)
Tests for soft reservation timer feature:

- ✅ **Enabled Reservation** - Active reservation timer
  - Validates `enabled`, `minutes`, `label`, `disclaimer`
  
- ✅ **Disabled Reservation** - Reservation timer off
  - Validates `enabled: false`

### 4. Complete Configuration Workflows (2 tests)
Tests for end-to-end configuration scenarios:

- ✅ **Complete Flash Sale** - All features enabled
  - Timer (fixed_end) + Inventory (real) + Reservation + Presentation
  - Validates all fields work together correctly
  
- ✅ **Minimal Flash Sale** - Only required fields
  - Validates minimum viable configuration

### 5. Feature Combination Tests (4 tests)
Tests for multiple features working together:

- ✅ **Timer + Inventory** - Dual urgency
  - Duration timer with pseudo inventory
  
- ✅ **Timer + Reservation** - Personal offer with reservation
  - Personal timer with reservation window
  
- ✅ **Inventory + Reservation** - Reserved stock
  - Real inventory with reservation timer
  
- ✅ **All Features Combined** - Triple threat
  - Fixed end timer + Real inventory + Reservation

### 6. Validation Error Handling (3 tests)
Tests for schema validation and error detection:

- ✅ **Missing Required Fields** - Rejects incomplete config
  - Validates required field enforcement
  
- ✅ **Invalid Discount Percentage** - Rejects > 100%
  - Validates percentage bounds (0-100)
  
- ✅ **Invalid Countdown Duration** - Rejects < 60 seconds
  - Validates minimum duration requirement

---

## Test Summary by Feature

| Feature | Tests | Status |
|---------|-------|--------|
| Timer Modes | 4 | ✅ |
| Inventory Modes | 2 | ✅ |
| Reservation Timer | 2 | ✅ |
| Complete Workflows | 2 | ✅ |
| Feature Combinations | 4 | ✅ |
| Validation Errors | 3 | ✅ |
| **TOTAL** | **17** | **✅** |

---

## Configuration Combinations Tested

### Timer Modes
- ✅ Duration (fixed countdown)
- ✅ Fixed End (absolute time)
- ✅ Personal (per-visitor)
- ✅ Stock Limited (until sold out)

### Inventory Modes
- ✅ Pseudo (simulated)
- ✅ Real (Shopify products)

### Reservation States
- ✅ Enabled (with custom settings)
- ✅ Disabled

### Feature Combinations
- ✅ Timer + Inventory
- ✅ Timer + Reservation
- ✅ Inventory + Reservation
- ✅ All three combined

---

## Running the Tests

```bash
# Run Flash Sale integration tests
npm run test -- tests/unit/domains/campaigns/flash-sale-integration.test.ts

# Run all unit tests
npm run test

# Run with coverage
npm run test:run -- --coverage
```

---

## Key Validation Rules Tested

### Required Fields
- `headline` - Main headline (required)
- `urgencyMessage` - Urgency message (required)
- `buttonText` - CTA button text (required)
- `successMessage` - Success message (required)

### Constraints
- `discountPercentage` - Must be 0-100
- `countdownDuration` - Must be ≥ 60 seconds
- `timer.personalWindowSeconds` - Must be ≥ 60 seconds
- `inventory.showThreshold` - Must be ≥ 1
- `reserve.minutes` - Must be ≥ 1

### Optional Fields
- `subheadline`, `ctaUrl`, `dismissLabel`, `failureMessage`
- All timer, inventory, and reservation configurations

---

## Notes

- All tests use Zod schema validation (`FlashSaleContentSchema`)
- Tests verify both successful validation and error cases
- Integration tests ensure feature combinations work correctly
- No database or API calls required (pure schema validation)
- Tests run in < 10ms (very fast)

---

## Related Files

- **Schema Definition**: `app/domains/campaigns/types/campaign.ts`
- **Component**: `app/domains/campaigns/components/sections/FlashSaleContentSection.tsx`
- **Unit Tests**: `tests/unit/domains/campaigns/flash-sale-all-options.test.tsx` (68 tests)
- **Integration Tests**: `tests/unit/domains/campaigns/flash-sale-integration.test.ts` (17 tests)

**Total Flash Sale Test Coverage**: 85 tests (68 unit + 17 integration)

