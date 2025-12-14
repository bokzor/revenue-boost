# Slot Machine Gamification

> Priority: P2 | Impact: 🔥🔥 | Effort: Medium

## Summary

Add a slot machine (3-reel) game as an alternative to spin-to-win and scratch cards. Wheelio pioneered this format and it provides variety for merchants who want fresh engagement mechanics.

## Why

- Expands gamification library beyond spin wheel
- Different visual appeal attracts different audiences
- Same backend logic as existing gamification
- Competitive feature parity with Wheelio
- Medium effort: reuse existing prize/discount infrastructure

## User Stories

- As a merchant, I want a slot machine game to capture emails
- As a merchant, I want to configure winning combinations and prizes
- As a visitor, I want an exciting slot machine experience

## Implementation Tasks

### Template Setup
- [ ] Add `SLOT_MACHINE` to TemplateTypeSchema
- [ ] Create `SlotMachineContentSchema`
- [ ] Define reel symbols and combinations
- [ ] Reuse existing discount/prize system

### Slot Machine UI
- [ ] 3-reel slot machine animation
- [ ] Configurable symbols (7s, fruits, store icons, custom)
- [ ] Spin button with anticipation build-up
- [ ] Win/lose animations
- [ ] Prize reveal overlay

### Prize Logic
- [ ] Define winning combinations (3 matching, 2 matching, etc.)
- [ ] Map combinations to prizes/discounts
- [ ] Same probability system as spin-to-win
- [ ] Guaranteed win option

### Admin Configuration
- [ ] Symbol picker (preset or custom upload)
- [ ] Combination → Prize mapping
- [ ] Win probability settings
- [ ] Preview slot machine

## Technical Design

### Slot Machine Content Schema

```typescript
export const SlotMachineContentSchema = BaseContentConfigSchema.extend({
  // Headlines
  headline: z.string().default("Try Your Luck!"),
  subheadline: z.string().default("Spin the reels for a chance to win"),
  
  // Reel Configuration
  reelSymbols: z.array(SlotSymbolSchema).min(3).max(8),
  reelCount: z.literal(3).default(3), // Future: 5 reels
  
  // Winning Combinations
  winningCombinations: z.array(WinningCombinationSchema),
  
  // Animation
  spinDuration: z.number().default(3), // seconds
  showNearMiss: z.boolean().default(true), // Adds excitement
  
  // Results
  winMessage: z.string().default("🎰 JACKPOT! You won {prize}!"),
  loseMessage: z.string().default("So close! Try again next time."),
  
  // Form fields
  emailPlaceholder: z.string().default("Enter your email to spin"),
  submitButtonText: z.string().default("SPIN!"),
});

export const SlotSymbolSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(), // Symbol image URL or emoji
  value: z.number(), // For scoring/weighting
});

export const WinningCombinationSchema = z.object({
  id: z.string(),
  name: z.string(), // "Jackpot", "Big Win", "Small Win"
  pattern: z.array(z.string()), // Symbol IDs ["7", "7", "7"]
  matchType: z.enum(["exact", "any_order", "any_two"]),
  prize: PrizeConfigSchema, // Reuse from spin-to-win
  probability: z.number().min(0).max(1),
});
```

### Default Symbols

```typescript
const DEFAULT_SLOT_SYMBOLS = [
  { id: "seven", name: "Lucky 7", image: "7️⃣", value: 100 },
  { id: "diamond", name: "Diamond", image: "💎", value: 75 },
  { id: "cherry", name: "Cherry", image: "🍒", value: 50 },
  { id: "lemon", name: "Lemon", image: "🍋", value: 25 },
  { id: "bar", name: "BAR", image: "📊", value: 40 },
  { id: "bell", name: "Bell", image: "🔔", value: 35 },
];
```

### Animation Approach

```typescript
// CSS keyframe animation for each reel
const reelAnimation = {
  // Staggered stop times for anticipation
  reel1StopDelay: 1000, // ms
  reel2StopDelay: 2000,
  reel3StopDelay: 3000,
  
  // Near-miss: Show winning symbol just above/below line
  nearMissEnabled: true,
  nearMissProbability: 0.3, // 30% of losses show near-miss
};
```

## UI Design

### Slot Machine Popup

```
┌─────────────────────────────────────┐
│         🎰 LUCKY SPIN 🎰            │
│    Spin to win exclusive discounts! │
│                                     │
│    ┌─────┬─────┬─────┐              │
│    │  🍒 │  💎 │  7️⃣  │  ← Visible  │
│    ├─────┼─────┼─────┤  ← WIN LINE  │
│    │  🍋 │  🍒 │  🔔 │  ← Visible   │
│    └─────┴─────┴─────┘              │
│                                     │
│  Email: [_____________________]     │
│                                     │
│         [🎰 PULL LEVER 🎰]          │
│                                     │
│  3x 7️⃣ = 50% OFF | 3x 💎 = 30% OFF  │
│  3x 🍒 = 20% OFF | Any 2 = 10% OFF  │
└─────────────────────────────────────┘
```

### Win State

```
┌─────────────────────────────────────┐
│         🎉 JACKPOT! 🎉              │
│                                     │
│    ┌─────┬─────┬─────┐              │
│    │  7️⃣  │  7️⃣  │  7️⃣  │  ✨✨✨    │
│    └─────┴─────┴─────┘              │
│                                     │
│     You won 50% OFF!                │
│     Code: LUCKY50                   │
│                                     │
│     [Copy Code & Shop Now]          │
└─────────────────────────────────────┘
```

## Reuse From Spin-to-Win

- Prize/discount configuration
- Probability engine
- Discount code generation
- Lead capture flow
- Analytics tracking

## Related Files

- `app/domains/campaigns/types/campaign.ts` (add schema)
- `app/domains/storefront/popups-new/SlotMachinePopup.tsx` (new)
- `app/domains/campaigns/components/content-sections/SlotMachineContent.tsx` (new)
- `app/domains/storefront/shared/SlotMachineReels.tsx` (new component)

## Success Metrics

- Slot machine vs spin-to-win conversion comparison
- Email capture rate
- Engagement time (slot anticipation)
- Prize redemption rate

