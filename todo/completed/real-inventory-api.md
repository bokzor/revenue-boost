# Real Inventory API for Flash Sale

> Priority: P1 | Status: ✅ COMPLETE | Shipped: 2025-11-30

## Summary

Integrate with Shopify Inventory API to show real stock levels in Flash Sale popups instead of fake/random numbers.

## Features

- ✅ Shopify Inventory API integration for real stock levels
- ✅ Supports: variant IDs, product IDs, collection IDs
- ✅ "Only X left!" displays actual inventory data
- ✅ Flash Sale template `inventory.mode: "real"` now functional

## Implementation

### Content Config

```typescript
inventory: {
  mode: "real" | "fake",
  // For "real" mode - fetches from Shopify
  variantId?: string,
  productId?: string,
  collectionId?: string,
  // For "fake" mode - displays static number
  fakeCount?: number,
}
```

### API Integration

Uses Shopify Admin GraphQL API:
- `inventoryLevels` query for variant-level stock
- Caches results for 5 minutes to reduce API calls
- Falls back to "fake" mode if API fails

## Related Files

- `app/domains/commerce/services/inventory.server.ts`
- `app/domains/storefront/popups-new/FlashSalePopup.tsx`

