# Real-Time Email Validation

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Validate email addresses in real-time during popup submission to prevent fake, disposable, and invalid emails. Justuno and Wheelio offer this to reduce wasted leads and improve ESP deliverability.

## Why

- 20-30% of email signups can be fake or invalid
- Invalid emails hurt sender reputation and deliverability
- Disposable emails (mailinator, tempmail) never convert
- Reduces merchant frustration with bad lead quality
- Low effort: simple API integration

## User Stories

- As a merchant, I want to block disposable email addresses
- As a merchant, I want to verify email format and domain validity
- As a visitor, I want helpful error messages for typos (e.g., "Did you mean gmail.com?")
- As a merchant, I want to see validation stats in my dashboard

## Implementation Tasks

### Client-Side Validation
- [ ] Real-time format validation (regex)
- [ ] Typo detection ("gmial.com" → "Did you mean gmail.com?")
- [ ] Show validation status indicator (✓ or ✗)

### Server-Side Validation
- [ ] Integrate with email validation API
- [ ] Check: format, domain MX records, disposable detection
- [ ] Block submission if validation fails
- [ ] Configurable strictness levels

### Admin Configuration
- [ ] Enable/disable validation per campaign
- [ ] Strictness level: Basic (format) | Standard (+ domain) | Strict (+ disposable block)
- [ ] Whitelist specific domains (for B2B)
- [ ] View validation rejection stats

### Analytics
- [ ] Track rejected emails by reason
- [ ] Show validation quality metrics
- [ ] Alert on high rejection rates

## Technical Design

### Email Validation Schema

```typescript
export const EmailValidationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strictnessLevel: z.enum(["basic", "standard", "strict"]).default("standard"),
  blockDisposable: z.boolean().default(true),
  suggestCorrections: z.boolean().default(true),
  whitelistedDomains: z.array(z.string()).default([]),
});
```

### Validation Response

```typescript
interface EmailValidationResult {
  valid: boolean;
  email: string;
  reason?: "invalid_format" | "invalid_domain" | "disposable" | "no_mx_record";
  suggestion?: string; // "Did you mean john@gmail.com?"
  isDisposable: boolean;
  isFreeProvider: boolean;
}
```

### API Integration Options

| Provider | Price | Features | Recommendation |
|----------|-------|----------|----------------|
| ZeroBounce | $0.008/email | Full validation, AI scoring | Best overall |
| Kickbox | $0.01/email | Fast, reliable | Good alternative |
| NeverBounce | $0.008/email | Bulk + real-time | Good for volume |
| Abstract API | Free tier | Basic validation | Good for MVP |

### Client-Side Typo Detection

```typescript
const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

function suggestDomainCorrection(email: string): string | null {
  const [local, domain] = email.split("@");
  if (!domain) return null;
  
  // Levenshtein distance for typo detection
  for (const correct of COMMON_DOMAINS) {
    if (levenshtein(domain, correct) <= 2 && domain !== correct) {
      return `${local}@${correct}`;
    }
  }
  return null;
}
```

## Validation Flow

```
User enters email
    ↓
Client-side format check (instant)
    ↓ (valid format)
Show loading indicator
    ↓
Server-side API validation
    ↓
├── Valid → Proceed with submission
├── Invalid format → "Please enter a valid email"
├── No MX record → "This email domain doesn't exist"
├── Disposable → "Please use a permanent email address"
└── Typo detected → "Did you mean john@gmail.com?"
```

## Configuration UI

```
Email Validation
├── ☑️ Enable email validation
├── Strictness Level: [Standard ▼]
│   ├── Basic: Format only
│   ├── Standard: Format + Domain + MX
│   └── Strict: + Block disposable emails
├── ☑️ Suggest corrections for typos
└── Whitelisted domains: [Add domain...]
```

## Related Files

- `app/domains/campaigns/types/campaign.ts` (config schema)
- `app/routes/api.leads.submit.tsx` (validation logic)
- `app/lib/email-validation/` (new service)
- `app/domains/storefront/popups-new/` (UI feedback)

## Success Metrics

- Reduction in bounce rate for captured emails
- % of submissions blocked by validation
- ESP deliverability improvement
- Lead-to-customer conversion rate improvement

