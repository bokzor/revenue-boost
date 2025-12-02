Wh3# Discount Components Analysis

> ⚠️ **See also:** [CAMPAIGN_CONCEPTS_CLARIFICATION.md](./CAMPAIGN_CONCEPTS_CLARIFICATION.md) for the distinction between Goals, Templates, and Triggers.

This document provides a comprehensive analysis of discount components, their appropriate use cases, and UX considerations.

> **Last Updated:** 2025-12-02
> **Status:** ✅ Verified against current codebase

---

## Part 1: Campaign Goals & Discount Strategy

### Understanding Campaign Intent

Each campaign type has a **primary goal** that determines which discount types make sense:

| Campaign Type | Primary Goal | User Journey | Has Dedicated Content Section? |
|--------------|--------------|--------------|-------------------------------|
| Newsletter | Email capture | User sees popup → Enters email → Receives reward | ✅ `NewsletterContentSection.tsx` |
| Exit Intent | Prevent bounce | User about to leave → Sees offer → Stays/converts | ❌ Uses Newsletter template |
| Spin-to-Win | Gamified email capture | User sees wheel → Enters email → Spins → Wins prize | ✅ `SpinToWinContentSection.tsx` |
| Scratch Card | Gamified email capture | User sees card → Enters email → Scratches → Reveals prize | ✅ `ScratchCardContentSection.tsx` |
| Flash Sale | Urgency-driven sales | User sees limited offer → Feels urgency → Buys now | ✅ `FlashSaleContentSection.tsx` |
| Cart Abandonment | Cart recovery | User about to leave cart → Sees incentive → Completes order | ✅ `CartAbandonmentContentSection.tsx` |
| Product Upsell | Increase AOV | User shown related products → Adds to cart → Bigger order | ✅ `ProductUpsellContentSection.tsx` |
| Free Shipping Bar | Threshold motivation | User sees progress → Adds more items → Gets free shipping | ✅ `FreeShippingContentSection.tsx` |
| Countdown Timer | Create urgency | User sees time limit → Acts before expiry | ❌ Uses CountdownTimerPopup only |
| Social Proof | Build trust | User sees activity → Feels FOMO → Converts | ✅ `SocialProofContentSection.tsx` |
| Announcement | Inform users | User sees message → Takes action | ✅ `AnnouncementContentSection.tsx` |

> **Note:** Exit Intent is a **trigger type**, not a template type. It uses the Newsletter template with `exit_intent` trigger configuration.

---

## Part 2: Discount Types - When They Make Sense

### Available Discount Types

1. **Basic Discounts** (Simple code-based)
   - Percentage Off (e.g., "10% OFF")
   - Fixed Amount Off (e.g., "$5 OFF")
   - Free Shipping

2. **Advanced Discounts** (Complex logic)
   - Tiered Discounts ("Spend $50 get 10%, $100 get 20%")
   - BOGO ("Buy 2 Get 1 Free")
   - Free Gift with Purchase

---

### Discount Compatibility Matrix

| Campaign Type | % Off | Fixed $ | Free Ship | Tiered | BOGO | Free Gift | Current Component |
|--------------|:-----:|:-------:|:---------:|:------:|:----:|:---------:|-------------------|
| **Newsletter** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | `DiscountSection` |
| **Exit Intent** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | (Same as Newsletter) |
| **Spin-to-Win** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | `GenericDiscountComponent` (per segment) |
| **Scratch Card** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | `GenericDiscountComponent` (per prize) |
| **Flash Sale** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `GenericDiscountComponent` |
| **Cart Abandonment** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | `DiscountSection` |
| **Product Upsell** | ✅ | ✅ | ❌ | ❌ | ✅* | ❌ | Built-in `bundleDiscount` field |
| **Free Shipping Bar** | ❌ | ❌ | ✅ | ✅** | ❌ | ❌ | `DiscountSection` ⚠️ |
| **Countdown Timer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | None |
| **Social Proof** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | None |
| **Announcement** | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | None |

**Legend:**
- ✅ = Makes sense, should support
- ⚠️ = Edge case, might work but complex UX
- ❌ = Doesn't make sense for this campaign type
- \* = Product Upsell has built-in bundle discount (different from BOGO)
- \** = Free Shipping Bar has built-in threshold logic (similar to tiered)

---

## Part 3: Detailed Analysis by Campaign Type

### Newsletter / Exit Intent

**Goal:** Capture email in exchange for a simple reward

**What works:**
- ✅ "Subscribe and get 10% off" - Simple, clear value prop
- ✅ "Subscribe for $5 off your first order" - Easy to understand
- ✅ "Subscribe for free shipping" - Clear benefit

**What doesn't work:**
- ❌ BOGO: "Subscribe and buy 2 get 1 free" - Confusing. User just wants to subscribe, not think about purchase quantities
- ⚠️ Tiered: "Subscribe for 10% off $50+, 20% off $100+" - Too complex for a quick signup. Messaging becomes cluttered
- ⚠️ Free Gift: Could work ("Subscribe and get a free sample!") but requires inventory management

**Visual Rendering:**
```
┌─────────────────────────────────────┐
│     Join Our Newsletter! 📧         │
│                                     │
│  Get 10% OFF your first order       │
│                                     │
│  [    Enter your email    ]         │
│  [      Subscribe       ]           │
└─────────────────────────────────────┘
```

**Current state:** Uses `DiscountSection` (basic only) ✅ **CORRECT**

---

### Spin-to-Win / Scratch Card

**Goal:** Gamified email capture with variable rewards per segment/prize

**What works:**
- ✅ Each wheel segment is a distinct prize - variety is the point
- ✅ "10% OFF", "20% OFF", "Free Shipping", "Free Gift!" segments
- ✅ Makes sense to have different discount types per segment

**What doesn't work:**
- ❌ Tiered discounts per segment: A segment IS a single reward, not "spend X get Y"
- ❌ BOGO per segment: Too complex for a prize. "You won: Buy 2 Get 1 Free!" is awkward

**Visual Rendering (Success State):**
```
┌─────────────────────────────────────┐
│     🎉 You Won: 15% OFF! 🎉         │
│                                     │
│     Your discount code:             │
│     ┌─────────────────────┐         │
│     │  SPIN15-XYZ123  📋 │         │
│     └─────────────────────┘         │
│                                     │
│  [   Continue Shopping   ]          │
└─────────────────────────────────────┘
```

**Current state:** Uses `GenericDiscountComponent` via `WheelSegmentEditor`
- ⚠️ **Issue:** Advanced types (Tiered, BOGO) don't make sense per-segment
- **Recommendation:** Should use basic discounts + Free Gift option only
- **File:** `app/domains/campaigns/components/sections/WheelSegmentEditor.tsx` (line 214)

---

### Flash Sale

**Goal:** Create urgency, drive immediate sales with attractive offers

**What works:**
- ✅ All discount types make sense here - this is a SALES campaign
- ✅ "Flash Sale: 30% OFF everything!"
- ✅ "Spend $100, Get 25% OFF - 2 Hours Only!"
- ✅ "Buy 2 Get 1 Free - Limited Time!"
- ✅ "Free gift with any purchase over $50!"

**Visual Rendering (Tiered Example):**
```
┌─────────────────────────────────────┐
│  🔥 FLASH SALE - 2 HOURS LEFT! 🔥   │
│          ⏰ 01:45:32                │
│                                     │
│  Spend more, save more:             │
│  • $50+ → 15% OFF                   │
│  • $100+ → 25% OFF                  │
│  • $200+ → 35% OFF                  │
│                                     │
│  [    Shop Now    ]                 │
└─────────────────────────────────────┘
```

**Current state:** Uses `GenericDiscountComponent` ✅ **CORRECT**
- **File:** `app/domains/campaigns/components/sections/FlashSaleContentSection.tsx` (line 583)

---

### Cart Abandonment

**Goal:** Recover abandoned cart with an incentive to complete purchase

**What works:**
- ✅ "Complete your order and get 10% off!"
- ✅ "Checkout now and get free shipping!"
- ✅ Tiered: "Add $20 more and get 15% off your entire order"

**What doesn't work:**
- ❌ BOGO: User already has items in cart - asking them to add specific quantities is confusing
- ⚠️ Free Gift: "Complete order for a free gift" - Could work but adds complexity

**Visual Rendering:**
```
┌─────────────────────────────────────┐
│  Don't forget your items! 🛒        │
│                                     │
│  [Product 1 image] Product 1  $29   │
│  [Product 2 image] Product 2  $45   │
│                                     │
│  Complete now and save 10%!         │
│  Use code: SAVE10                   │
│                                     │
│  [  Complete Order  ]               │
└─────────────────────────────────────┘
```

**Current state:** Uses `DiscountSection` (basic only)
- **File:** `app/domains/campaigns/components/sections/CartAbandonmentContentSection.tsx` (line 530)
- **Recommendation:** Could benefit from Tiered discounts for "Spend $X more" messaging

---

### Product Upsell

**Goal:** Increase Average Order Value by recommending additional products

**What works:**
- ✅ Bundle discount: "Add 3+ items, save 15%" - Already built into popup
- ✅ Percentage off selected items

**What doesn't work:**
- ❌ Free Shipping: Not related to upselling
- ❌ Tiered: The bundle discount IS a form of tiering
- ❌ Free Gift: Would conflict with upsell purpose

**Visual Rendering:**
```
┌─────────────────────────────────────┐
│  Complete Your Look ✨               │
│                                     │
│  [Product A]  [Product B]  [Prod C] │
│   $29 ☐        $35 ☑       $42 ☑    │
│                                     │
│  ✨ Add 2+ items and save 15%!      │
│                                     │
│  Total: $77 → $65 (Save $12!)       │
│  [   Add to Cart   ]                │
└─────────────────────────────────────┘
```

**Current state:** Has built-in `bundleDiscount` property ✅ **CORRECT**
- **File:** `app/domains/campaigns/components/sections/ProductUpsellContentSection.tsx` (line 444)
- No discount config component needed - uses native `bundleDiscount` and `bundleDiscountText` fields

---

### Free Shipping Bar

**Goal:** Motivate customers to reach a spending threshold

**What works:**
- ✅ Free shipping threshold - This IS the whole point
- ✅ Tiered messaging: "Spend $25 more for free shipping!"

**What doesn't work:**
- ❌ Percentage/Fixed discounts: Conflicts with purpose
- ❌ BOGO: Different mechanism
- ❌ Free Gift: Different mechanism

**Visual Rendering:**
```
┌─────────────────────────────────────────────────────────┐
│  🚚 Spend $25 more for FREE SHIPPING! ████████░░ 75%   │
└─────────────────────────────────────────────────────────┘
```

**Current state:** Uses `DiscountSection`
- **File:** `app/domains/campaigns/components/sections/FreeShippingContentSection.tsx` (line 355)
- ⚠️ **Problem:** Free Shipping Bar has built-in threshold logic (`freeShippingThreshold` field)
- The `DiscountSection` here adds redundant/confusing options

---

## Part 4: Current State vs Recommended State

### Admin Components Inventory

| Component | Location | Features | Status |
|-----------|----------|----------|--------|
| `GenericDiscountComponent` | `campaigns/components/form/` | Full (Tiered, BOGO, FreeGift) | ✅ Active - Used by Flash Sale, Spin-to-Win, Scratch Card |
| `DiscountSection` | `popups/components/design/` | Basic only (%, $, Free Shipping) | ✅ Active - Used by Newsletter, Cart Abandonment, Free Shipping |
| `DiscountSettingsStep` | `campaigns/components/` | Full modal with behavior settings | ✅ Active - Exports `DiscountAdvancedSettings` used by `DiscountSection` |
| `DiscountConfigSection` | `campaigns/components/sections/` | Basic fields | ⚠️ **EXPORTED but UNUSED** - Only referenced in `index.ts` |

### Current Usage vs Recommended

| Campaign Type | Current Component | Recommended | Change Needed? |
|--------------|-------------------|-------------|----------------|
| Newsletter | `DiscountSection` | `DiscountSection` | ❌ No |
| Exit Intent | (Same as Newsletter - trigger-based) | (Same as Newsletter) | ❌ No |
| Spin-to-Win | `GenericDiscountComponent` (via `WheelSegmentEditor`) | Basic + FreeGift only | ⚠️ Simplify - Remove Tiered/BOGO |
| Scratch Card | `GenericDiscountComponent` (per prize) | Basic + FreeGift only | ⚠️ Simplify - Remove Tiered/BOGO |
| Flash Sale | `GenericDiscountComponent` | `GenericDiscountComponent` | ❌ No |
| Cart Abandonment | `DiscountSection` | Consider `GenericDiscountComponent` | ⚠️ Add Tiered support |
| Product Upsell | Built-in `bundleDiscount` field | Keep as-is | ❌ No |
| Free Shipping Bar | `DiscountSection` | Remove or simplify | ⚠️ Has own threshold logic |
| Countdown Timer | None | None | ❌ No |
| Social Proof | None | None | ❌ No |
| Announcement | None | None | ❌ No |

---

## Part 5: Storefront Rendering Analysis

### How Popups Display Discounts

| Popup | Discount Display | Supports Tiered/BOGO Rendering? | Uses Shared Components? |
|-------|-----------------|--------------------------------|------------------------|
| `NewsletterPopup.tsx` | `SuccessState` → `DiscountCodeDisplay` | ❌ Only shows code | ✅ `useDiscountCode`, `SuccessState` |
| `SpinToWinPopup.tsx` | `DiscountCodeDisplay` after spin | ❌ Only shows code | ✅ `useDiscountCode`, `DiscountCodeDisplay` |
| `ScratchCardPopup.tsx` | `DiscountCodeDisplay` after reveal | ❌ Only shows code | ✅ `useDiscountCode`, `DiscountCodeDisplay` |
| `FlashSalePopup.tsx` | `getDiscountMessage()` + messaging | ✅ YES - renders tiered/BOGO messaging | ❌ Custom implementation |
| `CartAbandonmentPopup.tsx` | Shows % or $ teaser, then code | ⚠️ Partial - shows savings preview | ✅ `useDiscountCode`, `DiscountCodeDisplay` |
| `ProductUpsellPopup.tsx` | Built-in bundle savings calculator | ✅ Own implementation | ❌ Custom |
| `FreeShippingPopup.tsx` | Progress bar to threshold | ✅ Own threshold implementation | ❌ Custom |

### Shared Storefront Hooks & Components

Located in `app/domains/storefront/popups-new/`:

```
hooks/
├── useDiscountCode.ts    # Manages discount code state, copy functionality
├── usePopupForm.ts       # Form state, validation, submission with discount code generation
└── useCountdownTimer.ts  # Timer countdown logic

components/shared/
├── DiscountCodeDisplay   # Renders copyable discount code with styling
├── SuccessState          # Post-submission success message with optional discount
└── LeadCaptureForm       # Email/name/GDPR form
```

### Key Insight: FlashSalePopup Already Renders Advanced Discounts

```typescript
// From FlashSalePopup.tsx - lines 256-276
const getDiscountMessage = () => {
  if (dc?.tiers?.length) {
    // Tiered discount
    const tiers = dc.tiers.map((t) => {
      const threshold = (t.thresholdCents / 100).toFixed(0);
      if (t.discount.kind === "free_shipping") return `$${threshold} free ship`;
      return `$${threshold} get ${t.discount.value}${t.discount.kind === "percentage" ? "%" : "$"} off`;
    });
    return `Spend more, save more: ${tiers.join(", ")}`;
  }

  if (dc?.bogo) {
    const buy = dc.bogo.buy.quantity;
    const get = dc.bogo.get.quantity;
    if (dc.bogo.get.discount.kind === "free_product") {
      return `Buy ${buy} Get ${get} Free`;
    }
    return `Buy ${buy} Get ${get} at ${dc.bogo.get.discount.value}% off`;
  }
  // ...
};
```

### CartAbandonmentPopup Discount Flow

The Cart Abandonment popup has sophisticated discount handling:

1. **Teaser State:** Shows discount amount (e.g., "15% OFF") before CTA click
2. **Code Generation:** Calls `issueDiscount()` on CTA click to generate code
3. **Display State:** Shows `DiscountCodeDisplay` with generated code
4. **Price Updates:** Dynamically updates cart item prices and totals with discount applied

---

## Part 6: Recommendations

### 1. ✅ Keep Current Separation (Correct Design)

The current split between `GenericDiscountComponent` and `DiscountSection` is **intentional and correct**:
- Simple templates get simple options → less cognitive load for merchant
- Sales-focused templates get advanced options → more flexibility for promotions

**No action needed.**

### 2. ⚠️ Simplify Spin-to-Win / Scratch Card Discount Options

**Files to modify:**
- `app/domains/campaigns/components/sections/WheelSegmentEditor.tsx`
- `app/domains/campaigns/components/sections/ScratchCardContentSection.tsx`

**Current:** Uses `GenericDiscountComponent` which offers Tiered/BOGO options
**Problem:** These advanced types don't make sense for per-segment prizes
**Solution:** Create a simplified variant of `GenericDiscountComponent` that only shows:
- Basic discount types (Percentage, Fixed Amount, Free Shipping)
- Free Gift option

**Effort:** Low | **Priority:** P3 (Nice to have)

### 3. ⚠️ Consider Adding Tiered Discounts to Cart Abandonment

**File:** `app/domains/campaigns/components/sections/CartAbandonmentContentSection.tsx`

**Current:** Uses `DiscountSection` (basic only)
**Opportunity:** "Spend $X more and get Y% off" messaging could increase AOV

**Effort:** Medium (requires storefront rendering support) | **Priority:** P2

### 4. ⚠️ Review Free Shipping Bar's Discount Section

**File:** `app/domains/campaigns/components/sections/FreeShippingContentSection.tsx` (line 355)

**Current:** Uses `DiscountSection` which offers % and $ discounts
**Problem:** Free Shipping Bar already has:
- Built-in `freeShippingThreshold` field
- Built-in threshold progress bar on storefront
- The `DiscountSection` options are redundant/confusing

**Solution:** Either:
1. Remove `DiscountSection` entirely (Free Shipping Bar IS the discount)
2. Keep but pre-configure to FREE_SHIPPING only

**Effort:** Low | **Priority:** P3

### 5. 🗑️ Consider Removing Legacy `DiscountConfigSection`

**File:** `app/domains/campaigns/components/sections/DiscountConfigSection.tsx`

**Current Status:**
- Exported in `index.ts`
- **NOT imported or used anywhere else in the codebase**
- Appears to be superseded by `DiscountSection` (popups/design)

**Recommendation:**
1. Verify no external packages depend on it
2. Remove from `index.ts` export
3. Delete the file

**Effort:** Very Low | **Priority:** P3

---

## File Locations Summary

```
app/domains/
├── campaigns/components/
│   ├── DiscountSettingsStep.tsx              # Full modal for advanced settings
│   │                                         # Exports: DiscountAdvancedSettings (used by DiscountSection)
│   ├── form/
│   │   └── GenericDiscountComponent.tsx      # Full-featured: Basic + Tiered + BOGO + FreeGift
│   │                                         # Used by: Flash Sale, Spin-to-Win, Scratch Card
│   └── sections/
│       ├── DiscountConfigSection.tsx         # ⚠️ UNUSED - Legacy, removing
│       ├── FlashSaleContentSection.tsx       # Uses GenericDiscountComponent ✅
│       ├── NewsletterContentSection.tsx      # Uses DiscountSection ✅
│       ├── CartAbandonmentContentSection.tsx # Uses DiscountSection (basic only)
│       ├── FreeShippingContentSection.tsx    # Uses DiscountSection ⚠️ (redundant)
│       ├── SpinToWinContentSection.tsx       # Uses WheelSegmentEditor
│       ├── WheelSegmentEditor.tsx            # Uses GenericDiscountComponent ⚠️ (overkill)
│       ├── ScratchCardContentSection.tsx     # Uses GenericDiscountComponent ⚠️ (overkill)
│       ├── ProductUpsellContentSection.tsx   # Uses built-in bundleDiscount ✅
│       ├── AnnouncementContentSection.tsx    # No discount section
│       └── SocialProofContentSection.tsx     # No discount section
│
├── popups/components/design/
│   └── DiscountSection.tsx                   # Basic only: %, $, Free Shipping
│                                             # Opens DiscountAdvancedSettings modal
│
└── storefront/popups-new/
    ├── hooks/
    │   ├── useDiscountCode.ts                # Shared hook for code state/copy
    │   └── usePopupForm.ts                   # Form submission with discount generation
    ├── components/shared/
    │   ├── DiscountCodeDisplay.tsx           # Shared copyable code display
    │   └── SuccessState.tsx                  # Success message with optional discount
    ├── FlashSalePopup.tsx                    # ✅ Renders tiered/BOGO messaging via getDiscountMessage()
    ├── NewsletterPopup.tsx                   # Shows code via SuccessState
    ├── SpinToWinPopup.tsx                    # Shows code via DiscountCodeDisplay
    ├── ScratchCardPopup.tsx                  # Shows code via DiscountCodeDisplay
    ├── CartAbandonmentPopup.tsx              # Shows teaser → code via DiscountCodeDisplay
    ├── ProductUpsellPopup.tsx                # Custom bundle savings display
    └── FreeShippingPopup.tsx                 # Custom progress bar display
```

## Summary of Action Items

| # | Action | File(s) | Priority | Effort |
|---|--------|---------|----------|--------|
| 1 | Remove unused `DiscountConfigSection` | `sections/DiscountConfigSection.tsx`, `sections/index.ts` | P3 | Very Low |
| 2 | Simplify Spin-to-Win discount options | `WheelSegmentEditor.tsx` | P3 | Low |
| 3 | Simplify Scratch Card discount options | `ScratchCardContentSection.tsx` | P3 | Low |
| 4 | Review Free Shipping Bar's DiscountSection | `FreeShippingContentSection.tsx` | P3 | Low |
| 5 | Add Tiered support to Cart Abandonment | `CartAbandonmentContentSection.tsx`, `CartAbandonmentPopup.tsx` | P2 | Medium |

