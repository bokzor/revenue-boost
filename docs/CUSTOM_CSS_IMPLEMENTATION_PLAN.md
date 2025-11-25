# Custom CSS Implementation Plan

## Overview
Goal: support both global (store-wide) and per-campaign custom CSS while keeping styles isolated in previews and storefront Shadow DOM. This doc reflects the current React Router 7 flow (`DesignStepContent` + `LivePreviewPanel`) and the new storefront popups under `app/domains/storefront/popups-new/`.

## Current State (2024-XX-XX)
- `DesignConfigSchema` already exposes `customCSS`.
- Legacy Remix preview (`PopupPreview` in `app/domains/popups/components/design/PopupPreview.tsx`) injects `customCSS`, but the new flow does not pass CSS into `LivePreviewPanel` or the `popups-new` components.
- `StoreSettingsSchema` has no global CSS field.
- Shadow DOM is used in `PopupPortal`, but it currently only injects base/animation styles.

## Gaps to Close
1) Add `globalCustomCSS` to store settings and thread it through loaders/API responses.
2) Carry both global + campaign CSS through the new admin UI (Design step) and preview stack.
3) Apply both CSS blobs in storefront renderers (`popups-new`) inside the Shadow DOM.
4) Add guardrails (length/sanity) and tests.

## 1) Schema & Validation
- Extend `app/domains/store/types/settings.ts`:
  - Add `globalCustomCSS?: z.string().optional()` plus a max-length refinement (e.g., 30_000 chars) and optional basic sanitization (reject `<script>`).
- Keep `DesignConfigSchema.customCSS` as-is, but enforce the same length check in actions that accept design config payloads.

## 2) Admin UI
- Create `app/domains/store/components/GlobalCSSSettings.tsx` (textarea + helper copy). Wire into `app/routes/app.settings.tsx` to read/write `globalCustomCSS` in store settings.
- Create `app/domains/campaigns/components/CustomCSSEditor.tsx` (collapsible, with template class reference).
- Integrate editor in `DesignStepContent` after design configuration so per-campaign CSS is editable in the new flow.
- Optional: surface a small CSS class reference (`app/domains/campaigns/constants/css-class-reference.ts`) and use it in the editor.

## 3) Preview Flow (Admin)
- Add `globalCustomCSS` prop through loaders (`app.routes/app.campaigns.*`) and pass down via `CampaignFormWithABTesting` → `renderDesignStep` → `DesignStepContent` → `LivePreviewPanel`.
- Update `LivePreviewPanel`/`TemplatePreview` to accept `globalCustomCSS` and inject both blobs into a scoped `<style>` tag using a preview container id/data-attr to avoid bleeding into the admin shell.
- Keep the legacy `PopupPreview` logic untouched; the new flow should rely on `LivePreviewPanel`.

## 4) API / Data Flow
- `/api/campaigns/active` (and any admin loaders that hydrate campaigns) should include `globalCustomCSS` alongside campaign data:
  - Fetch store settings, pull `globalCustomCSS`, and include it in the JSON response.
- Ensure preview flows (`/api/preview/session`, active campaigns preview mode) also include the global CSS value so unsaved previews render accurately.

## 5) Storefront Runtime (popups-new)
- Thread `globalCustomCSS` through the storefront client (`extensions/storefront-src/index.ts`), storing it on the app instance.
- Update `renderPopup`/`PopupManagerPreact` (and any React wrappers) to pass `globalCustomCSS` into popup components.
- Update `PopupPortal` (`app/domains/storefront/popups-new/PopupPortal.tsx`) to inject both `globalCustomCSS` and campaign `customCSS` inside the Shadow DOM `<style>` block, after base styles. Campaign CSS should override global CSS.
- Each popup config type should accept `globalCustomCSS` + `campaignCustomCSS` and pass them to `PopupPortal`.

## 6) Guardrails
- Length cap: reject CSS > ~30kb in actions.
- Sanitization: reject obvious `<script>`/`</script>` or `@import url(javascript:...)`. Log and strip if encountered.
- Feature flag: optionally gate rendering behind a flag so rollout can be staged (admin read-only → preview → storefront).

## 7) Testing
- Unit: schema validation for new fields/length caps; scoped style injection helpers; `PopupPortal` style injection with both blobs.
- Integration: `/api/campaigns/active` returns `globalCustomCSS`; storefront renderer applies both CSS; admin preview renders both.
- E2E smoke: create campaign, add custom CSS + global CSS, verify in admin preview and storefront app proxy render.

## 8) Rollout Order
1) Add schema + server-side validation.
2) Thread data through loaders/API responses.
3) Wire storefront renderer to accept and apply CSS.
4) Ship admin UI editors (global + per-campaign).
5) Enable flag/remove flag after QA.
