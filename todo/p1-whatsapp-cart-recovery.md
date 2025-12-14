# WhatsApp Cart Abandonment Recovery

> Priority: P1 | Impact: 🔥🔥🔥 | Effort: High

## Summary

Add WhatsApp as a cart recovery channel alongside existing email recovery. WhatsApp has 98% open rates and 45-60% conversion rates compared to SMS's 5% conversion rate.

## Why

- **98% open rate** vs 20-30% for email
- **45-60% conversion rate** vs 5% for SMS
- **Cost-effective**: ~$0.01-0.02 per message
- **Global reach**: 2+ billion users, especially strong in LATAM, Europe, India
- **Rich media**: Send product images, buttons, checkout links

## User Stories

- As a merchant, I want to recover abandoned carts via WhatsApp
- As a merchant, I want to capture phone numbers with consent in my popups
- As a merchant, I want to see WhatsApp recovery analytics alongside email
- As a visitor, I want to opt-in to WhatsApp notifications easily

## Cost Comparison

| Channel | Cost/Message | Open Rate | Conversion Rate | Cost per Conversion |
|---------|-------------|-----------|-----------------|---------------------|
| Email | ~$0.001 | 20-30% | 2-5% | ~$0.02-0.05 |
| SMS | ~$0.01 | 98% | 5% | ~$0.20 |
| WhatsApp | ~$0.01-0.02 | 98% | 45-60% | ~$0.02-0.04 |

## Implementation Phases

### Phase 1: Phone Capture (2 weeks)
Extend existing popups to capture phone numbers with WhatsApp consent.

### Phase 2: WhatsApp Integration (3-4 weeks)
Integrate with WhatsApp Business API (via Twilio or Meta Cloud API).

### Phase 3: Admin UI (2 weeks)
Settings, message templates, analytics dashboard.

### Phase 4: Testing & Launch (2 weeks)
Beta testing, documentation, production rollout.

**Total: ~8-10 weeks**

---

## Technical Design

### Phase 1: Phone Capture Schema

```typescript
// Extend CartAbandonmentContentSchema
export const CartAbandonmentContentSchema = BaseContentConfigSchema.extend({
  // ... existing fields

  // NEW: WhatsApp recovery
  enableWhatsAppRecovery: z.boolean().default(false),
  phonePlaceholder: z.string().default("Your phone number"),
  whatsAppOptInText: z.string().default("Send me cart reminders via WhatsApp"),
  countryCodeDefault: z.string().default("+1"),
});
```

### Phase 2: WhatsApp Domain Structure

```
app/domains/whatsapp/
├── services/
│   ├── whatsapp.server.ts       # API integration
│   ├── message-queue.server.ts  # Delayed message sending
│   └── templates.server.ts      # Message template management
├── types/
│   └── whatsapp.ts              # Zod schemas
└── components/
    └── WhatsAppSettings.tsx     # Admin settings UI
```

### Database Schema

```prisma
model WhatsAppSubscriber {
  id          String   @id @default(cuid())
  storeId     String
  phone       String
  countryCode String
  optedInAt   DateTime @default(now())
  optedOut    Boolean  @default(false)
  campaignId  String?

  store       Store    @relation(fields: [storeId], references: [id])
  campaign    Campaign? @relation(fields: [campaignId], references: [id])

  @@unique([storeId, phone])
}

model WhatsAppMessage {
  id           String   @id @default(cuid())
  storeId      String
  subscriberId String
  templateId   String
  status       WhatsAppMessageStatus
  sentAt       DateTime?
  deliveredAt  DateTime?
  readAt       DateTime?
  errorMessage String?

  store        Store    @relation(fields: [storeId], references: [id])
  subscriber   WhatsAppSubscriber @relation(fields: [subscriberId], references: [id])
}

enum WhatsAppMessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}
```

### WhatsApp API Integration Options

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **Twilio** | Easy integration, good docs | Higher cost | $0.005 + Meta fee |
| **Meta Cloud API** | Direct, lower cost | More complex setup | Meta fee only |
| **MessageBird** | Good EU support | Less common | Competitive |

**Recommendation**: Start with Twilio for faster development, migrate to Meta Cloud API for cost savings at scale.

### Message Template (Meta Approved)

```
Hi {{1}}! 👋

You left some items in your cart at {{2}}:

🛒 {{3}}

Complete your order now and get {{4}} OFF:
{{5}}

This offer expires in 24 hours ⏰

Reply STOP to unsubscribe.
```

Variables:
1. Customer first name
2. Store name
3. Product list
4. Discount amount
5. Checkout URL with discount


---

## Implementation Tasks

### Phase 1: Phone Capture
- [ ] Extend `CartAbandonmentContentSchema` with phone fields
- [ ] Add phone input component to `CartAbandonmentPopup.tsx`
- [ ] Country code selector with flag icons
- [ ] WhatsApp opt-in checkbox
- [ ] Phone validation (E.164 format)
- [ ] Save phone to Lead model

### Phase 2: WhatsApp Integration
- [ ] Create `app/domains/whatsapp/` domain structure
- [ ] Twilio WhatsApp API integration
- [ ] Message template management
- [ ] Queue system for delayed messages (1h, 24h, 72h)
- [ ] Delivery status webhooks
- [ ] Error handling and retry logic

### Phase 3: Admin UI
- [ ] WhatsApp settings page (API credentials)
- [ ] Message template editor
- [ ] Send test message functionality
- [ ] WhatsApp analytics in campaign detail
- [ ] Subscriber management (opt-out handling)

### Phase 4: Testing & Launch
- [ ] E2E tests for phone capture flow
- [ ] Integration tests for Twilio API
- [ ] Meta template approval process
- [ ] Documentation for merchants
- [ ] Gradual rollout to beta merchants

---

## Pricing Model

### Suggested Plan Limits

| Plan | WhatsApp Messages/Month | Overage |
|------|------------------------|---------|
| Free | 50 | Not available |
| Growth ($29/mo) | 500 | $0.03/msg |
| Pro ($79/mo) | 2,000 | $0.02/msg |
| Enterprise | Unlimited | Custom |

### Cost Analysis

At $0.015 average cost per message:
- 500 messages = $7.50 cost → $29 plan = healthy margin
- 2,000 messages = $30 cost → $79 plan = healthy margin

---

## Go-to-Market

### Target Markets (WhatsApp-dominant)
1. 🇧🇷 Brazil - 99% WhatsApp penetration
2. 🇮🇳 India - 97% WhatsApp penetration
3. 🇲🇽 Mexico - 95% WhatsApp penetration
4. 🇩🇪 Germany - 84% WhatsApp penetration
5. 🇬🇧 UK - 75% WhatsApp penetration

### Messaging
- "Recover 45% of abandoned carts with WhatsApp"
- "98% open rate vs 20% for email"
- "10x more effective than SMS"

---

## Compliance Considerations

- [ ] GDPR consent for EU customers
- [ ] TCPA compliance for US (express written consent)
- [ ] Meta Business verification required
- [ ] WhatsApp Commerce Policy compliance
- [ ] Clear opt-out mechanism (STOP keyword)

---

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/domains/campaigns/components/sections/CartAbandonmentContentSection.tsx`
- `app/domains/storefront/popups-new/CartAbandonmentPopup.tsx`
- `app/routes/api.cart.email-recovery.tsx` (pattern to follow)
- `app/webhooks/orders.create.ts` (conversion attribution)

---

## Quick-Win Alternative

For faster time-to-market (2-3 weeks), integrate with existing providers:

1. **Zapier/Make webhook** - Push leads to Zoko/Klaviyo
2. **Native partner integration** - Direct API with existing WhatsApp apps
3. **Shopify Flow trigger** - Let merchants use Shopify Flow with WhatsApp apps

This allows merchants to use WhatsApp without building full native integration.

