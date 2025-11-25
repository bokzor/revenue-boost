# Cart Abandonment Popup - Complete Test Coverage

## Overview

This document summarizes the comprehensive unit test coverage for **ALL** cart abandonment popup configuration options.

**Total Tests: 182 passing tests across 9 test files**

---

## Test Files

### 1. Content Configuration Tests

#### `cart-abandonment-schema.test.ts` (18 tests)
Tests base content fields inherited from `BaseContentConfigSchema`:
- ✅ Required fields: `headline`, `buttonText`, `successMessage`
- ✅ Optional fields: `subheadline`, `dismissLabel`, `failureMessage`, `ctaText`
- ✅ Cart display options: `showCartItems`, `maxItemsToShow`, `showCartTotal`, `currency`
- ✅ Validation: Empty headline rejection, range validation (1-10 items)

#### `cart-abandonment-urgency.test.ts` (14 tests)
Tests urgency and scarcity features:
- ✅ `showUrgency` (boolean, default: true)
- ✅ `urgencyTimer` (60-3600 seconds, default: 300)
- ✅ `urgencyMessage` (string with {{time}} placeholder support)
- ✅ `showStockWarnings` (boolean, default: false)
- ✅ `stockWarningMessage` (string)
- ✅ Combined urgency + stock warnings configuration

#### `cart-abandonment-email-recovery.test.ts` (13 tests)
Tests email capture and recovery flow:
- ✅ `enableEmailRecovery` (boolean, default: false)
- ✅ `requireEmailBeforeCheckout` (boolean, default: false)
- ✅ `emailPlaceholder` (string)
- ✅ `emailButtonText` (string)
- ✅ `emailSuccessMessage` (string)
- ✅ `emailErrorMessage` (string)
- ✅ Various email recovery flow combinations

#### `cart-abandonment-cta.test.ts` (7 tests)
Tests call-to-action options:
- ✅ `ctaUrl` (string, various URL formats)
- ✅ `saveForLaterText` (string)
- ✅ Combined CTA configurations
- ✅ Complete content configuration with all fields

---

### 2. Design Configuration Tests

#### `cart-abandonment-design-config.test.ts` (21 tests)
Tests visual/design properties:
- ✅ **Colors** (13 color properties):
  - Required: `backgroundColor`, `textColor`, `buttonColor`, `buttonTextColor`
  - Optional: `descriptionColor`, `inputBackgroundColor`, `inputTextColor`, `inputBorderColor`, `accentColor`, `overlayColor`, `overlayOpacity`, `imageBgColor`, `successColor`
  - Supports: hex, RGB, RGBA formats
- ✅ **Background Image**:
  - `backgroundImageMode`: 'none' | 'preset' | 'file'
  - `backgroundImagePresetKey` (string)
  - `backgroundImageFileId` (string)
- ✅ **Layout**:
  - `position`: 'center' | 'top' | 'bottom' | 'left' | 'right'
  - `size`: 'small' | 'medium' | 'large'
  - `popupSize`: 'compact' | 'standard' | 'wide' | 'full'
  - `borderRadius` (string | number)

#### `cart-abandonment-design-layout.test.ts` (26 tests)
Tests layout, typography, and visual effects:
- ✅ **Spacing**: `padding`, `maxWidth` (string | number formats)
- ✅ **Animation**: 'fade' | 'slide' | 'bounce' | 'none'
- ✅ **Display Mode**: 'modal' | 'banner' | 'slide-in' | 'inline'
- ✅ **Typography**: `fontFamily`, `fontSize`, `fontWeight`
- ✅ **Visual Effects**: `boxShadow`, `customCSS`
- ✅ **Images**: `imageUrl`, `imagePosition` ('left' | 'right' | 'top' | 'bottom' | 'none')
- ✅ **Button**: `buttonUrl`

#### `cart-abandonment-behavior.test.ts` (24 tests)
Tests behavior and accessibility:
- ✅ **Behavior**:
  - `previewMode` (boolean)
  - `showCloseButton` (boolean)
  - `closeOnOverlayClick` (boolean)
  - `closeOnEscape` (boolean)
  - `autoCloseDelay` (number in milliseconds)
- ✅ **Accessibility**:
  - `ariaLabel` (string)
  - `ariaDescribedBy` (string)
- ✅ **Metadata**:
  - `campaignId` (string)
  - `challengeToken` (string)

---

### 3. Discount Configuration Tests

#### `cart-abandonment-discount.test.ts` (42 tests)
Tests all discount configuration options from `DiscountConfigSchema`:
- ✅ **Basic Settings**:
  - `enabled` (boolean, default: false)
  - `showInPreview` (boolean, default: true)
- ✅ **Discount Type & Value**:
  - `type`: 'shared' | 'single_use'
  - `valueType`: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  - `value` (number ≥ 0)
  - `code` (string)
- ✅ **Delivery Mode**:
  - `deliveryMode`: 'auto_apply_only' | 'show_code_fallback' | 'show_code_always' | 'show_in_popup_authorized_only'
  - `requireLogin` (boolean)
  - `storeInMetafield` (boolean)
  - `authorizedEmail` (email string)
  - `requireEmailMatch` (boolean)
- ✅ **Expiry & Limits**:
  - `expiryDays` (number ≥ 1)
  - `minimumAmount` (number ≥ 0)
  - `usageLimit` (integer ≥ 1)
- ✅ **Auto-Apply & Presentation**:
  - `autoApplyMode`: 'ajax' | 'redirect' | 'none' (default: 'ajax')
  - `codePresentation`: 'show_code' | 'hide_code' (default: 'show_code')
- ✅ **Customer Eligibility**:
  - `customerEligibility`: 'everyone' | 'logged_in' | 'segment'
- ✅ **Combining Rules**:
  - `combineWith.orderDiscounts` (boolean)
  - `combineWith.productDiscounts` (boolean)
  - `combineWith.shippingDiscounts` (boolean)
- ✅ **Metadata**:
  - `prefix` (string)
  - `description` (string)

---

### 4. Integration Tests

#### `cart-abandonment-integration.test.ts` (17 tests)
Tests real-world configuration scenarios:
- ✅ Basic cart abandonment with urgency timer
- ✅ Email-gated cart recovery with discount
- ✅ Cart abandonment with stock warnings and urgency
- ✅ Minimal configuration (verifies defaults)
- ✅ Maximal configuration (all options together)
- ✅ Percentage discount with auto-apply
- ✅ Fixed amount discount with code display
- ✅ Free shipping discount
- ✅ Email-authorized discount
- ✅ Discount with usage limits
- ✅ Edge cases and validation errors
- ✅ Type safety for all enum values

---

## Configuration Options Summary

### Content Configuration (~25 options)
- Base fields: 7 options
- Cart display: 4 options
- Urgency & scarcity: 5 options
- Email recovery: 6 options
- CTA: 2 options

### Design Configuration (~35 options)
- Colors: 13 options
- Background image: 3 options
- Layout & positioning: 7 options
- Typography: 3 options
- Visual effects: 3 options
- Images: 2 options
- Button: 1 option
- Behavior: 5 options
- Accessibility: 2 options
- Metadata: 2 options

### Discount Configuration (~25 options)
- Basic settings: 2 options
- Type & value: 4 options
- Delivery: 5 options
- Expiry & limits: 3 options
- Auto-apply: 2 options
- Eligibility: 1 option
- Combining: 3 options (nested)
- Metadata: 2 options

**Total: ~85 configuration options tested**

---

## Running the Tests

```bash
# Run all cart abandonment tests
npm run test:run -- tests/unit/domains/campaigns/cart-abandonment tests/unit/domains/storefront/cart-abandonment

# Run specific test file
npm run test:run -- tests/unit/domains/campaigns/cart-abandonment-schema.test.ts

# Run with coverage
npm run test:run -- --coverage tests/unit/domains/campaigns/cart-abandonment
```

---

## Test Quality

- ✅ **100% option coverage**: Every configuration option is tested
- ✅ **Validation testing**: Tests both valid and invalid inputs
- ✅ **Default values**: Verifies all default values are correct
- ✅ **Edge cases**: Tests boundary conditions and error cases
- ✅ **Type safety**: Validates all enum values
- ✅ **Integration**: Tests realistic combinations of options
- ✅ **Zod schema validation**: Uses actual schema validation (not mocks)

