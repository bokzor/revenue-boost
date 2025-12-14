# Webhook & API Access

> Priority: P3 | Impact: 🔥 | Effort: Medium

## Summary

External integrations via webhooks and REST API. Enable Zapier, custom integrations, and developer access.

## Why

Power users want to integrate with their own systems. Agencies need API access.

## Features

### Outgoing Webhooks
- [ ] Webhook on lead capture
- [ ] Webhook on conversion
- [ ] Webhook on campaign status change
- [ ] Configurable webhook URLs per event
- [ ] Retry logic for failed deliveries

### REST API
- [ ] Campaign CRUD endpoints
- [ ] Analytics read endpoints
- [ ] Template listing
- [ ] API key authentication
- [ ] Rate limiting

### Zapier Integration
- [ ] Zapier app listing
- [ ] Triggers: Lead captured, Conversion
- [ ] Actions: Create campaign, Update campaign

## Technical Design

### Webhook Payload

```typescript
interface WebhookPayload {
  event: "lead.created" | "conversion.created" | "campaign.updated",
  timestamp: string,
  data: Record<string, any>,
  signature: string,  // HMAC for verification
}

// Example: lead.created
{
  event: "lead.created",
  timestamp: "2024-12-14T10:30:00Z",
  data: {
    leadId: "...",
    email: "customer@example.com",
    campaignId: "...",
    campaignName: "Newsletter Popup",
  },
  signature: "sha256=..."
}
```

### API Authentication

```typescript
// API key in header
Authorization: Bearer rb_live_xxxxx

// Or query param (for webhooks)
?api_key=rb_live_xxxxx
```

### Rate Limits
- 100 requests/minute per store
- 1000 webhook deliveries/day on free plan

## Related Files

- `app/routes/api.v1.campaigns.tsx` (new)
- `app/routes/api.v1.analytics.tsx` (new)
- `app/domains/webhooks/` (new)

