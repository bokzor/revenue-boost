# Exit Intent + Email Recovery Combo

> Priority: P3 | Impact: 🔥🔥 | Effort: Medium

## Summary

Multi-touch recovery flow combining popup + email for maximum cart recovery.

## Why

Single touchpoint recovery has limits. Combining popup (immediate) + email (follow-up) increases recovery rates.

## Flow

```
1. Visitor adds to cart
2. Visitor triggers exit intent
3. Popup shows: "Wait! Get 10% off"
   ├─ User enters email → Captured as lead
   │   └─ Email 1 sent: "Complete your order" (immediate)
   │   └─ Email 2 sent: "Still interested?" (24 hours)
   │   └─ Email 3 sent: "Last chance: 15% off" (72 hours)
   │
   └─ User dismisses popup
       └─ No email sequence (no consent)
```

## Features

### Escalating Discounts
- [ ] Start with small discount (10%)
- [ ] Increase over time (15%, 20%)
- [ ] Configurable escalation

### Email Sequence
- [ ] Multi-email recovery sequence
- [ ] Configurable timing (1h, 24h, 72h)
- [ ] Smart stop on conversion
- [ ] Unsubscribe handling

### Unified Experience
- [ ] Popup and email use same branding
- [ ] Consistent discount codes
- [ ] Attribution across touchpoints

## Technical Design

### Recovery Sequence

```typescript
interface RecoverySequence {
  id: string,
  campaignId: string,
  steps: RecoveryStep[],
}

interface RecoveryStep {
  delay: number,  // minutes
  channel: "email" | "sms" | "whatsapp",
  discountPercent: number,
  templateId: string,
}
```

### Conversion Tracking
Track which step recovered the sale for optimization.

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/routes/api.cart.email-recovery.tsx`
- `app/domains/recovery/` (new)

