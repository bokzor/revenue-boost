# Birthday Capture in Popups

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Add optional birthday (month/day) capture to lead-generation popups. Birthday campaigns have 2-3x higher conversion rates. Competitors like Tada and Wheelio offer this for automated birthday discount programs.

## Why

- Birthday emails have 481% higher transaction rate (Experian)
- Simple addition to existing form templates
- Privacy-friendly: only month/day needed (no year)
- ESPs can automate birthday campaigns with this data
- Low effort: just a date picker UI

## User Stories

- As a merchant, I want to collect customer birthdays for personalized campaigns
- As a merchant, I want birthday data synced to my ESP for automation
- As a visitor, I want to share my birthday to receive special offers
- As a merchant, I want privacy-friendly birthday collection (no full DOB)

## Implementation Tasks

### Schema Updates
- [ ] Add `collectBirthday` boolean to `BaseContentConfigSchema`
- [ ] Add `birthdayRequired` boolean
- [ ] Add `birthdayLabel` string field
- [ ] Add `birthday` field to Lead model (MM-DD format)

### UI Components
- [ ] Month/Day picker (no year for privacy)
- [ ] Mobile-friendly date selection
- [ ] Optional incentive text ("Get a special gift on your birthday!")
- [ ] Preview in admin

### Backend
- [ ] Store birthday in Lead (format: "MM-DD")
- [ ] Add `birthday:MM-DD` tag to Shopify customer
- [ ] Validate date format server-side

### Admin UI
- [ ] Toggle "Collect Birthday" in content editor
- [ ] Birthday label/prompt customization
- [ ] Incentive text editor
- [ ] Preview with birthday field

## Technical Design

### Schema Addition

```typescript
// In BaseContentConfigSchema
collectBirthday: z.boolean().default(false),
birthdayRequired: z.boolean().default(false),
birthdayLabel: z.string().default("Birthday (for special offers)"),
birthdayIncentiveText: z.string().optional(), // "Get 20% off on your birthday!"
```

### Lead Model Update

```prisma
model Lead {
  // existing fields...
  birthday          String?   // Format: "MM-DD" (e.g., "12-25")
}
```

### Birthday Picker Component

```typescript
interface BirthdayPickerProps {
  value?: string; // "MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

// Month options
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  // ...
];

// Day options (1-31)
const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1),
}));
```

### ESP Tag Format

```typescript
// Tags added to Shopify customer
const birthdayTags = [
  `birthday:${birthday}`,           // "birthday:12-25"
  `birthday-month:${month}`,        // "birthday-month:12"
  "has-birthday",                   // For segmentation
];
```

## UI Design

### Popup Form Addition

```
┌─────────────────────────────────────┐
│  🎉 Join for 10% Off!               │
│                                     │
│  Email: [___________________]       │
│                                     │
│  Birthday (optional):               │
│  [Month ▼] [Day ▼]                  │
│  🎂 Get a special gift on your      │
│     birthday!                       │
│                                     │
│  [Subscribe]                        │
└─────────────────────────────────────┘
```

### Admin Configuration

```
Birthday Collection
├── ☑️ Collect birthday
├── Required: ○ Optional ● Required
├── Label: [Birthday (for special offers)]
└── Incentive text: [Get 20% off on your birthday!]
```

## ESP Automation Example (Klaviyo)

With birthday tag synced to Shopify customer:

1. Create segment: Customers where `birthday-month` = current month
2. Create flow: "Birthday Month Celebration"
3. Trigger: 1st of birth month
4. Send birthday discount email

## Privacy Considerations

- Only collect month/day (no year = no age data)
- Store minimal data (MM-DD string only)
- Clear opt-in with purpose explanation
- GDPR compliant: legitimate interest for marketing

## Related Files

- `app/domains/campaigns/types/campaign.ts` (schema)
- `app/domains/storefront/popups-new/` (popup components)
- `app/domains/storefront/shared/BirthdayPicker.tsx` (new component)
- `app/routes/api.leads.submit.tsx` (lead submission)
- `prisma/schema.prisma` (Lead model)

## Success Metrics

- % of leads with birthday captured
- Birthday campaign revenue attribution
- Birthday email open/click rates
- Customer retention improvement

