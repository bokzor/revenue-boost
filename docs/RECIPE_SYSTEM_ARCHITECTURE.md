# Recipe System Architecture

> **Status**: PROPOSAL
> **Created**: 2024-12-01
> **Last Updated**: 2024-12-01
> **Replaces**: TEMPLATE_VARIANT_ARCHITECTURE.md (simplified approach)

## Executive Summary

This document defines the **Styled Recipe System** — a unified architecture where:

1. **Recipes** define behavior and structure (what the campaign DOES)
2. **Styles** define visual variations (seasonal/themed looks)
3. **Themes** define color palettes (reusable across recipes)
4. **Components** render the UI (flexible, composable)
5. **editableFields** constrain the admin (single source of truth)

**Key insight**: The recipe is the single model that drives BOTH the component rendering AND the admin form generation.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [The Single Model Principle](#the-single-model-principle)
3. [Styled Recipes](#styled-recipes)
4. [Theme System](#theme-system)
5. [Component Architecture](#component-architecture)
6. [Admin Form Generation](#admin-form-generation)
7. [Recipe Catalog](#recipe-catalog)
8. [User Flow](#user-flow)
9. [Implementation](#implementation)
10. [Migration Strategy](#migration-strategy)

---

## Core Concepts

### Concept Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STYLED RECIPE (what merchant sees)                              │
│  └── "Black Friday Sale", "Summer Flash Sale", "Welcome Discount"│
│                                                                  │
│      ┌─────────────────────────────────────────────────────────┐│
│      │ Composed of:                                             ││
│      │                                                          ││
│      │ BASE RECIPE (behavior)     STYLE (visual variation)     ││
│      │ └── flash-sale             └── black-friday             ││
│      │ └── newsletter-signup      └── summer                   ││
│      │ └── cart-recovery          └── holiday                  ││
│      │                                                          ││
│      │ THEME (colors)             COMPONENT (rendering)        ││
│      │ └── bold, dark, modern     └── FlashSaleCentered        ││
│      │ └── summer, black-friday   └── NewsletterSplit          ││
│      │                                                          ││
│      │ EDITABLE FIELDS (admin)    DEFAULTS (locked values)     ││
│      │ └── headline, buttonText   └── showCountdown: true      ││
│      │ └── discountValue          └── urgencyMessage: "..."    ││
│      └─────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Definitions

| Concept | Definition | Example |
|---------|------------|---------|
| **Styled Recipe** | A ready-to-use campaign template with predefined behavior, visuals, and copy | "Black Friday Sale" |
| **Base Recipe** | The underlying behavior/use case | "flash-sale" (time-limited discount) |
| **Style** | A themed visual variation of a base recipe | "black-friday", "summer", "holiday" |
| **Theme** | A color palette from the existing theme system | "bold", "dark", "summer" |
| **Component** | The React component that renders the popup | `FlashSaleCentered`, `NewsletterSplit` |
| **Editable Fields** | Which fields the merchant can customize in admin | `["headline", "discountValue"]` |
| **Defaults** | Pre-configured values that are locked | `{ showCountdown: true }` |

---

## The Single Model Principle

### The Problem

```
Component supports: 30+ configurable fields
Admin exposes: 30+ form fields
Merchant sees: Overwhelming complexity
```

### The Solution

**The Styled Recipe is the single source of truth that:**
1. Tells the component what to render (via merged config)
2. Tells the admin what to show (via editableFields)
3. Provides sensible defaults (via defaults)

```
┌─────────────────────────────────────────────────────────────────┐
│  STYLED RECIPE: "Black Friday Sale"                              │
│                                                                  │
│  editableFields: ["headline", "discountValue", "buttonText"]    │
│                                                                  │
│  defaults: {                                                     │
│    subheadline: "BIGGEST SALE OF THE YEAR",                     │
│    showCountdown: true,                                          │
│    theme: "black-friday",                                        │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │ ADMIN FORM        │       │ COMPONENT         │
        │                   │       │                   │
        │ Shows only:       │       │ Receives merged:  │
        │ • Headline        │       │ • headline (user) │
        │ • Discount %      │       │ • subheadline     │
        │ • Button text     │       │ • showCountdown   │
        │                   │       │ • theme           │
        │ (3 fields)        │       │ (full config)     │
        └───────────────────┘       └───────────────────┘
```

---

## Styled Recipes

### Why "Styled Recipes" Instead of "Recipes + Styles"?

Merchants think in campaign names, not abstract combinations:

> ✅ "I want to run a **Black Friday Sale**"
>
> ❌ "I want a Flash Sale recipe with Black Friday style"

**Styled Recipes are presented as standalone cards**, hiding the internal recipe+style structure.

### StyledRecipe Interface

```typescript
interface StyledRecipe {
  // Identity
  id: string;                        // "black-friday-sale"
  name: string;                      // "Black Friday Sale"
  tagline: string;                   // "The biggest sale of the year"
  description: string;               // Longer explanation
  icon: string;                      // "🖤"

  // Classification
  category: RecipeCategory;          // "sales_promos"
  goal: CampaignGoal;                // "INCREASE_REVENUE"
  templateType: TemplateType;        // "FLASH_SALE"

  // Internal reference (optional, for understanding)
  baseRecipeId?: string;             // "flash-sale"
  styleId?: string;                  // "black-friday"

  // Rendering
  component: ComponentName;          // "FlashSaleCentered"
  theme: ThemeKey;                   // "black-friday"
  background?: string;               // "bg-dark-texture.png"

  // Admin form generation
  editableFields: EditableField[];   // What merchant can edit
  inputs: RecipeInput[];             // Quick setup inputs (1-3)

  // Locked configuration
  defaults: {
    contentConfig: Partial<ContentConfig>;
    designConfig: Partial<DesignConfig>;
    targetRules?: Partial<TargetRulesConfig>;
    discountConfig?: Partial<DiscountConfig>;
  };

  // Build function (merges user input with defaults)
  build: (context: RecipeContext) => CampaignConfig;
}
```

### EditableField Interface

```typescript
interface EditableField {
  key: string;                       // "headline"
  type: FieldType;                   // "text" | "textarea" | "number" | "boolean" | "select" | "color"
  label: string;                     // "Headline"
  placeholder?: string;              // "Enter your headline..."
  helpText?: string;                 // "This appears at the top of the popup"
  options?: SelectOption[];          // For select type
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  defaultValue?: unknown;            // Initial value if not in defaults
  group?: string;                    // For grouping in admin UI
}

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "product_picker"
  | "collection_picker"
  | "date"
  | "duration";
```

---

## Recipe Categories

Recipes are organized by **merchant intent**, not technical template type:

| Category | Icon | Description | Example Styled Recipes |
|----------|------|-------------|------------------------|
| **Email & Leads** | 📧 | Capture emails with offers | Welcome Discount, Exit Offer, Spin For Prize, VIP Early Access |
| **Sales & Promos** | 🔥 | Drive sales with urgency | Flash Sale, Black Friday Sale, Summer Sale, BOGO Weekend |
| **Cart & Recovery** | 🛒 | Recover carts, increase AOV | Cart Recovery, Free Shipping Progress, Complete Your Look |
| **Announcements** | 📢 | Inform customers | Sale Announcement, New Arrival, Store Update |

### Category Metadata

```typescript
type RecipeCategory = "email_leads" | "sales_promos" | "cart_recovery" | "announcements";

const RECIPE_CATEGORIES: Record<RecipeCategory, CategoryMeta> = {
  email_leads: {
    label: "Email & Leads",
    icon: "📧",
    description: "Grow your email list with compelling offers",
    defaultGoal: "NEWSLETTER_SIGNUP",
  },
  sales_promos: {
    label: "Sales & Promos",
    icon: "🔥",
    description: "Drive sales with discounts and urgency",
    defaultGoal: "INCREASE_REVENUE",
  },
  cart_recovery: {
    label: "Cart & Recovery",
    icon: "🛒",
    description: "Recover abandoned carts and increase AOV",
    defaultGoal: "INCREASE_REVENUE",
  },
  announcements: {
    label: "Announcements",
    icon: "📢",
    description: "Inform customers about news and updates",
    defaultGoal: "ENGAGEMENT",
  },
};
```

---

## Theme System

### Separation of Concerns

| Concern | Where It Lives | Examples |
|---------|----------------|----------|
| **Colors** | Theme (`color-presets.ts`) | backgroundColor, textColor, buttonColor |
| **Background Images** | contentConfig | `backgroundImage`, `imageUrl` |
| **Layout** | Component + CSS | centered, split-left, banner |

**Themes are colors only. Background images are separate content.**

### Available Themes

The existing theme system provides these built-in themes:

| Theme | Description | Best For |
|-------|-------------|----------|
| `modern` | Clean, professional blue | General use, newsletters |
| `minimal` | Black/white, simple | Luxury brands |
| `elegant` | Sophisticated, refined | Fashion, jewelry |
| `bold` | High contrast, impactful | Flash sales, urgency |
| `dark` | Dark mode | Evening campaigns, tech |
| `gradient` | Purple gradient | Gamification, fun |
| `luxury` | Gold/dark | Premium products |
| `neon` | Vibrant neon colors | Youth brands |

### Seasonal Themes (to be added)

| Theme | Description | Best For |
|-------|-------------|----------|
| `summer` | Coral, turquoise, warm | Summer sales |
| `black-friday` | Black, yellow, urgent | Black Friday |
| `holiday` | Red, green, gold | Holiday season |
| `valentine` | Pink, red, romantic | Valentine's Day |

### Theme + Background Independence

A styled recipe specifies both, but they're independent choices:

```typescript
{
  id: "summer-flash-sale",
  theme: "summer",                    // Colors from theme system
  background: "bg-summer-waves.png",  // Optional background image
}

{
  id: "black-friday-sale",
  theme: "black-friday",              // Colors
  background: undefined,               // No background, solid color
}
```

---

## Component Architecture

### The Problem with Props Explosion

```tsx
// ❌ This becomes unmanageable
<FlashSalePopup
  variant="black-friday"
  layout="split"
  showImage={true}
  showCountdown={true}
  showUrgencyBadge={true}
  imagePosition="left"
  countdownPosition="top"
  badgeStyle="ribbon"
  useFullscreenOnMobile={true}
  animationType="bounce"
  // ... 20 more props
/>
```

### When to Use Props vs New Component

| Difference Level | Example | Solution |
|------------------|---------|----------|
| Colors/copy only | "Flash Sale" vs "Black Friday" | Same component, theme prop |
| Show/hide sections | With image vs without | Same component, boolean props |
| Different layout | Centered vs side drawer | CSS classes via props |
| **Different HTML structure** | Newsletter form vs Spin wheel | **Different component** |

### Composition Pattern

**Three layers of abstraction:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Layer 1: PRIMITIVES (atoms)                                     │
│  └── Headline, Button, Input, CountdownTimer, ProgressBar       │
│                                                                  │
│  Layer 2: SECTIONS (molecules)                                   │
│  └── HeaderSection, ImageSection, FormSection, DiscountBadge    │
│                                                                  │
│  Layer 3: TEMPLATES (organisms)                                  │
│  └── FlashSaleCentered, FlashSaleSplit, NewsletterSplit         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Example Components

**Primitives (reusable across all templates):**
```tsx
// primitives/Headline.tsx
export function Headline({ children, size = "lg" }) {
  return <h2 className={cn("popup-headline", `text-${size}`)}>{children}</h2>;
}

// primitives/CTAButton.tsx
export function CTAButton({ children, onClick }) {
  return <button className="popup-cta" onClick={onClick}>{children}</button>;
}

// primitives/CountdownTimer.tsx
export function CountdownTimer({ duration, onComplete }) {
  const { hours, minutes, seconds } = useCountdown(duration);
  return <div className="popup-countdown">{hours}:{minutes}:{seconds}</div>;
}
```

**Templates (compose primitives):**
```tsx
// templates/FlashSaleCentered.tsx
export function FlashSaleCentered({ content, design }: Props) {
  return (
    <PopupShell position="center" theme={design.theme}>
      <Headline>{content.headline}</Headline>
      <Subheadline>{content.subheadline}</Subheadline>
      {content.showCountdown && <CountdownTimer duration={content.countdownDuration} />}
      <CTAButton onClick={handleClick}>{content.buttonText}</CTAButton>
    </PopupShell>
  );
}

// templates/FlashSaleSplit.tsx
export function FlashSaleSplit({ content, design }: Props) {
  return (
    <PopupShell position="center" theme={design.theme}>
      <SplitLayout>
        <ImagePane src={content.imageUrl} />
        <ContentPane>
          <Headline>{content.headline}</Headline>
          <CTAButton>{content.buttonText}</CTAButton>
        </ContentPane>
      </SplitLayout>
    </PopupShell>
  );
}
```

### Component Registry

```typescript
const COMPONENT_MAP: Record<ComponentName, React.ComponentType<PopupProps>> = {
  "FlashSaleCentered": FlashSaleCentered,
  "FlashSaleSplit": FlashSaleSplit,
  "NewsletterSplit": NewsletterSplit,
  "NewsletterMinimal": NewsletterMinimal,
  "SpinWheel": SpinWheel,
  "CartRecovery": CartRecovery,
  "FreeShippingBar": FreeShippingBar,
};

// Renderer picks component based on recipe
export function PopupRenderer({ recipe, content, design }: Props) {
  const Component = COMPONENT_MAP[recipe.component];
  return <Component content={content} design={design} />;
}
```

### File Structure

```
app/domains/storefront/popups/
├── primitives/
│   ├── Headline.tsx
│   ├── Subheadline.tsx
│   ├── CTAButton.tsx
│   ├── CountdownTimer.tsx
│   ├── EmailInput.tsx
│   └── ProgressBar.tsx
├── sections/
│   ├── HeaderSection.tsx
│   ├── ImageSection.tsx
│   └── SplitLayout.tsx
├── shells/
│   ├── PopupShell.tsx          # Modal container
│   ├── DrawerShell.tsx         # Side drawer
│   └── BannerShell.tsx         # Top/bottom bar
├── templates/
│   ├── flash-sale/
│   │   ├── FlashSaleCentered.tsx
│   │   └── FlashSaleSplit.tsx
│   ├── newsletter/
│   │   ├── NewsletterSplit.tsx
│   │   └── NewsletterMinimal.tsx
│   └── index.ts                # COMPONENT_MAP
└── PopupRenderer.tsx
```

---

## Admin Form Generation

### The Principle

**`editableFields` drives the admin form automatically.**

The recipe declares which fields can be edited. The admin form generator reads this and renders only those fields.

### How It Works

```typescript
// Recipe defines editable fields
const blackFridaySale: StyledRecipe = {
  id: "black-friday-sale",
  // ...
  editableFields: [
    { key: "headline", type: "text", label: "Headline", group: "content" },
    { key: "discountValue", type: "number", label: "Discount %", group: "offer" },
    { key: "buttonText", type: "text", label: "Button Text", group: "content" },
  ],
  defaults: {
    contentConfig: {
      subheadline: "BIGGEST SALE OF THE YEAR",
      showCountdown: true,
      urgencyMessage: "LIMITED TIME",
    },
  },
};
```

### Admin Form Component

```tsx
// RecipeEditor.tsx
function RecipeEditor({ recipe, values, onChange }: Props) {
  // Group fields for organized UI
  const groupedFields = groupBy(recipe.editableFields, 'group');

  return (
    <Form>
      {Object.entries(groupedFields).map(([group, fields]) => (
        <FormSection key={group} title={group}>
          {fields.map((field) => (
            <FormField
              key={field.key}
              type={field.type}
              label={field.label}
              value={values[field.key] ?? recipe.defaults.contentConfig?.[field.key]}
              onChange={(v) => onChange(field.key, v)}
              placeholder={field.placeholder}
              helpText={field.helpText}
              validation={field.validation}
            />
          ))}
        </FormSection>
      ))}
    </Form>
  );
}
```

### Comparison: Simple vs Power User Recipes

**Simple Recipe (3 editable fields):**
```typescript
{
  id: "black-friday-sale",
  editableFields: [
    { key: "headline", type: "text", label: "Headline" },
    { key: "discountValue", type: "number", label: "Discount %" },
    { key: "buttonText", type: "text", label: "Button Text" },
  ],
  // Everything else is locked in defaults
}
```

**Power User Recipe (10+ editable fields):**
```typescript
{
  id: "custom-flash-sale",
  editableFields: [
    { key: "headline", type: "text", label: "Headline" },
    { key: "subheadline", type: "text", label: "Subheadline" },
    { key: "discountValue", type: "number", label: "Discount %" },
    { key: "buttonText", type: "text", label: "Button Text" },
    { key: "showCountdown", type: "boolean", label: "Show Countdown" },
    { key: "countdownDuration", type: "duration", label: "Duration" },
    { key: "urgencyMessage", type: "text", label: "Urgency Message" },
    { key: "theme", type: "select", label: "Theme", options: THEMES },
    { key: "imageUrl", type: "image", label: "Background Image" },
  ],
  // Minimal defaults, user controls everything
}
```

---

## Styled Recipe Catalog

### 📧 Email & Leads

| Styled Recipe | Icon | Theme | Component | Editable Fields |
|---------------|------|-------|-----------|-----------------|
| **Welcome Discount** | 🎁 | modern | NewsletterSplit | headline, discountValue, buttonText |
| **Exit Offer** | 🚪 | dark | NewsletterMinimal | headline, discountValue |
| **Spin For Prize** | 🎡 | gradient | SpinWheel | headline |
| **VIP Early Access** | 👑 | luxury | NewsletterMinimal | headline, buttonText |

### 🔥 Sales & Promos (Evergreen)

| Styled Recipe | Icon | Theme | Component | Editable Fields |
|---------------|------|-------|-----------|-----------------|
| **Flash Sale** | ⚡ | bold | FlashSaleCentered | headline, discountValue, duration |
| **Product Spotlight** | ✨ | elegant | FlashSaleSplit | product, discountValue |
| **BOGO Weekend** | 🛍️ | gradient | FlashSaleCentered | products, headline |
| **Spend More Save More** | 📈 | modern | FlashSaleCentered | headline |

### 🔥 Sales & Promos (Seasonal)

| Styled Recipe | Icon | Theme | Component | Base Recipe |
|---------------|------|-------|-----------|-------------|
| **Summer Flash Sale** | ☀️ | summer | FlashSaleSplit | flash-sale |
| **Black Friday Sale** | 🖤 | black-friday | FlashSaleCentered | flash-sale |
| **Holiday Sale** | 🎄 | holiday | FlashSaleCentered | flash-sale |
| **Cyber Monday Deal** | 💻 | neon | FlashSaleCentered | flash-sale |

### 🛒 Cart & Recovery

| Styled Recipe | Icon | Theme | Component | Editable Fields |
|---------------|------|-------|-----------|-----------------|
| **Cart Recovery** | 🛒 | modern | CartRecovery | headline, discountValue |
| **Free Shipping Progress** | 🚚 | modern | FreeShippingBar | threshold |
| **Complete Your Look** | 👗 | minimal | ProductUpsell | headline, bundleDiscount |

### 📢 Announcements

| Styled Recipe | Icon | Theme | Component | Editable Fields |
|---------------|------|-------|-----------|-----------------|
| **Sale Announcement** | 📣 | bold | AnnouncementBanner | headline, ctaUrl |
| **New Arrival** | 🆕 | modern | AnnouncementBanner | product, headline |

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Pick Recipe                                             │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  📧 Email & Leads                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Welcome         │  │ Spin For        │  │ Exit            │  │
│  │ Discount 🎁     │  │ Prize 🎡        │  │ Offer 🚪        │  │
│  │                 │  │                 │  │                 │  │
│  │ "Get 10% off    │  │ "Spin to win!"  │  │ "15% off before │  │
│  │  your first"    │  │                 │  │  you go"        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  🔥 Sales & Promos                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Flash Sale ⚡    │  │ BOGO Weekend 🛍️ │  │ Spend More 📈   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│                    [+ Build from scratch]                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Quick Setup (1-3 inputs)                                │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  Welcome Discount                                                │
│                                                                  │
│  What discount do you want to offer?                            │
│  ┌─────────────────────────────────────┐                        │
│  │  [====●==================] 10%      │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│                              [Continue]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Choose Your Style                                       │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  Pick a theme:  (uses existing ThemePresetSelector)              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │Mod │ │Min │ │Ele │ │Bold│ │Dark│ │Grad│ │Lux │ │Neon│  ...  │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘       │
│                                                                  │
│  Your custom themes:                                             │
│  ┌────────────────────────────────────────────┐                 │
│  │ [My Brand Theme]  [Summer 2024]  [+ New]   │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │                             │                                │
│  │      [Live Preview]        │                                │
│  │                             │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
│                              [Continue]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Review & Publish                                        │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  Campaign: Welcome Discount                                      │
│                                                                  │
│  ┌─────────────────────────────┐  Content (editable)            │
│  │                             │  ├─ Headline: "Get 10% Off..." │
│  │      [Final Preview]       │  ├─ Button: "Claim My Discount" │
│  │                             │  └─ Success: "Check your email" │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Targeting: Shows after 5 seconds                               │
│  Discount: 10% off, single-use, auto-apply                      │
│                                                                  │
│             [Save Draft]  [Publish Campaign]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### File Structure

```
app/domains/
├── campaigns/
│   ├── recipes/
│   │   ├── styled-recipe-catalog.ts   # All styled recipes
│   │   ├── styled-recipe-types.ts     # TypeScript interfaces
│   │   ├── editable-fields.ts         # Field definitions
│   │   └── index.ts
│   ├── components/
│   │   ├── recipes/
│   │   │   ├── RecipePicker.tsx       # Step 1: Category + recipe cards
│   │   │   ├── RecipeQuickSetup.tsx   # Step 2: Quick inputs
│   │   │   ├── RecipeThemePicker.tsx  # Step 3: Theme selection
│   │   │   ├── RecipeEditor.tsx       # Step 4: Editable fields form
│   │   │   └── RecipePreview.tsx      # Live preview
│   │   └── form/
│   │       └── DynamicFormField.tsx   # Renders field by type
│   └── ...
└── storefront/
    └── popups/
        ├── primitives/                 # Reusable atoms
        ├── sections/                   # Composable molecules
        ├── shells/                     # Container components
        ├── templates/                  # Final popup components
        │   ├── flash-sale/
        │   │   ├── FlashSaleCentered.tsx
        │   │   └── FlashSaleSplit.tsx
        │   ├── newsletter/
        │   │   ├── NewsletterSplit.tsx
        │   │   └── NewsletterMinimal.tsx
        │   └── index.ts               # COMPONENT_MAP
        └── PopupRenderer.tsx          # Picks component from recipe
```

### Complete StyledRecipe Example

```typescript
// styled-recipe-catalog.ts

const blackFridaySale: StyledRecipe = {
  // Identity
  id: "black-friday-sale",
  name: "Black Friday Sale",
  tagline: "The biggest sale of the year",
  description: "High-urgency flash sale with dark theme and bold messaging.",
  icon: "🖤",

  // Classification
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",

  // Internal reference
  baseRecipeId: "flash-sale",
  styleId: "black-friday",

  // Rendering
  component: "FlashSaleCentered",
  theme: "black-friday",

  // Quick setup (1-3 inputs shown first)
  inputs: [
    { type: "discount_percentage", label: "Discount", key: "discountValue", defaultValue: 50 },
    { type: "duration_hours", label: "Duration", key: "durationHours", defaultValue: 24 },
  ],

  // What merchant can customize in editor
  editableFields: [
    { key: "headline", type: "text", label: "Headline", group: "content" },
    { key: "subheadline", type: "text", label: "Subheadline", group: "content" },
    { key: "buttonText", type: "text", label: "Button Text", group: "content" },
    { key: "discountValue", type: "number", label: "Discount %", group: "offer" },
  ],

  // Locked configuration (recipe decides)
  defaults: {
    contentConfig: {
      headline: "BLACK FRIDAY",
      subheadline: "UP TO {discountValue}% OFF EVERYTHING",
      buttonText: "SHOP NOW",
      urgencyMessage: "LIMITED TIME",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "bounce",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 2000 },
      },
    },
  },

  // Merge user input with defaults
  build: (context) => {
    const discountValue = context.discountValue ?? 50;
    return {
      name: "Black Friday Sale",
      contentConfig: {
        ...defaults.contentConfig,
        headline: context.headline ?? "BLACK FRIDAY",
        subheadline: `UP TO ${discountValue}% OFF EVERYTHING`,
      },
      designConfig: {
        theme: context.selectedTheme ?? "black-friday",
        ...defaults.designConfig,
      },
      discountConfig: {
        enabled: true,
        type: "shared",
        valueType: "PERCENTAGE",
        value: discountValue,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      },
      targetRules: defaults.targetRules,
    };
  },
};
```

---

## Mobile Handling

All recipes are **mobile-first by default**. No separate mobile template selection.

### Strategy

| Device | Layout Behavior |
|--------|----------------|
| Mobile (<640px) | Bottom sheet, full-width, larger touch targets |
| Desktop (≥640px) | Centered modal or side drawer based on component |

### CSS-Based Responsive

```css
/* Base: mobile layout (bottom sheet) */
.popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 24px 24px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  max-height: 80vh;
}

/* Desktop override */
@media (min-width: 640px) {
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    bottom: auto;
    border-radius: 16px;
    max-width: 480px;
  }

  .popup--split {
    max-width: 720px;
    display: grid;
    grid-template-columns: 45% 55%;
  }
}

/* Touch optimization */
.popup button {
  min-height: 48px;
  font-size: 16px; /* Prevents iOS zoom */
}
```

---

## Migration Strategy

### No Database Changes Required

Styled recipes output standard `CampaignFormData` compatible with existing system:

```typescript
const output = recipe.build(context);

await createCampaign({
  name: output.name,
  goal: recipe.goal,
  templateType: recipe.templateType,
  contentConfig: output.contentConfig,
  designConfig: output.designConfig,
  discountConfig: output.discountConfig,
  targetRules: output.targetRules,
});
```

### Tracking Recipe Origin (Optional)

To show "Created from: Black Friday Sale" in campaign list:

```typescript
// Add to Campaign model (optional)
model Campaign {
  // ... existing fields
  recipeId      String?   // "black-friday-sale"
}
```

---

## Comparison: Before vs After

| Aspect | Current Wizard | Styled Recipe Flow |
|--------|----------------|-------------------|
| **Step 1** | Pick Goal | Pick Styled Recipe card |
| **Step 2** | Pick Template | Quick Setup (1-3 inputs) |
| **Step 3** | Configure Content (many fields) | Pick Theme |
| **Step 4** | Configure Design (many fields) | Edit Content (only editable fields) |
| **Step 5** | Configure Targeting | Review & Publish |
| **Step 6** | Configure Discount | — |
| **Step 7** | Review & Publish | — |
| **Total Steps** | 7 | 5 |
| **Fields to configure** | 40+ | 3-10 (recipe decides) |
| **Time to publish** | 10-15 minutes | 2-3 minutes |

---

## Key Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Styled Recipes are the cards** | Merchants think "Black Friday Sale", not "Flash Sale + Black Friday style" |
| **Recipe = single source of truth** | Drives both component rendering AND admin form |
| **editableFields constrains admin** | Simple recipes = few fields; power user = more fields |
| **Themes are colors only** | Background images are separate content concern |
| **Composition over props** | Different HTML structure = different component, shared primitives |
| **Mobile-first CSS** | No separate mobile templates; responsive by default |
| **No database changes** | Recipes output standard campaign data |

---

## Next Steps

1. [ ] Add seasonal themes to `color-presets.ts` (summer, black-friday, holiday)
2. [ ] Refactor `recipe-catalog.ts` to `StyledRecipe` structure
3. [ ] Add `editableFields` to all styled recipes
4. [ ] Create `RecipePicker` component (category grid + recipe cards)
5. [ ] Create `RecipeEditor` component (dynamic form from editableFields)
6. [ ] Create new popup components using composition pattern
7. [ ] Update campaign creation route to use new flow
8. [ ] Add mobile preview toggle in editor

---

*Document maintained by the Engineering team. Last review: 2024-12-01*
