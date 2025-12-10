# SOLID / DRY Opportunities

Quick inventory of duplicated logic and SOLID violations that are currently active in the app. Use this as a checklist for small refactors that reduce drift and make future changes safer.

## 1) Bulk campaign actions repeat the same flow
- Where: `app/routes/app._index.tsx:150-244`
- Pattern: Each intent (activate/pause/archive/delete/duplicate) repeats: parse IDs → `Promise.allSettled` → count failures → `data({ success, message })`.
- Risk: Any change to error handling, logging, or status mapping must be copied 5 times.
- Suggested refactor: Introduce an intent → handler map (e.g., `runBulkAction(intent, updater, successCopy)`) or a tiny `BulkCampaignActions` helper that encapsulates the shared flow, leaving only the intent-specific mutation functions inline.

## 2) Campaign duplication rules diverge **[COMPLETED]**
- Where:
  - Bulk duplicate: `app/routes/app._index.tsx:208-244`
  - Single duplicate (same file): `app/routes/app._index.tsx:246-270`
  - Detail page duplicate: `app/routes/app.campaigns.$campaignId.tsx:225-254`
- Pattern: Three places build “copy” payloads differently (e.g., stripping experiment association vs. posting the full campaign object).
- Risk: Copies can drift (status resets, experiment detach, date handling). Bugs will be subtle because copies succeed but differ.
- Suggested refactor: Add `CampaignDuplicator` in the domain that accepts a campaign and returns sanitized `CampaignCreateData` (resets status, removes experiment/variant keys, resets dates). All callers use it; UI POST becomes a thin wrapper.

## 3) API mutation paths are split and only partially sanitized **[PARTIALLY COMPLETED - Security Fix Applied]**
- Where:
  - Query-param route: `app/routes/api.campaigns.tsx` (POST/PUT/DELETE via `?id=...`)
  - Path-param route: `app/routes/api.campaigns.$campaignId.tsx` (PUT/DELETE `/api/campaigns/:campaignId`)
- Observations: Only the query-param route sanitizes `designConfig.customCSS`; the path-param route does not. Frontend uses the path-param route for save/delete, while create uses the query-param route.
- Risk: Validation behavior diverges; someone fixing validation in one route can forget the other.
- Suggested refactor: Extract design-config sanitization into a shared validator (e.g., `domains/campaigns/validation/design-config.ts`) and call it from both routes. Longer-term, consolidate to one mutation entry point and keep any legacy path behind a thin proxy.

## 4) Campaign-to-form mapping is duplicated with different defaults
- Where:
  - `campaignToCampaignData` in `app/routes/app.campaigns.$campaignId_.edit.tsx:176-240`
  - `campaignToCampaignData` in `app/routes/app.experiments.$experimentId_.edit.tsx:158-198`
- Pattern: Both map `CampaignWithConfigs` → `CampaignData` but diverge on defaults (audience targeting gating, page targeting defaults, frequency defaults, schedule shape).
- Risk: UI behavior differs between single-campaign edit and experiment edit (e.g., free-plan targeting visibility, frequency caps).
- Suggested refactor: Create a shared mapper in the campaigns domain (e.g., `domains/campaigns/utils/campaign-mapper.ts`) that accepts an options bag (plan gating, include schedule) to keep a single source of defaults.

## 5) Targeting/frequency defaults scattered in UI validation
- Where: `app/domains/campaigns/components/unified/SingleCampaignFlow.tsx:375-450` hard-codes defaults for targeting and frequency; additional defaults exist in the per-route mappers above.
- Risk: Validation and initial state can drift from route loaders, causing “required” warnings in one flow but not another.
- Suggested refactor: Centralize targeting/frequency default objects in a small `targeting-defaults.ts` module and reuse in both loaders and `SingleCampaignFlow`.

## 6) Discount strategy inference duplicated **[COMPLETED]**
- Where:
  - `inferStrategy` and `normalizeDiscountConfig` in `app/routes/api.discounts.issue.tsx:1-74`
  - Strategy selection also lives in `domains/commerce/services/discount.server.ts` (strategy list and application)
- Risk: API-layer inference can diverge from domain-layer strategy handling; adding a new strategy would require two updates.
- Suggested refactor: Move normalization/strategy inference into the commerce discount service and let the route call that shared function.

## 7) Two campaign update routes (overlap)
- Where: `app/routes/api.campaigns.tsx` (`PUT ?id=`) and `app/routes/api.campaigns.$campaignId.tsx` (`PUT /:campaignId`)
- Current usage: UI uses the path-param route for updates/deletes; create uses the query-param route. No in-repo callers for `?id=` PUT/DELETE.
- Suggested refactor: Keep one “real” mutation handler and expose the other path as a thin proxy to avoid duplicate validation/auth/logging stacks.

## 8) Design token schemas exist in two places (risk of drift)
- Where:
  - Admin/Zod schema: `app/domains/campaigns/types/design-tokens.ts`
  - Storefront/runtime types: `app/domains/campaigns/types/design-tokens-runtime.ts`
- Pattern: Two hand-maintained representations of the same shape.
- Risk: A token added to the Zod schema might not get added to runtime types (or vice versa), causing runtime styling gaps.
- Suggested refactor: Generate runtime types from the Zod schema (or export inferred types) and keep the runtime file as a thin, dependency-free export built from the source schema to avoid manual sync.

## 9) Custom CSS editor wiring duplicated across design steps
- Where: `DesignStepContent.tsx:243-257`, `DesignContentStep.tsx:192-200`, `DesignOnlyStep.tsx:145-153`, `PopupDesignEditor.tsx:1360-1366` (admin flow)
- Pattern: Multiple components render and wire the same `CustomCSSEditor`/`CustomCSSEditorWithBilling` with slightly different shapes.
- Risk: Feature gating (billing), validation, or prop changes need to be applied in four places.
- Suggested refactor: Extract a single `DesignCustomCssField` component that handles billing gating + change propagation, and reuse it across all design steps/editors.

## 10) Targeting/frequency defaults scattered between loaders and UI
- Where:
  - Loader mapping defaults: `campaignToCampaignData` in edit/experiment routes (see #4)
  - UI validation/state defaults: `SingleCampaignFlow.tsx:375-450`
- Pattern: Default objects for audience/page/geo targeting and frequency caps are defined in multiple places.
- Risk: Draft vs published flows show different defaults or validation results when defaults diverge.
- Suggested refactor: Centralize targeting/frequency default factories (e.g., `domains/targeting/defaults.ts`) and import them in both loaders and UI validation.

## 11) Legacy popup admin/preview stack vs new storefront stack **[COMPLETED]**
- Where:
  - Legacy admin design/preview components under `app/domains/popups/components/design/*` (`PopupDesignEditor`, `PopupPreview`, etc.)
  - New storefront popup system under `app/domains/storefront/popups-new/*` with shared components/layout.
- Pattern: Two distinct stacks for previewing/styling popups; design tokens and layout logic live separately.
- Risk: Visual/behavioral drift between admin preview and storefront rendering; changes to tokens or layout must be applied twice.
- Resolution: Legacy components (`PopupPreview.tsx`, `RealTimePreviewPanel.tsx`) were deleted. Admin flows now use `TemplatePreview.tsx` which shares code with storefront.

## 12) Portal/rendering primitives duplicated
- Where: `PopupPortal.tsx` (modal/backdrop/fullscreen handling) vs `BannerPortal.tsx` (banner-specific) vs `slideins/SlideInPopup.tsx`.
- Pattern: Multiple portal/wrapper implementations each manage visibility state, reduced motion, and animations.
- Risk: Accessibility/reduced-motion fixes or z-index changes must be made in three places; behaviors can diverge between popup types.
- Suggested refactor: Extract a base portal/visibility controller with shared reduced-motion + lifecycle handling, and compose banner/slide-in specifics via options to keep one implementation of the core concerns.

## 13) Frequency capping defaults copied across many recipe files
- Where:
  - Recipe files for each template (e.g., `newsletter-design-recipes.ts`, `flash-sale-design-recipes.ts`, `upsell-recipes.ts`, etc.) hard-code `frequency_capping` objects.
  - Utility exists: `app/domains/campaigns/utils/frequency-defaults.ts` plus components use their own inline defaults.
- Pattern: Same frequency caps repeated per recipe/template.
- Risk: Adjusting default caps (or adding a field) requires touching dozens of files; easy to miss one and create inconsistent behavior.
- Suggested refactor: Move frequency cap defaults into a central factory keyed by template/recipe type (or reuse `frequency-defaults.ts`) and import in recipes to keep a single source of truth.

## 14) Lead capture UI logic split between admin and storefront
- Where:
  - Admin config UI: `app/domains/campaigns/components/sections/LeadCaptureFormSection.tsx` (and template-specific sections use it)
  - Storefront rendering: `app/domains/storefront/popups-new/components/shared/LeadCaptureForm.tsx` + `LeadCaptureLayout.tsx`
- Pattern: Two separate implementations wired to the same `LeadCaptureConfig` shape but not sharing validation/helpers.
- Risk: Adding a field (e.g., consent text) or changing defaults requires edits in both UIs; risk of mismatched placeholders/labels or validation behavior.
- Suggested refactor: Extract shared lead-capture field descriptors + validation helpers (already defined in `LeadCaptureConfigSchema`) and render both admin and storefront forms from the same descriptors where feasible, or at minimum share default builders and validation.

## 15) Popup preview styling vs production styling **[COMPLETED]**
- Where:
  - Admin preview: `app/domains/popups/components/design/PopupPreview.tsx` contains its own style builders (button, close button, container sizing).
  - Storefront/shared styling: `app/domains/storefront/shared/PopupStyles.ts` used by live popups.
- Pattern: Two styling systems for popup preview vs live rendering.
- Risk: Admin preview can diverge from storefront rendering (font sizes, spacing, button styles), leading to surprises after publish.
- Resolution: Legacy `PopupPreview.tsx` deleted. Active preview components use shared logic.

## 16) Multiple popup manager variants
- Where: `PopupManagerCore` + `PopupManagerReact` wrapper + legacy popup/slide-in components under `app/domains/popups` vs new popups under `storefront/popups-new`.
- Pattern: Coexistence of a legacy stack and the new stack; some components still import legacy slide-in/banner implementations.
- Risk: Triggering logic or popup selection can diverge depending on which manager/stack is used; maintenance spread across two systems.
- Suggested refactor: Consolidate on the new `popups-new` + `PopupManagerCore` path; deprecate legacy popups/slide-ins or wrap them behind the same manager API to avoid dual maintenance.

## 17) CSS scoping helpers duplicated per surface
- Where: `buildScopedCss` used across storefront banners (`notifications/BannerPopup.tsx`), popups (`popups-new/*`), and social proof (`notifications/social-proof/*`), sometimes with bespoke inline concatenation.
- Pattern: Each component does its own `globalCustomCSS/customCSS` merge and selector scoping.
- Risk: Selector escaping, ordering, or brand/tenant scoping fixes must be patched in multiple places.
- Suggested refactor: Centralize a `buildScopedCss` helper with presets for popup/banner/social-proof selectors, and have components call the preset instead of re-implementing the merge.

## 18) Error/response handling inconsistently reused
- Where:
  - `api-helpers.server.ts` provides `createSuccessResponse`, `createErrorResponse`, `createMethodRouter`, `createApiLoader`, but several routes hand-roll responses (e.g., some `routes/api.*` use `data(...)` directly) while others use the helpers.
  - `handleApiError` is imported variably across routes.
- Pattern: Mixed patterns for API responses and error handling.
- Risk: CORS headers, status codes, or logging context can diverge between routes.
- Suggested refactor: Standardize on `createMethodRouter`/`createApiLoader` + `handleApiError` in all API routes to keep a single response contract.

## 19) Rate limiting patterns forked
- Where:
  - `lib/rate-limit-middleware.server.ts` for authenticated routes (campaigns, etc.).
  - Routes like `api.discounts.issue.tsx` implement their own rate-limit logic inline (session-based).
- Pattern: Multiple rate-limit flows with different keys/limits sprinkled across routes.
- Risk: Inconsistent behavior and more surface area to update if rate-limit strategy changes.
- Suggested refactor: Expose a shared rate-limit helper that supports session-based keys and reuse it in routes instead of bespoke implementations.

## 20) Template recipes duplicate structural/default data
- Where: Numerous recipe files under `app/domains/campaigns/recipes/*` repeat base sections (hero layout, CTA defaults, frequency caps, targeting defaults).
- Pattern: Copy-paste of similar recipe shapes per template/seasonal variant.
- Risk: Any change to base section structure or defaults requires touching many files; high risk of drift.
- Suggested refactor: Define composable recipe “building blocks” (base layout, base targeting/frequency, base CTA) and assemble recipes from those primitives to reduce copy/paste.

## 21) Slide-in/banner vs popup style systems
- Where: Slide-in popups (`storefront/slideins/SlideInPopup.tsx`) and banners (`popups-new/BannerPortal.tsx`, `notifications/BannerPopup.tsx`) maintain their own style logic; popup styles in `storefront/shared/PopupStyles.ts`.
- Pattern: Parallel styling definitions for different surfaces.
- Risk: Brand color or typography adjustments need to be replicated; inconsistent look and feel across surfaces.
- Suggested refactor: Extend `PopupStyles` (or a shared design-tokens-to-style adapter) to cover slide-ins and banners so all surfaces derive from the same token set.

## 22) Discount config normalization/inference split **[COMPLETED]**
- Where: `api.discounts.issue.tsx` normalizes and infers strategy; `commerce/services/discount.server.ts` implements strategy application; legacy popups discount service re-exports logic.
- Pattern: Cross-layer duplication of discount config shaping.
- Risk: Adding fields or changing defaults requires edits in multiple layers; inference may diverge from execution.
- Suggested refactor: Keep a single discount normalization/inference module in the commerce domain; routes import and apply it before calling strategy execution.

## 23) Auth/storeId retrieval scattered
- Where: Many routes import `getStoreId` directly; some use helper wrappers (`withAuthRateLimit`), others inline.
- Pattern: Mixed patterns for auth + storeId derivation.
- Risk: Drift in error handling or logging, and redundant code to wire auth on each route.
- Suggested refactor: Provide a standard route wrapper for authenticated admin routes that resolves `admin` + `storeId` and applies CORS/rate-limit consistently, to reduce duplication across route files.

## 24) Content validation duplicated client/server
- Where:
  - Admin UI: `SingleCampaignFlow.tsx` calls `validateContentConfig` and `validateCampaignCreateData` client-side.
  - Server: Campaign services/routes validate with Zod schemas.
- Pattern: Two validation passes with similar logic but separately wired.
- Risk: Validation rules can drift; error messages differ. Client may block while server would allow (or vice versa).
- Suggested refactor: Centralize validation helpers that can run isomorphically (e.g., shared `validateCampaignCreateData` exporting a pure function) and have the UI import the same module for sync with server validation messages.

## 25) Campaign duplication logic bypasses domain rules **[COMPLETED]**
- Where:
  - UI duplicate posts full campaign object to `/api/campaigns` (detail page).
  - Bulk/single duplicate in dashboard routes construct payloads manually.
- Pattern: Duplication bypasses domain-level create guards (plan gates, date rules) or applies them inconsistently.
- Risk: Copies might skip important normalizations or validations, leading to subtle data issues.
- Suggested refactor: A domain-level `duplicateCampaign(id, storeId, admin)` that enforces the same invariants as create/update; UI calls this via API to avoid ad-hoc payloads.

## 26) Storefront CSS insertion repeated
- Where: `PopupPortal` injects CSS (adoptedStyleSheets fallback), while other components (e.g., `CountdownTimerPopup` banner mode, `BannerPortal`) inline `<style>` tags for animations.
- Pattern: Multiple ad-hoc CSS injection methods.
- Risk: Harder to manage CSP/style ordering; cross-browser fixes repeated.
- Suggested refactor: Provide a shared stylesheet injection utility (with adoptedStyleSheet fallback) and reuse across components needing dynamic CSS.

## 27) Story/preview vs production paths
- Where: Stories under `stories/` may use legacy components; admin preview uses old stack; storefront uses new stack.
- Pattern: Multiple rendering paths for the same popup types.
- Risk: A bug can be fixed in prod rendering but remain in story/preview, or vice versa, causing confusion.
- Suggested refactor: Align stories/previews to render the same components/hooks as production (via shared adapters) to ensure single-source behavior.

## 28) App proxy pass-through routes duplicated
- Where: `app/routes/apps.revenue-boost.api.*.tsx` files re-export loaders/actions from corresponding `/api/*` routes (analytics.track, campaigns.active, inventory, leads.submit, popups.scratch-card, spin-win, etc.).
- Pattern: One file per proxy with identical boilerplate.
- Risk: Adding a new API route requires adding yet another proxy file; easy to forget, and duplicated boilerplate clutters routes.
- Suggested refactor: Generate these proxies or add a small helper that maps a list of routes to pass-through re-exports, or consolidate via a parameterized proxy handler.

## 29) Segment sync trigger repeated in multiple mutation routes
- Where: `/api/campaigns` (POST/PUT) and `/api/campaigns/:campaignId` (PUT) call `triggerCampaignSegmentSync` with similar options.
- Pattern: Each route wires targeting extraction and calls the sync helper separately.
- Risk: Changes to sync conditions (e.g., when to trigger) must be updated in multiple routes.
- Suggested refactor: Move “post-campaign-update hooks” into the CampaignMutation service (or a shared mutation orchestration layer) so routes only call one mutation entrypoint and hooks run centrally.

## 30) Shopify App Proxy asset/bundle routes
- Where: `apps.revenue-boost.assets.$.tsx` and `apps.revenue-boost.bundles.$bundleName.tsx` likely mirror server-side asset serving logic.
- Pattern: Separate routes for proxying assets/bundles with similar boilerplate.
- Risk: Serving behavior or headers can diverge between proxy and direct routes.
- Suggested refactor: Share a common asset-serving handler and have proxy routes import it to avoid drift.

## 31) Lead capture type/schema defined twice
- Where:
  - Interface + defaults: `app/shared/types/lead-capture-config.ts`
  - Zod schema + inferred type: `app/domains/campaigns/types/campaign.ts` (LeadCaptureConfigSchema)
- Pattern: Interface and schema are kept in sync via a type assertion, but defaults live in one place while schema defaults live in another.
- Risk: Adding a field requires touching both files; defaults can drift between admin/storefront usage and schema defaults.
- Suggested refactor: Derive the runtime defaults and TypeScript type from the Zod schema (or vice versa) in a single module, exporting both inferred type and defaults for admin and storefront consumers.

## 32) Targeting country lists and geo helpers
- Where:
  - `app/domains/targeting/utils/countries.ts` (country list/labels)
  - Other modules may inline country options or patterns.
- Pattern: Potential multiple sources for country data.
- Risk: If country lists diverge, geo targeting UI/validation could differ.
- Suggested refactor: Ensure all geo targeting components import a single country list/util (and expose it from the targeting domain) to avoid drift.

## 33) Dual design systems (legacy vs tokens)
- Where:
  - Legacy `PopupDesignConfig`/`ExtendedColorConfig` used in admin preview/legacy popups.
  - New design tokens (`design-tokens.ts`) driving storefront `popups-new`.
- Pattern: Two parallel design systems.
- Risk: Styling changes or new properties need to be applied in both; previews can misrepresent production rendering.
- Suggested refactor: Migrate legacy design config to consume design tokens (via adapter) so there is one source of truth for colors/layout.

## 34) Layout/position definitions duplicated
- Where:
  - PopupPortal props (`position`, `size`, `mobilePresentationMode`) in `popups-new`.
  - Layout options in `design-tokens.ts` and legacy popup configs.
- Pattern: Multiple enums/sets describing position/size/mobile mode.
- Risk: Adding a layout option requires updating multiple enums and UI pickers.
- Suggested refactor: Define a single layout/position enum set and reuse across portal, design schema, and admin UI selectors.

## 35) Animation/keyframe definitions repeated
- Where: `PopupPortal`, `BannerPortal`, and individual popups (e.g., CountdownTimer banner mode) inline keyframes.
- Pattern: Each component defines its own animation CSS.
- Risk: Reduced-motion fixes or timing tweaks must be replicated; inconsistencies across surfaces.
- Suggested refactor: Centralize animation definitions (enter/exit, fade/slide/zoom) and import into portals/popup components.

## 36) Social-proof vs popup notification plumbing
- Where: Social-proof notifications (`domains/storefront/notifications/social-proof`) have their own CSS scoping and render flow separate from popups.
- Pattern: Similar concerns (timing, visibility, CSS scoping) handled separately.
- Risk: Bug fixes (e.g., scroll locking, z-index, reduced motion) need duplication.
- Suggested refactor: Share portal/visibility + CSS scoping utilities between popups and social-proof notifications where feasible.

## 37) Plan guard checks duplicated
- Where: Routes check plan gates inline (e.g., scheduled campaigns in `/api/campaigns`), while some services may also enforce or omit.
- Pattern: Plan entitlement logic sprinkled across routes and services.
- Risk: Inconsistent enforcement; hard to audit feature gating.
- Suggested refactor: Centralize plan guard assertions inside domain services (mutation layer) so routes don’t duplicate checks.

## 38) Prisma include/where patterns partially centralized
- Where: `service-helpers.server.ts` exports some include/where helpers, but other queries inline similar selects/includes.
- Pattern: Mixed usage of helpers vs inline Prisma include/select definitions.
- Risk: Fields returned can drift between routes/services; unnecessary data fetched.
- Suggested refactor: Expand helper usage (or add missing ones) so all campaign/template/experiment queries rely on the same include/select sets.

## 39) Discount caching/idempotency logic isolated
- Where: `api.discounts.issue.tsx` implements caching (Redis) and idempotency; other discount issuance paths may not reuse it.
- Pattern: Discount issuance logic not centralized in the commerce discount service.
- Risk: Different issuance endpoints behave differently under retries; cache invalidation scattered.
- Suggested refactor: Move discount issuance + caching/idempotency into the commerce discount service, letting routes call a single function.

## 40) Email capture/lead submission paths
- Where: `/api/leads.submit.tsx` and possibly other lead save flows; storefront components post directly with custom payloads.
- Pattern: Lead submission handling/validation may be duplicated per route/template.
- Risk: Drift in validation or consent handling; harder to add new lead fields consistently.
- Suggested refactor: Centralize lead submission validation/mapping in a service and have routes/components use that contract.

## 41) API analytics tracking helpers duplicated
- Where: `api.analytics.track.tsx` notes “minimal helpers duplicated from /api/analytics/frequency to avoid coupling”.
- Pattern: Similar analytics/event handling implemented in more than one route.
- Risk: Event schema/validation can diverge; logging inconsistent.
- Suggested refactor: Provide a shared analytics event helper module and import in both routes to avoid duplication.

## 42) Storybook/tests vs production config
- Where: Stories/tests may stub or hard-code configs (e.g., base URLs, tokens) separately from production env handling.
- Pattern: Environment constants duplicated in test helpers (`tests/e2e/staging/helpers/*`) and code.
- Risk: Drift in base URLs or feature flags between test and prod code paths.
- Suggested refactor: Centralize environment/config accessors for tests/stories so they read from the same config module as the app (with overrides), reducing duplication.

## 43) Popup entry form validation split across steps
- Where: `SingleCampaignFlow` validates name/template + content + design; some validations also happen server-side per step.
- Pattern: Step-specific validators live in the component; domain validators live in services.
- Risk: Inconsistent validation messaging across steps vs server responses.
- Suggested refactor: Compose client-side validation from the same domain validators (with an options flag for “draft” vs “publish”) to avoid step-level drift.

## 44) Campaign status transitions handled inline
- Where: Bulk actions in `app._index.tsx` and detail pages call `CampaignService.updateCampaign` directly to toggle statuses.
- Pattern: No centralized transition guard/state machine.
- Risk: Invalid transitions (e.g., ARCHIVED -> ACTIVE) slip in; logging/side-effects not centralized.
- Suggested refactor: Encapsulate status transitions in a domain service/state machine with allowed transitions, and have UI/routes call that.

## 45) Discount behavior enums duplicated (content vs config)
- Where: `ContentDiscountTypeSchema` (lowercase) vs `DiscountValueTypeSchema` (uppercase) and behavior enums in `campaign.ts`.
- Pattern: Multiple enums representing similar concepts for UI vs backend.
- Risk: Mapping issues and duplicated validation logic.
- Suggested refactor: Define a single discount value/behavior enum set and provide display labels separately to avoid multiple schemas for the same concept.

## 46) CTA button components duplicated
- Where: Storefront shared `CTAButton` vs other popups that render their own button styles, and admin preview builds its own button styles.
- Pattern: Repeated button style/behavior logic.
- Risk: CTA appearance/behavior drifts across templates and previews.
- Suggested refactor: Standardize CTA rendering via a shared component and theme adapter both in admin preview and storefront popups.

## 47) Design token presets scattered
- Where: `design-tokens.ts` contains `PRESET_DESIGNS`; recipes embed design presets; other files may reference presets directly.
- Pattern: Preset definitions referenced from multiple spots.
- Risk: Updating a preset requires hunting references; inconsistency between recipes and design tokens.
- Suggested refactor: Keep presets only in design-tokens module and import everywhere else; recipes reference by ID only.

## 48) Targeting rule builders duplicated
- Where: Targeting UI components (e.g., `QuickTriggerSetup`) and server-side targeting parsing/validation both build targeting structures.
- Pattern: Similar targeting shapes assembled in multiple layers.
- Risk: UI can produce shapes server rejects (or vice versa).
- Suggested refactor: Provide targeting builder helpers shared between UI and server validation to ensure the same shape/field names.

## 49) Spinner/loading components repeated
- Where: Storefront shared `LoadingSpinner` vs bespoke skeletons/spinners in admin components (e.g., `CampaignTableSkeleton`, other inline spinners).
- Pattern: Multiple loading components with differing UX.
- Risk: Inconsistent loading UX and duplicated markup/styles.
- Suggested refactor: Reuse a shared spinner/skeleton system (Polaris has components; storefront has its own) and consolidate custom spinners into a single shared component per surface (admin vs storefront).

## 50) Error handling/logging patterns inconsistent
- Where: Some routes console.log/console.error; others use `handleApiError`; UI shows toast vs silent failures.
- Pattern: Ad-hoc logging/notifications.
- Risk: Harder to trace issues; inconsistent user feedback.
- Suggested refactor: Standardize error logging (with context) and user-facing messaging via shared helpers/hooks per layer (server vs admin UI).

## 51) Fetch/api client usage split
- Where: Some components use `apiClient` abstraction; others call `fetch` directly (e.g., in edit routes).
- Pattern: Mixed HTTP client usage.
- Risk: Auth headers/error handling can diverge; duplicate request/response handling.
- Suggested refactor: Route all browser-side API calls through `apiClient` (or a thin wrapper) to keep a single place for headers, errors, and retries.

## 52) Schema-derived types vs manual types
- Where: Some types are inferred from Zod (good), but other interfaces are hand-written (e.g., some shared types, payloads).
- Pattern: Mixed source of truth for types.
- Risk: Type drift between schema and interfaces.
- Suggested refactor: Favor `z.infer` exports from schemas and limit manual interfaces to truly schema-less shapes; update hand-written types to reference inferred ones.

---

# Prioritized Backlog (high → medium → lower)

## High Priority
1) **Campaign duplication consistency** (Items 2, 25) **[COMPLETED]**: Central `CampaignDuplicator` service + domain-level duplicate API; swap all callers. Prevents silent drift and data bugs when copying campaigns.  
2) **Bulk campaign actions abstraction** (Item 1): Shared bulk handler for activate/pause/archive/delete/duplicate; reduces 5x duplication and future intent bugs.  
3) **Unified campaign mutation pipeline** (Items 3, 7, 29): Single mutation entrypoint (PUT/POST/DELETE) with shared hooks (sanitize custom CSS, segment sync, plan guards). Retire duplicate routes or proxy them.  
4) **Shared campaign mapper/defaults** (Items 4, 10): One `campaignToFormData` mapper with centralized targeting/frequency defaults; used by both edit and experiment flows + SingleCampaignFlow. Prevents UI inconsistency.  
5) **Design/custom CSS sanitization + preview parity** (Items 3, 9, 15, 33) **[COMPLETED]**: Central CSS sanitizer (Done), and admin preview legacy code removed to enforce usage of storefront-consistent `TemplatePreview`.

## Medium Priority
6) **Discount normalization/strategy single source** (Items 6, 22, 39) **[COMPLETED]**: Move normalization + strategy inference + caching/idempotency into commerce discount service; routes thin.  
7) **Portal/rendering/animation unification** (Items 12, 35, 36): Base portal/visibility + shared animations/CSS scoping; apply to popups, banners, slide-ins, social-proof.  
8) **Lead capture single source** (Items 14, 31, 40): One module exporting schema, type, defaults, and field descriptors; admin/storefront render from it; lead submission validation shared.  
9) **Plan guard/state machine for status** (Items 37, 44): Centralize plan checks in mutation service and enforce status transitions via a state machine.  
10) **Design/layout enums + CTA/button reuse** (Items 45, 46, 47, 34, 21): Single enums for layout/position/mobile mode; CTA/button shared component; presets only in design-tokens.

## Lower Priority
11) **Proxy/asset route boilerplate reduction** (Items 28, 30): Generate or parameterize proxy routes; central asset handler.  
12) **Rate limiting helpers** (Item 19): Shared rate-limit wrapper supporting session/admin keys; apply to bespoke routes.  
13) **Prisma include/select standardization** (Item 38): Expand helper usage for campaign/template/experiment queries.  
14) **Targeting builders + country list** (Items 32, 48): Single country list export; shared targeting builders for UI + server validation.  
15) **API client/error/logging consistency** (Items 18, 50, 51, 41): Standardize on apiClient in UI, createMethodRouter/handleApiError on server, shared analytics helper, consistent logging/toasts.  
16) **Recipe building blocks + frequency defaults** (Items 13, 20): Central frequency/default builders and recipe composition primitives to remove copy/paste.  
17) **Validation isomorphism** (Items 24, 52): Client uses the same pure validators as server (`z.infer`-driven), with “draft vs publish” modes.  
18) **Env/test/story config alignment** (Items 27, 42): Tests/stories read from shared config module with overrides.  
19) **Spinner/skeleton consolidation** (Item 49): Standard loading components per surface (admin/storefront) instead of bespoke spinners.  
20) **CSS injection utility** (Item 26, 17): One stylesheet injection helper with adoptedStyleSheet fallback + scoping presets.

### Suggested sequencing
1) Extract bulk action helper (small, self-contained).
2) Add `CampaignDuplicator` and swap callers.
3) Centralize design-config sanitization and campaign mapper defaults.
4) Fold discount normalization into the commerce service.
5) Remove/alias the unused `?id=` mutation path after confirming external dependencies.
