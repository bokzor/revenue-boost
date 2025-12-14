# Shopify Segments Deep Integration

> Priority: P3 | Impact: 🔥🔥 | Effort: Medium

## Summary

Leverage Shopify's customer segments for advanced targeting. RFM-based targeting, segment sync.

## Why

Shopify already has powerful segmentation. We can leverage it instead of rebuilding.

## Features

### Pre-built Segment Templates
- [ ] VIP customers (top 10% by spend)
- [ ] At-risk customers (no purchase in 60 days)
- [ ] New customers (first purchase < 30 days)
- [ ] Repeat buyers (2+ orders)
- [ ] High AOV customers

### RFM-Based Targeting
- [ ] Recency: Days since last purchase
- [ ] Frequency: Number of orders
- [ ] Monetary: Total spend
- [ ] Segment by RFM score

### Segment Performance Comparison
- [ ] A/B test same campaign on different segments
- [ ] Compare conversion rates by segment
- [ ] Identify highest-value segments

### Real-Time Segment Sync
- [ ] Sync Shopify segments on campaign load
- [ ] Check customer segment membership
- [ ] Update targeting in real-time

## Technical Design

### Shopify Customer Segments API

```graphql
query getSegments {
  segments(first: 50) {
    edges {
      node {
        id
        name
        query
      }
    }
  }
}

query checkSegmentMembership($customerId: ID!, $segmentId: ID!) {
  customer(id: $customerId) {
    inSegment(segmentId: $segmentId)
  }
}
```

### Targeting Rules Addition

```typescript
targetRules: {
  shopifySegments?: {
    enabled: boolean,
    segmentIds: string[],
    matchType: "any" | "all",
  }
}
```

## Limitations

- Requires customer to be logged in
- Or: match by email from lead capture
- Segment API has rate limits

## Related Files

- `app/domains/campaigns/types/targeting.ts`
- `app/domains/campaigns/services/campaign-filter.server.ts`
- `app/lib/shopify/segments.server.ts` (new)

