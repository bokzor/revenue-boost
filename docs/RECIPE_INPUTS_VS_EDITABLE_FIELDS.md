# Recipe Inputs vs Editable Fields: Analysis Document

> **Status**: Draft (to be refined)  
> **Context**: Recipe-Driven Campaign Creation Redesign

---

## Overview

The recipe system uses two distinct configuration mechanisms:
1. **Quick Inputs (`inputs`)** - Minimal upfront configuration (1-3 fields)
2. **Editable Fields (`editableFields`)** - Full customization in editor mode

Understanding the distinction between these two systems is critical for the unified campaign creation flow.

---

## 1. Quick Inputs (`inputs`)

### Purpose
Quick Inputs are the **minimum required decisions** a user must make to configure a recipe. They appear in **Step 2 (Quick Setup)** before the full editor.

### Location in Recipe Definition
```typescript
const recipe: StyledRecipe = {
  // ...
  inputs: [
    { type: "discount_percentage", key: "discountValue", label: "Discount", defaultValue: 10 },
    { type: "select", key: "triggerType", label: "When to show", defaultValue: "time_delay", options: [...] }
  ],
  // ...
};
```

### Available Input Types (from `QuickInputType`)
| Type | Purpose | UI Component |
|------|---------|--------------|
| `discount_percentage` | Discount slider (5-75%) | RangeSlider with % suffix |
| `discount_amount` | Fixed dollar discount | TextField with $ prefix |
| `currency_amount` | Threshold amounts | TextField with $ prefix |
| `duration_hours` | Sale duration | Button group (6/12/24/48/72h) |
| `product_picker` | Select products | Shopify Resource Picker |
| `collection_picker` | Select collections | Shopify Resource Picker |
| `text` | Free-form text | TextField |
| `datetime` | Date/time selection | DatePicker |
| `select` | Dropdown selection | Select with options |

### Data Flow
```
Recipe.inputs[] 
    ↓ (rendered by RecipeQuickSetup)
User enters values
    ↓ (stored in RecipeContext)
RecipeContext = { discountValue: 15, triggerType: "exit_intent", ... }
    ↓ (used in buildCampaignFromRecipe)
Applied to contentConfig, discountConfig, targetRules
```

### Key Characteristics
- **Count**: 0-3 inputs per recipe (most have 1-2)
- **Purpose**: Critical business decisions (discount amount, timing, trigger)
- **Visibility**: Shown immediately after recipe selection
- **Impact**: Values often affect multiple config sections (discount + content + targeting)

---

## 2. Editable Fields (`editableFields`)

### Purpose
Editable Fields define **all customizable content** for a recipe. They appear in **Step 3 (Full Editor)** with grouped sections and live preview.

### Location in Recipe Definition
```typescript
const NEWSLETTER_EDITABLE_FIELDS = [
  { key: "headline", type: "text", label: "Headline", group: "content", validation: { required: true, maxLength: 100 } },
  { key: "subheadline", type: "text", label: "Description", group: "content", validation: { maxLength: 200 } },
  { key: "buttonText", type: "text", label: "Button Text", group: "content", validation: { required: true, maxLength: 30 } },
  { key: "emailPlaceholder", type: "text", label: "Email Placeholder", group: "content" },
];

const recipe: StyledRecipe = {
  // ...
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  // ...
};
```

### Available Field Types (from `EditableFieldType`)
| Type | Purpose | UI Component |
|------|---------|--------------|
| `text` | Single-line text | TextField |
| `textarea` | Multi-line text | TextField multiline |
| `number` | Numeric values | TextField type="number" |
| `boolean` | Toggle options | (Not yet implemented) |
| `select` | Dropdown options | Select |
| `color` | Color picker | Native color input + TextField |
| `image` | Image selection | (Not yet implemented) |
| `product_picker` | Product selection | Resource Picker |
| `collection_picker` | Collection selection | Resource Picker |
| `date` | Date selection | DatePicker |
| `duration` | Duration input | (Not yet implemented) |

### Data Flow
```
Recipe.editableFields[]
    ↓ (rendered by RecipeEditor)
User edits values
    ↓ (updates content state)
content = { headline: "...", subheadline: "...", ... }
    ↓ (used in RecipeOutput)
Applied to contentConfig only
```

### Key Characteristics
- **Count**: 3-10+ fields per template type
- **Purpose**: Content customization (headlines, descriptions, button text)
- **Visibility**: Full editor after quick setup (optional step)
- **Grouping**: Organized by `group` property ("content", "design", "other")
- **Validation**: Supports required, min/max length, pattern

---

## 3. Comparison Table

| Aspect | Quick Inputs (`inputs`) | Editable Fields (`editableFields`) |
|--------|------------------------|-----------------------------------|
| **When shown** | Step 2 - Quick Setup | Step 3 - Full Editor |
| **Count** | 0-3 per recipe | 3-10+ per template |
| **Purpose** | Business decisions | Content customization |
| **Complexity** | Minimal | Full editing |
| **Targets** | Multiple config sections | Primarily `contentConfig` |
| **User required?** | Often yes | Usually optional (defaults work) |
| **Examples** | discountValue, triggerType, durationHours | headline, subheadline, buttonText |

---

## 4. Recipe Examples by Template Type

### Newsletter Recipes

**Typical Inputs:**
```typescript
inputs: [
  { type: "discount_percentage", key: "discountValue", label: "Discount", defaultValue: 15 },
  { type: "select", key: "triggerType", label: "When to show", defaultValue: "time_delay", options: [...] }
]
```

**Editable Fields:** `headline`, `subheadline`, `buttonText`, `emailPlaceholder`

**Note:** Some newsletter recipes have `inputs: []` (no discount) - they're pure lead collection.

---

### Flash Sale Recipes

**Typical Inputs:**
```typescript
inputs: [
  { type: "discount_percentage", key: "discountValue", label: "Discount", defaultValue: 20 },
  { type: "duration_hours", key: "durationHours", label: "Duration", defaultValue: 24 }
]
```

**Editable Fields:** `headline`, `subheadline`, `buttonText`

**Note:** Duration affects countdown timer configuration.

---

### Spin-to-Win Recipes

**Typical Inputs:**
```typescript
inputs: [
  { type: "select", key: "triggerType", label: "When to show", defaultValue: "time_delay", options: [...] }
]
```

**Editable Fields:** `headline`, `subheadline`, `spinButtonText`, `buttonText`, `emailPlaceholder`

**Note:** No discount input - wheel segments have preset prize values.

---

### Scratch Card Recipes

**Typical Inputs:** Similar to Spin-to-Win (trigger selection only)

**Editable Fields:** `headline`, `instructionText`, `buttonText`, `emailPlaceholder`

---

## 5. How Inputs Feed Into Configuration

Quick inputs are mapped to **multiple configuration sections** during campaign creation:

```typescript
function buildCampaignFromRecipe(recipe: StyledRecipe, context: RecipeContext) {
  return {
    // Content: Inputs can override content defaults
    contentConfig: {
      ...recipe.defaults.contentConfig,
      // discountValue interpolated into headlines like "Get {discountValue}% OFF"
    },

    // Discount: Direct mapping from input
    discountConfig: {
      ...recipe.defaults.discountConfig,
      value: context.discountValue,  // ← from discount_percentage input
    },

    // Targeting: Trigger type selection
    targetRules: {
      ...recipe.defaults.targetRules,
      enhancedTriggers: {
        // triggerType input determines which trigger is enabled
        time_delay: { enabled: context.triggerType === "time_delay", ... },
        exit_intent: { enabled: context.triggerType === "exit_intent", ... },
        scroll_depth: { enabled: context.triggerType === "scroll_depth", ... },
      }
    }
  };
}
```

---

## 6. Key Insight: Why Both Systems Exist

### Quick Inputs: "Configure the Strategy"
- User decides: *How much discount? When to show? For how long?*
- These are **business decisions** that vary per campaign
- Affect the campaign's core mechanics

### Editable Fields: "Customize the Message"
- User refines: *What exact headline? What button text?*
- These are **content tweaks** that personalize the recipe
- Recipes provide sensible defaults that work out-of-box

### The Two-Step Philosophy
1. **Quick Setup**: Make the critical business decisions (usually sufficient for "recipe-driven" flow)
2. **Full Editor**: Deep customization for power users (optional)

---

## 7. Current Unified Flow Analysis

### Current Flow Structure (`SingleCampaignFlow.tsx`)

The current implementation has **2 major steps**:

**Step 1: Recipe Selection** (`step === "recipe"`)
- GoalFilter at top
- RecipePicker grid
- Modal for quick inputs when recipe is clicked

**Step 2: Editor** (`step === "editor"`) - Collapsible sections:
1. `basics` - Campaign Name & Description
2. `design` - Customize Design (uses content sections + design config)
3. `discount` - Discount & Incentives
4. `targeting` - Targeting & Triggers
5. `frequency` - Frequency
6. `schedule` - Schedule & Settings

### Current QuickInputs Location

Currently, QuickInputs are shown in a **modal** when user clicks a recipe:
- `RecipeSelectionStep.tsx` lines 198-251
- Modal with "Quick Setup" section
- User configures inputs, clicks "Continue to Editor"
- Data is passed to editor step

### Problem with Current Modal Approach

1. **Extra click** - Modal interrupts the flow
2. **Limited space** - Modal constrains UI
3. **Not visible during editing** - Can't adjust discount % while editing content

---

## 8. Recommended Flow: Keep Existing Steps + Inline QuickInputs

### Revised 6-Step Flow

Keep the existing unified flow structure but **inline QuickInputs at Step 2** instead of using a modal:

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1 (Recipe Selection - KEEP AS IS)                          │
│ ├─ GoalFilter at top                                            │
│ └─ RecipePicker grid → Click to select (NO MODAL)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ EDITOR STEP (2-column layout with live preview)                 │
│                                                                  │
│ Section 1: "Campaign Name & Description" (KEEP)                 │
│ ├─ Campaign name (required)                                     │
│ └─ Description (optional)                                       │
│                                                                  │
│ Section 2: "Quick Configuration" (NEW - inline QuickInputs)     │
│ ├─ Show ONLY if recipe.inputs.length > 0                       │
│ └─ Renders recipe.inputs[] inline (discountValue, trigger, etc) │
│                                                                  │
│ Section 3: "Customize Design" (KEEP - improved subtitle)        │
│ ├─ ContentConfigSection (template-specific: headline, etc.)     │
│ └─ DesignConfigSection (colors, layout, background)             │
│ NEW SUBTITLE: "Adjust colors, content, styling and behaviour"   │
│                                                                  │
│ Section 4: "Targeting & Triggers" (KEEP)                        │
│ ├─ Page targeting                                               │
│ ├─ Device targeting                                             │
│ └─ Enhanced triggers (exit intent, scroll, time delay)          │
│                                                                  │
│ Section 5: "Frequency" (KEEP)                                   │
│ ├─ Max triggers per session                                     │
│ ├─ Max triggers per day                                         │
│ └─ Cooldown between triggers                                    │
│                                                                  │
│ Section 6: "Schedule & Settings" (KEEP)                         │
│ ├─ Start/end dates                                              │
│ └─ Priority                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### What Changes

1. **Remove modal** from `RecipeSelectionStep.tsx`
   - Recipe click → immediately go to editor step
   - No more "Configure: Recipe Name" modal

2. **Add new Section 2** in `FormSections.tsx`
   - ID: `"quickConfig"`
   - Title: "Quick Configuration"
   - Subtitle: "Configure your offer details"
   - Only shown if `recipe.inputs.length > 0`
   - Renders inline QuickInput fields

3. **Update Section 3 subtitle**
   - From: "Adjust colors, content, and styling"
   - To: "Adjust colors, content, styling and behaviour"

4. **Keep DesignStepContent** for Section 3
   - Already uses template-specific content sections
   - Already has design config section
   - Already integrated with live preview

### Why This Approach?

1. **Minimal changes** - Keep working code, just restructure
2. **No modal friction** - QuickInputs inline in editor
3. **Clear separation** - Business config (Step 2) vs Content/Design (Step 3)
4. **Familiar pattern** - Users already know the 6-section layout
5. **Reuses existing components** - No duplication

### What Happens to `editableFields`?

**Remove/deprecate** - They're no longer needed:
- `ContentConfigSection` already handles all content editing
- `DesignConfigSection` already handles all design editing
- Recipe `inputs[]` handle business decisions
- `editableFields[]` was a middle ground we don't need

### Component Changes Summary

| File | Change |
|------|--------|
| `RecipeSelectionStep.tsx` | Remove modal, just call `onRecipeSelected` on click |
| `FormSections.tsx` | Add new `quickConfig` section with inline inputs |
| `SingleCampaignFlow.tsx` | Add `quickConfig` to `EDITOR_SECTIONS` |
| `styled-recipe-types.ts` | No changes (keep `inputs[]`) |

---

## 9. Implementation Details

### Section 2: Quick Configuration Component

```tsx
// In FormSections.tsx, add to section rendering:
case "quickConfig":
  // Only show if recipe has inputs
  if (!selectedRecipe?.inputs?.length) return null;

  return (
    <BlockStack gap="400">
      {selectedRecipe.inputs.map((input) => (
        <QuickInputField
          key={input.key}
          input={input}
          value={contextData[input.key]}
          onChange={(value) => handleInputChange(input.key, value)}
        />
      ))}
    </BlockStack>
  );
```

### QuickInputField Renderer

Extract from `RecipeSelectionStep.tsx` (already exists):

```tsx
function QuickInputField({ input, value, onChange }) {
  switch (input.type) {
    case "discount_percentage":
      return <RangeSlider ... />;
    case "duration_hours":
      return <RangeSlider ... />;
    case "currency_amount":
      return <TextField type="number" ... />;
    case "text":
      return <TextField ... />;
    case "select":
      return <Select ... />;
    default:
      return null;
  }
}
```

### Updated EDITOR_SECTIONS

```tsx
const EDITOR_SECTIONS = [
  { id: "basics", icon: "📝", title: "Campaign Name & Description", subtitle: "Give your campaign a name and optional description" },
  { id: "quickConfig", icon: "⚙️", title: "Quick Configuration", subtitle: "Configure your offer details" },
  { id: "design", icon: "🎨", title: "Customize Design", subtitle: "Adjust colors, content, styling and behaviour" },
  { id: "targeting", icon: "🎯", title: "Targeting & Triggers", subtitle: "Define who sees your popup and when" },
  { id: "frequency", icon: "🔄", title: "Frequency", subtitle: "Control how often the popup appears" },
  { id: "schedule", icon: "📅", title: "Schedule & Settings", subtitle: "Set start/end dates and priority" },
];
```

---

## 10. Final Decision: Hybrid Approach

### Chosen Architecture

After analysis, we chose a **hybrid approach** that balances simplicity with template-awareness:

```
┌─────────────────────────────────────────────────────────────────┐
│ RECIPE SELECTION STEP                                           │
│ ├─ GoalFilter at top                                            │
│ └─ RecipePicker grid → Click to select (NO MODAL)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ EDITOR STEP (2-column layout with live preview)                 │
│                                                                  │
│ Section 1: "Campaign Name & Description" (universal)            │
│ ├─ Campaign name (required)                                     │
│ └─ Description (optional)                                       │
│                                                                  │
│ Section 2: "Quick Configuration" (CONDITIONAL)                  │
│ ├─ Only shown if recipe.inputs.length > 0                      │
│ └─ Inline inputs: discountValue, triggerType, duration, etc.   │
│                                                                  │
│ Section 3: "Content & Template Settings" (template-specific)    │
│ ├─ Reuses existing content sections (no refactoring needed)    │
│ ├─ NewsletterContentSection for Newsletter                      │
│ ├─ FlashSaleContentSection for Flash Sale                       │
│ ├─ SpinToWinContentSection for Spin-to-Win                      │
│ └─ Collapsibles inside for advanced features (timer, wheel)     │
│                                                                  │
│ Section 4: "Design & Colors" (universal)                        │
│ ├─ Theme picker                                                 │
│ ├─ Layout picker                                                │
│ ├─ Background presets                                           │
│ └─ Color customization                                          │
│                                                                  │
│ Section 5: "Targeting & Triggers" (universal)                   │
│ ├─ Page targeting                                               │
│ ├─ Device targeting                                             │
│ └─ Enhanced triggers (exit intent, scroll, time delay)          │
│                                                                  │
│ Section 6: "Frequency" (universal)                              │
│ ├─ Max triggers per session                                     │
│ ├─ Max triggers per day                                         │
│ └─ Cooldown between triggers                                    │
│                                                                  │
│ Section 7: "Schedule & Settings" (universal)                    │
│ ├─ Start/end dates                                              │
│ └─ Priority                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Why Hybrid?

1. **Fewer sections** - 7 max instead of 9
2. **Reuse existing components** - No need to split FlashSaleContentSection, SpinToWinContentSection
3. **Template complexity stays contained** - One dedicated section per template
4. **Less implementation work** - Minimal refactoring needed
5. **Can split later** - If users complain about long sections, we can refactor

### Section Numbering

Sections are **dynamically numbered** based on visibility:
- If `recipe.inputs.length === 0`: Skip Section 2, so Content becomes "2", Design becomes "3", etc.
- Users always see 1, 2, 3... with no gaps

### Files to Change

| File | Change |
|------|--------|
| `RecipeSelectionStep.tsx` | Remove modal, call `onRecipeSelected` directly on recipe click |
| `SingleCampaignFlow.tsx` | Update `EDITOR_SECTIONS` to include `quickConfig`, rename `design` to `content` |
| `FormSections.tsx` | Add rendering for `quickConfig` section, handle conditional visibility |
| (Optional) `QuickInputField.tsx` | Extract input renderer from RecipeSelectionStep for reuse |

### Updated EDITOR_SECTIONS

```tsx
const EDITOR_SECTIONS = [
  { id: "basics", icon: "📝", title: "Campaign Name & Description", subtitle: "Give your campaign a name and optional description" },
  { id: "quickConfig", icon: "⚙️", title: "Quick Configuration", subtitle: "Configure your offer details", conditional: true },
  { id: "content", icon: "✏️", title: "Content & Template Settings", subtitle: "Configure headlines, buttons, and template-specific features" },
  { id: "design", icon: "🎨", title: "Design & Colors", subtitle: "Adjust colors, layout, and styling" },
  { id: "targeting", icon: "🎯", title: "Targeting & Triggers", subtitle: "Define who sees your popup and when" },
  { id: "frequency", icon: "🔄", title: "Frequency", subtitle: "Control how often the popup appears" },
  { id: "schedule", icon: "📅", title: "Schedule & Settings", subtitle: "Set start/end dates and priority" },
];
```

---

## 11. Decisions Summary

| Decision | Choice |
|----------|--------|
| Discount section | TBD (keep separate for now) |
| Recipes with no inputs | Skip Quick Configuration section entirely |
| Section visibility | Conditional with dynamic numbering |
| Split DesignStepContent | No - use hybrid approach instead |
| Approach | Hybrid (fewer sections, reuse existing components) |

---

## References

### Recipe System
- **Type Definitions**: `app/domains/campaigns/recipes/styled-recipe-types.ts`
- **Quick Setup Component**: `app/domains/campaigns/components/recipes/RecipeQuickSetup.tsx`
- **Full Editor Component**: `app/domains/campaigns/components/recipes/RecipeEditor.tsx`
- **Newsletter Recipes**: `app/domains/campaigns/recipes/newsletter-design-recipes.ts`
- **Flash Sale Recipes**: `app/domains/campaigns/recipes/flash-sale-design-recipes.ts`

### Existing Campaign Editor Components (Recommended for Reuse)
- **Design Step Container**: `app/domains/campaigns/components/steps/DesignStepContent.tsx`
- **Content Section Router**: `app/domains/campaigns/components/sections/ContentConfigSection.tsx`
- **Design Section**: `app/domains/campaigns/components/sections/DesignConfigSection.tsx`
- **Template-Specific Sections**:
  - `app/domains/campaigns/components/sections/NewsletterContentSection.tsx`
  - `app/domains/campaigns/components/sections/FlashSaleContentSection.tsx`
  - `app/domains/campaigns/components/sections/SpinToWinContentSection.tsx`
  - `app/domains/campaigns/components/sections/ScratchCardContentSection.tsx`

### Other Step Components
- **Targeting**: `app/domains/campaigns/components/steps/TargetingStepContent.tsx`
- **Frequency**: `app/domains/campaigns/components/steps/FrequencyStepContent.tsx`
- **Schedule**: `app/domains/campaigns/components/steps/ScheduleStepContent.tsx`

