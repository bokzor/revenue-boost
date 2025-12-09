# SOLID / DRY Opportunities

Quick inventory of duplicated logic and SOLID violations that are currently active in the app. Use this as a checklist for small refactors that reduce drift and make future changes safer.

## 1) Bulk campaign actions repeat the same flow
- Where: `app/routes/app._index.tsx:150-244`
- Pattern: Each intent (activate/pause/archive/delete/duplicate) repeats: parse IDs → `Promise.allSettled` → count failures → `data({ success, message })`.
- Risk: Any change to error handling, logging, or status mapping must be copied 5 times.
- Suggested refactor: Introduce an intent → handler map (e.g., `runBulkAction(intent, updater, successCopy)`) or a tiny `BulkCampaignActions` helper that encapsulates the shared flow, leaving only the intent-specific mutation functions inline.

## 2) Campaign duplication rules diverge
- Where:
  - Bulk duplicate: `app/routes/app._index.tsx:208-244`
  - Single duplicate (same file): `app/routes/app._index.tsx:246-270`
  - Detail page duplicate: `app/routes/app.campaigns.$campaignId.tsx:225-254`
- Pattern: Three places build “copy” payloads differently (e.g., stripping experiment association vs. posting the full campaign object).
- Risk: Copies can drift (status resets, experiment detach, date handling). Bugs will be subtle because copies succeed but differ.
- Suggested refactor: Add `CampaignDuplicator` in the domain that accepts a campaign and returns sanitized `CampaignCreateData` (resets status, removes experiment/variant keys, resets dates). All callers use it; UI POST becomes a thin wrapper.

## 3) API mutation paths are split and only partially sanitized
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

## 6) Discount strategy inference duplicated
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

### Suggested sequencing
1) Extract bulk action helper (small, self-contained).
2) Add `CampaignDuplicator` and swap callers.
3) Centralize design-config sanitization and campaign mapper defaults.
4) Fold discount normalization into the commerce service.
5) Remove/alias the unused `?id=` mutation path after confirming external dependencies.
