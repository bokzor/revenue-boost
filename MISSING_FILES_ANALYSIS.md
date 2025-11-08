# Missing Files Analysis - Split Pop Rework

## Summary
Comparison between original implementation (`/Users/bokzor/WebstormProjects/split-pop/app`) and rework (`revenue-boost/app`)

## Missing Top-Level Directories

### 1. **`app/client/`** ❌ MISSING
- **Original**: `/Users/bokzor/WebstormProjects/split-pop/app/client/`
- **Contains**: `trigger-detection.client.ts` (14KB)
- **Purpose**: Client-side trigger detection logic
- **Status**: NOT present in rework

### 2. **`app/data/`** ❌ MISSING
- **Original**: `/Users/bokzor/WebstormProjects/split-pop/app/data/`
- **Contains**: `segments.ts` (3.6KB)
- **Purpose**: Segment data definitions
- **Status**: NOT present in rework

### 3. **`app/styles/`** ❌ MISSING
- **Original**: `/Users/bokzor/WebstormProjects/split-pop/app/styles/`
- **Contains**: 
  - `design-tokens.css` (8KB)
  - `polaris-overrides.css` (6.5KB)
- **Purpose**: CSS styling and design tokens
- **Status**: NOT present in rework

## Missing Domain Subdirectories

### Commerce Domain
#### Missing: `app/domains/commerce/shopify/` ❌
**Original files**:
- `shopify-functions.server.ts`
- `customer.server.ts`
- `trial.server.ts`
- `pricing.server.ts`
- `shopify-billing.server.ts`
- `shopifyCustomers.server.ts`
- `shop-eligibility.server.ts`
- `webhook.server.ts`
- `store.server.ts`
- `customer-metafields.server.ts`
- `shop-redaction.server.ts`
- `billing.server.ts`

#### Missing: `app/domains/commerce/routes/` ❌
**Original files**:
- `apps.split-pop.product-upsell.$campaignId.tsx`
- `apps.split-pop.commerce.leads.subscribe.tsx`
- `apps.split-pop.commerce.popup-record.tsx`
- `app.billing.tsx`
- `app.billing.confirm.tsx`

#### Missing: `app/domains/commerce/services/` subdirectories ❌
- `services/plans/plan-limits.server.ts`
- `services/cart/cart-integration.server.ts`
- `services/cart/cart-context.server.ts`
- `services/cart/cart-transform.server.ts`
- `services/variant.server.ts`
- `services/upsell-recommendations.server.ts`
- `services/rules-evaluator.server.ts`
- `services/discounts/discount-checkout.server.ts`

#### Missing: `app/domains/commerce/components/` ❌
- `UsageDashboard.tsx`
- `EventVolumeDashboard.tsx`
- `PricingPage.tsx`

#### Missing: `app/domains/commerce/types/` ❌

### Targeting Domain
#### Missing: `app/domains/targeting/routes/` ❌
**Original files**:
- `apps.split-pop.frequency.record.tsx`
- `api.frequency.record.ts`
- `api.segments.tsx`
- `api.seed-segments.tsx`

#### Missing: `app/domains/targeting/services/` subdirectories ❌
- `services/personalization/advanced-segmentation.server.ts`
- `services/personalization/exit-intent.server.ts`
- `services/personalization/personalization.server.ts`
- `services/personalization/audience-targeting.server.ts`
- `services/triggers/enhanced-trigger-evaluation.server.ts`
- `services/triggers/trigger-analytics.server.ts`
- `services/audience/redis-visitor-tracking.server.ts`
- `services/audience/__tests__/redis-visitor-tracking.test.ts`
- `services/audience/shopify-audience-api.server.ts`

#### Missing: `app/domains/targeting/components/` subdirectories ❌
- `components/personalization/PersonalizationEngine.tsx`
- `components/recommendations/SmartRecommendationsPanel.tsx`

### Popups Domain
#### Missing: `app/domains/popups/routes/` ❌
#### Missing: `app/domains/popups/templates/` ❌

### Campaigns Domain
#### Missing: `app/domains/campaigns/routes/` ❌
#### Missing: `app/domains/campaigns/tests/` ❌

## Missing Shared Components

### `app/shared/components/` subdirectories ❌
- `admin/`
- `content/`
- `dashboard/`
- `dashboard/performance/`
- `forms/`
- `i18n/`
- `layout/`
- `onboarding/`
- `performance/`
- `settings/`
- `settings/panels/`
- `validation/`

### `app/shared/services/` ❌ ENTIRE DIRECTORY MISSING
- `content/`
- `contracts/`
- `contracts/__tests__/`
- `infrastructure/`
- `infrastructure/database/`
- `infrastructure/monitoring/`
- `infrastructure/performance/`
- `integrations/`
- `monitoring/`
- `security/`
- `segments/`
- `settings/`
- `ui/`
- `validation/`

### `app/shared/routes/` ❌ MISSING

## Missing Library Files

### `app/lib/` subdirectories ❌
- `shared-types/`
- `shopify/`
- `triggers/`

## Missing Routes Structure

The original has a much more complex routes structure:
- `routes/auth/`
- `routes/campaigns/`
- `routes/commerce/`
- `routes/domains/`
- `routes/popups/`
- `routes/shared/`
- `routes/webhooks/`

The rework only has flat route files in `app/routes/`.

## TODO Items Found in Rework

Found **50+ TODO comments** in the rework, including:
1. Stub components with TODO markers
2. Missing implementations for:
   - AnimationControlPanel
   - Affix component
   - MultiStepNewsletterForm
   - CountdownTimerBanner
   - DiscountSection
   - MobileOptimizationPanel
   - ProductPicker
   - FlashSaleModal
   - Trigger models
   - KeyboardShortcutsHelp
   - CollectionPicker

## Critical Missing Files Summary

1. **Client-side code**: `app/client/trigger-detection.client.ts`
2. **Data definitions**: `app/data/segments.ts`
3. **Styles**: All CSS files
4. **Shopify integration**: Entire `commerce/shopify/` directory
5. **Services layer**: Most of `app/shared/services/`
6. **Routes**: Domain-specific route files
7. **Tests**: Campaign tests and other test files
8. **Infrastructure**: Database, monitoring, performance services

## Recommendation

The rework is missing significant portions of the original implementation. Priority should be given to:
1. Copying over critical infrastructure (client, data, styles)
2. Implementing missing Shopify integration layer
3. Adding missing service layers
4. Completing stub components marked with TODO
5. Restructuring routes to match original architecture

