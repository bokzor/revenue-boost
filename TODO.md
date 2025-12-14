# TODO

> ⚠️ **This file has been migrated!**
>
> The feature roadmap and technical debt have been reorganized into the `todo/` directory for better organization.
>
> **See:**
> - [`todo/README.md`](./todo/README.md) - Feature roadmap overview
> - [`todo/technical-debt.md`](./todo/technical-debt.md) - Technical issues (content from this file)
> - [`todo/p1-*.md`](./todo/) - High priority features
> - [`todo/p2-*.md`](./todo/) - Medium priority features
> - [`todo/p3-*.md`](./todo/) - Future/backlog features

---

# DEPRECATED - Content Below Has Been Migrated

The content below is kept for reference but is no longer maintained. See `todo/technical-debt.md` for the current version.

---

## Missing Targeting Triggers

### ❌ What's Missing (Industry Standard)

| Category | Missing Triggers | Use Case |
|----------|------------------|----------|
| **Visitor Status** | `first_time_visitor` | First Purchase Discount |
| | `returning_visitor` | "Welcome back!" offers |
| | `visit_count` (1st, 2nd, 3rd...) | Progressive offers |
| **Traffic Source** | `utm_source`, `utm_medium`, `utm_campaign` | Show offer to Facebook ads traffic only |
| | `referrer_url` / `referrer_domain` | Show offer to Google organic visitors |
| | `traffic_type` (direct/organic/paid/social) | Different offers per channel |
| **Session History** | `pages_viewed_count` | After viewing 3+ products |
| | `products_viewed` (specific products) | Cross-sell related items |
| | `time_on_site_total` | Engaged visitors (5+ min on site) |
| **Time-Based** | `day_of_week` | Weekend-only sales |
| | `time_of_day` | Happy hour deals |
| | `date_range` | Holiday period targeting |
| **Purchase History** | `has_purchased_before` | Returning customer offers |
| | `total_orders_count` | VIP customer targeting |
| | `days_since_last_purchase` | Win-back campaigns |

---

## Most Valuable Missing Triggers (IMO)

### 1. **Visitor Status** (enables First Purchase Discount)

```typescript
visitor_status: {
  enabled: boolean,
  type: "first_time" | "returning" | "any",
  visit_count_min?: number,  // e.g., show on 2nd+ visit
  visit_count_max?: number,
}
```

*Implementation: localStorage/cookie tracking*

### 2. **Traffic Source / UTM** (enables campaign-specific offers)

```typescript
traffic_source: {
  enabled: boolean,
  utm_source?: string[],      // ["facebook", "google"]
  utm_medium?: string[],      // ["cpc", "email"]
  utm_campaign?: string[],    // ["black-friday-2024"]
  referrer_contains?: string[], // ["google.com", "facebook.com"]
}
```

*Implementation: Read URL params + document.referrer on page load*

### 3. **Date/Time** (enables scheduled campaigns)

```typescript
schedule: {
  enabled: boolean,
  days_of_week?: number[],    // [0,6] = weekends
  time_range?: { start: string, end: string }, // "09:00" - "17:00"
  date_range?: { start: Date, end: Date },
}
```

*Implementation: Server-side or client-side date check*

---

## What Do You Think?

Should we:

1. **Add Visitor Status tracking** → Enables "First Purchase", "Welcome Back", "Loyal Customer" recipes
2. **Add UTM/Traffic Source** → Enables "Facebook Ad Exclusive", "Email Subscriber Offer" recipes
3. **Add Time-Based scheduling** → Enables "Weekend Sale", "Happy Hour", "Holiday Period" recipes

These 3 would unlock a lot of powerful use cases for Flash Sale and other templates.

---

## Conversion Suppression

### Feature: Auto-hide campaigns after visitor converts

**Problem**: Currently, if a visitor signs up (submits lead) or converts, the campaign may still show again on subsequent page loads because there's no server-side check for existing conversions.

**Solution**: Add conversion suppression in `filterCampaigns()`:

```typescript
// In app/domains/campaigns/services/campaign-filter.server.ts

// Before returning campaigns, check if visitor has already converted
const visitorLeads = await prisma.lead.findMany({
  where: {
    visitorId: context.visitorId,
    campaignId: { in: campaigns.map(c => c.id) }
  },
  select: { campaignId: true }
});

const convertedCampaignIds = new Set(visitorLeads.map(l => l.campaignId));

// Filter out campaigns where visitor already converted
filtered = filtered.filter(c => !convertedCampaignIds.has(c.id));
```

**Benefits**:
- No more showing newsletter signup to someone who already signed up
- Works across devices (server-side, not localStorage)
- Respects A/B test tracking (use experimentId for suppression)

**Priority**: Medium - Currently client-side dismissal handles this partially, but server-side is more reliable.

---

## Tiered Discount UX Issue

### Problem: Users can miss higher discount tiers after dismissing popup

**Scenario**:
1. User has $40 cart, next tier is at $50 (15% off)
2. Popup shows progress: "Spend $10 more to unlock 15% OFF!"
3. User dismisses/closes the popup
4. User adds more items later, reaching $60
5. **Problem**: User never sees they now qualify for a better tier (or any tier)

**Current behavior**:
- Discount code is issued when user clicks CTA (e.g., "Resume Checkout")
- Code is selected based on cart value at issuance time
- Once popup is dismissed, it won't re-show (frequency capping)
- Even a persistent progress bar can be dismissed

**Possible solutions to explore**:

1. **Tiered Progress Bar** (like Free Shipping bar)
   - Always visible, live cart updates
   - Issue code on "Claim" button click
   - Problem: User can still dismiss it

2. **Re-trigger on tier threshold crossing**
   - Track cart value, re-show popup when crossing a new tier
   - Problem: Can feel pushy/annoying

3. **Cart drawer integration**
   - Show tier progress inside cart drawer (less dismissible)
   - Problem: Requires theme integration

4. **Checkout-time tier evaluation**
   - Don't issue code until checkout
   - Evaluate best tier at that moment
   - Problem: Less urgency/engagement

5. **"Undismissible" mini-widget**
   - Small floating indicator showing current tier status
   - Less intrusive than full bar
   - Always visible, cannot be fully dismissed

**Key insight**: The core tension is between:
- **Respect user intent** (they dismissed it, leave them alone)
- **Maximize conversion** (show them they unlocked a better deal)

**Priority**: Low - Need to think through UX implications before implementing.

---

## Unified Discount Strategy for PRODUCT_UPSELL

### Problem: Split Data Model

Currently, discount configuration is split across two locations:

```typescript
contentConfig: {
  bundleDiscount: 15,        // ← Simple bundle discount lives here
  bundleDiscountText: "..."
}

discountConfig: {
  enabled: true,
  tiers: [...],              // ← Tiered discounts live here
  bogo: {...},
  freeGift: {...}
}
```

This causes issues:
- "Spend More, Save More" recipe sets `discountConfig.tiers` but popup reads `contentConfig.bundleDiscount`
- Admin UI has two places to configure discounts (confusing)
- Storefront has to check both locations

### Proposed Solution: Add `strategy` field to discountConfig

```typescript
discountConfig: {
  enabled: true,

  // NEW: Which discount strategy to use
  strategy: "bundle" | "tiered" | "bogo" | "free_gift" | "simple",

  // For "simple" and "bundle" strategies
  valueType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
  value: 15,  // e.g., 15% off

  // For "bundle" strategy only
  bundleText: "Save 15% on selected items!",

  // For "tiered" strategy
  tiers: [...],

  // For "bogo" / "free_gift"
  bogo: {...},
  freeGift: {...},
}
```

### Admin UI Changes

Replace separate "Bundle Discount" section in `ProductUpsellContentSection` with unified strategy selector in `GenericDiscountComponent`:

```
Discount Strategy:
○ Simple         - Fixed % or $ off entire order
● Bundle         - % off selected upsell products
○ Tiered         - Spend more, save more
○ BOGO           - Buy X get Y free
○ Free Gift      - Free product with purchase
```

### Implementation Tasks

| Task | Effort |
|------|--------|
| Add `strategy` and `bundleText` to `DiscountConfigSchema` | Low |
| Add "Bundle" strategy option to `GenericDiscountComponent` | Medium |
| Remove "Bundle Discount" section from `ProductUpsellContentSection` | Low |
| Update `ProductUpsellPopup` to read from `discountConfig.strategy` | Medium |
| Update `ProductUpsellPopup` to call `issueDiscount()` for tiered | Medium |
| Update recipes to use new `discountConfig.strategy` approach | Low |
| Add backward compatibility fallback to `contentConfig.bundleDiscount` | Low |
| Deprecate `bundleDiscount` from `ProductUpsellContentSchema` | Low |

### Affected Files

- `app/domains/campaigns/types/campaign.ts` - Add strategy to schema
- `app/domains/campaigns/components/form/GenericDiscountComponent.tsx` - Add bundle strategy UI
- `app/domains/campaigns/components/sections/ProductUpsellContentSection.tsx` - Remove bundle discount section
- `app/domains/storefront/popups-new/ProductUpsellPopup.tsx` - Read from discountConfig, issue discount
- `app/domains/campaigns/recipes/upsell-recipes.ts` - Update recipes

### Storefront Flow After Implementation

```
1. Popup shows with either:
   - Bundle banner: "Save 15% on selected items!"
   - Tiered progress: "Spend $50 → 10%, $100 → 20%, $150 → 30%"

2. User selects products & clicks "Add & Save"

3. handleAddToCart() executes:
   a) Add selected products to cart
   b) Call issueDiscount({ cartSubtotalCents, selectedProductIds })
   c) Backend creates appropriate discount code
   d) Apply discount code to cart

4. Show success state with discount code
```

**Priority**: Medium - Blocks "Spend More, Save More" recipe from working properly.


POINTS TO CLARIFY
BUNDLE DISCOUNT VS CLASSIC DISCOUNT => need to check how use it with auto suggested productsyes
