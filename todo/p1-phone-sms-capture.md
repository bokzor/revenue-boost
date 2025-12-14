# Phone/SMS Capture in Popups

> Priority: P1 | Impact: 🔥🔥🔥 | Effort: Low

## Summary

Add optional phone number capture to all lead-generation popups. SMS marketing has 98% open rates compared to 20% for email. Competitors like Wheelio, Privy, and ONE already capture phone numbers directly in popups.

## Why

- SMS marketing converts 3-5x better than email
- Phone field already exists in Lead model but isn't used
- Low effort to implement (UI + validation only)
- ESPs that sync with Shopify (Klaviyo, Postscript) auto-receive SMS consent

## User Stories

- As a merchant, I want to collect phone numbers alongside emails in my popups
- As a merchant, I want phone validation to ensure real numbers
- As a merchant, I want SMS consent tracked separately from email consent
- As a visitor, I want to optionally provide my phone for SMS offers

## Implementation Tasks

### Schema Updates
- [ ] Add `collectPhone` boolean to `BaseContentConfigSchema`
- [ ] Add `phoneRequired` boolean (optional vs required)
- [ ] Add `phonePlaceholder` string field
- [ ] Add `smsConsentText` string for legal compliance
- [ ] Add `smsConsent` boolean to Lead model (separate from email consent)

### UI Components
- [ ] Add phone input field to popup form templates
- [ ] International phone input with country code picker
- [ ] Phone validation (format, length)
- [ ] SMS consent checkbox with configurable text
- [ ] Mobile-friendly phone keyboard trigger (`type="tel"`)

### Backend
- [ ] Validate phone format server-side
- [ ] Store phone + SMS consent in Lead
- [ ] Add `sms-consent:true` tag to Shopify customer
- [ ] Track SMS opt-in events in analytics

### Admin UI
- [ ] Toggle "Collect Phone Number" in content editor
- [ ] Phone placeholder text input
- [ ] SMS consent text editor
- [ ] Preview with phone field

## Technical Design

### Schema Addition

```typescript
// In BaseContentConfigSchema
collectPhone: z.boolean().default(false),
phoneRequired: z.boolean().default(false),
phonePlaceholder: z.string().default("Your phone number"),
smsConsentText: z.string().default("I agree to receive SMS marketing messages"),
```

### Lead Model Update

```prisma
model Lead {
  // existing fields...
  phone             String?
  smsConsent        Boolean   @default(false)
  smsConsentedAt    DateTime?
  smsConsentText    String?   // TCPA: exact consent text
}
```

### Phone Validation

```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const validatePhone = (phone: string, country?: string): boolean => {
  try {
    return isValidPhoneNumber(phone, country);
  } catch {
    return false;
  }
};
```

## Competitive Reference

| Competitor | Phone Capture | SMS Consent | Validation |
|------------|---------------|-------------|------------|
| Wheelio | ✅ Yes | ✅ Yes | ✅ Real-time |
| Privy | ✅ Yes | ✅ Yes | ✅ Yes |
| ONE | ✅ Yes | ✅ Yes | ✅ Yes |
| **Revenue Boost** | ❌ No | ❌ No | ❌ No |

## Legal Compliance (TCPA/GDPR)

- Must have explicit SMS consent checkbox (not pre-checked)
- Must store exact consent text and timestamp
- Must provide opt-out mechanism info
- Default consent text: "By providing your phone number, you agree to receive marketing text messages. Msg & data rates may apply. Reply STOP to unsubscribe."

## Dependencies

- `libphonenumber-js` for phone parsing/validation
- No external SMS API needed (ESPs handle sending)

## Related Files

- `app/domains/campaigns/types/campaign.ts` (schema)
- `app/domains/storefront/popups-new/` (popup components)
- `app/routes/api.leads.submit.tsx` (lead submission)
- `prisma/schema.prisma` (Lead model)

## Success Metrics

- % of leads with phone numbers captured
- SMS consent rate vs email consent rate
- Conversion rate for SMS-captured leads

