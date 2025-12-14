# ESP Integrations (Shopify Native Sync)

> Priority: P0 | Status: ✅ COMPLETE | Shipped: 2025-11-30

## Summary

When a lead signs up via a Revenue Boost popup, we create a Shopify Customer with email marketing consent and tags for segmentation. Any ESP that syncs Shopify customers (Klaviyo, Mailchimp, Omnisend, ActiveCampaign, etc.) automatically receives these leads with zero configuration.

## How It Works

1. Lead submits email via popup
2. Revenue Boost creates/updates Shopify Customer with:
   - `emailMarketingConsent.marketingState: "SUBSCRIBED"`
   - Tags: `source:revenue-boost-popup`, `campaign:{id}`, template type, etc.
3. ESP syncs customer automatically via their Shopify integration
4. Tags flow through for segmentation in ESP

## Benefits

- Works with ALL ESPs that have Shopify integrations
- No API key management in Revenue Boost
- Tags flow through for segmentation in ESP
- Merchants configure sync once in their ESP app

## Tags Reference

| Tag | Example | Purpose |
|-----|---------|---------|
| `source:revenue-boost-popup` | - | Identifies lead origin |
| `campaign:{id}` | `campaign:abc123` | Links to specific campaign |
| `template:{type}` | `template:newsletter` | Identifies template type |
| `experiment:{id}` | `experiment:xyz789` | For A/B test attribution |

## Related Documentation

See `docs/INTEGRATIONS_PLAN.md` for full details.

