# Type System Architecture Diagram

## Overview

This diagram shows how the unified type system works across the entire stack.

## Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Campaign Content Types                           │
│              (app/domains/campaigns/types/campaign.ts)              │
│                                                                      │
│  BaseContentConfig (shared by all)                                  │
│  ├─ headline: string                                                │
│  ├─ subheadline?: string                                            │
│  ├─ buttonText: string                                              │
│  ├─ successMessage: string                                          │
│  └─ ctaText?: string                                                │
│                                                                      │
│  NewsletterContent extends BaseContentConfig                        │
│  ├─ emailPlaceholder: string                                        │
│  ├─ submitButtonText: string                                        │
│  ├─ nameFieldEnabled: boolean                                       │
│  └─ consentFieldEnabled: boolean                                    │
│                                                                      │
│  SpinToWinContent extends BaseContentConfig                         │
│  ├─ spinButtonText: string                                          │
│  ├─ wheelSegments: Prize[]                                          │
│  ├─ emailRequired: boolean                                          │
│  └─ maxAttemptsPerUser: number                                      │
│                                                                      │
│  ... (8 more content types)                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ extends
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Storefront Design Config                          │
│           (app/domains/storefront/popups-new/types.ts)              │
│                                                                      │
│  PopupDesignConfig (design/visual properties only)                  │
│  ├─ id: string                                                      │
│  ├─ backgroundColor: string                                         │
│  ├─ textColor: string                                               │
│  ├─ buttonColor: string                                             │
│  ├─ position: PopupPosition                                         │
│  ├─ size: PopupSize                                                 │
│  ├─ borderRadius?: number                                           │
│  ├─ animation?: PopupAnimation                                      │
│  └─ ... (all design properties)                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ extends both
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Storefront Popup Configs                         │
│          (app/domains/storefront/popups-new/*.tsx)                  │
│                                                                      │
│  NewsletterConfig extends PopupDesignConfig, NewsletterContent      │
│  ├─ (inherits all design properties from PopupDesignConfig)         │
│  ├─ (inherits all content fields from NewsletterContent)            │
│  └─ discount?: DiscountConfig  (storefront-specific)                │
│                                                                      │
│  SpinToWinConfig extends PopupDesignConfig, SpinToWinContent        │
│  ├─ (inherits all design properties from PopupDesignConfig)         │
│  ├─ (inherits all content fields from SpinToWinContent)             │
│  └─ wheelSize?: number  (storefront-specific)                       │
│                                                                      │
│  ... (8 more popup configs)                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ used by
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Popup Components                               │
│          (app/domains/storefront/popups-new/*.tsx)                  │
│                                                                      │
│  NewsletterPopup({ config: NewsletterConfig })                      │
│  SpinToWinPopup({ config: SpinToWinConfig })                        │
│  ... (8 more popup components)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Template Seeding (prisma/template-data.ts)
    │
    │ Uses NewsletterContent schema
    │ { headline: "Join Our Newsletter", emailPlaceholder: "...", ... }
    │
    ▼
Database (Prisma)
    │
    │ Stores as JSON in contentConfig field
    │
    ▼
Campaign Form (app/domains/campaigns/components/...)
    │
    │ Validates using NewsletterContentSchema
    │
    ▼
Design Editor (app/domains/popups/components/design/...)
    │
    │ Edits both design + content fields
    │ Maps to NewsletterConfig
    │
    ▼
Preview (app/domains/popups/components/preview/...)
    │
    │ Passes NewsletterConfig to NewsletterPopup
    │
    ▼
Storefront (extensions/storefront-src/...)
    │
    │ Renders NewsletterPopup with NewsletterConfig
    │
    ▼
Customer sees popup with correct headline!
```

## Field Name Mapping (ELIMINATED!)

### Before (Required Mapping)
```
Campaign:     headline        → Design Editor: title
Campaign:     subheadline     → Design Editor: description
Campaign:     submitButtonText → Design Editor: buttonText
```

### After (No Mapping Needed!)
```
Campaign:     headline        → Design Editor: headline
Campaign:     subheadline     → Design Editor: subheadline
Campaign:     submitButtonText → Design Editor: submitButtonText
```

All components use the same field names from the content types!

## Type Safety Benefits

```typescript
// ✅ TypeScript catches errors at compile time

const config: NewsletterConfig = {
  id: "popup-1",
  headline: "Join Our Newsletter",  // ✅ Required by NewsletterContent
  emailPlaceholder: "Enter email",  // ✅ From NewsletterContent
  backgroundColor: "#FFFFFF",       // ✅ From PopupDesignConfig
  position: "center",               // ✅ From PopupDesignConfig
  
  // ❌ TypeScript error: Property doesn't exist
  invalidField: "value",
};

// ✅ Auto-completion works perfectly
config.headline;        // ✅ string (from NewsletterContent)
config.backgroundColor; // ✅ string (from PopupDesignConfig)
config.emailPlaceholder; // ✅ string (from NewsletterContent)
```

## Migration Path

### Phase 1: ✅ COMPLETE
- Created `PopupDesignConfig`
- Updated all 10 popup configs to extend design + content types
- Added temporary field mapping in preview

### Phase 2: 🚧 TODO
- Remove temporary field mapping
- Update TemplatePreview to use unified types
- Update PopupDesignEditorV2 to use content field names

### Phase 3: 🚧 TODO
- Verify template seeding uses correct field names
- Test end-to-end flow
- Remove deprecated `PopupConfig` type

## Key Principles

1. **Single Source of Truth**: Content fields defined ONCE in campaign types
2. **Separation of Concerns**: Design (how it looks) vs. Content (what it says)
3. **Type Safety**: TypeScript ensures compatibility
4. **No Duplication**: Fields not repeated across types
5. **Maintainability**: Changes propagate automatically

