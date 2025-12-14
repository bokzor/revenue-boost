# Advanced Discount Types

> Priority: P2 | Impact: 🔥🔥 | Effort: Medium

## Summary

Expand discount options beyond simple percentage/fixed amount. Match competitor feature sets (Privy, Justuno).

## Why

Merchants want flexible promotions. BOGO, tiered discounts, and free gifts drive higher AOV.

## User Stories

- As a merchant, I want to offer "Spend $100, get 15% off; Spend $200, get 25% off"
- As a merchant, I want to offer "Buy 2, Get 1 Free"
- As a merchant, I want to offer a free gift with purchase

## Discount Types to Implement

### Tiered Discounts
- [ ] Multiple spend thresholds with increasing discounts
- [ ] Progress bar showing next tier
- [ ] Auto-apply best tier at checkout

### BOGO (Buy One Get One)
- [ ] Buy X, Get Y free
- [ ] Buy X, Get Y at 50% off
- [ ] Same product or different product

### Free Gift with Purchase
- [ ] Spend $X, get free product
- [ ] Choose from multiple gift options
- [ ] Inventory-aware (hide if gift out of stock)

### First-Time Buyer Exclusives
- [ ] Detect if customer has purchased before
- [ ] Exclusive discount for new customers only
- [ ] "Welcome" discount code

### Bundle Discounts
- [ ] Discount on specific product combinations
- [ ] "Buy these 3 together and save 20%"

## Technical Design

```typescript
// Discount config schema
discountConfig: {
  strategy: "simple" | "tiered" | "bogo" | "free_gift" | "bundle",
  
  // Tiered
  tiers?: { threshold: number, discount: number }[],
  
  // BOGO
  bogo?: {
    buyQuantity: number,
    getQuantity: number,
    getDiscount: number,  // 100 = free, 50 = half off
    getProductId?: string,  // if different product
  },
  
  // Free gift
  freeGift?: {
    minSpend: number,
    giftProductId: string,
    giftVariantId?: string,
  },
}
```

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/domains/campaigns/components/form/GenericDiscountComponent.tsx`
- `app/routes/api.discount.issue.tsx`

