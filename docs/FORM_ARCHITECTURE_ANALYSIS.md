# Form Architecture Analysis

## Executive Summary

The current campaign form has a fundamental architectural problem: **form fields are not tightly coupled to the popup React components**. This creates mismatches where form fields exist but have no effect, or popup features exist without corresponding form controls.

---

## Current Architecture

### How It Works Today

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Campaign Form (Monolithic)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ContentConfigSection.tsx                                               │
│    └── Switch by templateType:                                          │
│        ├── NEWSLETTER → NewsletterContentSection                        │
│        ├── SPIN_TO_WIN → SpinToWinContentSection                       │
│        ├── FLASH_SALE → FlashSaleContentSection                        │
│        └── ... (11 template types)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  DesignConfigSection.tsx (SHARED for all templates)                     │
│    └── Theme, Position, Size, Colors, Background, Typography, etc.     │
├─────────────────────────────────────────────────────────────────────────┤
│  DiscountConfigSection.tsx (SHARED)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  TargetingConfigSection.tsx (SHARED)                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            contentConfig + designConfig
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     Popup Components (Separate)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  NewsletterPopup.tsx                                                    │
│    └── Uses: headline, subheadline, buttonText, emailPlaceholder,       │
│             nameFieldEnabled, consentFieldEnabled, discount,            │
│             backgroundColor, textColor, buttonColor, imageUrl, etc.     │
├─────────────────────────────────────────────────────────────────────────┤
│  SpinToWinPopup.tsx                                                     │
│    └── Uses: headline, spinButtonText, wheelSegments, collectName,      │
│             emailPlaceholder, showGdprCheckbox, animationDuration, etc. │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Core Problem

**No guaranteed 1:1 mapping between form fields and popup props.**

| Symptom | Example |
|---------|---------|
| **Form field with no effect** | `titleFontWeight` in DesignConfigSchema but not used by all popups |
| **Popup prop with no form** | `successTitle`, `successEmoji` in NewsletterConfig but no form field |
| **Inconsistent naming** | `buttonText` in form vs `submitButtonText` in some popups |
| **Shared fields that don't apply** | `popupSize` only for FlashSale but in shared DesignConfigSchema |

---

## Field Mapping Audit: Newsletter

### Form Fields (NewsletterContentSection.tsx)

| Field | Form Location | Used by Popup? |
|-------|---------------|----------------|
| `headline` | Content | ✅ Yes |
| `subheadline` | Content | ✅ Yes |
| `buttonText` | Content | ⚠️ Partially (mapped to submitButtonText) |
| `emailLabel` | Content | ❌ Not used directly |
| `dismissLabel` | Content | ❌ Not rendered |
| `emailPlaceholder` | Content | ✅ Yes |
| `successMessage` | Content | ✅ Yes |
| `failureMessage` | Content | ❌ Not used (no error display) |
| `nameFieldEnabled` | Field Config | ✅ Yes |
| `consentFieldEnabled` | Field Config | ✅ Yes |

### Popup Props (NewsletterPopup.tsx) NOT in Form

| Prop | Description | Has Form Field? |
|------|-------------|-----------------|
| `successTitle` | Title on success screen | ❌ No |
| `successEmoji` | Emoji on success screen | ❌ No |
| `titleFontSize` | Typography control | ❌ No (in schema but collapsed) |
| `inputBackdropFilter` | Glass effect | ❌ No |
| `inputBoxShadow` | Input shadow | ❌ No |

---

## Identified Mismatches

### 1. Newsletter
- Form has `dismissLabel` but popup doesn't render it
- Form has `emailLabel` but popup uses placeholder only
- Popup has `successTitle`/`successEmoji` with no form control

### 2. Flash Sale  
- Form has `urgencyMessage` field
- Form has timer configuration
- Design has `popupSize` specific to this template

### 3. Spin to Win
- Uses `spinButtonText` not generic `buttonText`
- Has `wheelSegments` with complex nested config
- `collectName` vs `nameFieldEnabled` naming inconsistency

### 4. Design Config (Shared)
- 50+ design fields in schema
- Many are only relevant to certain templates
- Typography fields exist but hidden in collapsed sections
- No validation that template supports the field

---

## Proposed Solutions

### Option A: Block-Based Architecture

Each visual block defines BOTH its React component AND its form schema in one place:

```typescript
// blocks/HeadlineBlock.ts
export const HeadlineBlock = {
  // Component that renders in popup
  Component: ({ config }) => <h1 style={...}>{config.headline}</h1>,

  // Form that edits this block
  Form: ({ value, onChange }) => (
    <TextField label="Headline" value={value.headline} onChange={...} />
  ),

  // Schema for validation
  schema: z.object({
    headline: z.string().min(1),
  }),

  // Default values
  defaults: { headline: "Welcome!" },
};
```

**Template composition:**
```typescript
// templates/newsletter.ts
export const NewsletterTemplate = {
  blocks: [
    HeadlineBlock,
    SubheadlineBlock,
    EmailInputBlock,
    SubmitButtonBlock,
    BackgroundBlock,
  ],
};
```

**Pros:**
- ✅ Guaranteed 1:1 parity between form and popup
- ✅ Each block is self-contained and testable
- ✅ Easy to add new blocks
- ✅ Blocks can be reused across templates

**Cons:**
- ❌ Major refactor of existing code
- ❌ Need to decompose existing popup components
- ❌ May add complexity for tightly-coupled features

---

### Option B: Template-Specific Forms (Simpler)

Each template type has its own dedicated form that exactly matches its popup:

```
templates/
├── newsletter/
│   ├── NewsletterPopup.tsx      # Popup component
│   ├── NewsletterForm.tsx       # Admin form
│   └── newsletter.schema.ts     # Shared schema
├── spin-to-win/
│   ├── SpinToWinPopup.tsx
│   ├── SpinToWinForm.tsx
│   └── spin-to-win.schema.ts
└── flash-sale/
    ├── FlashSalePopup.tsx
    ├── FlashSaleForm.tsx
    └── flash-sale.schema.ts
```

**The schema is THE contract:**
```typescript
// templates/newsletter/newsletter.schema.ts
export const NewsletterSchema = z.object({
  // Content
  headline: z.string(),
  subheadline: z.string().optional(),
  buttonText: z.string(),
  emailPlaceholder: z.string(),
  successMessage: z.string(),

  // Form fields
  nameFieldEnabled: z.boolean(),
  consentFieldEnabled: z.boolean(),

  // Design (only newsletter-relevant fields)
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  imageUrl: z.string().optional(),
  layout: z.enum(["centered", "split-left", "split-right"]),
});

export type NewsletterConfig = z.infer<typeof NewsletterSchema>;
```

**Pros:**
- ✅ Simpler mental model
- ✅ Each template is fully self-contained
- ✅ No need to decompose existing popups
- ✅ Easier incremental migration

**Cons:**
- ❌ Some duplication across templates
- ❌ Adding a new feature to all templates requires touching multiple files

---

## Recommendation: Hybrid Approach

Combine the best of both:

1. **Keep template-specific schemas** (Option B) as the source of truth
2. **Extract shared blocks** (Option A) for common patterns like:
   - `HeadlineBlock` (headline + subheadline)
   - `EmailCaptureBlock` (email input + name + consent)
   - `DiscountBlock` (discount configuration)
   - `BackgroundBlock` (image/color/gradient)
3. **Compose templates from blocks** where it makes sense
4. **Allow template-specific overrides** for unique features

### Migration Path

```
Phase 1: Audit & Document
  └── Map all form fields to popup props for each template

Phase 2: Create Shared Blocks
  └── Extract 5-7 common blocks used by multiple templates

Phase 3: Refactor One Template
  └── Start with Newsletter as the simplest case

Phase 4: Validate with Recipe Editor
  └── Ensure the simplified recipe form works with new architecture

Phase 5: Migrate Remaining Templates
  └── One template at a time
```

---

## Integration with Recipe Editor

The simplified recipe editor (`/app/campaigns/new/quick`) should:

1. **Show only the blocks that exist in the selected template**
2. **Use the same block form components** as the full editor
3. **Collapse design blocks** by default (show content blocks expanded)

```
Recipe Quick Editor
├── Content Blocks (expanded)
│   ├── HeadlineBlock.Form
│   ├── SubheadlineBlock.Form
│   └── EmailCaptureBlock.Form
├── Design Blocks (collapsed)
│   ├── BackgroundBlock.Form
│   ├── ColorBlock.Form
│   └── TypographyBlock.Form
└── Targeting (collapsed)
    └── TargetingBlock.Form
```

---

## Next Steps

1. [ ] Audit all 11 templates and create field mapping tables
2. [ ] Decide: Block-based (A) vs Template-specific (B) vs Hybrid
3. [ ] Design the block interface/contract
4. [ ] Prototype with Newsletter template
5. [ ] Build the simplified recipe editor using new architecture

