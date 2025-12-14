# Low Stock Threshold Triggers

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Trigger popups automatically when product inventory falls below a threshold. Creates urgency with "Only 3 left!" messaging using real inventory data.

## Why

+15-25% conversion per industry research. Real inventory API is already available.

## User Stories

- As a merchant, I want popups to auto-show when stock is running low
- As a merchant, I want "Only X left!" to show real numbers, not fake ones
- As a visitor, I want to know when items are almost sold out

## Current State

- [x] Inventory API integration for real stock levels ✅
- [x] "Only X left!" notifications with real data ✅
- [ ] Stock threshold triggers (show popup when inventory < N)
- [ ] Restock notifications

## Implementation Tasks

### Threshold Triggers
- [ ] Add `inventoryThreshold` to targeting rules schema
- [ ] Check inventory level in campaign filter
- [ ] Only return campaign if stock <= threshold
- [ ] Cache inventory checks (5 min TTL)

### Restock Notifications
- [ ] "Notify me when back in stock" popup template
- [ ] Collect email for restock alerts
- [ ] Webhook on inventory update to trigger emails

## Technical Design

```typescript
// Targeting rules addition
targetRules: {
  inventoryTrigger?: {
    enabled: boolean,
    productId: string,
    threshold: number,  // Show when stock <= this number
  }
}
```

## Related Files

- `app/domains/commerce/services/inventory.server.ts`
- `app/domains/campaigns/services/campaign-filter.server.ts`
- `app/domains/campaigns/types/targeting.ts`

