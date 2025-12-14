# Campaign Duplication

> Priority: P1 | Status: ✅ COMPLETE | Shipped: 2025-11-30

## Summary

Allow merchants to duplicate existing campaigns to quickly create variations for A/B testing or seasonal updates.

## Features

- ✅ Single campaign duplicate from dashboard table
- ✅ Bulk duplicate via multi-select
- ✅ Copies all config (content, design, targeting, discounts)
- ✅ New campaign created as DRAFT status
- ✅ Appends "(Copy)" to campaign name

## Implementation

### API Endpoint
`POST /api/campaigns/:id/duplicate`

### Copied Fields
- `templateType`
- `contentConfig`
- `designConfig`
- `targetRules`
- `discountConfig`
- `goal`

### Not Copied
- `status` (always DRAFT)
- `analytics` (starts fresh)
- `experimentId` (not part of original experiment)

