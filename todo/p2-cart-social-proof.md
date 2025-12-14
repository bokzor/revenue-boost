# Cart Activity Social Proof

> Priority: P2 | Impact: 🔥🔥 | Effort: Low

## Summary

Show "X people have this in cart" notifications to create urgency. Real-time cart activity tracking.

## Why

High conversion impact. Already planned in social proof TODO. Creates FOMO.

## User Stories

- As a visitor, I want to know if others are interested in a product
- As a merchant, I want to show cart activity to create urgency

## Implementation Tasks

### Cart Tracking
- [ ] Track add-to-cart events per product
- [ ] Store in Redis with TTL (30 min - 24 hours)
- [ ] Aggregate counts by product

### Display Component
- [ ] "12 people have this in their cart" notification
- [ ] Show on product pages
- [ ] Configurable threshold (only show if > X carts)

### Real-Time Updates
- [ ] WebSocket or polling for live updates
- [ ] Smooth count animations

### Privacy Considerations
- [ ] No PII collected
- [ ] Aggregate counts only
- [ ] Configurable anonymization

## Technical Design

```typescript
// Redis key structure
// cart:activity:{shopId}:{productId} = count
// TTL: 24 hours

interface CartActivityConfig {
  enabled: boolean,
  minThreshold: number,  // Only show if count > this
  displayText: string,   // "{count} people have this in cart"
  position: "below_add_to_cart" | "floating",
}
```

## Related Files

- `app/domains/social-proof/`
- `extensions/storefront-popup/` (for display)
- `app/routes/api.cart.activity.tsx` (new)

