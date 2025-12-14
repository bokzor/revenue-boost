# Web Push Notifications

> Priority: P3 | Impact: 🔥🔥🔥 | Effort: High

## Summary

Extend engagement beyond the current session with browser push notifications. Re-engage visitors after they leave. Key differentiator for retention.

Inspired by Wisepops' multi-channel approach.

## Why

Push notifications reach users even when they're not on the site. Cart abandonment reminders via push have high open rates.

## User Stories

- As a merchant, I want to collect push notification subscribers
- As a merchant, I want to send cart abandonment reminders via push
- As a merchant, I want to announce flash sales to subscribers

## Features

### Push Opt-in
- [ ] Push opt-in popup/banner
- [ ] Native browser permission request
- [ ] Custom opt-in UI before native prompt
- [ ] Subscription storage

### Cart Abandonment Push
- [ ] Detect abandoned cart
- [ ] Send reminder push after X hours
- [ ] Include cart summary in notification
- [ ] Deep link back to checkout

### Promotional Campaigns
- [ ] Scheduled push campaigns
- [ ] Flash sale announcements
- [ ] New product launches
- [ ] Segmented sending (by behavior, purchase history)

### Analytics
- [ ] Delivery rates
- [ ] Click rates
- [ ] Conversion attribution

## Technical Design

### Service Worker
Required for push notifications. Must be served from root domain.

### Push Providers
- Web Push API (native)
- OneSignal (managed service)
- Firebase Cloud Messaging

### Data Model

```typescript
interface PushSubscription {
  id: string,
  storeId: string,
  endpoint: string,
  keys: { p256dh: string, auth: string },
  createdAt: Date,
  lastActive: Date,
}

interface PushCampaign {
  id: string,
  title: string,
  body: string,
  icon?: string,
  url: string,
  scheduledAt?: Date,
  sentAt?: Date,
  stats: { sent: number, clicked: number },
}
```

## Related Files

- `extensions/storefront-popup/` (for opt-in UI)
- `app/domains/push/` (new domain)
- `app/routes/api.push.subscribe.tsx` (new)

