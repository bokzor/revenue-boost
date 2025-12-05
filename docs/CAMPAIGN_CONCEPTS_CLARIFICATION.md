# Campaign Concepts Clarification

## The Problem: Mixed Concepts

We're currently mixing three distinct concepts in the codebase:

```
GOAL (Why?) ───────────────────────────────────────────────────────────
  "What business outcome do we want?"
  
TEMPLATE (What?) ──────────────────────────────────────────────────────
  "What does the popup look like and do?"
  
TRIGGER (When?) ───────────────────────────────────────────────────────
  "When should this popup appear?"
```

**Current confusion:** `EXIT_INTENT` is listed as a template type, but it's actually a trigger!

---

## Current State in Codebase

### Goals (Correct ✅)
```typescript
// app/domains/campaigns/types/campaign.ts
export const CampaignGoalSchema = z.enum([
  "NEWSLETTER_SIGNUP",   // Capture emails
  "INCREASE_REVENUE",    // Drive sales
  "ENGAGEMENT",          // General engagement
]);
```

### Template Types (Mixed ❌)
```typescript
export const TemplateTypeSchema = z.enum([
  "NEWSLETTER",          // ✅ Template - email capture form
  "SPIN_TO_WIN",         // ✅ Template - spinning wheel game
  "FLASH_SALE",          // ✅ Template - urgency sale banner
  "FREE_SHIPPING",       // ✅ Template - shipping threshold bar
  "EXIT_INTENT",         // ❌ This is a TRIGGER, not a template!
  "CART_ABANDONMENT",    // ⚠️ Mix of trigger (cart left) + template
  "PRODUCT_UPSELL",      // ✅ Template - product recommendations
  "SOCIAL_PROOF",        // ✅ Template - activity notifications
  "COUNTDOWN_TIMER",     // ✅ Template - countdown display
  "SCRATCH_CARD",        // ✅ Template - scratch game
  "ANNOUNCEMENT",        // ✅ Template - info banner
]);
```

### Triggers (Spread Across Config)
Currently in `EnhancedTriggersConfigSchema`:
- Exit intent detection
- Time delay
- Scroll percentage  
- Idle time
- Page visit count
- Cart changes
- etc.

---

## Proposed Clean Model

### 1. GOALS - Business Outcomes

| Goal | Description | Success Metric |
|------|-------------|----------------|
| `NEWSLETTER_SIGNUP` | Capture email addresses | Lead count |
| `INCREASE_REVENUE` | Drive immediate sales | Revenue, AOV |
| `CART_RECOVERY` | Recover abandoned carts | Recovery rate |
| `ENGAGEMENT` | General interaction | Click rate |

### 2. TEMPLATES - Visual/Functional Types

| Template | Description | Has Email Capture? | Has Products? |
|----------|-------------|:------------------:|:-------------:|
| `NEWSLETTER` | Email signup form | ✅ | ❌ |
| `SPIN_TO_WIN` | Wheel game + email | ✅ | ❌ |
| `SCRATCH_CARD` | Scratch game + email | ✅ | ❌ |
| `FLASH_SALE` | Urgency banner | Optional | Optional |
| `COUNTDOWN_TIMER` | Timer display | ❌ | ❌ |
| `CART_REMINDER` | Cart recovery | Optional | ✅ (cart items) |
| `PRODUCT_UPSELL` | Recommendations | ❌ | ✅ |
| `FREE_SHIPPING_BAR` | Progress bar | ❌ | ❌ |
| `SOCIAL_PROOF` | Activity toast | ❌ | ❌ |
| `ANNOUNCEMENT` | Info banner | ❌ | ❌ |

**Note:** `EXIT_INTENT` removed - it's a trigger, not a template!

### 3. TRIGGERS - Display Conditions

| Trigger | Description |
|---------|-------------|
| `exit_intent` | Mouse leaves viewport |
| `time_delay` | After X seconds |
| `scroll_depth` | After scrolling X% |
| `idle_time` | User inactive for X seconds |
| `page_views` | After X page views |
| `cart_update` | Item added/removed from cart |
| `cart_abandonment` | User tries to leave with items in cart |
| `click_element` | User clicks specific element |
| `page_match` | On specific pages |

---

## How They Combine

A campaign is: **GOAL + TEMPLATE + TRIGGER(S) + DISCOUNT**

### Examples:

```
Campaign: "Welcome Popup"
├── Goal: NEWSLETTER_SIGNUP
├── Template: NEWSLETTER
├── Triggers: [time_delay: 5s, exit_intent]
└── Discount: 10% off (basic)

Campaign: "Flash Friday Sale"  
├── Goal: INCREASE_REVENUE
├── Template: FLASH_SALE
├── Triggers: [page_match: /collections/*, time_delay: 3s]
└── Discount: Tiered (Spend $50→15%, $100→25%)

Campaign: "Spin for Prize"
├── Goal: NEWSLETTER_SIGNUP
├── Template: SPIN_TO_WIN
├── Triggers: [scroll_depth: 50%, exit_intent]
└── Discount: Per-segment prizes (basic + free gift)

Campaign: "Don't Leave Your Cart"
├── Goal: CART_RECOVERY
├── Template: CART_REMINDER
├── Triggers: [cart_abandonment, exit_intent]
└── Discount: 15% off (basic)
```

---

## Discount Strategy Based on Goal

Now discounts make more sense when tied to GOAL:

| Goal | Recommended Discounts | Why |
|------|----------------------|-----|
| `NEWSLETTER_SIGNUP` | Basic only (%, $, Free Ship) | Simple value exchange for email |
| `INCREASE_REVENUE` | All (Basic + Tiered + BOGO + Free Gift) | Maximize sales tactics |
| `CART_RECOVERY` | Basic + Tiered | Incentivize completion, maybe add more |
| `ENGAGEMENT` | Basic + Free Gift | Simple rewards |

---

## What Needs to Change?

### 1. Rename/Refactor Template Types

```typescript
// BEFORE (mixed)
export const TemplateTypeSchema = z.enum([
  "NEWSLETTER",
  "EXIT_INTENT",        // ❌ Remove - it's a trigger
  "CART_ABANDONMENT",   // ⚠️ Rename to CART_REMINDER
  // ...
]);

// AFTER (clean)
export const TemplateTypeSchema = z.enum([
  "NEWSLETTER",
  "SPIN_TO_WIN",
  "SCRATCH_CARD",
  "FLASH_SALE",
  "COUNTDOWN_TIMER",
  "CART_REMINDER",      // Renamed from CART_ABANDONMENT
  "PRODUCT_UPSELL",
  "FREE_SHIPPING_BAR",  // Renamed from FREE_SHIPPING
  "SOCIAL_PROOF",
  "ANNOUNCEMENT",
]);
```

### 2. Add CART_RECOVERY Goal

```typescript
export const CampaignGoalSchema = z.enum([
  "NEWSLETTER_SIGNUP",
  "INCREASE_REVENUE",
  "CART_RECOVERY",      // NEW
  "ENGAGEMENT",
]);
```

### 3. Migrate EXIT_INTENT to Trigger

Campaigns currently using `templateType: "EXIT_INTENT"` should become:
- `templateType: "NEWSLETTER"`
- `triggers: { exitIntent: { enabled: true } }`

---

## Impact on Discount Components

With this clean model, the discount component becomes simpler:

```tsx
<UnifiedDiscountConfig
  discountConfig={discountConfig}
  onChange={onChange}
  campaignGoal={goal}  // Determines available discount strategies
/>

// Internal logic:
const GOAL_DISCOUNT_STRATEGIES = {
  NEWSLETTER_SIGNUP: ["basic"],
  INCREASE_REVENUE: ["basic", "tiered", "bogo", "free_gift"],
  CART_RECOVERY: ["basic", "tiered"],
  ENGAGEMENT: ["basic", "free_gift"],
};
```

---

## Questions to Resolve

1. **Should we migrate EXIT_INTENT campaigns?**
   - Option A: Migrate existing data to use NEWSLETTER template + exit_intent trigger
   - Option B: Keep EXIT_INTENT as alias for NEWSLETTER with default trigger

2. **Is CART_ABANDONMENT the template or the trigger?**
   - The popup (showing cart items) is the template → `CART_REMINDER`
   - The condition (leaving with cart items) is the trigger → `cart_abandonment`

3. **Do we need a migration for existing campaigns?**

