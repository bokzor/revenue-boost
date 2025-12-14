# Revenue Attribution Dashboard

> Priority: P2 | Impact: 🔥🔥🔥 | Effort: Medium

## Summary

Advanced analytics showing ROI, revenue attribution, and comparative metrics. Justifies pricing, reduces churn, drives upgrades.

## Why

Merchants need to see value. "You made $5,240 from popups vs $29/month = 180x ROI" is a powerful retention message.

## User Stories

- As a merchant, I want to see how much revenue my popups generated
- As a merchant, I want to compare my performance to benchmarks
- As a merchant, I want to understand which campaigns perform best

## Implementation Tasks

### ROI Calculator
- [ ] Calculate total revenue attributed to Revenue Boost
- [ ] Compare to subscription cost
- [ ] Display as "180x ROI" or "Made $5,240, paid $29"

### Attribution Models
- [ ] First-touch attribution (popup was first interaction)
- [ ] Last-touch attribution (popup was last before purchase)
- [ ] View-through attribution (saw popup, bought later)
- [ ] Configurable attribution window (7 days, 30 days)

### Comparative Metrics
- [ ] "25% above average conversion rate"
- [ ] Benchmarks by industry/template type
- [ ] Trend indicators (up/down vs last period)

### Cohort Analysis
- [ ] Revenue by signup date cohort
- [ ] Long-term value of popup-acquired customers
- [ ] Retention curves

## Technical Design

```typescript
// Analytics aggregation
interface RevenueMetrics {
  totalRevenue: number,
  attributedOrders: number,
  averageOrderValue: number,
  roiMultiple: number,  // revenue / subscription cost
  comparisonToBenchmark: number,  // +25% means 25% above avg
}
```

## Related Files

- `app/routes/app.analytics._index.tsx`
- `app/domains/analytics/services/`
- `app/webhooks/orders.create.ts` (for attribution tracking)

