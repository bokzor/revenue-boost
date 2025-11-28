# Design Section Refactoring Analysis

## Executive Summary

The campaign form has **two conflicting approaches** for handling design configuration:
1. **Self-contained templates** embed design controls in their content section components
2. **Other templates** use the centralized `DesignConfigSection` component

This creates **code duplication**, **inconsistent UI**, and **missing features** for some templates (e.g., overlay settings not available for all popup types).

**Goal**: Unify all templates to use `DesignConfigSection` for design controls, while keeping template-specific content sections focused on content only.

---

## Current Architecture

### File: `DesignStepContent.tsx`
The orchestrator that decides which approach to use:

```tsx
const SELF_CONTAINED_TEMPLATES: TemplateType[] = [
  "NEWSLETTER",
  "EXIT_INTENT", 
  "FLASH_SALE",
  "COUNTDOWN_TIMER",
];

// Self-contained: render XXXContentSection (includes design)
// Others: render ContentConfigSection + DesignConfigSection (separate)
```

### File: `DesignConfigSection.tsx` (832 lines)
Centralized design component that:
- Uses `design-capabilities.ts` to gate controls per template
- Includes: Theme, Position, Size, Background Image, Main Colors, Typography, Button Colors, Input Colors, Overlay Settings
- Has collapsible sections for organization
- Supports custom theme presets

---

## Template Content Sections Analysis

### 1. NEWSLETTER / EXIT_INTENT → `NewsletterContentSection.tsx` (687 lines)

**Structure:**
| Card | Contents |
|------|----------|
| 📝 Content | headline, subheadline, buttonText, emailLabel, dismissLabel, emailPlaceholder, successMessage, failureMessage, FieldConfigurationSection |
| 💰 Discount | DiscountSection (optional) |
| 🎨 Design & Colors | **DUPLICATED** - Theme, Position, Size, Main Colors, Button Colors, Advanced (Collapsible): Input Colors, Background Image, Overlay |

**Design Controls Present:** ✅ All (duplicated from DesignConfigSection)

**What should remain after refactor:** Content + Discount cards only

---

### 2. FLASH_SALE / COUNTDOWN_TIMER → `FlashSaleContentSection.tsx` (1072 lines)

**Structure:**
| Card | Contents |
|------|----------|
| ⚡ Content | headline, urgencyMessage (FLASH_SALE only), subheadline, buttonText, ctaUrl, dismissLabel, successMessage, failureMessage |
| ⏱️ Timer Settings | showCountdown, countdownDuration, Advanced Timer (Collapsible): mode, endTimeISO, timezone, onExpire |
| 📦 Inventory Display | (Collapsible) showStock, stockThreshold, stockMessage, showHotBadge |
| 🛒 Cart Reservation | (Collapsible) enableReservation, reservationWindow, reservationMessage |
| 💰 Discount Config | GenericDiscountComponent (FLASH_SALE only) |
| 🎨 Design & Colors | **DUPLICATED** - Theme, DisplayMode, Position, Size, showCloseButton, Main Colors, Button Colors, Advanced (Collapsible): Overlay, Timer Behavior |

**Design Controls Present:** ✅ Theme, Position, Size, Colors, Overlay, DisplayMode, showCloseButton
**Missing vs DesignConfigSection:** ❌ Background Image, Typography, Input Colors (not needed for this template)

**What should remain after refactor:** Content + Timer + Inventory + Reservation + Discount cards only

---

### 3. SPIN_TO_WIN → `SpinToWinContentSection.tsx` (228 lines)

**Structure:**
| Card | Contents |
|------|----------|
| 🎡 Content & capture | headline, subheadline, spinButtonText, emailPlaceholder, dismissLabel, failureMessage, loadingText, FieldConfigurationSection |
| 🎯 Wheel configuration | wheelSize, wheelBorderWidth, wheelBorderColor, spinDuration, minSpins, WheelSegmentEditor |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 4. SCRATCH_CARD → `ScratchCardContentSection.tsx` (494 lines)

**Structure:**
| Card | Contents |
|------|----------|
| 🎫 Content & capture | headline, subheadline, successMessage, dismissLabel, emailPlaceholder, emailCollection mode, failureMessage |
| 🎨 Scratch settings | scratchInstruction, scratchThreshold, scratchRadius |
| 🎁 Prizes & probabilities | Prize list with GenericDiscountComponent per prize |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 5. CART_ABANDONMENT → `CartAbandonmentContentSection.tsx` (541 lines)

**Structure (all collapsible):**
| Section | Contents |
|---------|----------|
| Basic Content | headline, subheadline |
| Cart Display | showCartItems, maxItemsToShow, showCartTotal |
| Urgency & Scarcity | showUrgency, urgencyTimer, urgencyMessage, showStockWarnings, stockWarningMessage |
| Call to Action | buttonText, ctaUrl, saveForLaterText, dismissLabel |
| Email Recovery | enableEmailRecovery, emailPlaceholder, emailButtonText, etc. |
| 💰 Discount | DiscountSection |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 6. PRODUCT_UPSELL → `ProductUpsellContentSection.tsx` (528 lines)

**Structure (all collapsible):**
| Section | Contents |
|---------|----------|
| Basic Content | headline, subheadline |
| Product Selection | productSelectionMethod, ProductPicker, etc. |
| Layout & Display | layout, productsToShow, showProductImages, etc. |
| Bundle Discount | enableBundleDiscount, bundleDiscountType, etc. |
| Behavior | autoDismissAfter, dismissLabel |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 7. FREE_SHIPPING → `FreeShippingContentSection.tsx` (366 lines)

**Structure:**
| Card | Contents |
|------|----------|
| 🚚 Threshold | threshold, currency, nearMissThreshold slider |
| 📝 Messages | emptyMessage, progressMessage, nearMissMessage, unlockedMessage |
| ⚙️ Display | barPosition, dismissible, dismissLabel, showIcon, celebrateOnUnlock |
| 💰 Discount | DiscountSection |
| 🎮 Preview Simulation | previewCartTotal slider |

**Design Controls Present:** ❌ None embedded (has reserved `onDesignChange` prop but unused)
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 8. SOCIAL_PROOF → `SocialProofContentSection.tsx` (204 lines)

**Structure:**
| Card | Contents |
|------|----------|
| Notification Types | enablePurchaseNotifications, enableVisitorNotifications, enableReviewNotifications |
| Display & Frequency | cornerPosition, rotationInterval, maxNotificationsPerSession |
| Data Thresholds | minVisitorCount, minReviewRating |
| Visual Options | showProductImage, showTimer |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

### 9. ANNOUNCEMENT → `AnnouncementContentSection.tsx` (144 lines)

**Structure:**
| Card | Contents |
|------|----------|
| 📢 Content | headline, subheadline, icon, buttonText, ctaUrl |
| Behavior | dismissible, dismissLabel, autoDismissAfter |

**Design Controls Present:** ❌ None embedded
**Uses separate DesignConfigSection:** ✅ Yes

**Status:** ✅ Already follows target architecture

---

## Summary Table

| Template | Content Section | Lines | Has Embedded Design? | Action Needed |
|----------|-----------------|-------|---------------------|---------------|
| NEWSLETTER | NewsletterContentSection | 687 | ✅ Yes (duplicated) | 🔴 **REFACTOR** |
| EXIT_INTENT | NewsletterContentSection | 687 | ✅ Yes (duplicated) | 🔴 **REFACTOR** |
| FLASH_SALE | FlashSaleContentSection | 1072 | ✅ Yes (duplicated) | 🔴 **REFACTOR** |
| COUNTDOWN_TIMER | FlashSaleContentSection | 1072 | ✅ Yes (duplicated) | 🔴 **REFACTOR** |
| SPIN_TO_WIN | SpinToWinContentSection | 228 | ❌ No | ✅ OK |
| SCRATCH_CARD | ScratchCardContentSection | 494 | ❌ No | ✅ OK |
| CART_ABANDONMENT | CartAbandonmentContentSection | 541 | ❌ No | ✅ OK |
| PRODUCT_UPSELL | ProductUpsellContentSection | 528 | ❌ No | ✅ OK |
| FREE_SHIPPING | FreeShippingContentSection | 366 | ❌ No | ✅ OK |
| SOCIAL_PROOF | SocialProofContentSection | 204 | ❌ No | ✅ OK |
| ANNOUNCEMENT | AnnouncementContentSection | 144 | ❌ No | ✅ OK |

---

## Part 2: Design Capabilities Registry

### File: `design-capabilities.ts`

This file gates which design controls are shown per template. Current definitions:

| Template | usesOverlay | usesButtons | usesInputs | usesImage | Position Options | Size Options |
|----------|-------------|-------------|------------|-----------|------------------|--------------|
| NEWSLETTER | ✅ | ✅ | ✅ | ✅ | center,top,bottom,left,right | small,medium,large |
| EXIT_INTENT | ✅ | ✅ | ✅ | ✅ | center,top,bottom,left,right | small,medium,large |
| FLASH_SALE | ✅ | ✅ | ❌ | ❌ | center,top,bottom | (uses popupSize) |
| COUNTDOWN_TIMER | ❌ | ✅ | ❌ | ❌ | top,bottom | (full-width) |
| SPIN_TO_WIN | ✅ | ✅ | ✅ | ❌ | center | medium,large |
| SCRATCH_CARD | ✅ | ✅ | ✅ | ✅ | center | small,medium |
| CART_ABANDONMENT | ❌ | ✅ | ❌ | ❌ | center,bottom | small,medium,large |
| PRODUCT_UPSELL | ❌ | ✅ | ❌ | ❌ | center | small,medium,large |
| FREE_SHIPPING | ❌ | ❌ | ❌ | ❌ | top,bottom | (full-width) |
| SOCIAL_PROOF | ❌ | ❌ | ❌ | ❌ | (uses cornerPosition) | (fixed) |
| ANNOUNCEMENT | ❌ | ✅ | ❌ | ❌ | top,bottom | (full-width) |

### Issues Identified

1. **CART_ABANDONMENT** has `usesOverlay: false` but it's a modal popup - should it have overlay?
2. **PRODUCT_UPSELL** has `usesOverlay: false` but it's a modal popup - should it have overlay?
3. **COUNTDOWN_TIMER** has `usesOverlay: false` - correct for banner, but if displayMode=modal it should have overlay

---

## Part 3: Collapsible Section Patterns

### Current Patterns in Use

#### Pattern A: Single Collapsible for "Advanced"
Used by: `NewsletterContentSection`, `FlashSaleContentSection`

```tsx
const [showAdvancedDesign, setShowAdvancedDesign] = useState(false);

<InlineStack align="space-between" blockAlign="center">
  <Text as="h4" variant="headingSm">Advanced Options</Text>
  <Button variant="plain" onClick={() => setShowAdvancedDesign(!showAdvancedDesign)}
    icon={showAdvancedDesign ? ChevronUpIcon : ChevronDownIcon}>
    {showAdvancedDesign ? "Hide" : "Show"}
  </Button>
</InlineStack>

<Collapsible open={showAdvancedDesign} id="advanced-design-options"
  transition={{ duration: "200ms", timingFunction: "ease-in-out" }}>
  {/* content */}
</Collapsible>
```

#### Pattern B: Multiple Collapsible Sections (Accordion-like)
Used by: `DesignConfigSection`, `CartAbandonmentContentSection`, `ProductUpsellContentSection`

```tsx
const [openSections, setOpenSections] = useState<Record<string, boolean>>({
  basicContent: true,
  advancedOptions: false,
});

const toggleSection = (section: string) => {
  setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
};

const handleKeyDown = (section: string) => (e: KeyboardEvent<HTMLDivElement>) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleSection(section);
  }
};

// For each section:
<div role="button" tabIndex={0} style={{ cursor: "pointer" }}
  onClick={() => toggleSection("sectionName")}
  onKeyDown={handleKeyDown("sectionName")}>
  <InlineStack gap="200" blockAlign="center">
    <Button variant="plain" icon={openSections.sectionName ? ChevronUpIcon : ChevronDownIcon} />
    <Text as="h4" variant="headingSm">Section Title</Text>
  </InlineStack>
</div>

<Collapsible open={openSections.sectionName} id="section-name"
  transition={{ duration: "200ms", timingFunction: "ease-in-out" }}>
  {/* content */}
</Collapsible>
```

### Recommendation: Create Reusable `CollapsibleSection` Component

```tsx
// app/domains/campaigns/components/form/CollapsibleSection.tsx

interface CollapsibleSectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleSection({ id, title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <BlockStack gap="300">
      <div role="button" tabIndex={0} style={{ cursor: "pointer" }}
        onClick={onToggle} onKeyDown={handleKeyDown}>
        <InlineStack gap="200" blockAlign="center">
          <Button variant="plain" icon={isOpen ? ChevronUpIcon : ChevronDownIcon} />
          <Text as="h4" variant="headingSm">{title}</Text>
        </InlineStack>
      </div>
      <Collapsible open={isOpen} id={id}
        transition={{ duration: "200ms", timingFunction: "ease-in-out" }}>
        {children}
      </Collapsible>
    </BlockStack>
  );
}

// Usage hook:
export function useCollapsibleSections(initialState: Record<string, boolean>) {
  const [openSections, setOpenSections] = useState(initialState);
  const toggle = (section: string) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  return { openSections, toggle };
}
```

---

## Part 4: Refactoring Plan

### Step 1: Create `CollapsibleSection` Component ✅ COMPLETED
- ✅ Created `app/domains/campaigns/components/form/CollapsibleSection.tsx`
- ✅ Created `useCollapsibleSections` hook
- ✅ Updated `DesignConfigSection.tsx` to use the new component
- ✅ Result: 832 lines → 685 lines (-147 lines, ~18% reduction)

### Step 2: Refactor `NewsletterContentSection` ✅ COMPLETED
1. ✅ Removed entire Design Card (lines ~310-683)
2. ✅ Kept only Content Card + Discount Card
3. ✅ Updated `DesignStepContent.tsx` to render `DesignConfigSection` after `NewsletterContentSection`
4. ✅ Result: 687 lines → 196 lines (-71% reduction)

### Step 3: Refactor `FlashSaleContentSection` ✅ COMPLETED
1. ✅ Removed Design Card (lines ~626-863)
2. ✅ Kept Content + Timer Settings + Inventory + Reservation + Discount cards
3. ✅ Updated `DesignStepContent.tsx` to add `DesignConfigSection` after FlashSaleContentSection
4. ✅ Updated tests to remove design-related test cases
5. ✅ Result: 1072 lines → 798 lines (-26% reduction)

### Step 4: Update `DesignStepContent.tsx` ✅ COMPLETED
1. ✅ Removed `FLASH_SALE_TEMPLATES` constant (was `SELF_CONTAINED_TEMPLATES`)
2. All templates now use: `ContentConfigSection` + `DesignConfigSection`
3. Simplify the rendering logic

### Step 5: Review & Update `design-capabilities.ts`
1. Verify overlay settings for CART_ABANDONMENT, PRODUCT_UPSELL
2. Add conditional overlay based on displayMode for templates that support both modal and banner
3. Ensure all popup-type templates have access to overlay controls

### Step 6: Testing
- Test each template in the campaign form
- Verify live preview works correctly
- Check that saved campaigns load correctly
- Test theme preset application

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| NewsletterContentSection lines | 687 | ~280 (-59%) |
| FlashSaleContentSection lines | 1072 | ~600 (-44%) |
| Code duplication | ~400 lines | 0 lines |
| Consistency | ❌ Mixed approaches | ✅ Unified |
| Missing features | Some templates lack overlay | ✅ All have access |

---

## Part 5: Existing Shared Components (Good Examples)

These components are already properly shared and can serve as examples:

### `FieldConfigurationSection.tsx` (198 lines)
Shared by: `NewsletterContentSection`, `SpinToWinContentSection`, `CartAbandonmentContentSection`

Handles: Email, Name, GDPR consent fields with prop aliasing for backwards compatibility.

### `ThemePresetSelector.tsx`
Shared by: `NewsletterContentSection`, `FlashSaleContentSection`, `DesignConfigSection`

Handles: Built-in theme swatches (modern, minimal, elegant, bold, etc.)

### `GenericDiscountComponent.tsx`
Shared by: `FlashSaleContentSection`, `ScratchCardContentSection`

Handles: Complex discount configuration (tiered, BOGO, free gifts)

### `DiscountSection.tsx`
Shared by: `NewsletterContentSection`, `CartAbandonmentContentSection`, `FreeShippingContentSection`

Handles: Simple discount configuration for lead capture campaigns

---

## Part 6: Key Decisions for Refactoring

### Decision 1: Keep Discount in Content Section or Move Out?
**Recommendation:** Keep in content section. Discount is template-specific (some templates have per-segment/prize discounts).

### Decision 2: What about template-specific design fields?
- `displayMode` (modal vs banner) → Add to `DesignConfigSection` with capability gating
- `popupSize` (compact/standard/wide/full) → Already in `DesignConfigSection` for FLASH_SALE
- `showCloseButton` → Add to `DesignConfigSection` as universal option

### Decision 3: Theme preset application with wheel colors (Spin-to-Win)?
**Current:** `DesignStepContent.tsx` has special `onThemeChange` callback for this.
**Keep:** This integration hook is fine - DesignConfigSection triggers callback, parent updates content.

---

## Files to Modify

1. ✅ **Created:** `app/domains/campaigns/components/form/CollapsibleSection.tsx`
2. ⏳ **Modify:** `app/domains/campaigns/components/sections/NewsletterContentSection.tsx`
3. ⏳ **Modify:** `app/domains/campaigns/components/sections/FlashSaleContentSection.tsx`
4. ⏳ **Modify:** `app/domains/campaigns/components/steps/DesignStepContent.tsx`
5. ⏳ **Modify:** `app/domains/templates/registry/design-capabilities.ts`
6. ✅ **Modified:** `app/domains/campaigns/components/sections/DesignConfigSection.tsx` (using CollapsibleSection)
7. ✅ **Modified:** `app/domains/campaigns/components/form/index.ts` (exported new component)

