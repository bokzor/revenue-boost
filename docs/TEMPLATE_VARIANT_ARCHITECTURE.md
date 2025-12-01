# Template Variant Architecture

> **Status**: APPROVED  
> **Created**: 2024-12-01  
> **Last Updated**: 2024-12-01

## Executive Summary

This document defines our template architecture: **"multiple pre-designed variants with minimal configuration"** instead of one highly-configurable template per type.

### Key Constraints

| Constraint | Target |
|------------|--------|
| Bundle size per template | ~50kb (lazy loaded) |
| Variants per template | 10+ |
| External dependencies | Zero (no XState, etc.) |
| Architecture patterns | One unified pattern for all |
| Mobile support | 100% optimized (not just responsive) |

### The Problem

Current templates expose 40+ config fields (position, size, image placement, etc.), creating:
- Too many combinations that don't make visual sense
- User overwhelm with choices
- QA complexity testing all permutations

### The Solution

**10+ curated variants** per template type, each with:
- Locked design decisions (layout, animations, visual structure)
- Limited customization (brand colors, copy, behavior toggles)
- Separate mobile layout (bottom sheets, touch-optimized)

---

## Table of Contents

1. [Architecture Decision](#architecture-decision)
2. [Core Architecture](#core-architecture)
3. [Variant System](#variant-system)
4. [Layout Modes](#layout-modes)
5. [Mobile Optimization](#mobile-optimization)
6. [Template Type Analysis](#template-type-analysis)
7. [Bundle Size Analysis](#bundle-size-analysis)
8. [Implementation Plan](#implementation-plan)
9. [Migration Strategy](#migration-strategy)

---

## Architecture Decision

### Options Evaluated & Rejected

| Option | Why Rejected |
|--------|--------------|
| **XState** | +15-20kb bundle, overkill for our needs |
| **Separate component per variant** | 10+ variants = too many files, code duplication |
| **Compound components** | Too flexible, hard to lock down variants |
| **Runtime token processing** | Runtime overhead, bundle size |
| **Multiple architecture patterns** | Cognitive overhead, inconsistency |

### Chosen Approach: Single Unified Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONE PATTERN FOR ALL TEMPLATES                 │
│                                                                  │
│  BEHAVIOR:     useTemplate() hook with useState/useReducer      │
│  COMPONENT:    Single component per template type                │
│  VARIANTS:     Pure data (config object + CSS class)            │
│  STYLING:      CSS Variables + CSS Grid layout modes            │
│  MOBILE:       Separate layout mode per variant                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Works

| Requirement | How It's Met |
|-------------|--------------|
| 10+ variants | Variants = data, not code (scales infinitely) |
| ~50kb budget | One component + CSS, variants add ~3kb total |
| Zero dependencies | useState/useReducer instead of XState |
| Single pattern | Same structure for all 11 template types |
| Mobile-optimized | Each variant declares desktop + mobile layout |

---

## Core Architecture

### File Structure Per Template

```
app/domains/templates/
├── newsletter/
│   ├── useNewsletter.ts       # Behavior hook (~2kb)
│   ├── NewsletterPopup.tsx    # Single component (~8kb)
│   ├── newsletter.css         # All styles (~4kb)
│   └── variants.ts            # 10+ variants as data (~3kb)
│
├── spin-to-win/
│   ├── useSpinToWin.ts
│   ├── SpinToWinPopup.tsx
│   ├── spin-to-win.css
│   └── variants.ts
│
└── ... (other templates)
```

### The Hook (Behavior Layer)

Simple state management with discriminated unions:

```typescript
// useNewsletter.ts (~50 lines)
type NewsletterState = 
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; discountCode?: string }
  | { status: 'error'; message: string };

export function useNewsletter(config: NewsletterConfig) {
  const [state, setState] = useState<NewsletterState>({ status: 'idle' });
  const [email, setEmail] = useState('');
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const result = await submitEmail(email, config.campaignId);
      setState({ status: 'success', discountCode: result.code });
    } catch (error) {
      setState({ status: 'error', message: error.message });
    }
  };
  
  return { state, email, setEmail, submit };
}
```

### The Component (Presentation Layer)

One component handles ALL variants via CSS classes:

```typescript
// NewsletterPopup.tsx (~150 lines)
export function NewsletterPopup({ variant, content, config, onClose }: Props) {
  const { state, email, setEmail, submit } = useNewsletter(config);
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Pick layout based on device
  const layoutMode = isMobile ? variant.layout.mobile : variant.layout.desktop;
  
  return (
    <PopupPortal>
      <div className="popup-backdrop" onClick={onClose} />
      
      <div
        className={`newsletter-popup layout-${layoutMode} ${variant.themeClass || ''}`}
        style={variant.cssVars}
      >
        <button className="popup-close" onClick={onClose}>×</button>
        
        {variant.sections.image && (
          <div className="popup-image">
            <img src={content.imageUrl} alt="" />
          </div>
        )}
        
        <div className="popup-content">
          <h2>{content.headline}</h2>
          {variant.sections.subtitle && <p>{content.subheadline}</p>}
          
          {state.status === 'success' ? (
            <SuccessView discountCode={state.discountCode} message={content.successMessage} />
          ) : (
            <EmailForm email={email} onChange={setEmail} onSubmit={submit} loading={state.status === 'submitting'} />
          )}
        </div>
      </div>
    </PopupPortal>
  );
}
```

---

## Variant System

### Variant Definition Structure

```typescript
// variants.ts
interface TemplateVariant {
  key: string;                    // Unique identifier
  name: string;                   // Display name
  description: string;            // For variant picker UI
  preview: string;                // Preview image URL

  // Layout per device
  layout: {
    desktop: LayoutMode;          // e.g., 'split-left', 'fullscreen'
    mobile: LayoutMode;           // e.g., 'mobile-sheet' (always optimized)
  };

  // Which sections to show
  sections: {
    image: boolean;
    subtitle: boolean;
    gdprCheckbox: boolean;
    // ... template-specific sections
  };

  // CSS Variables for theming
  cssVars: Record<string, string>;

  // Optional theme class for complex decorations
  themeClass?: string;

  // What users can customize
  editableFields: string[];
}
```

### Example: Newsletter Variants (10+)

```typescript
export const NEWSLETTER_VARIANTS: NewsletterVariant[] = [
  // ===== LAYOUT VARIANTS =====
  {
    key: 'classic',
    name: 'Classic',
    layout: { desktop: 'split-left', mobile: 'mobile-sheet' },
    sections: { image: true, subtitle: true, gdprCheckbox: false },
    cssVars: {
      '--popup-bg': '#ffffff',
      '--text-primary': '#1a1a1a',
      '--button-bg': '#3b82f6',
      '--button-text': '#ffffff',
      '--radius': '16px',
    },
    editableFields: ['headline', 'subheadline', 'buttonText', 'buttonColor', 'backgroundColor'],
  },

  {
    key: 'fullscreen',
    name: 'Fullscreen Hero',
    layout: { desktop: 'fullscreen', mobile: 'fullscreen' },
    sections: { image: true, subtitle: true, gdprCheckbox: false },
    cssVars: {
      '--popup-bg': 'transparent',
      '--text-primary': '#ffffff',
      '--overlay-opacity': '0.6',
    },
    editableFields: ['headline', 'subheadline', 'buttonText', 'backgroundImage'],
  },

  {
    key: 'minimal',
    name: 'Minimal Clean',
    layout: { desktop: 'minimal', mobile: 'mobile-sheet' },
    sections: { image: false, subtitle: true, gdprCheckbox: false },
    cssVars: {
      '--popup-bg': '#ffffff',
      '--text-primary': '#18181b',
      '--radius': '8px',
    },
    editableFields: ['headline', 'subheadline', 'buttonText', 'buttonColor'],
  },

  // ===== THEMED VARIANTS =====
  {
    key: 'black-friday',
    name: 'Black Friday',
    layout: { desktop: 'fullscreen', mobile: 'fullscreen' },
    cssVars: {
      '--popup-bg': '#000000',
      '--text-primary': '#ffffff',
      '--button-bg': '#fbbf24',
    },
    themeClass: 'theme-black-friday',
    editableFields: ['headline', 'subheadline', 'buttonText'],
  },

  {
    key: 'christmas',
    name: 'Christmas',
    layout: { desktop: 'fullscreen', mobile: 'fullscreen' },
    cssVars: {
      '--popup-bg': '#14532d',
      '--text-primary': '#ffffff',
      '--button-bg': '#dc2626',
    },
    themeClass: 'theme-christmas',
    editableFields: ['headline', 'subheadline', 'buttonText'],
  },

  // ... valentines, summer-sale, halloween, easter, etc.
];
```

---

## Layout Modes

### The Key Insight

**6 layout modes** can generate **10+ variants** through theming:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYOUT MODES (structural patterns)                              │
│                                                                  │
│  "split-left"          "split-right"         "split-top"        │
│  ┌──────┬───────┐      ┌───────┬──────┐      ┌──────────┐       │
│  │ IMG  │CONTENT│      │CONTENT│ IMG  │      │   IMG    │       │
│  │      │       │      │       │      │      ├──────────┤       │
│  └──────┴───────┘      └───────┴──────┘      │ CONTENT  │       │
│                                               └──────────┘       │
│                                                                  │
│  "fullscreen"          "minimal"             "mobile-sheet"     │
│  ┌──────────────┐      ┌──────────┐          ┌──────────┐       │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │          │          │          │       │
│  │▓▓ CONTENT ▓▓▓│      │ CONTENT  │          ├──────────┤       │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │          │          │ CONTENT  │       │
│  └──────────────┘      └──────────┘          └──────────┘       │
│  (background image)    (no image)            (bottom sheet)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Implementation

```css
/* Layout modes via CSS Grid - no JS runtime cost */

.layout-split-left {
  display: grid;
  grid-template-columns: 45% 55%;
  grid-template-areas: "image content";
}

.layout-split-right {
  display: grid;
  grid-template-columns: 55% 45%;
  grid-template-areas: "content image";
}

.layout-split-top {
  display: grid;
  grid-template-rows: 200px auto;
  grid-template-areas: "image" "content";
}

.layout-fullscreen {
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-fullscreen .popup-image {
  position: absolute;
  inset: 0;
}

.layout-minimal {
  padding: 2rem;
  text-align: center;
  max-width: 400px;
}

.layout-minimal .popup-image {
  display: none;
}

.layout-mobile-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 24px 24px 0 0;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
}
```

### Theme Classes for Decorations

```css
.theme-christmas::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/assets/snowflakes.svg');
  opacity: 0.1;
  pointer-events: none;
}

.theme-black-friday .popup-headline {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## Mobile Optimization

### 100% Mobile-Optimized (Not Just Responsive)

Every variant specifies a **separate mobile layout**:

```typescript
{
  layout: {
    desktop: 'split-left',    // Side-by-side with image
    mobile: 'mobile-sheet',   // Bottom sheet, optimized for touch
  }
}
```

### Mobile Sheet Characteristics

```css
.layout-mobile-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  --min-touch-target: 48px;
}

.layout-mobile-sheet input,
.layout-mobile-sheet button {
  min-height: var(--min-touch-target);
  font-size: 16px; /* Prevents iOS zoom */
}

.layout-mobile-sheet button {
  width: 100%;
}
```

---

## Template Type Analysis

### Template Complexity Classification

| Template Type | States | Animation Needs | Recommended Layout Modes |
|---------------|--------|-----------------|--------------------------|
| **NEWSLETTER** | 4 | Entry/Exit/Success | split-left, split-right, fullscreen, minimal, mobile-sheet |
| **SPIN_TO_WIN** | 6 | Entry/Exit/Spin/Reveal/Celebrate | centered, fullscreen, mobile-sheet |
| **SCRATCH_CARD** | 5 | Entry/Exit/Scratch/Reveal | centered, fullscreen, mobile-sheet |
| **FLASH_SALE** | 4 | Entry/Exit/Timer/Urgency | banner-top, banner-bottom, modal, mobile-sheet |
| **FREE_SHIPPING** | 4 | Entry/Exit/Progress | bar-top, bar-bottom, floating |
| **COUNTDOWN_TIMER** | 3 | Entry/Exit/Tick | banner, floating, embedded |
| **CART_ABANDONMENT** | 3 | Entry/Exit | split, drawer, mobile-sheet |
| **PRODUCT_UPSELL** | 4 | Entry/Exit/Add | grid, carousel, drawer, mobile-sheet |
| **SOCIAL_PROOF** | 3 | Enter/Exit/Rotate | toast-left, toast-right |
| **ANNOUNCEMENT** | 2 | Entry/Exit | banner-top, banner-bottom, ribbon |
| **EXIT_INTENT** | 4 | Entry/Exit | (same as Newsletter) |

### State Management Approach

All templates use simple `useState` or `useReducer`:

```typescript
// Simple templates (Newsletter, Announcement)
const [state, setState] = useState<State>({ status: 'idle' });

// Complex templates (Spin-to-Win) - useReducer for multiple state fields
const [state, dispatch] = useReducer(reducer, initialState);

// NO XState - discriminated unions provide type safety
type SpinToWinState =
  | { status: 'idle' }
  | { status: 'collecting-email'; email: string }
  | { status: 'spinning'; rotation: number }
  | { status: 'revealing'; prize: Prize }
  | { status: 'claimed'; code: string };
```

---

## Bundle Size Analysis

### Per-Template Budget

```
Target: ~50kb per template (lazy loaded)

Component breakdown:
├── useTemplate.ts       ~2kb gzipped
├── TemplatePopup.tsx    ~3kb gzipped (single component)
├── template.css         ~2kb gzipped
├── variants.ts          ~1kb gzipped (10+ variants as data)
└── shared utilities     ~2kb gzipped
                         ─────────────
                         ~10kb per template type

Well under 50kb budget ✅
```

### Why Variants Don't Add Bundle Size

```typescript
// Variants are pure data - compress extremely well
// 10 variants ≈ 1kb gzipped

// vs. separate components per variant:
// 10 components × 8kb each = 80kb ❌
```

### Code Splitting Strategy

```typescript
// Only load the template types actually used
const Newsletter = lazy(() => import('./newsletter/NewsletterPopup'));
const SpinToWin = lazy(() => import('./spin-to-win/SpinToWinPopup'));
const FlashSale = lazy(() => import('./flash-sale/FlashSalePopup'));

// Variant data is bundled with the template (tiny overhead)
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

1. **Core Infrastructure**
   - [ ] Define TypeScript types for variant system
   - [ ] Create base CSS with layout modes
   - [ ] Set up `useMediaQuery` hook for mobile detection
   - [ ] Create `PopupPortal` component

2. **Newsletter Template** (simplest, validates approach)
   - [ ] `useNewsletter` hook
   - [ ] `NewsletterPopup` component with all layout modes
   - [ ] 4+ variants (classic, fullscreen, minimal, mobile-compact)
   - [ ] Unit tests

### Phase 2: Complex Templates (Week 2-3)

3. **Spin-to-Win** (most complex)
   - [ ] `useSpinToWin` hook with wheel physics
   - [ ] Wheel component
   - [ ] 3+ variants (casino, minimal, festive)

4. **Flash Sale**
   - [ ] Timer logic
   - [ ] Urgency animations
   - [ ] 3+ variants

### Phase 3: Remaining Templates (Week 4-5)

5. **Gamification**: Scratch Card
6. **Commerce**: Product Upsell, Cart Abandonment, Free Shipping
7. **Simple**: Countdown Timer, Social Proof, Announcement
8. **Exit Intent**: Reuse Newsletter with different trigger

### Phase 4: Migration & Polish (Week 6)

9. **Campaign Form Updates**
   - [ ] Variant picker UI
   - [ ] Editable fields based on variant
   - [ ] Preview updates

10. **Migration**
    - [ ] Mark existing campaigns as legacy
    - [ ] Provide upgrade path

---

## Migration Strategy

### Database Changes

```prisma
model Campaign {
  // Existing fields...

  // New fields
  variantKey      String?           // e.g., "classic", "fullscreen"
  isLegacyConfig  Boolean @default(false)
}
```

### Migration Approach

1. **Existing campaigns**: Mark as `isLegacyConfig: true`, continue to work
2. **New campaigns**: Must select a variant, get limited customization
3. **Storefront rendering**: Check `isLegacyConfig` flag, render accordingly

```typescript
// Storefront popup renderer
if (campaign.isLegacyConfig) {
  // Use old flexible rendering
  return <LegacyPopupRenderer config={campaign.designConfig} />;
} else {
  // Use new variant-based rendering
  const variant = getVariant(campaign.templateType, campaign.variantKey);
  return <PopupRenderer variant={variant} content={campaign.contentConfig} />;
}
```

---

## Appendix: Type Definitions

### Core Types

```typescript
// Layout modes (shared across templates)
type LayoutMode =
  | 'split-left'
  | 'split-right'
  | 'split-top'
  | 'fullscreen'
  | 'minimal'
  | 'mobile-sheet'
  | 'banner-top'
  | 'banner-bottom'
  | 'toast-left'
  | 'toast-right'
  | 'drawer'
  | 'centered';

// Base variant interface
interface BaseVariant {
  key: string;
  name: string;
  description?: string;
  preview?: string;

  layout: {
    desktop: LayoutMode;
    mobile: LayoutMode;
  };

  cssVars: Record<string, string>;
  themeClass?: string;
  editableFields: string[];
}

// Template-specific variants extend base
interface NewsletterVariant extends BaseVariant {
  sections: {
    image: boolean;
    subtitle: boolean;
    gdprCheckbox: boolean;
  };
}

interface SpinToWinVariant extends BaseVariant {
  sections: {
    subtitle: boolean;
  };
  wheelStyle: 'default' | 'casino' | 'minimal';
  celebrationStyle: 'confetti' | 'glow' | 'none';
}
```

---

*Document maintained by the Engineering team. Last review: 2024-12-01*
