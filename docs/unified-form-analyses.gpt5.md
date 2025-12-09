### Overview
Below is an implementation plan to redesign the unified campaign creation flow so recipes are the entry point, with minimal inputs and hidden complexity. It leverages existing recipe types, quick-setup patterns, and Prisma/Zod models without schema changes.

### 1) Reusable patterns from `RecipeQuickSetup.tsx`
- **Quick input renderers**: Centralized switch on `QuickInput.type` (`discount_percentage`, `duration_hours`, `currency_amount`, `text`, `select`, etc.) that maps to small, focused controls. These can be reused inline in the unified flow.
- **Default seeding**: On mount, it merges `initialContext` with `recipe.inputs` defaults, ensuring required fields have sane starting values.
- **Context-driven config**: Builds `contentConfig` from `recipe.defaults.contentConfig` and applies minimal transformations (e.g., replace discount in `subheadline`).
- **Design config builder**: Derives `designConfig` from recipe defaults + theme presets/background helpers (`NEWSLETTER_THEMES`, `getBackgroundById`, `getBackgroundUrl`) and layout-driven `imagePosition` inference.
- **Live preview integration**: Uses `LivePreviewPanel` with `contentConfig` + `designConfig` to show immediate visual feedback.
- **Navigation callbacks**: `onBack`, `onContinue`, `onSkip` pattern fits into a stepper.

### 2) Proposed component structure for the new unified flow (`app/domains/campaigns/components/unified/`)
- `UnifiedCampaignFlow.tsx` (or similar): step controller (state machine) with steps: `Basics` → `RecipeConfig` → `Review` (optional) → `Done`.
- `StepBasics.tsx`: captures `campaignName`, `description` only.
- `StepRecipeConfig.tsx`: embeds recipe selection + inline quick setup.
  - Subcomponents:
    - `RecipeSelectorPanel`: reuse/adapt `RecipePicker` (grid, tags, goals), but selection immediately advances to inline config.
    - `InlineRecipeQuickSetup`: thin wrapper around the `RecipeQuickSetup` renderers to show only the quick inputs inside the unified step (no separate page). Uses `LivePreviewPanel`.
- `HiddenConfigAssembler.ts`: pure helper to translate recipe choice + quick context → `{ templateType, contentConfig, designConfig, discountConfig?, targetRules?, themeMode, presetId }` using recipe defaults and existing builders.
- `ReviewSummary.tsx` (optional): displays resolved configs for confirmation (read-only chips/JSON summary).
- Hooks/state:
  - `useUnifiedCampaignWizard`: manages step, selected recipe, basics, context, assembled configs.

### 3) Step-by-step user journey
1) **Step 1 – Campaign Basics**
  - Inputs: `Name`, `Description` (text fields). Continue enabled when `Name` is non-empty.
2) **Step 2 – Recipe Configuration (inline)**
  - User lands on recipe gallery (default goal filter optional). Selecting a recipe shows quick inputs pane + live preview alongside the gallery.
  - Quick inputs prefilled with defaults. User edits minimal fields (1–3 inputs). Preview updates live.
  - User clicks **Continue** to lock the recipe and proceed.
3) **(Optional) Review**
  - Show summary: chosen recipe, key values (discount, hours, headline), and inferred template/design config. CTA: **Create Campaign**.
4) **Persist**
  - On submit, call existing creation mutation with `{ name, description, templateType, contentConfig, designConfig, discountConfig?, targetRules?, themeMode, presetId }` derived from recipe + context.

### 4) Minimum required fields per recipe type (quick inputs)
Use existing `recipe.inputs` definitions; keep to 1–3 essentials:
- **Flash Sale / Discounted promos**: `discount_percentage` (required), optionally `duration_hours` if present.
- **Free Shipping**: `currency_amount` (threshold) or `select`/`text` if defined; often no quick input if bar is defaulted.
- **Cart Abandonment / Exit Intent**: often none; if present, likely `discount_percentage` or `duration_hours`.
- **Newsletter / Lead Gen**: often `discount_percentage` or a `text` placeholder for headline/subheadline; some have `select` trigger style.
- **Spin-to-Win / Scratch Card**: typically none or a single `discount_percentage`.
- **Product Upsell**: `product_picker`/`collection_picker` (if present) or `select` for layout; many recipes rely on defaults.
- **Social Proof**: usually no quick input; may have a `select` for style.
- **Announcements**: usually `text` for headline/subheadline or `select` for variant.
- **Countdown / Urgency**: `duration_hours` or `datetime` (if defined); otherwise rely on defaults.

(Concrete mapping should be read directly from each recipe’s `inputs` array; the above lists the minimal set to expose.)

### 5) Mapping recipe selection to template/content/design behind the scenes
- **Template selection is implicit**: `recipe.templateType` drives which popup/template is used; the user never sees `templateType`.
- **Content config**: Start from `recipe.defaults.contentConfig`; apply quick-input context (e.g., replace `%` in `subheadline`, set `threshold`, `headline`, `buttonText`, etc.). Leave other fields as defaults—no extra form.
- **Design config**: Start from `recipe.defaults.designConfig`; then derive theme/preset/background via existing helpers (`NEWSLETTER_THEMES`, `getBackgroundById`, `getBackgroundUrl`, `buildRecipeDesignConfig`). Respect recipe `layout`, `imageUrl`, `backgroundPresetId`, and fallback `imagePosition` logic.
- **Discount/targeting/schedule**: If recipe specifies `requiredConfig`, optionally prebuild `discountConfig`/`targetRules` using defaults; otherwise keep hidden and defaulted.
- **Theme mode**: Use `getThemeModeForRecipeType(recipe.recipeType)` and `getPresetIdForRecipe(recipe.id)` for seasonal/inspiration presets; otherwise use store default theme.

### Implementation steps
1) **Create the unified flow shell**: `UnifiedCampaignFlow.tsx` with stepper state and callbacks.
2) **Basics step**: simple form, updates wizard state.
3) **Integrate recipe picker inline**: reuse `RecipePicker` for selection; when selected, render `InlineRecipeQuickSetup` alongside and store `selectedRecipe` + `context`.
4) **Port quick inputs**: extract `renderQuickInput` and input components from `RecipeQuickSetup` into a shared module (e.g., `RecipeQuickInputs.tsx`) to use inline.
5) **Preview**: reuse `LivePreviewPanel` with derived `contentConfig`/`designConfig` from the selected recipe + context.
6) **Assembler**: implement `HiddenConfigAssembler` that, given `recipe` and `context`, returns the final `templateType`, `contentConfig`, `designConfig`, `discountConfig?`, `targetRules?`, `themeMode`, `presetId` using existing builders and defaults.
7) **Review (optional)**: render summary chips/JSON for debugging; can be skipped for MVP.
8) **Submit**: call existing campaign creation mutation using preserved Prisma/Zod models; no schema changes required.

### Notes on keeping UX minimal
- Default as much as possible from `recipe.defaults`.
- Only render `recipe.inputs` (<=3) as quick inputs; hide `editableFields` in this flow.
- Auto-apply design/background; hide theme/preset toggles unless later needed.
- Provide “Skip” to use defaults without editing quick inputs.

This plan keeps recipes as the entry point, minimizes user input, hides technical fields, and reuses existing components and data models.
