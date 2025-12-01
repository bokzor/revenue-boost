Wh3# Discount Components Analysis

> ⚠️ **See also:** [CAMPAIGN_CONCEPTS_CLARIFICATION.md](./CAMPAIGN_CONCEPTS_CLARIFICATION.md) for the distinction between Goals, Templates, and Triggers.

This document provides a comprehensive analysis of discount components, their appropriate use cases, and UX considerations.

---

## Part 1: Campaign Goals & Discount Strategy

### Understanding Campaign Intent

Each campaign type has a **primary goal** that determines which discount types make sense:

| Campaign Type | Primary Goal | User Journey |
|--------------|--------------|--------------|
| Newsletter | Email capture | User sees popup → Enters email → Receives reward |
| Exit Intent | Prevent bounce | User about to leave → Sees offer → Stays/converts |
| Spin-to-Win | Gamified email capture | User sees wheel → Enters email → Spins → Wins prize |
| Scratch Card | Gamified email capture | User sees card → Enters email → Scratches → Reveals prize |
| Flash Sale | Urgency-driven sales | User sees limited offer → Feels urgency → Buys now |
| Cart Abandonment | Cart recovery | User about to leave cart → Sees incentive → Completes order |
| Product Upsell | Increase AOV | User shown related products → Adds to cart → Bigger order |
| Free Shipping Bar | Threshold motivation | User sees progress → Adds more items → Gets free shipping |
| Countdown Timer | Create urgency | User sees time limit → Acts before expiry |
| Social Proof | Build trust | User sees activity → Feels FOMO → Converts |
| Announcement | Inform users | User sees message → Takes action |

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

| Campaign Type | % Off | Fixed $ | Free Ship | Tiered | BOGO | Free Gift |
|--------------|:-----:|:-------:|:---------:|:------:|:----:|:---------:|
| **Newsletter** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ |
| **Exit Intent** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ |
| **Spin-to-Win** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Scratch Card** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Flash Sale** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cart Abandonment** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Product Upsell** | ✅ | ✅ | ❌ | ❌ | ✅* | ❌ |
| **Free Shipping Bar** | ❌ | ❌ | ✅ | ✅** | ❌ | ❌ |
| **Countdown Timer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Social Proof** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Announcement** | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |

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

**Current state:** Uses `GenericDiscountComponent` - **OVERKILL**
- Advanced types (Tiered, BOGO) don't make sense per-segment
- Should use basic discounts + Free Gift option only

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
**Recommendation:** Could benefit from Tiered discounts

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
- No discount config component needed

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
**Problem:** Should NOT use generic discount component - has built-in threshold logic

---

## Part 4: Current State vs Recommended State

### Admin Components Inventory

| Component | Location | Features | Should Exist? |
|-----------|----------|----------|---------------|
| `GenericDiscountComponent` | `form/` | Full (Tiered, BOGO, FreeGift) | ✅ For Flash Sale |
| `DiscountSection` | `popups/design/` | Basic only | ✅ For Newsletter |
| `DiscountSettingsStep` | `components/` | Basic + behavior | ✅ As modal |
| `DiscountConfigSection` | `sections/` | Legacy | ❌ Remove |

### Current Usage vs Recommended

| Campaign Type | Current Component | Recommended | Change Needed? |
|--------------|-------------------|-------------|----------------|
| Newsletter | `DiscountSection` | `DiscountSection` | ❌ No |
| Exit Intent | `DiscountSection` | `DiscountSection` | ❌ No |
| Spin-to-Win | `GenericDiscountComponent` | Basic + FreeGift only | ⚠️ Simplify |
| Scratch Card | `GenericDiscountComponent` | Basic + FreeGift only | ⚠️ Simplify |
| Flash Sale | `GenericDiscountComponent` | `GenericDiscountComponent` | ❌ No |
| Cart Abandonment | `DiscountSection` | `DiscountSection` + Tiered | ⚠️ Add Tiered |
| Product Upsell | Built-in bundleDiscount | Keep as-is | ❌ No |
| Free Shipping Bar | `DiscountSection` | Remove or simplify | ⚠️ Review |
| Countdown Timer | None | None | ❌ No |
| Social Proof | None | None | ❌ No |
| Announcement | None | None | ❌ No |

---

## Part 5: Storefront Rendering Analysis

### How Popups Display Discounts

| Popup | Discount Display | Supports Tiered/BOGO Rendering? |
|-------|-----------------|--------------------------------|
| `NewsletterPopup.tsx` | `SuccessState` → `DiscountCodeDisplay` | ❌ Only shows code |
| `SpinToWinPopup.tsx` | `DiscountCodeDisplay` after spin | ❌ Only shows code |
| `ScratchCardPopup.tsx` | `DiscountCodeDisplay` after reveal | ❌ Only shows code |
| `FlashSalePopup.tsx` | `getDiscountMessage()` + `DiscountCodeDisplay` | ✅ YES - renders tiered/BOGO messaging |
| `CartAbandonmentPopup.tsx` | Shows % or $ teaser, then code | ⚠️ Partial - no tiered UI |
| `ProductUpsellPopup.tsx` | Built-in bundle savings calculator | ✅ Own implementation |
| `FreeShippingPopup.tsx` | Progress bar to threshold | ✅ Own implementation |

### Key Insight: FlashSalePopup Already Renders Advanced Discounts

```typescript
// From FlashSalePopup.tsx - lines 256-276
const getDiscountMessage = () => {
  if (dc?.tiers?.length) {
    // Tiered discount
    const tiers = dc.tiers.map((t) => {
      const threshold = (t.thresholdCents / 100).toFixed(0);
      return `$${threshold} get ${t.discount.value}% off`;
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

---

## Part 6: Recommendations

### 1. Keep Current Separation (Mostly Correct)

The current split between `GenericDiscountComponent` and `DiscountSection` is **intentional and correct**:
- Simple templates get simple options → less cognitive load for merchant
- Sales-focused templates get advanced options → more flexibility for promotions

### 2. Simplify Spin-to-Win / Scratch Card

Remove BOGO/Tiered from these - they don't make sense per-segment:
- Keep: Percentage, Fixed, Free Shipping, Free Gift
- Remove: Tiered, BOGO

### 3. Consider Adding Tiered to Cart Abandonment

"Spend $X more and get Y% off" could help increase AOV during recovery

### 4. Review Free Shipping Bar

Currently uses `DiscountSection` but shouldn't - it has its own built-in threshold logic

### 5. Clean Up Legacy Code

Remove `DiscountConfigSection` if truly unused

---

## File Locations Summary

```
app/domains/
├── campaigns/components/
│   ├── DiscountSettingsStep.tsx          # Modal for advanced settings
│   ├── form/
│   │   └── GenericDiscountComponent.tsx  # Full-featured (Flash Sale)
│   └── sections/
│       ├── DiscountConfigSection.tsx     # LEGACY - consider removing
│       ├── FlashSaleContentSection.tsx   # Uses GenericDiscountComponent ✅
│       ├── NewsletterContentSection.tsx  # Uses DiscountSection ✅
│       ├── CartAbandonmentContentSection.tsx # Uses DiscountSection
│       ├── FreeShippingContentSection.tsx    # Uses DiscountSection ⚠️
│       ├── WheelSegmentEditor.tsx        # Uses GenericDiscountComponent ⚠️
│       └── ScratchCardContentSection.tsx # Uses GenericDiscountComponent ⚠️
├── popups/components/design/
│   └── DiscountSection.tsx               # Basic - for simple templates
└── storefront/popups-new/
    ├── FlashSalePopup.tsx                # Renders tiered/BOGO messaging ✅
    ├── NewsletterPopup.tsx               # Shows code only ✅
    ├── SpinToWinPopup.tsx                # Shows code only
    ├── ScratchCardPopup.tsx              # Shows code only
    └── CartAbandonmentPopup.tsx          # Shows % or code
```

