# Technical Debt & Implementation Issues

> This file tracks technical debt, refactoring needs, and implementation issues.

---

## 🔴 High Priority

### Missing Targeting Triggers

Industry-standard triggers that are not yet implemented:

| Category | Missing Triggers | Use Case |
|----------|------------------|----------|
| **Visitor Status** | `first_time_visitor`, `returning_visitor`, `visit_count` | First Purchase Discount, "Welcome back!" offers |
| **Traffic Source** | `utm_source`, `utm_medium`, `utm_campaign`, `referrer_url` | Show offer to Facebook ads traffic only |
| **Session History** | `pages_viewed_count`, `products_viewed`, `time_on_site_total` | After viewing 3+ products |
| **Time-Based** | `day_of_week`, `time_of_day`, `date_range` | Weekend-only sales |
| **Purchase History** | `has_purchased_before`, `total_orders_count`, `days_since_last_purchase` | Win-back campaigns |

**Most Valuable to Implement:**

1. **Visitor Status** (enables First Purchase Discount)
```typescript
visitor_status: {
  enabled: boolean,
  type: "first_time" | "returning" | "any",
  visit_count_min?: number,
  visit_count_max?: number,
}
```
*Implementation: localStorage/cookie tracking*

2. **Traffic Source / UTM** (enables campaign-specific offers)
```typescript
traffic_source: {
  enabled: boolean,
  utm_source?: string[],
  utm_medium?: string[],
  utm_campaign?: string[],
  referrer_contains?: string[],
}
```
*Implementation: Read URL params + document.referrer on page load*

3. **Date/Time** (enables scheduled campaigns)
```typescript
schedule: {
  enabled: boolean,
  days_of_week?: number[],
  time_range?: { start: string, end: string },
  date_range?: { start: Date, end: Date },
}
```

---

### Conversion Suppression

**Problem**: If a visitor signs up or converts, the campaign may still show again on subsequent page loads.

**Solution**: Add conversion suppression in `filterCampaigns()`:

```typescript
// In app/domains/campaigns/services/campaign-filter.server.ts
const visitorLeads = await prisma.lead.findMany({
  where: {
    visitorId: context.visitorId,
    campaignId: { in: campaigns.map(c => c.id) }
  },
  select: { campaignId: true }
});

const convertedCampaignIds = new Set(visitorLeads.map(l => l.campaignId));
filtered = filtered.filter(c => !convertedCampaignIds.has(c.id));
```

**Priority**: Medium - Client-side dismissal handles this partially, but server-side is more reliable.

---

## 🟡 Medium Priority

### Tiered Discount UX Issue

**Problem**: Users can miss higher discount tiers after dismissing popup.

**Scenario**:
1. User has $40 cart, next tier is at $50 (15% off)
2. Popup shows: "Spend $10 more to unlock 15% OFF!"
3. User dismisses popup
4. User adds more items, reaching $60
5. User never sees they qualify for better tier

**Possible Solutions**:
1. Tiered Progress Bar (always visible)
2. Re-trigger on tier threshold crossing
3. Cart drawer integration
4. Checkout-time tier evaluation
5. "Undismissible" mini-widget

**Core tension**: Respect user intent vs. maximize conversion.



**Implementation Tasks**:

| Task | Effort |
|------|--------|
| Add `strategy` and `bundleText` to `DiscountConfigSchema` | Low |
| Add "Bundle" strategy option to `GenericDiscountComponent` | Medium |
| Remove "Bundle Discount" section from `ProductUpsellContentSection` | Low |
| Update `ProductUpsellPopup` to read from `discountConfig.strategy` | Medium |
| Update recipes to use new approach | Low |
| Add backward compatibility fallback | Low |

**Affected Files**:
- `app/domains/campaigns/types/campaign.ts`
- `app/domains/campaigns/components/form/GenericDiscountComponent.tsx`
- `app/domains/campaigns/components/sections/ProductUpsellContentSection.tsx`
- `app/domains/storefront/popups-new/ProductUpsellPopup.tsx`

---

## 🟢 Low Priority / Notes

### Bundle Discount vs Classic Discount

Need to clarify how bundle discounts work with auto-suggested products.

**Questions to answer**:
- Does bundle discount apply to all upsell products?
- Or only products added via the popup?
- How does this interact with Shopify's discount stacking rules?

---

## Refactoring Opportunities

See `docs/solid-dry-opportunities.md` for code quality improvements.

---

## How to Use This File

1. **Adding an issue**: Add under appropriate priority section
2. **Fixing an issue**: Move to "Resolved" section with date and PR link
3. **Escalating priority**: Move to higher priority section with explanation

---

## Resolved

*Move completed items here with resolution date and PR link.*

<!-- Example:
### [RESOLVED] Issue Name
**Resolved**: 2024-12-01 | **PR**: #123
Brief description of the fix.
-->

