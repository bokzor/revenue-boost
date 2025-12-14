# Referral Popup / Share-to-Unlock

> Priority: P2 | Impact: 🔥🔥 | Effort: Medium

## Summary

Add referral popups that incentivize visitors to share offers with friends. "Share to unlock your discount" or "Refer a friend, both get 15% off." ONE and Wishpond offer referral campaigns that create viral loops.

## Why

- Viral loops drive free customer acquisition
- Referrals convert 3-5x better than cold traffic
- Complements existing gamification
- Creates ongoing engagement beyond single visit
- Medium effort: unique links + tracking

## User Stories

- As a merchant, I want customers to share my store with friends
- As a merchant, I want to reward both referrer and referred friend
- As a visitor, I want to earn rewards by sharing with friends
- As a merchant, I want to track referral conversions

## Implementation Tasks

### Core Referral System
- [ ] Generate unique referral links per visitor
- [ ] Track referral link clicks
- [ ] Attribute conversions to referrer
- [ ] Dual-sided rewards (referrer + referee)

### Referral Popup Types
- [ ] "Share to Unlock" - Share first, get discount
- [ ] "Refer a Friend" - Get reward when friend purchases
- [ ] "Milestone Rewards" - Bigger rewards for more referrals

### Sharing Mechanisms
- [ ] Copy link button
- [ ] Social share buttons (Facebook, Twitter, WhatsApp, Email)
- [ ] QR code for in-person sharing
- [ ] Pre-filled share messages

### Tracking & Attribution
- [ ] Referral link click tracking
- [ ] Cookie-based attribution (30-day window)
- [ ] First-touch vs last-touch attribution option
- [ ] Conversion tracking for referee purchases

### Reward Fulfillment
- [ ] Automatic discount code generation for referrer
- [ ] Email notification on successful referral
- [ ] Dashboard for referrer to track their referrals

## Technical Design

### Template Type

```typescript
export const TemplateTypeSchema = z.enum([
  // existing...
  "REFERRAL",
]);
```

### Referral Content Schema

```typescript
export const ReferralContentSchema = BaseContentConfigSchema.extend({
  // Headlines
  headline: z.string().default("Share & Save!"),
  subheadline: z.string().default("Give 15%, Get 15%"),
  
  // Referral Type
  referralType: z.enum([
    "share_to_unlock",    // Share first, instant reward
    "refer_to_earn",      // Reward on friend purchase
    "milestone",          // Multiple referral tiers
  ]).default("share_to_unlock"),
  
  // Rewards
  referrerReward: ReferralRewardSchema,
  refereeReward: ReferralRewardSchema,
  
  // Milestone config (if type = milestone)
  milestones: z.array(MilestoneSchema).optional(),
  
  // Share config
  shareMessage: z.string().default("Check out {store_name}! Use my link for {discount}% off"),
  shareChannels: z.array(z.enum(["copy", "facebook", "twitter", "whatsapp", "email"])),
  
  // Attribution
  attributionWindow: z.number().default(30), // days
  
  // Form
  emailPlaceholder: z.string().default("Your email"),
  submitButtonText: z.string().default("Get My Referral Link"),
});

export const ReferralRewardSchema = z.object({
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number(),
  minPurchase: z.number().optional(),
});

export const MilestoneSchema = z.object({
  referralCount: z.number(), // e.g., 3 referrals
  reward: ReferralRewardSchema,
  badgeName: z.string().optional(), // "Bronze Referrer"
});
```

### Data Model

```prisma
model Referral {
  id              String    @id @default(cuid())
  storeId         String
  campaignId      String
  
  // Referrer info
  referrerEmail   String
  referrerLeadId  String?
  referralCode    String    @unique // Short code: "ABC123"
  referralLink    String    // Full URL
  
  // Stats
  clicks          Int       @default(0)
  conversions     Int       @default(0)
  totalRevenue    Decimal   @default(0)
  
  // Rewards
  rewardsEarned   Json      // Array of earned rewards
  rewardsPending  Json      // Awaiting conversion
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  store     Store     @relation(fields: [storeId], references: [id])
  campaign  Campaign  @relation(fields: [campaignId], references: [id])
  referees  ReferralConversion[]
}

model ReferralConversion {
  id              String    @id @default(cuid())
  referralId      String
  refereeEmail    String
  orderId         String?
  orderTotal      Decimal?
  discountUsed    String?
  convertedAt     DateTime?
  
  createdAt       DateTime  @default(now())
  
  referral  Referral  @relation(fields: [referralId], references: [id])
}
```

### Referral Link Format

```typescript
// Generate unique referral code
const generateReferralCode = (): string => {
  return nanoid(8).toUpperCase(); // "ABC12XYZ"
};

// Referral link format
const referralLink = `https://${shop}/discount/${discountCode}?ref=${referralCode}`;
// Or via app proxy
const referralLink = `https://${shop}/apps/revenue-boost/r/${referralCode}`;
```

## UI Design

### Share-to-Unlock Popup

```
┌─────────────────────────────────────┐
│       🎁 Share & Save! 🎁           │
│                                     │
│   Give 15% to a friend              │
│   Get 15% for yourself              │
│                                     │
│   Your referral link:               │
│   ┌─────────────────────────────┐   │
│   │ shop.com/r/ABC123     [📋] │   │
│   └─────────────────────────────┘   │
│                                     │
│   Share via:                        │
│   [📘 Facebook] [🐦 Twitter]        │
│   [💬 WhatsApp] [📧 Email]          │
│                                     │
│   ✓ Link copied! Share to unlock    │
│     your 15% discount.              │
└─────────────────────────────────────┘
```

### Milestone Referral

```
┌─────────────────────────────────────┐
│     🏆 Referral Rewards 🏆          │
│                                     │
│   You've referred: 2 friends        │
│   ●●○○○                             │
│                                     │
│   Milestones:                       │
│   ✓ 1 referral = 10% off            │
│   ✓ 2 referrals = 15% off           │
│   ○ 3 referrals = 20% off           │
│   ○ 5 referrals = Free Shipping     │
│                                     │
│   [Share to earn more →]            │
└─────────────────────────────────────┘
```

## Related Files

- `app/domains/campaigns/types/campaign.ts` (schema)
- `app/domains/storefront/popups-new/ReferralPopup.tsx` (new)
- `app/domains/referrals/` (new domain)
- `app/routes/api.referrals.tsx` (new API)
- `prisma/schema.prisma` (Referral model)

## Success Metrics

- Referral link share rate
- Referral conversion rate
- Average referrals per user
- Viral coefficient (K-factor)
- Revenue from referred customers

