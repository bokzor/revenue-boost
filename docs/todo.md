# NOTE: Canonical go-live checklist has moved

For the up-to-date pre‑production / go‑live checklist, see **`docs/PRE_PRODUCTION_CHECKLIST.md`**. That document supersedes the checklist and readiness analysis below.


Overall assessment
The repo is far beyond the base Shopify React Router template: it has a proper Postgres/Prisma schema for campaigns, templates, experiments, leads, popup events, security models, and a fully-fledged domain layer (app/domains/*), a theme app extension (extensions/storefront-popup), storefront popup components (app/domains/storefront/popups-new), analytics, targeting, social proof, and E2E/unit tests.
However, there are clear signs of “MVP / WIP state”:
Several TODOs in core flows (e.g. targeting UI, timezone handling, unified type system migration).
Docs like TYPE_SYSTEM_DIAGRAM.md explicitly mark Phase 2 & 3 as TODO.
TargetingStep in the campaign wizard is still a placeholder.
QUICK_START_GUIDE.md and BUILD_ISSUES_SUMMARY.md (referenced) indicate past or current build issues and missing components.
CI workflow disables TypeScript typechecking, and only runs on main / epic/goal-first, not the current campaign-form branch.
Below is a prioritized pre‑production checklist and list of missing / incomplete features, with concrete, actionable items.
1. Pre‑Production Checklist
   🔴 Critical priority (must be done before production)
   1.1. Build & runtime stability
   Ensure clean, reproducible builds
   Run locally and in CI:
   npm run build
   npm run lint
   npm run typecheck
   npm run test:run
   npm run test:e2e
   Fix any remaining TypeScript errors, missing imports/components, or failing tests.
   Remove or fully implement any components that are still “under development” placeholders referenced in:
   QUICK_START_GUIDE.md (e.g. CountdownTimerBanner, AnimationControlPanel, MobileOptimizationPanel, ProductPicker, CollectionPicker, etc.).
   Any other stub components returning “TODO: Implement …”.
   Re‑enable full TypeScript checking in CI
   .github/workflows/unit-and-storefront-tests.yml currently does:
   run: echo "TypeScript checking temporarily disabled - tests are the primary validation".
   Replace that with a real typecheck step (e.g. npm run typecheck or tsc --noEmit).
   Fix CI branch coverage
   That same workflow only runs on branches: [main, epic/goal-first].
   Add your actual default/release branches (campaign-form etc.) so every PR destined for production runs:
   Lint
   Typecheck
   Unit tests
   (Optionally) Storefront bundle tests
   1.2. Core flow test coverage
   For production, you need green tests and coverage for all merchant‑critical flows:
   Admin / App (embedded)
   Install + /auth + /app load.
   /app.setup onboarding flow (ensuring required prerequisites are enforced).
   /app.campaigns.new:
   Select goal → select template → configure content + design.
   Configure targeting (once implemented) and discounts.
   Save campaign, verify in DB (Campaign row with correct JSON fields).
   /app.campaigns.$campaignId view + edit + analytics pages.
   /app.experiments.* create, start, stop, declare winner, analytics.
   Plans/billing gating (if you intend to charge) via app/domains/billing.
   Storefront
   App extension loads correctly (from extensions/storefront-popup), and the storefront bundle (extensions/storefront-src) renders:
   Newsletter popup.
   Spin-to-win.
   At least a few other template types.
   Active campaign selection via /apps.revenue-boost.api.campaigns.active:
   Honors Campaign.status, dates, and targeting rules.
   Lead submission /apps.revenue-boost.api.leads.submit:
   Records Lead, issues discounts (where configured), and logs PopupEvents.
   Analytics tracking endpoints (api.analytics.track, api.analytics.frequency) are hit and behave as expected (no perf issues).
   Action:
   Extend or confirm E2E coverage in tests/e2e:
   admin-campaign-flow.spec.ts
   admin-newsletter-form.spec.ts
   storefront-smoke.spec.ts
   ab-testing-goal-sync.spec.ts
   Make sure:
   They follow your latest UX (data‑test‑id strategy).
   They run successfully and deterministically on CI.
   1.3. Database migrations & data integrity
   Confirm migrations match schema.prisma
   Generate & apply migrations for all current models (Session, Store, Campaign, Template, Experiment, Lead, PopupEvent, CampaignConversion, ChallengeToken, RateLimitLog, etc.).
   Ensure prisma/migrations exists and:
   npx prisma migrate dev runs cleanly in dev.
   npx prisma migrate deploy is wired into the production deploy flow.
   Set up production Postgres
   datasource db { provider = "postgresql" … } → you need a production‑grade Postgres service.
   Configure DATABASE_URL for:
   Dev
   Test (separate DB, see below)
   Production
   Test data integrity constraints in realistic flows
   @@unique([storeId, campaignId, email]) on Lead → verify duplicate leads behave as expected (idempotency).
   @@unique([storeId, name]) / @@unique([name, isDefault]) on CustomerSegment.
   @@index combinations on Campaign, Template, Lead, PopupEvent → test queries used in analytics/selection to avoid slow scans.
   1.4. Security, abuse prevention & compliance
   Lock down app proxy endpoints
   For all /apps.revenue-boost.* routes (e.g. leads submit, challenge request, discount issue, social proof tracking):
   Verify Shopify app proxy HMAC validation on every request.
   Ensure no unauthenticated external caller can hit these endpoints directly without proper signature.
   Enforce ChallengeToken and RateLimitLog
   ChallengeToken and RateLimitLog models exist to prevent discount abuse. Confirm they are:
   Used in api.challenge.request / apps.revenue-boost.api.challenge.request.
   Used in api.discounts.issue / apps.revenue-boost.api.discounts.issue.
   Enforcing:
   One‑time token usage.
   TTL expiry.
   Per‑IP/email/session rate limits for sensitive actions (discount issuing, challenge requests).
   Input validation everywhere
   For all JSON‑accepting routes (api.leads.submit, api.analytics.track, api.audience.preview, api.social-proof.track, etc.):
   Validate payloads with Zod or equivalent.
   Sanitize free‑text fields written to DB (metadata, pageTitle, referrer) to prevent log/HTML injection.
   GDPR / privacy compliance
   Implement and test mandatory privacy webhooks:
   customers/data_request
   customers/redact
   shop/redact
   Ensure these webhooks:
   Locate relevant Lead, PopupEvent, and CampaignConversion rows by shop/customer.
   Delete or anonymize as required.
   Required for Shopify app review.
   1.5. Environment & deployment configuration
   Environment variables
   Provide a canonical .env.example covering:
   SHOPIFY_API_KEY, SHOPIFY_API_SECRET
   SHOPIFY_APP_URL
   DATABASE_URL
   SCOPES
   Any Redis/queue endpoints (for social proof, etc.)
   Sentry/logging keys if used.
   Verify prod is deployed with NODE_ENV=production.
   Test isolation
   Ensure Playwright + Vitest tests run against a dedicated test DB:
   Use a separate DATABASE_URL for tests.
   Tests should not touch dev or prod data.
   Wire this into the test commands used by CI.
   Shopify configuration
   Confirm shopify.app.toml (and any prod variant) is correct:
   application_url points to your production host.
   embedded setting matches actual behavior.
   App distribution (AppDistribution.AppStore) aligns with app plans.
   Ensure theme app extension (extensions/storefront-popup) is:
   Built with npm run build:storefront.
   Deployed and enabled as an app embed by default in your demo/test theme.
   🟠 High priority (should be done before or soon after launch)
   1.6. Targeting, scheduling, and timezone accuracy
   Implement targeting configuration UI
   TargetingStep (app/domains/campaigns/components/steps/TargetingStep.tsx) is currently a placeholder with a TODO.
   You already have a sophisticated targeting domain (app/domains/targeting/*) and Campaign.targetRules / CustomerSegment models.
   Connect:
   Targeting editors in the admin UI.
   Zod validation for targetRules.
   Serialization to the Campaign.targetRules JSON field.
   Evaluation on the storefront (which campaigns are active for a given visitor/page).
   Timezone correctness
   app/routes/api.time.tsx has a TODO:
   Currently hardcodes shopTimezone = "UTC".
   For countdown timers, schedules, and possibly analytics grouping, fetch the shop’s real timezone from Shopify and cache it per shop.
   Audit any time‑based logic (start/end dates, “last 24h” analytics) to ensure they use the correct timezone.
   1.7. Performance & scalability
   Cache hot paths
   Add caching (memory/Redis) where appropriate:
   Active campaigns for a store (campaign selection query).
   Social proof notification payloads (already designed in social-proof/README.md).
   Template metadata.
   Tune TTLs based on README guidelines (e.g. 30‑second API cache, 5‑minute visitor counts).
   Avoid heavy synchronous work in request handlers
   Offload heavier analytics or audience sync tasks to background jobs if necessary, or carefully batch queries so API endpoints stay fast.
   Storefront bundle size & performance
   Check the built storefront asset (under extensions/storefront-popup/assets) for:
   Avoiding unnecessary dependencies.
   Lazy loading non‑essential logic if possible.
   1.8. Observability and operations
   Add:
   Structured logging (correlating admin + storefront flows, campaign IDs, store IDs).
   Error tracking (e.g., Sentry) for both admin and storefront runtimes.
   A simple /api.health or equivalent (you already have api.health.tsx) integrated into monitoring.
   1.9. Documentation
   Replace the template README with:
   Overview of Revenue Boost features.
   How campaigns/templates/experiments/analytics fit together.
   Setup instructions specific to this app (not just base template).
   Deployment checklist summarizing the above.
   Add:
   Merchant‑facing docs (how to create a campaign, how targeting works, what templates are available).
   Privacy/billing docs for Shopify app review (links to privacy policy & support).
   🟡 Medium priority (quality / UX / “nice‑to‑have” before or shortly after launch)
   Clean up transitional typing / deprecated types
   docs/TYPE_SYSTEM_DIAGRAM.md lists:
   Phase 2 and 3 as TODO (removing temporary field mapping, updating TemplatePreview and PopupDesignEditorV2, removing deprecated PopupConfig).
   Complete the migration so:
   Everything uses the unified content + design config types.
   No temporary mapping layers remain.
   UI/UX polish
   Ensure all templates have:
   Reasonable default copy and design.
   Clear empty states and error states in the admin.
   Confirm frequency capping and campaign priority options are intuitive and surfaced clearly in the admin (per your earlier preferences).
   Extended test coverage
   Add unit tests for:
   Targeting evaluators.
   Discount issuing logic.
   Rate limiting / ChallengeToken workflows.
   Add E2E tests for:
   A few more templates beyond newsletter (spin‑to‑win, flash sale, etc.).
   Social proof basic flow (notifications appear, tracking works).
2. Critical Missing or Incomplete Features
   Here I’ll call out specific gaps visible in the code/docs, again by priority.
   🔴 Critical missing/incomplete features
   Audience targeting editor not implemented in the campaign wizard
   File: app/domains/campaigns/components/steps/TargetingStep.tsx
   Current state: simple card with “Targeting editors will be integrated here.”
   Impact:
   Merchants cannot configure when/where/who sees a campaign via the UI.
   Campaign.targetRules model and app/domains/targeting/* logic exist but aren’t exposed in UX.
   Action:
   Build the full targeting UI (segments, conditions, operators).
   Wire it to CampaignFormData, validation, and targetRules persistence.
   Ensure storefront selection respects these rules and is covered by tests.
   Type system migration incomplete (Template → Preview → Storefront)
   Evidence: docs/TYPE_SYSTEM_DIAGRAM.md:
   Phase 2 (update TemplatePreview, remove temporary field mapping) – TODO.
   Phase 3 (verify seeding, E2E test, remove deprecated PopupConfig) – TODO.
   Risk:
   Admin/editor and storefront popups may diverge if mapping is off.
   Future template changes are harder and more error‑prone.
   Action:
   Locate and remove any intermediate mapping layer.
   Ensure template seeding (prisma/templates-data.*) aligns with campaign/content schemas.
   Update preview/editor components to use unified config types directly.
   Add E2E tests validating end‑to‑end field consistency (content & design).
   Potentially missing or stubbed core admin components
   Evidence: QUICK_START_GUIDE.md lists “Missing Components (from BUILD_ISSUES_SUMMARY.md)”:
   CountdownTimerBanner
   AnimationControlPanel
   MobileOptimizationPanel
   KeyboardShortcutsHelp
   ProductPicker
   CollectionPicker
   “And more…”
   If these are still missing or only stubbed:
   ProductPicker / CollectionPicker are essential for commerce‑driven templates (e.g. product upsell, flash sale).
   Countdown / animation / mobile optimization are key to some template value props.
   Action:
   Audit all imports of these components.
   Either:
   Implement them fully, or
   Remove/feature‑gate references for v1 so builds/tests are clean and merchants don’t see dead UI.
   Incomplete GDPR / data‑privacy implementation
   Current webhooks in routes: webhooks.app.uninstalled, webhooks.orders.create, webhooks.app.scopes_update, but no explicit privacy webhooks seen.
   Shopify app review requires:
   Proper responses to customers/data_request, customers/redact, shop/redact.
   Action:
   Implement and register those webhooks.
   Map them to deletion/anonymization of Lead, PopupEvent, CampaignConversion, and any other PII.
   CI gaps (no full typecheck/tests on production branch)
   As above: CI workflow:
   No TypeScript typecheck step.
   Doesn’t trigger for campaign-form (current default).
   Effectively means breaking changes can land without automated detection.
   🟠 High‑priority missing/incomplete features
   Timezone‑aware scheduling and countdowns
   api.time.tsx hardcodes shopTimezone = "UTC" with a TODO.
   For:
   Countdown timers (e.g., flash sales).
   Campaign schedule start/end.
   Time‑based analytics.
   Action:
   Fetch timezone from the shop (Admin API) once per shop and cache.
   Update all time‑based logic to use shop timezone.
   Social proof Tier 2 & Tier 3 features
   app/domains/social-proof/README.md:
   Tier 1 (purchase, visitor count, sales count) – implemented.
   Tier 2: Cart activity, low stock alerts – TODO.
   Tier 3: Reviews, newsletter sign‑ups, fast shipping timer – planned.
   For an MVP, Tier 1 may be enough; Tier 2 features are strong differentiators.
   Action:
   Decide MVP scope:
   If cart activity & low stock are in your marketing promises, implement them before launch.
   Otherwise, clearly mark them as “coming soon” and hide any non‑functional UI.
   Billing flows (if you plan to charge)
   There’s a app/domains/billing domain, but we haven’t inspected its completeness.
   Production app store listing typically needs:
   Plan selection in admin.
   Shopify billing subscriptions / usage charges.
   Handling of billing webhooks.
   Action:
   Verify end‑to‑end billing flows exist and are tested (unit + e2e), or
   Position the app as free at launch and hide any half‑implemented billing UI.
   Frequency capping UI & behavior confirmation
   There is an endpoint api.analytics.frequency.tsx and schema support for analytics.
   From prior preferences: persistent templates (FREE_SHIPPING, ANNOUNCEMENT, etc.) should respect frequency capping with clear UI.
   Action:
   Ensure:
   Campaign creation/editing exposes frequency capping controls.
   Storefront selection logic uses them.
   At least one E2E test asserts that a popup does not show more than allowed per user/session.
   🟡 Medium‑priority missing/incomplete features
   Advanced social proof options & A/B testing integration
   TODOs in social-proof/README.md include:
   WebSocket support (optional).
   A/B testing for notification types.
   Analytics dashboard for social‑proof performance.
   Nice‑to‑have for v1, but not required to be “production‑ready” if Tier 1 is solid.
   Developer ergonomics & documentation gaps
   README is still the generic Shopify app template README, not specific to Revenue Boost.
   There are good internal docs (ARCHITECTURE_DIAGRAM.md, docs/TYPE_SYSTEM_DIAGRAM.md, app/domains/*/README.md), but:
   Onboarding a new dev still requires jumping between multiple docs.
   Action:
   Add a top‑level “Architecture overview” and “How to add a new template / domain guide”.
   Summarize critical design decisions (already in WARP.md) in a shorter CONTRIBUTING/DEV_GUIDE.
   Linting for tests
   .eslintignore ignores tests/**.
   Not a blocker, but:
   Allowing lint on tests can catch subtle async bugs and unused imports.
   Action:
   Optionally re‑enable ESLint on tests/ and fix any violations
