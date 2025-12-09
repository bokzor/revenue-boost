1. Analysis of Current RecipeQuickSetup.tsx Patterns

   Reusable Patterns Identified

   A. Input Renderers (Lines 54-193)
   The component has well-structured input renderers for each QuickInputType:

   | Input Type | Component | Use Case |
      |------------|-----------|----------|
   | discount_percentage | DiscountPercentageInput | Slider 5-75% |
   | duration_hours | DurationHoursInput | Button group (6h, 12h, 24h, 48h, 72h) |
   | currency_amount | CurrencyAmountInput | Number input with $ prefix |
   | text | TextInputRenderer | Standard text field |
   | select | SelectInputRenderer | Dropdown options |

   Recommendation: Extract these into a shared QuickInputRenderers.tsx module for reuse.

   B. Context State Management (Lines 207-224)
   const [context, setContext] = useState<RecipeContext>(() => {
   const initial: RecipeContext = { ...initialContext };
   recipe.inputs.forEach((input) => {
   const defaultVal = "defaultValue" in input ? input.defaultValue : undefined;
   if (initial[input.key] === undefined && defaultVal !== undefined) {
   (initial as Record<string, unknown>)[input.key] = defaultVal;
   }
   });
   return initial;
   });
   This pattern of initializing defaults from recipe inputs is essential.

   C. Live Preview Configuration (Lines 246-296)
   The designConfig builder constructs preview-ready configuration from:
   • Theme colors from NEWSLETTER_THEMES
   • Background presets via getBackgroundById
   • Layout-aware image positioning
   • Recipe defaults merged with theme overrides

   Recommendation: Extract into buildPreviewDesignConfig(recipe, context) utility.

   D. Content Config with Context Application (Lines 227-243)
   Applies user input (e.g., discount percentage) to content templates:
   if (context.discountValue !== undefined) {
   content.subheadline = content.subheadline.replace(/\d+%/, `${context.discountValue}%`);
   }


───────────────────────────────────────────

2. Proposed Component Structure

New File Structure

app/domains/campaigns/components/unified/
├── index.ts                          # Updated exports
├── types.ts                          # Extended types
├── SingleCampaignFlow.tsx            # MODIFIED: New 2-step flow
├── steps/
│   ├── CampaignBasicsStep.tsx        # NEW: Step 1 - Name & description
│   └── RecipeConfigurationStep.tsx   # NEW: Step 2 - Inline recipe setup
├── shared/
│   ├── QuickInputRenderers.tsx       # NEW: Extracted from RecipeQuickSetup
│   └── RecipeConfigBuilder.ts        # NEW: Utility for building configs
└── [existing files remain]

Component Hierarchy

SingleCampaignFlow (orchestrator)
├── Step 1: CampaignBasicsStep
│   ├── CampaignNameField
│   └── CampaignDescriptionField (optional)
│
└── Step 2: RecipeConfigurationStep
├── RecipePicker (condensed grid with goal filter)
│   └── RecipeCard (clickable, shows preview on hover)
│
└── [After recipe selection] InlineRecipeConfigurator
├── Layout.Section (left): QuickInputsPanel
│   ├── RecipeHeader (icon, name, description)
│   └── QuickInputRenderers (1-3 inputs from recipe.inputs)
│
└── Layout.Section (right): LivePreviewPanel
└── [Existing component, receives built config]


─────────────────────────────────────────────────────────────

3. Step-by-Step User Journey

Step 1: Campaign Basics (Minimal Friction Entry)

┌─────────────────────────────────────────────────────────────┐
│  ← Back                              Create Campaign        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Campaign Name *                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ e.g., Summer Sale Newsletter Popup                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Description (optional)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Notes about this campaign...                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                      [Continue to Recipe →] │
└─────────────────────────────────────────────────────────────┘

State collected: { name: string, description?: string }

Step 2A: Recipe Selection (Before Selection)

┌─────────────────────────────────────────────────────────────┐
│  ← Back to Basics                    "Summer Sale Pop..."   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose Your Recipe                                         │
│  ─────────────────────────────────────────────────────────  │
│  [📧 Email & Leads] [💰 Sales & Revenue] [❤️ Engagement]   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ ✨       │  │ 💻       │  │ ⚡       │  │ 🎰       │   │
│  │ Elegant  │  │ Minimal  │  │ Flash    │  │ Spin to  │   │
│  │ Luxe     │  │ Tech     │  │ Sale     │  │ Win      │   │
│  │          │  │          │  │          │  │          │   │
│  │ [Select] │  │ [Select] │  │ [Select] │  │ [Select] │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  [Browse all 50+ recipes →]                                │
└─────────────────────────────────────────────────────────────┘

Step 2B: Recipe Configuration (After Selection)

┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                                 [Save Draft]  [🚀 Publish]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────┐  ┌─────────────────────────────────────┐│
│  │ ✨ Elegant Luxe           │  │         📱 LIVE PREVIEW             ││
│  │ ────────────────────────  │  │                                     ││
│  │ Premium newsletter popup  │  │    ┌─────────────────────────┐     ││
│  │ for luxury brands.        │  │    │                         │     ││
│  │                           │  │    │   Join the Inner Circle │     ││
│  │ Quick Setup               │  │    │                         │     ││
│  │ ───────────               │  │    │   Get 15% off your      │     ││
│  │                           │  │    │   first order           │     ││
│  │ Discount Percentage       │  │    │                         │     ││
│  │ ●────────────○ 15%        │  │    │   [Your email]          │     ││
│  │                           │  │    │   [Subscribe]           │     ││
│  │ When to show popup        │  │    │                         │     ││
│  │ [After a few seconds ▼]   │  │    └─────────────────────────┘     ││
│  │                           │  │                                     ││
│  │ [Change Recipe]           │  │  [Desktop] [Tablet] [Mobile]        ││
│  │                           │  │                                     ││
│  │ ─────────────────────     │  │                                     ││
│  │ ▼ Advanced Settings       │  │                                     ││
│  │   (Collapsed by default)  │  │                                     ││
│  │   • Design customization  │  │                                     ││
│  │   • Targeting & triggers  │  │                                     ││
│  │   • Discount settings     │  │                                     ││
│  │   • Schedule              │  │                                     ││
│  └───────────────────────────┘  └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘


──────────────────────────────────────────────────────────────────────────────

4. Minimum Required Fields Per Recipe Type

Based on analysis of recipe definitions in app/domains/campaigns/recipes/*.ts:

Newsletter Recipes (NEWSLETTER templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| With Discount (Elegant Luxe, Spa Serenity) | discountValue (percentage), triggerType (select) | 2 inputs |
| No Discount (Minimal Tech, Cozy Home) | triggerType (select) | 1 input |

Mapping Logic:
• discountValue → Updates contentConfig.subheadline (replaces %d% pattern)
• triggerType → Updates targetRules.enhancedTriggers (enables selected trigger)

Flash Sale Recipes (FLASH_SALE templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| Time-Limited (Flash Sale, Black Friday) | discountValue (percentage), durationHours (duration) | 2 inputs |
| Inventory-Based (Last Chance, Scarcity) | triggerType (select), inventoryProducts (product_picker) | 2 inputs |

Mapping Logic:
• discountValue → contentConfig.subheadline + discountConfig.value
• durationHours → targetRules.schedule.endDate (calculated)
• inventoryProducts → contentConfig.inventory.productIds

Spin-to-Win Recipes (SPIN_TO_WIN templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| Standard (Lucky Fortune, Minimal Mono) | triggerType (select) | 1 input |
| Customizable Prizes (future) | triggerType, topPrize (discount_percentage) | 2 inputs |

Mapping Logic:
• triggerType → targetRules.enhancedTriggers
• Wheel segments come from recipe defaults (editable in advanced settings)

Cart Abandonment Recipes (CART_ABANDONMENT templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| With Discount (Save Your Cart) | discountValue (percentage), triggerType | 2 inputs |
| No Discount (Gentle Reminder, FOMO Urgency) | triggerType (select) | 1 input |

Mapping Logic:
• discountValue → contentConfig.subheadline + discountConfig.value
• triggerType → Pre-configured to exit_intent with cart context

Scratch Card Recipes (SCRATCH_CARD templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| All variants | triggerType (select) | 1 input |

Mapping Logic:
• Prize configuration comes from recipe defaults
• Scratch reveal animation is template-specific

Upsell/Cross-sell Recipes (UPSELL templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| Bundle Discount | bundleDiscount (percentage), productSelectionMethod (select), maxProducts (select) | 3 inputs |
| Free Gift | threshold (currency_amount), giftProduct (product_picker) | 2 inputs |

Mapping Logic:
• bundleDiscount → discountConfig.value
• threshold → targetRules.enhancedTriggers.cart_value.min_value
• giftProduct → discountConfig.freeGift + contentConfig.cta

Free Shipping Recipes (FREE_SHIPPING_BAR templateType)

| Recipe Category | Quick Inputs | Required Fields |
   |-----------------|--------------|-----------------|
| Standard | threshold (currency_amount) | 1 input |

Mapping Logic:
• threshold → contentConfig.threshold + bar messaging


─────────────────────────────────────────────────────

5. Recipe Selection → Template/Content/Design Mapping

Mapping Flow

User selects recipe (e.g., "Elegant Luxe")
│
├─► templateType: "NEWSLETTER"  (from recipe.templateType)
│
├─► goal: "NEWSLETTER_SIGNUP"   (from recipe.goal)
│
├─► contentConfig: {            (from recipe.defaults.contentConfig)
│       headline: "Join the Inner Circle",
│       subheadline: "Get {discountValue}% off...",  ← User input applied
│       emailPlaceholder: "Your email address",
│       buttonText: "Subscribe",
│       ...
│   }
│
├─► designConfig: {             (built from recipe theme + layout)
│       themeMode: "preset" | "default",  ← Based on recipeType
│       presetId: "elegant-luxe",         ← If inspiration recipe
│       layout: "split-left",
│       position: "center",
│       size: "large",
│       backgroundColor: "#FAF9F7",
│       ... (from NEWSLETTER_THEMES[recipe.theme])
│   }
│
├─► targetRules: {              (from recipe.defaults.targetRules)
│       enhancedTriggers: {
│           time_delay: { enabled: true, delay: 5000 },  ← Based on triggerType
│           frequency_capping: { ... }
│       },
│       pageTargeting: { ... }
│   }
│
└─► discountConfig: {           (from recipe.defaults.discountConfig + user input)
enabled: true,
type: "shared",
valueType: "PERCENTAGE",
value: 15,  ← User input
...
}

Implementation: buildCampaignFromRecipe() Utility

This utility (to be created in RecipeConfigBuilder.ts) will:

export function buildCampaignFromRecipe(
recipe: StyledRecipe,
context: RecipeContext,
campaignBasics: { name: string; description?: string }
): CampaignData {
// 1. Build content config with context values applied
const contentConfig = buildContentConfig(recipe, context);

     // 2. Build design config (theme mode based on recipeType)
     const designConfig = buildDesignConfig(recipe);

     // 3. Build discount config (merge recipe defaults + user input)
     const discountConfig = buildDiscountConfig(recipe, context);

     // 4. Build target rules (apply trigger selection)
     const targetRules = buildTargetRules(recipe, context);

     return {
       name: campaignBasics.name,
       description: campaignBasics.description,
       goal: recipe.goal,
       templateType: recipe.templateType,
       contentConfig,
       designConfig,
       discountConfig,
       targetRules,
       // Defaults for non-quick-setup fields
       frequencyConfig: recipe.defaults.targetRules?.enhancedTriggers?.frequency_capping || DEFAULT_FREQUENCY,
       scheduleConfig: { status: "DRAFT", priority: 50 },
     };
}


────────────────────────────────────────────────────────

6. Component Implementation Details

A. CampaignBasicsStep.tsx

interface CampaignBasicsStepProps {
name: string;
description: string;
onNameChange: (name: string) => void;
onDescriptionChange: (description: string) => void;
onContinue: () => void;
onBack: () => void;
}
// Renders: name field (required), description field (optional), Continue button
// Validation: name must be non-empty

B. RecipeConfigurationStep.tsx

interface RecipeConfigurationStepProps {
campaignName: string;  // Display in header
recipes: StyledRecipe[];
selectedRecipe?: StyledRecipe;
recipeContext: RecipeContext;
onRecipeSelect: (recipe: StyledRecipe) => void;
onContextChange: (key: string, value: unknown) => void;
onChangeRecipe: () => void;  // Go back to recipe grid
onSave: () => Promise<void>;
onSaveDraft: () => Promise<void>;
onBack: () => void;  // Go back to Step 1
// Advanced settings visibility
showAdvancedSettings: boolean;
onToggleAdvanced: () => void;
}
// Two modes:
// 1. Recipe not selected: Shows RecipePicker grid with goal filter
// 2. Recipe selected: Shows 2-column layout with inputs + preview

C. QuickInputRenderers.tsx (Extracted & Extended)

// Extracted from RecipeQuickSetup.tsx lines 54-193
// Extended to support additional input types from RecipeSelectionStep
export function renderQuickInput(
input: QuickInput,
value: unknown,
onChange: (key: string, value: unknown) => void,
options?: {
storeId?: string;  // For product/collection pickers
}
): React.ReactNode;

D. Modified SingleCampaignFlow.tsx

Key changes:
1. Replace current 2-step (recipe → editor) with new 2-step (basics → recipe+config)
2. Move advanced settings (design, targeting, frequency, schedule) into collapsible sections within Step 2
3. Reuse FormSections components for advanced settings but collapse them by default
4. Eliminate the modal-based recipe configuration from RecipeSelectionStep.tsx


─────────────────────────────────────────────────────────────────────────

7. Data Flow Summary

┌─────────────────────────────────────────────────────────────────────┐
│                        SingleCampaignFlow                            │
│                                                                      │
│  State:                                                              │
│  - step: "basics" | "recipe"                                         │
│  - campaignName: string                                              │
│  - campaignDescription: string                                       │
│  - selectedRecipe: StyledRecipe | undefined                         │
│  - recipeContext: RecipeContext                                      │
│  - [advanced configs: design, targeting, frequency, schedule]        │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: CampaignBasicsStep                                          │
│  ──────────────────────────                                          │
│  Props: name, description, onNameChange, onDescriptionChange         │
│  Output: Updates campaignName, campaignDescription                   │
│  Transition: onContinue → step = "recipe"                            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 2: RecipeConfigurationStep                                     │
│  ───────────────────────────────                                     │
│  Props: recipes, selectedRecipe, recipeContext, ...                  │
│                                                                      │
│  Sub-mode A (no recipe):                                             │
│  - Shows RecipePicker grid                                           │
│  - onRecipeSelect → sets selectedRecipe, initializes recipeContext  │
│                                                                      │
│  Sub-mode B (recipe selected):                                       │
│  - Left column: QuickInputs for recipe.inputs                        │
│  - Right column: LivePreviewPanel (builds config from recipe+context)│
│  - Collapsible: Advanced Settings (FormSections, collapsed)          │
│  - Actions: Save Draft, Publish, Change Recipe                       │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  On Save:                                                            │
│  ─────────                                                           │
│  const campaignData = buildCampaignFromRecipe(                       │
│    selectedRecipe,                                                   │
│    recipeContext,                                                    │
│    { name: campaignName, description: campaignDescription }          │
│  );                                                                  │
│  // Merge with any advanced settings modifications                   │
│  await onSave(campaignData);                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


─────────────────────────────────────────────────────────────────────────

8. Migration Strategy

Phase 1: Extract Reusable Utilities
1. Create QuickInputRenderers.tsx from RecipeQuickSetup.tsx
2. Create RecipeConfigBuilder.ts with buildCampaignFromRecipe()
3. No changes to existing flows

Phase 2: Create New Step Components
1. Create CampaignBasicsStep.tsx
2. Create RecipeConfigurationStep.tsx
3. Test in isolation

Phase 3: Modify SingleCampaignFlow
1. Update to use new 2-step flow
2. Keep FormSections for advanced settings (collapsed)
3. Remove modal-based configuration

Phase 4: Cleanup
1. Deprecate standalone RecipeQuickSetup.tsx (now integrated)
2. Update exports in index.ts


───────────────────────────────────────────────────────────────

9. Key Design Decisions

| Decision | Rationale |
   |----------|-----------|
| 2 steps, not 3 | Reduces friction; name/description is separate from recipe |
| Recipe grid in Step 2 | Users see recipes after committing to create a campaign |
| Inline configuration | No modal interruption; live preview drives engagement |
| Advanced settings collapsed | Power users can access; most users don't need them |
| Reuse FormSections | Leverages existing components for design/targeting/etc. |
| Extract QuickInputRenderers | Single source of truth for input rendering |
| buildCampaignFromRecipe utility | Centralizes recipe → campaign data transformation |


───────────────────────────────────────────────────────────────────────────────────────

10. Files to Create/Modify

New Files
| File | Purpose |
|------|---------|
| unified/steps/CampaignBasicsStep.tsx | Step 1 component |
| unified/steps/RecipeConfigurationStep.tsx | Step 2 component |
| unified/shared/QuickInputRenderers.tsx | Extracted input renderers |
| unified/shared/RecipeConfigBuilder.ts | Recipe → campaign builder |

Modified Files
| File | Changes |
|------|---------|
| unified/SingleCampaignFlow.tsx | New 2-step flow orchestration |
| unified/index.ts | Updated exports |
| unified/types.ts | Extended types if needed |

Potentially Deprecated
| File | Status |
|------|--------|
| recipes/RecipeQuickSetup.tsx | Logic moved to RecipeConfigurationStep; keep for backwards compatibility or remove |


─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

This implementation plan provides a comprehensive roadmap for the recipe-driven campaign creation flow. Shall I proceed with implementing any specific component?

● Update Tasks - updating 1 task
⎿ State → Complete
⎿ Updated tasks

● The implementation plan is complete. Here's a summary of the key deliverables:

Summary

1. Analysis of RecipeQuickSetup.tsx Patterns
   • Identified 5 reusable input renderers (discount_percentage, duration_hours, currency_amount, text, select)
   • Found context state management pattern for initializing defaults from recipe inputs
   • Identified live preview configuration builder that handles themes, backgrounds, and layouts

2. Proposed Component Structure
   • New 2-step flow: CampaignBasicsStep → RecipeConfigurationStep
   • 4 new files: Two step components, extracted QuickInputRenderers, and RecipeConfigBuilder utility
   • 1 modified file: SingleCampaignFlow.tsx orchestrates the new flow

3. User Journey Mapping
   • Step 1: Campaign name (required) and description (optional) - minimal friction entry
   • Step 2A: Recipe selection grid with goal filter tabs
   • Step 2B: Inline recipe configuration with live preview + collapsible advanced settings

4. Minimum Required Fields Per Recipe Type

| Template Type | Typical Inputs | Count |
   |---------------|----------------|-------|
| Newsletter (with discount) | discountValue, triggerType | 2 |
| Newsletter (no discount) | triggerType | 1 |
| Flash Sale | discountValue, durationHours | 2 |
| Spin-to-Win | triggerType | 1 |
| Cart Abandonment | discountValue, triggerType | 1-2 |
| Upsell/Bundle | bundleDiscount, productSelectionMethod, maxProducts | 3 |
| Free Shipping | threshold | 1 |

5. Recipe → Configuration Mapping
   The buildCampaignFromRecipe() utility centralizes the transformation:
   • templateType ← recipe.templateType
   • contentConfig ← recipe.defaults.contentConfig with user input substitutions
   • designConfig ← Built from theme + recipeType determines themeMode
   • discountConfig ← Recipe defaults merged with user input value
   • targetRules ← Recipe defaults with trigger selection applied

Would you like me to proceed with implementing any of the components outlined in this plan?
