# Plan Management & Settings Page – Technical Design Document

## 1. Architecture Overview

### 1.1 High-Level System Design

- **Plan definitions (static config)**
  - Single source of truth for tiers `FREE`, `STARTER`, `GROWTH`, `PRO`, `ENTERPRISE` (matching `docs/PRICING.md`).
  - Contains feature matrix, numeric limits, **monthly pricing**, and **monthly impression caps**.
  - Implemented as Zod-typed config in `app/domains/billing/types/plan.ts`.
- **Store plan state (per-merchant, in DB)**
  - `Store` model fields: `planTier`, `planStatus`, `trialEndsAt`, `currentPeriodEnd`.
  - Used for enforcement, trial behavior, and UI.
- **Plan guard service**
  - Centralizes limit and feature checks for a store.
  - Called from domain services (campaigns, experiments, etc.).
- **Settings page (`/app/settings`)**
  - Shows current plan, limits, usage, and available plans.
  - Provides upgrade/downgrade CTAs (wired to Shopify billing later).

### 1.2 Plan Limit Enforcement Across the App

- **Primary enforcement: service layer**
  - `PlanGuardService` enforces limits before domain mutations:
    - `CampaignService.createCampaign` → check active-campaign limit.
    - `ExperimentService.createExperiment` → check experiments & variants.
- **Secondary enforcement: API layer**
  - API routes catch plan errors and map them to HTTP 4xx with structured JSON.
  - Frontend uses this to show upgrade prompts and limit messages.
- **Initial enforced features**
  - Max active campaigns.
  - Experiments (A/B testing) and number of active experiments.
  - Variants per experiment.
  - Custom templates.
  - Advanced targeting / advanced analytics (as those features are wired).

### 1.3 Shopify Billing Integration (Conceptual, Later Phase)

- Long-term: integrate Shopify Billing API to create/update subscriptions.
- Store subscription outcome in `Store.planTier`, `planStatus`, `currentPeriodEnd`.
- Add a billing callback route to confirm subscriptions and update the store.
- Phase 1 (now): no live billing; plan changes are handled locally via Settings.

## 2. Data Model Design

### 2.1 Prisma Schema Changes

- Extend `Store` model with plan fields:
  - `planTier: PlanTier @default(FREE)`
  - `planStatus: PlanStatus @default(TRIALING)`
  - `trialEndsAt: DateTime?`
  - `currentPeriodEnd: DateTime?`
- Add enums:
  - `PlanTier = FREE | STARTER | GROWTH | PRO | ENTERPRISE`.
  - `PlanStatus = TRIALING | ACTIVE | PAST_DUE | CANCELLED`.
- Migration:
  - `npx prisma migrate dev --name add_store_plan_fields`.
  - Existing records default to `FREE` / `TRIALING` with null dates.

### 2.2 Rationale: Extend `Store` vs Separate `Subscription`

- **Extend `Store` (chosen)**
  - Simple, no extra joins; `Store` is already central per-merchant.
  - Good fit while the app is pre-launch and billing is simple.
- **Separate `Subscription` (future option)**
  - Useful for history or complex billing products.
  - Can be layered later; `Store.plan*` can remain as a cached view.

## 3. Plan Definitions & Limits

### 3.1 Plan Config (Static)

- Implemented in `app/domains/billing/types/plan.ts` using Zod:
  - `PlanTierSchema`, `PlanStatusSchema`.
  - `PlanLimitsSchema` (limits + feature flags).
  - `PlanDefinitionSchema` including:
    - `pricePerMonth: number`
    - `currency: "USD"` (for now)
    - `monthlyImpressionCap: number | null`
  - `PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition>`.
  - `PLAN_ORDER: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"]`.

### 3.2 Feature Matrix (Aligned with `docs/PRICING.md`)

- **FREE**
  - Price: `$0 / month`
  - Monthly impressions: up to **5,000 / month**
  - Limits: `maxActiveCampaigns = 1`, `maxExperiments = 0`, `maxVariantsPerExperiment = 0`, `maxCustomTemplates = 0`.
  - Features: basic templates, basic analytics (views/conversions), “Powered by” branding, no A/B tests, no advanced targeting, no custom templates, no advanced analytics.

- **STARTER**
  - Price: `$9 / month`
  - Monthly impressions: up to **25,000 / month**
  - Limits: `maxActiveCampaigns = null` (unlimited campaigns), no experiments, no advanced targeting/analytics enforced yet.
  - Features: all standard templates, basic targeting (page URL, device, simple timing rules), basic analytics (CTR, signups/leads), 1 ESP integration, no A/B tests.

- **GROWTH** (main plan)
  - Price: `$29 / month`
  - Monthly impressions: up to **100,000 / month**
  - Limits: reasonable caps on experiments/variants (for example, internal `maxExperiments` and `maxVariantsPerExperiment` values).
  - Features: everything in Starter plus A/B testing (variants per campaign), advanced targeting (UTM, traffic source, new vs returning visitors, etc.), multiple integrations (ESP + CRM + webhooks), more detailed analytics, priority email support.

- **PRO**
  - Price: `$79 / month`
  - Monthly impressions: up to **400,000 / month**
  - Limits: high or unlimited caps (for example, `maxExperiments = null`, higher `maxVariantsPerExperiment`, `maxCustomTemplates = null`).
  - Features: everything in Growth plus unlimited A/B tests, advanced segments (buyers vs non-buyers, high-LTV segments, etc.), higher limits on API calls and stored events, faster support SLA.

- **ENTERPRISE** (“Scale / Enterprise”)
  - Starting price: `$149+ / month`
  - Monthly impressions: `> 400,000 / month` (cap or base + overage, TBD).
  - Limits: customized per merchant (impressions, API usage, etc.).
  - Features: everything in Pro plus custom SLAs and onboarding, custom integrations, and optional outcome-based pricing elements for large merchants.

## 4. Enforcement Strategy

### 4.1 PlanGuardService

- New service (e.g., `app/domains/billing/services/plan-guard.server.ts`).
- Responsibilities:
  - `getPlanContext(storeId)` → combines `Store` + `PLAN_DEFINITIONS`.
  - `assertCanCreateCampaign(storeId)` → checks active-campaign count vs limit.
  - `assertCanCreateExperiment(storeId, variantCount)` → checks experiment/variant limits.
  - `assertFeatureEnabled(storeId, featureKey)` → checks feature flags (advanced targeting, analytics, custom templates, etc.).
- Called from domain services before performing mutations.

### 4.2 Error Handling & API Mapping

- New error type (e.g., `PlanLimitError` in `app/domains/billing/errors.ts`).
  - Extends the existing `ServiceError` pattern.
  - Fields: `code`, `httpStatus`, `details` (limit name, current/max, plan tier, etc.).
- API routes rely on `handleApiError` to convert plan errors into:
  - `HTTP 403/422` with structured payload for the frontend.
  - Example codes: `PLAN_LIMIT_EXCEEDED`, `FEATURE_NOT_AVAILABLE_ON_PLAN`.

### 4.3 UX for Upgrade Prompts

- When a limit is exceeded (e.g., campaign creation):
  - Backend throws `PlanLimitError`.
  - Frontend shows a clear banner explaining the limit and current plan.
  - Provide a CTA to visit `/app/settings` (and later directly trigger billing flows).
- In the UI (e.g., A/B testing toggle):
  - Disable controls if feature is not available on current plan.
  - Show helper text such as “Available on Basic and Pro plans”.

## 5. Settings Page Design

### 5.1 Route & Data Flow

- New route: `app/routes/app.settings.tsx` → `/app/settings`.
- Add nav link in `app/routes/app.tsx`.
- **Loader**:
  - Authenticates admin and resolves `storeId`.
  - Loads `Store` (plan fields) and enriches with `PLAN_DEFINITIONS` and `PLAN_ORDER`.
  - Optionally computes usage (active campaigns/experiments).
- **Action** (Phase 1):
  - Handles plan change requests (`targetPlanTier`).
  - Validates downgrade rules (see section 7.4).
  - Updates `Store.planTier` / `planStatus` for dev/manual control.

### 5.2 UI Structure

- Polaris layout with two main sections:
  - **Plan & Billing**
    - Current Plan card: plan name, tier/status badge, trial info, next billing date.
    - Price + impressions line (e.g., `Growth · $29/month · up to 100k impressions/month`).
    - Usage summary (e.g., `2 / 3` active campaigns vs the plan’s limit, if applicable).
    - Primary CTA: “Upgrade plan” or “Manage plan”.
  - **Plan Comparison**
    - Table comparing FREE / STARTER / GROWTH / PRO / ENTERPRISE with:
      - Price per month
      - Monthly impressions cap
      - Key features (A/B testing, targeting, integrations, analytics, etc.).
    - Each non-current tier has a “Choose [Tier]” button posting to the action.
- **General Settings** (placeholder)
  - Reserved for future configuration (tracking, defaults, etc.).

## 6. Implementation Plan

1. **Data model & plan config**
   - Update Prisma schema and run migration.
   - Finalize `app/domains/billing/types/plan.ts` definitions.
2. **Plan guard & errors**
   - Implement `PlanGuardService`.
   - Implement `PlanLimitError` and integrate with `handleApiError`.
3. **Wire enforcement**
   - Call guard methods from `CampaignService` and `ExperimentService` create flows.
   - Ensure API routes surface structured plan errors.
4. **Settings route & UI**
   - Implement `/app/settings` route (loader, action, component).
   - Add reusable billing components (`PlanSummaryCard`, `PlanComparisonTable`).
   - Add Settings link to the main navigation.
5. **Testing**
   - Unit tests for `PLAN_DEFINITIONS` and `PlanGuardService`.
   - E2E test for plan management and limit enforcement via real UI flows.

## 7. Decisions & Future Work

### 7.1 Billing Strategy (Decision)

- **Chosen now**: Option B – manual/local plan control, no live Shopify billing yet.
- Rationale: faster iteration on UX and limits during early development.
- Future: integrate Shopify Billing API to back plan changes with real subscriptions.

### 7.2 Trial Behavior (Decision)

- Trial length: **14 days**.
- During trial:
  - Store behaves as if on the **GROWTH** plan (`planTier = GROWTH`, `planStatus = TRIALING`).
- On trial expiry without a paid subscription:
  - Automatically downgrade to **FREE**.
  - Implementation detail (later): scheduled job or lazy check on admin access.

### 7.3 Grandfathering (Future Work)

- Not needed for initial launch (no existing users).
- Future: may introduce `legacyFlags` or similar if limits change post-launch.

### 7.4 Downgrades (Decision)

- Downgrades are **blocked** if current usage exceeds the target plan’s limits.
  - Example: cannot downgrade to STARTER if usage exceeds its caps (for example, active campaigns or enforced impression/feature limits).
- UX: Settings action returns a clear error listing what must be reduced (e.g., number of active campaigns/experiments) before the downgrade can proceed.

