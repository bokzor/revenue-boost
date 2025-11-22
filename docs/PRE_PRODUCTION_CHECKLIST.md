# Revenue Boost – Pre‑Production Readiness (Corrected)

## Context & corrections

- This document supersedes the earlier high‑level notes in `docs/todo.md` for **go‑live readiness**.
- **Enhanced triggers are already implemented end‑to‑end**:
  - Schema: `EnhancedTriggersConfigSchema` in `app/domains/campaigns/types/campaign.ts`.
  - Defaults: seeded per template in `prisma/template-data.ts`.
  - Server‑side filtering: `CampaignFilterService.filterCampaigns` (device, page, audience, variant, frequency).
  - Storefront evaluation: `TriggerManager` in `extensions/storefront-src/core/TriggerManager.ts`.
- **Frequency capping is implemented and wired into selection**:
  - Redis‑backed `FrequencyCapService` in `app/domains/targeting/services/frequency-cap.server.ts`.
  - Used from `CampaignFilterService.filterByFrequencyCapping` and the `/api.campaigns.active` route (via `CampaignFilterService.filterCampaigns`).
  - Template‑specific defaults + help text live in `app/domains/campaigns/utils/frequency-defaults.ts` and are surfaced via `FrequencyCappingPanel`.
- What is **still missing** is primarily **admin‑side configuration and UX wiring** (e.g. `TargetingStep` placeholder), CI hardening, and some compliance/operational pieces.

---

## 1. Pre‑production checklist (by priority)

### 🔴 Critical (must be done before production)

1. **Build, type safety & CI**
   - Ensure all of these succeed locally:
     - `npm run build`
     - `npm run lint`
     - `npm run typecheck`
     - `npm run test:run`
     - `npm run test:e2e`
   - Re‑enable TypeScript checking in CI (currently disabled in `unit-and-storefront-tests.yml`).
   - Ensure CI runs on the actual release branch(es) (e.g. `campaign-form`, `main`) for PRs.

2. **Database migrations & environments**
   - Confirm all Prisma models in `schema.prisma` have corresponding migrations and that:
     - `npx prisma migrate dev` runs cleanly in dev.
     - `npx prisma migrate deploy` is part of the production deploy pipeline.
   - Configure **three distinct Postgres URLs**: dev, test, production.
   - Verify key constraints/indices behave as expected (e.g. unique constraints on `Lead`, `CustomerSegment`).

3. **Security, abuse prevention & app proxy hardening**
   - For all `/apps.revenue-boost.*` routes, verify **Shopify app proxy HMAC validation** is enforced.
   - Confirm `ChallengeToken` and `RateLimitLog` are used in:
     - `api.challenge.request` / `apps.revenue-boost.api.challenge.request`.
     - `api.discounts.issue` / `apps.revenue-boost.api.discounts.issue`.
   - Ensure rate limits and one‑time tokens are correctly enforced and tested.
   - Validate all public JSON endpoints with Zod (or equivalent) and sanitize free‑text fields written to DB/logs.

4. **GDPR / privacy compliance (required for Shopify review)**
   - Implement and register mandatory privacy webhooks:
     - `customers/data_request`
     - `customers/redact`
     - `shop/redact`
   - On those webhooks, locate and delete/anonymize **Lead**, **PopupEvent**, **CampaignConversion**, and other PII rows for the relevant shop/customer.

5. **Core flow coverage (admin + storefront)**
   - Ensure there are **passing E2E tests** for at least:
     - First‑time setup (`/app.setup`) and app load (`/app`).
     - Creating a campaign: select goal → select template → configure content & design → save → verify in DB.
     - Editing a campaign and viewing analytics.
     - Storefront popup flow: active campaign selection via `/apps.revenue-boost.api.campaigns.active`, popup display, lead submission, discount issuing, popup events logging.
   - Make these tests deterministic and part of the CI pipeline.

6. **Targeting & triggers in the campaign wizard (admin UX wiring)**
   - `TargetingStep` (`app/domains/campaigns/components/steps/TargetingStep.tsx`) is currently a **placeholder**.
   - Integrate existing targeting components from `app/domains/targeting/components`:
     - `UnifiedTriggerEditor`, `PageTargetingPanel`, `AudienceTargetingPanel`.
     - `FrequencyCappingPanel` and related helpers.
   - Wire them into `CampaignFormData` so edits persist to `Campaign.targetRules` (including `enhancedTriggers` and audience/page rules).
   - Add unit and E2E tests to confirm that **admin settings actually affect storefront selection**, which already respects these rules.

7. **Environment & deployment configuration**
   - Provide an up‑to‑date `.env.example` with all required vars (Shopify API keys, `SHOPIFY_APP_URL`, `DATABASE_URL`, Redis, scopes, etc.).
   - Verify production deploy is built with `NODE_ENV=production` and that the theme app extension is built (`npm run build:storefront`) and enabled by default in a test theme.

### 🟠 High (should be done before or soon after launch)

1. **Timezone‑aware scheduling & countdowns**
   - `app/routes/api.time.tsx` currently hard‑codes `shopTimezone = "UTC"`.
   - Fetch each shop’s real timezone via the Admin API, cache it, and use it for:
     - Campaign start/end times.
     - Countdown timers.
     - Time‑bucketed analytics.

2. **Performance & caching**
   - Add caching (in‑memory or Redis) for hot paths:
     - Active campaign selection per store.
     - Social proof notification payloads.
     - Template metadata.
   - Audit storefront bundle size (under `extensions/storefront-popup/assets`) and avoid unnecessary dependencies.


4. **Billing flows (if charging at launch)**
   - Audit `app/domains/billing` for completeness:
     - Plan selection UI.
     - Subscription/usage charge creation.
     - Billing webhooks handling.
   - If billing is not ready, position the app as free for v1 and hide or gate incomplete billing UI.

5. **Observability & operations**
   - Add structured logging (including store ID, campaign ID, visitor ID where appropriate).
   - Integrate error tracking (e.g. Sentry) in both admin and storefront code paths.
   - Ensure `/api.health` is wired into external monitoring.

### 🟡 Medium (important quality / DX improvements)

1. **Type system migration clean‑up**
   - Complete the remaining steps in `docs/TYPE_SYSTEM_DIAGRAM.md` (Phases 2 & 3):
     - Remove any temporary field‑mapping layers between templates, previews, and storefront popups.
     - Ensure all templates and campaigns use the unified `contentConfig` + `designConfig` types directly.

2. **Template & social proof enhancements**
   - Decide MVP scope for advanced social proof (Tier 2 / Tier 3 in `app/domains/social-proof/README.md`).
   - Implement only what is needed for launch; clearly hide or label “coming soon” features in the UI.

3. **Developer ergonomics & docs**
   - Replace or augment the template README with a **Revenue Boost–specific** overview:
     - What features exist.
     - How templates/campaigns/experiments/analytics tie together.
     - How to run dev, tests, and deploy.
   - Add a short “How to add a new template” / “Architecture overview” doc that points to deeper docs (e.g. `ARCHITECTURE_DIAGRAM.md`, `TYPE_SYSTEM_DIAGRAM.md`).

4. **Linting & test hygiene**
   - Consider re‑enabling ESLint on `tests/**` and fixing violations to catch async/cleanup issues early.

---

## 2. Critical missing or incomplete features (concise view)

- **Privacy webhooks**: Explicit implementations for `customers/data_request`, `customers/redact`, and `shop/redact` must be added and tested.
- **CI hardening**: Typecheck currently skipped; workflows not aligned with the real release branch; tests must be green and mandatory for merges.
- **Timezone handling**: Shop‑timezone aware scheduling and countdowns are not yet implemented.
- **Type system finalization**: Remaining Type System migration phases are still marked TODO and should be completed soon after the core critical items above.

