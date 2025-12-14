# Notification Feed / On-Site Inbox

> Priority: P2 | Impact: 🔥🔥 | Effort: High

## Summary

Add a persistent notification feed (on-site inbox) as an alternative to popups. A floating icon opens a slide-out panel showing recent offers, personalized messages, and store updates. Wisepops offers this as a key differentiator for "popup fatigue" reduction.

## Why

- Reduces popup fatigue while maintaining engagement
- Persistent presence keeps offers visible
- Visitors can browse at their own pace
- Complements popups with different UX
- Works well for stores with frequent updates

## User Stories

- As a merchant, I want a less intrusive way to show offers
- As a merchant, I want visitors to have a place to see all current promotions
- As a visitor, I want to browse offers without being interrupted by popups
- As a merchant, I want to combine notification feed with popups strategically

## Implementation Tasks

### Core Feed System
- [ ] Add `NOTIFICATION_FEED` display type
- [ ] Floating launcher button (customizable position, icon)
- [ ] Slide-out panel with notification list
- [ ] Notification types: offers, announcements, product alerts

### Notification Types
- [ ] Discount offers
- [ ] New product announcements
- [ ] Flash sale alerts
- [ ] Back-in-stock notifications
- [ ] Personalized recommendations
- [ ] Cart reminders

### Persistence & State
- [ ] Remember dismissed notifications
- [ ] Unread count badge
- [ ] Session persistence
- [ ] Cross-session persistence (optional)

### Admin Configuration
- [ ] Feed appearance settings
- [ ] Notification management
- [ ] Priority ordering
- [ ] Expiration dates

## Technical Design

### Notification Feed Schema

```typescript
export const NotificationFeedConfigSchema = z.object({
  enabled: z.boolean().default(false),
  
  // Launcher button
  launcher: z.object({
    position: z.enum(["bottom-left", "bottom-right"]).default("bottom-right"),
    icon: z.enum(["bell", "gift", "mail", "custom"]).default("bell"),
    customIcon: z.string().optional(),
    backgroundColor: z.string().default("#000000"),
    iconColor: z.string().default("#ffffff"),
    showUnreadBadge: z.boolean().default(true),
  }),
  
  // Panel appearance
  panel: z.object({
    width: z.number().default(360), // pixels
    maxHeight: z.number().default(500),
    headerText: z.string().default("Latest Updates"),
    emptyStateText: z.string().default("No notifications yet"),
  }),
  
  // Behavior
  autoOpen: z.boolean().default(false), // Auto-open on first visit
  autoOpenDelay: z.number().default(5), // seconds
  persistDismissed: z.boolean().default(true),
});
```

### Notification Item Schema

```typescript
export const FeedNotificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "discount_offer",
    "announcement",
    "product_alert",
    "flash_sale",
    "back_in_stock",
    "recommendation",
    "cart_reminder",
  ]),
  
  // Content
  title: z.string(),
  message: z.string(),
  image: z.string().optional(),
  
  // Action
  ctaText: z.string().optional(),
  ctaAction: z.enum(["link", "apply_discount", "add_to_cart", "open_popup"]),
  ctaTarget: z.string().optional(), // URL or popup ID
  
  // Discount (if applicable)
  discountCode: z.string().optional(),
  discountValue: z.string().optional(), // "15% OFF" or "$10 OFF"
  
  // Scheduling
  priority: z.number().default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  
  // Targeting
  showOnPages: z.array(z.string()).optional(),
  hideOnPages: z.array(z.string()).optional(),
});
```

### Data Model

```prisma
model FeedNotification {
  id          String    @id @default(cuid())
  storeId     String
  campaignId  String?   // Optional link to campaign
  
  type        String
  title       String
  message     String
  image       String?
  
  ctaText     String?
  ctaAction   String
  ctaTarget   String?
  
  discountCode  String?
  discountValue String?
  
  priority    Int       @default(0)
  startDate   DateTime?
  endDate     DateTime?
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  store       Store     @relation(fields: [storeId], references: [id])
  
  @@index([storeId, isActive])
  @@index([startDate, endDate])
}
```

## UI Design

### Launcher Button

```
                          ┌───┐
                          │🔔│ ← Floating button
                          │ 3│ ← Unread badge
                          └───┘
```

### Feed Panel (Open)

```
┌─────────────────────────────────┐
│  📬 Latest Updates        [✕]  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ 🎉 Flash Sale!          │    │
│  │ 40% off everything      │    │
│  │ Ends in 2 hours         │    │
│  │ [Shop Now]              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💝 New Arrivals         │    │
│  │ Check out our spring    │    │
│  │ collection!             │    │
│  │ [View Collection]       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔔 Back in Stock!       │    │
│  │ [Product Image]         │    │
│  │ Best Seller Hoodie      │    │
│  │ [Add to Cart]           │    │
│  └─────────────────────────┘    │
│                                 │
│  ─────────────────────────────  │
│  You're all caught up! 🎉      │
└─────────────────────────────────┘
```

## Integration Points

### With Existing Campaigns
- Campaigns can optionally appear in feed
- Checkbox: "Also show in notification feed"
- Syncs discount codes and content

### With Social Proof
- Recent purchases can appear in feed
- "10 people bought this today"

### With Popups
- Feed can trigger popups
- "Click to see full offer" opens popup

## Related Files

- `app/domains/notification-feed/` (new domain)
- `app/domains/storefront/notification-feed/` (new)
- `extensions/storefront-popup/` (add feed component)
- `app/routes/api.notification-feed.tsx` (new API)

## Success Metrics

- Feed open rate
- Notification click-through rate
- Conversions from feed
- A/B test: Feed vs popup engagement
- Return visitor engagement

