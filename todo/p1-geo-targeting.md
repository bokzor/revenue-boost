# Geo-Targeting & Localization

> Priority: P1 | Impact: 🔥🔥🔥 | Effort: Medium

## Summary

Enable merchants to target campaigns by country/region and display localized content (language, currency) to international visitors.

## Why

Essential for international stores. Enables regional campaigns like "Black Friday US-only" or "EU GDPR-compliant" offers.

## User Stories

- As a merchant with international traffic, I want to show different offers per country
- As a merchant, I want discounts displayed in the visitor's local currency
- As a merchant, I want to run region-specific promotions (e.g., UK Boxing Day sale)

## Current State

- [x] Country/region targeting via Shopify `X-Country-Code` header ✅
- [ ] Multi-language content variants per campaign
- [ ] Currency-aware discount display
- [ ] Timezone-aware scheduling

## Implementation Tasks

### Phase 1: Multi-Language Content
- [ ] Add `contentVariants` field to campaign schema
- [ ] UI for adding language variants in campaign editor
- [ ] Storefront: detect visitor language via `Accept-Language` header
- [ ] Fallback to default content if no variant matches

### Phase 2: Currency Display
- [ ] Fetch store's enabled currencies from Shopify
- [ ] Display discount values in visitor's currency
- [ ] Handle currency conversion for fixed-amount discounts

### Phase 3: Timezone Scheduling
- [ ] Store campaign times in UTC
- [ ] Convert to visitor timezone for display
- [ ] "Happy Hour 4-6 PM local time" support

## Technical Design

```typescript
// Campaign schema addition
contentVariants?: {
  [locale: string]: Partial<ContentConfig>
}

// Example
contentVariants: {
  "fr": { headline: "Bienvenue!", submitButtonText: "S'inscrire" },
  "de": { headline: "Willkommen!", submitButtonText: "Anmelden" }
}
```

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/domains/storefront/services/campaign-filter.server.ts`
- `app/routes/api.campaigns.active.tsx`

