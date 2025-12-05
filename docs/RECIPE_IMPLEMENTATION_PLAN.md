# Styled Recipe System - Implementation Plan

> **Status**: DRAFT
> **Created**: 2024-12-01
> **Based on**: RECIPE_SYSTEM_ARCHITECTURE.md

## Executive Summary

This plan outlines the implementation of the Styled Recipe System in 4 phases over ~3-4 weeks. The goal is to transform the 7-step, 40+ field campaign wizard into a 4-5 step, streamlined recipe-based flow.

---

## Full Flow Analysis

### Current Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ADMIN (React)                                                               │
│  ─────────────                                                               │
│  1. User selects Goal → Template → configures 40+ fields                    │
│  2. CampaignFormWithABTesting manages wizard state                          │
│  3. Form submits CampaignFormData                                           │
│                                                                              │
│     templateType: "FLASH_SALE"                                               │
│     contentConfig: { headline, buttonText, ... }                            │
│     designConfig: { theme, position, size, displayMode, ... }               │
│     targetRules: { enhancedTriggers, pageTargeting, ... }                   │
│     discountConfig: { enabled, valueType, value, ... }                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  DATABASE (Prisma/PostgreSQL)                                                │
│  ────────────────────────────                                                │
│                                                                              │
│  Campaign {                                                                  │
│    id, storeId, name, description                                           │
│    goal: CampaignGoal                   // NEWSLETTER_SIGNUP, etc.          │
│    status: CampaignStatus               // DRAFT, ACTIVE, etc.              │
│    templateType: TemplateType           // FLASH_SALE, NEWSLETTER, etc.     │
│    contentConfig: Json                  // Template-specific content        │
│    designConfig: Json                   // Visual configuration             │
│    targetRules: Json                    // Triggers, audience, pages        │
│    discountConfig: Json                 // Discount settings                │
│    ...                                                                       │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  PREVIEW (Admin iframe)                                                      │
│  ──────────────────────                                                      │
│  - Uses same popup components as storefront                                 │
│  - Renders based on templateType                                            │
│  - Reads from wizard state (not DB)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  STOREFRONT (Preact extension)                                               │
│  ─────────────────────────────                                               │
│  1. Fetches active campaigns: GET /api/campaigns/active                     │
│  2. ComponentLoader.loadComponent(templateType)                             │
│  3. Renders popup based on templateType:                                    │
│                                                                              │
│     switch (templateType) {                                                 │
│       case "NEWSLETTER": return <NewsletterPopup />                         │
│       case "FLASH_SALE": return <FlashSalePopup />                          │
│       case "SPIN_TO_WIN": return <SpinToWinPopup />                         │
│       ...                                                                    │
│     }                                                                        │
│                                                                              │
│  4. Component reads contentConfig, designConfig for rendering               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Key Question: Do We Need Schema Changes?

**SHORT ANSWER: NO, but with caveats.**

#### What the Recipe System Outputs

A recipe's `build()` function outputs the exact same `CampaignFormData` structure:

```typescript
recipe.build(context) → {
  name: "Black Friday Sale",
  contentConfig: { headline: "BLACK FRIDAY", ... },
  designConfig: { theme: "black-friday", position: "center", ... },
  discountConfig: { enabled: true, ... },
  targetRules: { enhancedTriggers: { ... } },
}
```

This is 100% compatible with existing database schema. **No migration needed.**

#### The Component Variant Challenge

**Problem**: If we have `FlashSaleCentered` vs `FlashSaleSplit`, how does storefront know which to render?

**Current**: Storefront picks component based on `templateType` only:
```typescript
case "FLASH_SALE": return <FlashSalePopup />
```

**Options**:

| Option | Approach | Schema Change? | Pros | Cons |
|--------|----------|----------------|------|------|
| **A** | Use `designConfig.displayMode` or new `layout` field | NO | No migration, uses existing JSON | Implicit, needs docs |
| **B** | Add `componentVariant` field to Campaign table | YES | Explicit, clean | Migration needed |
| **C** | Add `recipeId` field, storefront looks up recipe | YES | Full tracking | Couples storefront to recipes |

**Recommendation: Option A** — Use existing `designConfig` fields

```typescript
// DesignConfigSchema already has:
displayMode: z.enum(["popup", "banner", "slide-in", "inline"]).optional()
position: z.enum(["center", "top", "bottom", "left", "right"])
imagePosition: z.enum(["left", "right", "top", "bottom", "full", "none"])

// We can add a layout field for component variants:
layout: z.enum(["centered", "split-left", "split-right", "fullscreen", "banner"]).optional()
```

**Storefront logic**:
```typescript
case "FLASH_SALE":
  if (designConfig.layout === "split-left") return <FlashSaleSplit />
  return <FlashSaleCentered /> // default
```

---

## Schema Decision Matrix

| Concern | Schema Change Needed? | Solution |
|---------|----------------------|----------|
| Recipe builds campaign | NO | Outputs standard CampaignFormData |
| Component variants | NO | Use `designConfig.layout` |
| Seasonal themes | NO | Add to DesignConfigSchema enum |
| Track recipe origin | OPTIONAL | Add `recipeId: String?` to Campaign |
| Background images | NO | Already have `imageUrl`, `backgroundImageMode` |

### Recommended Schema Change (Optional, for Analytics)

```prisma
model Campaign {
  // ... existing fields

  // NEW: Track which recipe created this campaign (optional)
  recipeId      String?   // e.g., "black-friday-sale"

  @@index([recipeId])
}
```

**Benefits**:
- Analytics: "Which recipes are most popular?"
- UX: Show "Created from: Black Friday Sale" in campaign list
- Future: Could enable recipe-based updates/migrations

**Effort**: Minimal (one nullable field, one index)

---

## Required Type Changes (No DB Migration)

### 1. Add `layout` to DesignConfigSchema

```typescript
// app/domains/campaigns/types/campaign.ts

export const DesignConfigSchema = z.object({
  // Existing fields...

  // NEW: Layout variant for component selection
  layout: z.enum([
    "centered",      // Default modal in center
    "split-left",    // Image on left, content on right
    "split-right",   // Content on left, image on right
    "fullscreen",    // Full viewport
    "banner",        // Top or bottom bar
    "sidebar",       // Slide-in from side
  ]).default("centered"),

  // ... rest of schema
});
```

### 2. Add Seasonal Themes

```typescript
export const DesignConfigSchema = z.object({
  theme: z.enum([
    // Existing
    "modern", "minimal", "elegant", "bold", "glass",
    "dark", "gradient", "luxury", "neon", "ocean", "summer-sale",

    // NEW: Seasonal
    "summer",
    "black-friday",
    "cyber-monday",
    "holiday",
    "valentine",
    "spring",
  ]).optional(),
  // ...
});
```

### 3. Storefront Component Selection

```typescript
// extensions/storefront-src/core/component-loader.ts

// Map templateType + layout to component
function getComponentKey(templateType: TemplateType, layout?: string): string {
  if (layout && layout !== "centered") {
    return `${templateType}_${layout.toUpperCase()}`; // e.g., "FLASH_SALE_SPLIT_LEFT"
  }
  return templateType; // Default component
}
```

---

---

## User Flow: Recipe-First with Live Previews

### Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STEP 1: Pick Recipe (with mini-previews)                       │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  🔥 Sales & Promos                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ [mini   ]│ │ [mini   ]│ │ [mini   ]│ │ [mini   ]│           │
│  │ [popup  ]│ │ [popup  ]│ │ [popup  ]│ │ [popup  ]│           │
│  │ [preview]│ │ [preview]│ │ [preview]│ │ [preview]│           │
│  │          │ │          │ │          │ │          │           │
│  │Flash Sale│ │Black Fri │ │Summer   │ │Holiday   │           │
│  │⚡ Classic │ │🖤 Urgent  │ │☀️ Playful│ │🎄 Festive│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  📧 Email & Leads                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ [mini   ]│ │ [mini   ]│ │ [mini   ]│ │ [mini   ]│           │
│  │ [popup  ]│ │ [popup  ]│ │ [popup  ]│ │ [popup  ]│           │
│  │Welcome  │ │Exit Offer│ │Spin Win │ │VIP Early │           │
│  │🎁        │ │🚪        │ │🎡        │ │👑        │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  [🛠️ Build from scratch - full control]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STEP 2: Full Preview + Quick Setup                             │
│  ──────────────────────────────────                             │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │                     │  │ Quick Setup                     │  │
│  │  ┌───────────────┐  │  │                                 │  │
│  │  │               │  │  │ Discount: [====●====] 30%       │  │
│  │  │  BLACK FRIDAY │  │  │                                 │  │
│  │  │  30% OFF      │  │  │ Duration: [24 hours      ▼]    │  │
│  │  │               │  │  │                                 │  │
│  │  │  [SHOP NOW]   │  │  │ ─────────────────────────────   │  │
│  │  │               │  │  │                                 │  │
│  │  │  23:59:42     │  │  │ Different style?                │  │
│  │  │               │  │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │  │
│  │  └───────────────┘  │  │ │Bold│ │Dark│ │Neon│ │+   │    │  │
│  │                     │  │ └────┘ └────┘ └────┘ └────┘    │  │
│  │  [Desktop] [Mobile] │  │                                 │  │
│  │                     │  │ [Continue →]                    │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STEP 3: Customize & Publish                                    │
│  ───────────────────────────                                    │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │                     │  │ Content (editable fields only)  │  │
│  │  [LIVE PREVIEW]     │  │ ├─ Headline: [BLACK FRIDAY  ]   │  │
│  │                     │  │ ├─ Subhead:  [30% OFF...    ]   │  │
│  │  Updates as you     │  │ └─ Button:   [SHOP NOW      ]   │  │
│  │  type...            │  │                                 │  │
│  │                     │  │ [+ Advanced targeting]          │  │
│  │                     │  │ [+ Discount settings]           │  │
│  │                     │  │ [+ Schedule & priority]         │  │
│  │                     │  │                                 │  │
│  │  [Desktop] [Mobile] │  │ [Save Draft] [Publish Campaign] │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key UX Decisions

| Decision | Rationale |
|----------|-----------|
| **Mini-previews in picker** | Users see actual popup designs, not just names |
| **Styled recipes as separate cards** | "Black Friday" IS visually distinct from "Summer" |
| **~25-30 total styled recipes** | Manageable with category grouping |
| **4 featured per category** | Avoids overwhelm, "See all" for more |
| **Full preview in Step 2** | Immediate feedback on selection |
| **Device toggle** | Mobile preview is essential |
| **Collapsed advanced options** | Progressive disclosure for power users |
| **No goal selection** | Goal is implicit in recipe category |
| **No template selection** | Template is implicit in recipe |

### Recipe Quantity Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│ RECIPE CATALOG STRUCTURE                                         │
│                                                                  │
│ 📧 Email & Leads (8 styled recipes)                             │
│ ├── Welcome Discount 🎁 (modern)                                │
│ ├── Exit Offer 🚪 (dark, urgent)                                │
│ ├── Spin to Win 🎡 (gradient, fun)                              │
│ ├── VIP Early Access 👑 (luxury)                                │
│ ├── Holiday Newsletter 🎄 (holiday theme)                       │
│ ├── Back to School 📚 (playful)                                 │
│ ├── Summer Signup ☀️ (summer theme)                             │
│ └── Minimal Signup ✨ (minimal, clean)                          │
│                                                                  │
│ 🔥 Sales & Promos (10 styled recipes)                           │
│ ├── Flash Sale ⚡ (bold)                                         │
│ ├── Black Friday Sale 🖤 (black-friday)                         │
│ ├── Cyber Monday 💻 (neon)                                      │
│ ├── Summer Sale ☀️ (summer)                                     │
│ ├── Holiday Sale 🎄 (holiday)                                   │
│ ├── Weekend Flash ⏰ (modern)                                   │
│ ├── BOGO Weekend 🛍️ (gradient)                                  │
│ ├── Spend More Save More 📈 (elegant)                           │
│ ├── Product Spotlight ✨ (minimal)                              │
│ └── Collection Sale 🏷️ (modern)                                 │
│                                                                  │
│ 🛒 Cart & Recovery (5 styled recipes)                           │
│ ├── Cart Recovery 🛒 (modern)                                   │
│ ├── Urgent Cart Recovery ⚠️ (bold, urgent)                      │
│ ├── Free Shipping Progress 🚚 (modern)                          │
│ ├── Complete Your Look 👗 (elegant)                             │
│ └── Bundle & Save 📦 (gradient)                                 │
│                                                                  │
│ 📢 Announcements (4 styled recipes)                             │
│ ├── Sale Announcement 📣 (bold)                                 │
│ ├── New Arrival 🆕 (modern)                                     │
│ ├── Store Update ℹ️ (minimal)                                   │
│ └── Holiday Announcement 🎄 (holiday)                           │
│                                                                  │
│ TOTAL: ~27 styled recipes                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current State Analysis

### What Exists ✅

| Component | Location | Status |
|-----------|----------|--------|
| Recipe catalog (partial) | `app/domains/campaigns/recipes/recipe-catalog.ts` | Has categories, structure, but missing `editableFields` |
| Popup primitives | `app/domains/storefront/popups-new/components/primitives/` | 7 primitives exist (PopupCard, PopupHeading, PopupText, PopupButton, PopupInput, CloseButton, PoweredByBadge) |
| Theme system | `app/config/color-presets.ts` | 11 themes, but no seasonal themes |
| Popup components | `app/domains/storefront/popups-new/*.tsx` | 11 popup types exist (Newsletter, FlashSale, SpinToWin, etc.) |
| Wizard state hook | `app/shared/hooks/useWizardState.ts` | Full wizard state management |
| Campaign form | `app/domains/campaigns/components/CampaignFormWithABTesting.tsx` | 5-step wizard (goal → design → targeting → frequency → schedule) |
| Step renderers | `app/domains/campaigns/utils/step-renderers.tsx` | Renders each wizard step |
| RecipeConfigurationModal | `app/domains/campaigns/components/recipes/RecipeConfigurationModal.tsx` | Basic modal, needs refactoring |

### What's Missing ❌

| Component | Description | Priority |
|-----------|-------------|----------|
| `StyledRecipe` structure | Full interface with `editableFields` | P0 |
| Seasonal themes | summer, black-friday, holiday, etc. | P1 |
| `RecipePicker` component | Category grid + recipe cards UI | P0 |
| `RecipeQuickSetup` component | Dynamic inputs (1-3 per recipe) | P0 |
| `RecipeEditor` component | Dynamic form from `editableFields` | P0 |
| `PopupRenderer` | Picks component based on recipe | P1 |
| Recipe-based route | New flow at `/app/campaigns/new/recipe` | P1 |
| Component variants | FlashSaleCentered, FlashSaleSplit, etc. | P2 |

---

## Gap Analysis

### 1. Recipe Catalog Structure

**Current**: Recipes have `inputs` but no `editableFields`
```typescript
// Current
{
  id: "welcome-discount",
  inputs: [{ type: "discount_percentage", ... }],
  build: (context) => { ... },
}
```

**Needed**: Full `StyledRecipe` with `editableFields`
```typescript
// Needed
{
  id: "welcome-discount",
  component: "NewsletterSplit",
  editableFields: [
    { key: "headline", type: "text", label: "Headline" },
    { key: "buttonText", type: "text", label: "Button" },
  ],
  defaults: {
    contentConfig: { subheadline: "...", showImage: true },
    designConfig: { position: "center", size: "medium" },
  },
  inputs: [...],
  build: (context) => { ... },
}
```

### 2. Admin Form Generation

**Current**: Each template has a custom content section component
- `NewsletterContentSection.tsx`
- `FlashSaleContentSection.tsx`
- `SpinToWinContentSection.tsx`
- etc. (11 total)

**Needed**: Single dynamic form generator
```typescript
// RecipeEditor generates form from editableFields
<RecipeEditor
  recipe={selectedRecipe}
  values={formValues}
  onChange={handleChange}
/>
```

### 3. Component Architecture

**Current**: One component per template type, lots of props
```typescript
<NewsletterPopup
  content={...}
  design={...}
  // 20+ props
/>
```

**Needed**: Component variants with shared primitives
```typescript
// Centered variant
<NewsletterMinimal content={...} design={...} />

// Split variant
<NewsletterSplit content={...} design={...} />
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1) 🏗️

**Goal**: Establish the `StyledRecipe` structure, picker UI with live previews

#### Tasks:

1. **Update recipe types** (`styled-recipe-types.ts`)
   - Add `StyledRecipe` interface with full structure
   - Add `EditableField` interface
   - Add `ComponentName` type enum
   - Add `RecipeCategory` metadata

2. **Add `layout` field to DesignConfigSchema**
   - Add layout enum: centered, split-left, split-right, fullscreen, banner, sidebar
   - This enables component variant selection without schema migration

3. **Add seasonal themes** (`color-presets.ts`)
   - Add: summer, black-friday, cyber-monday, holiday, valentine, spring
   - Ensure theme colors work with existing `useColorScheme` hook

4. **Refactor recipe catalog** (`styled-recipe-catalog.ts`)
   - Convert to full `StyledRecipe` format
   - Add `editableFields` to each recipe
   - Add `component` and `layout` references
   - Add `defaults` with locked values
   - Create ~27 styled recipes across 4 categories

5. **Create `RecipePicker` component**
   - Category sections with horizontal scroll
   - "See all" expansion for each category
   - Recipe cards with mini-previews
   - Selection state management

6. **Create `RecipeCard` component with mini-preview**
   - Renders actual popup at 25% scale
   - Shows recipe name, icon, tagline
   - Hover/click states

7. **Create `MiniPopupPreview` component**
   - Reuses existing popup components
   - Scales down with CSS transform
   - Non-interactive preview mode

#### Deliverables:
- [ ] `app/domains/campaigns/recipes/styled-recipe-types.ts`
- [ ] `app/domains/campaigns/recipes/styled-recipe-catalog.ts` (~27 styled recipes)
- [ ] `app/domains/campaigns/types/campaign.ts` (add `layout` to DesignConfigSchema)
- [ ] `app/config/color-presets.ts` (6 seasonal themes added)
- [ ] `app/domains/campaigns/components/recipes/RecipePicker.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeCard.tsx`
- [ ] `app/domains/campaigns/components/recipes/MiniPopupPreview.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeCategorySection.tsx`

---

### Phase 2: Dynamic Form System (Week 2) 📝

**Goal**: Build the admin form generation from `editableFields`

#### Tasks:

1. **Create `DynamicFormField` component**
   - Renders field based on `type` (text, number, boolean, select, color, image, product_picker)
   - Handles validation from field definition
   - Integrates with Polaris form components

2. **Create `RecipeQuickSetup` component**
   - Renders recipe `inputs` (1-3 quick decisions)
   - Progress indicator
   - "Continue" action

3. **Create `RecipeEditor` component**
   - Groups fields by `group` property
   - Collapsible sections for advanced options
   - Live preview integration

4. **Create `RecipeThemePicker` component**
   - Shows theme presets from color-presets
   - Highlights recipe's `suggestedTheme`
   - Custom theme support

#### Deliverables:
- [ ] `app/domains/campaigns/components/form/DynamicFormField.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeQuickSetup.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeEditor.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeThemePicker.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipePreview.tsx`

---

### Phase 3: New Campaign Flow (Week 3) 🚀

**Goal**: Create the new recipe-based campaign creation route

#### Tasks:

1. **Create new route** (`app.campaigns.new-recipe.tsx`)
   - Step 1: RecipePicker (select styled recipe)
   - Step 2: RecipeQuickSetup (1-3 quick inputs)
   - Step 3: RecipeThemePicker (choose/override theme)
   - Step 4: RecipeEditor (edit allowed fields)
   - Step 5: Review & Publish

2. **Create `RecipeWizard` component**
   - Simplified wizard state (fewer steps)
   - Recipe context provider
   - Step navigation

3. **Create `RecipeFormState` hook**
   - Manages form values
   - Merges user input with recipe defaults
   - Builds final `CampaignFormData`

4. **Update campaign submission**
   - Ensure recipe-built data works with existing `createCampaign` action
   - Optional: track `recipeId` on campaign for analytics

#### Deliverables:
- [ ] `app/routes/app.campaigns.new-recipe.tsx`
- [ ] `app/domains/campaigns/components/recipes/RecipeWizard.tsx`
- [ ] `app/domains/campaigns/hooks/useRecipeFormState.ts`
- [ ] `app/domains/campaigns/components/recipes/RecipeReviewStep.tsx`

---

### Phase 4: Polish & Migration (Week 4) ✨

**Goal**: Refine UX and enable gradual migration

#### Tasks:

1. **Add "Quick Create" entry point**
   - Button on campaigns index page
   - Modal or redirect to recipe flow
   - Feature flag for A/B testing the new flow

2. **Component variants** (optional, can be P2)
   - Create `FlashSaleCentered` vs `FlashSaleSplit`
   - Create `NewsletterSplit` vs `NewsletterMinimal`
   - Update `PopupRenderer` to pick correct variant

3. **Mobile preview**
   - Add device toggle in preview
   - Show mobile-optimized version

4. **Analytics & tracking**
   - Track recipe selection
   - Track completion rate per recipe
   - Compare with old wizard conversion

5. **Documentation & testing**
   - Update AGENTS.md with recipe flow
   - Add E2E tests for recipe creation
   - Add unit tests for recipe build functions

#### Deliverables:
- [ ] Feature flag: `RECIPE_FLOW_ENABLED`
- [ ] Updated campaigns index with "Quick Create" CTA
- [ ] Mobile preview toggle
- [ ] E2E test: `tests/e2e/recipe-flow.spec.ts`
- [ ] Unit tests: `tests/unit/styled-recipes.test.ts`

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  User Journey                                                    │
└─────────────────────────────────────────────────────────────────┘

Step 1: Pick Recipe
┌─────────────────┐
│ RecipePicker    │ → selectedRecipe: StyledRecipe
└─────────────────┘
         │
         ▼
Step 2: Quick Setup
┌─────────────────┐
│ RecipeQuickSetup│ → quickInputs: { discountValue: 10, ... }
└─────────────────┘
         │
         ▼
Step 3: Theme
┌─────────────────┐
│ RecipeThemePicker│ → selectedTheme: "modern" | "black-friday" | ...
└─────────────────┘
         │
         ▼
Step 4: Edit Content
┌─────────────────┐
│ RecipeEditor    │ → editedFields: { headline: "...", buttonText: "..." }
└─────────────────┘
         │
         ▼
Build Campaign Data
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  recipe.build({                                                  │
│    ...quickInputs,                                               │
│    ...editedFields,                                              │
│    selectedTheme,                                                 │
│  })                                                              │
│                                                                  │
│  Returns: CampaignFormData                                       │
│  - name, goal, templateType                                      │
│  - contentConfig (merged: defaults + user edits)                │
│  - designConfig (with theme applied)                            │
│  - discountConfig                                                │
│  - targetRules (from recipe defaults)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
Save to Database
┌─────────────────┐
│ createCampaign()│ → Campaign record
└─────────────────┘
```

---

## Migration Strategy

### Approach: Parallel Paths

```
                    ┌─────────────────────┐
                    │  /app/campaigns     │
                    └─────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  "Quick Create"     │       │  "Build from        │
    │  (Recipe Flow)      │       │   Scratch"          │
    │                     │       │  (Old Wizard)       │
    │  /new-recipe        │       │  /new               │
    └─────────────────────┘       └─────────────────────┘
```

1. **Phase 1-3**: Build recipe flow at `/app/campaigns/new-recipe`
2. **Phase 4**: Add "Quick Create" button that links to recipe flow
3. **Future**: Track metrics, if recipe flow wins, make it default
4. **Later**: Deprecate old wizard (or keep for power users)

### No Breaking Changes

- Existing campaigns unaffected
- Existing routes remain functional
- Recipe flow outputs same `CampaignFormData` format
- Same database schema used

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Recipe catalog incomplete | Medium | High | Start with 10 recipes, add more incrementally |
| Form generation bugs | Medium | Medium | Reuse existing Polaris components, thorough testing |
| Preview performance | Low | Medium | Lazy load preview, debounce updates |
| Theme conflicts | Low | Low | Test all theme + recipe combinations |
| A/B testing compatibility | Medium | High | Ensure recipe flow works with experiment system |

---

## Success Metrics

| Metric | Current (Wizard) | Target (Recipe) |
|--------|------------------|-----------------|
| Time to first campaign | 10-15 min | 2-3 min |
| Completion rate | ~40% (estimated) | >70% |
| Fields configured | 40+ | 3-10 |
| Steps to publish | 7 | 4-5 |
| User satisfaction | Unknown | NPS > 40 |

---

## Open Questions

1. **Should old wizard remain for power users?**
   - Recommendation: Yes, accessible via "Build from scratch" link

2. **How to handle recipe updates?**
   - Recipes only affect NEW campaigns
   - Existing campaigns keep their config

3. **Should we track recipe origin?**
   - Recommendation: Yes, add optional `recipeId` field to Campaign

4. **A/B testing in recipe flow?**
   - Phase 1: No A/B testing support
   - Phase 2: Add "Create A/B Test" option after recipe selection

---

## Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | StyledRecipe types, catalog, RecipePicker |
| 2 | Form System | DynamicFormField, RecipeEditor, RecipeThemePicker |
| 3 | New Flow | Route, Wizard, Form State, Review |
| 4 | Polish | Feature flag, analytics, tests, migration path |

---

*Plan created: 2024-12-01*
*Review scheduled: After Phase 1 completion*


