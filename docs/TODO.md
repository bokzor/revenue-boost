# Revenue Boost - Feature Roadmap & TODO

> Last updated: 2025-11-30

## Priority Legend
- **P0** - Critical / Next Sprint
- **P1** - High Priority / This Quarter
- **P2** - Medium Priority / Next Quarter
- **P3** - Future / Backlog

---

## ✅ Recently Completed

### [x] Email Marketing Integrations (via Shopify Native Sync)
**Status:** ✅ COMPLETE | **Shipped:** 2025-11-30

**How it works:**
When a lead signs up via a Revenue Boost popup, we create a Shopify Customer with:
- Email marketing consent (`emailMarketingConsent.marketingState: "SUBSCRIBED"`)
- Tags for segmentation (`source:revenue-boost-popup`, `campaign:{id}`, template type, etc.)

Any ESP that syncs Shopify customers (Klaviyo, Mailchimp, Omnisend, ActiveCampaign, etc.) automatically receives these leads with **zero configuration**.

**Benefits:**
- Works with ALL ESPs that have Shopify integrations
- No API key management in Revenue Boost
- Tags flow through for segmentation in ESP
- Merchants configure sync once in their ESP app

See `docs/INTEGRATIONS_PLAN.md` for full details and tag reference.

### [x] Campaign Duplication
**Status:** ✅ COMPLETE | **Shipped:** 2025-11-30

- Single campaign duplicate from dashboard table
- Bulk duplicate via multi-select
- Copies all config (content, design, targeting, discounts)
- New campaign created as DRAFT

### [x] Real Inventory API for Flash Sale
**Status:** ✅ COMPLETE | **Shipped:** 2025-11-30

- Shopify Inventory API integration for real stock levels
- Supports: variant IDs, product IDs, collection IDs
- "Only X left!" with actual inventory data
- Flash Sale template `inventory.mode: "real"` now functional

---

## 🚀 P0 - Critical Features

*No critical blockers remaining!*

---

## 🎯 P1 - High Priority

### [ ] Geo-Targeting & Localization
**Impact:** 🔥🔥🔥 | **Effort:** Medium

- [x] Country/region targeting (via Shopify `X-Country-Code` header) ✅
- [ ] Multi-language content variants per campaign
- [ ] Currency-aware discount display
- [ ] Timezone-aware scheduling

**Why:** Essential for international stores. Enables regional campaigns (Black Friday US-only).

### [ ] Low Stock Threshold Triggers
**Impact:** 🔥🔥 | **Effort:** Low

- [x] Inventory API integration for real stock levels ✅
- [x] "Only X left!" notifications with real data ✅
- [ ] Stock threshold triggers (show popup when inventory < N)
- [ ] Restock notifications

**Why:** +15-25% conversion per research. Real inventory now available.

### [ ] Campaign Scheduling Improvements
**Impact:** 🔥🔥 | **Effort:** Low

- [ ] Visual campaign calendar view
- [ ] Recurring campaigns ("Every Friday 4-6 PM")
- [ ] Auto-pause on end date (enforce existing fields)
- [ ] Time-zone aware display in UI

**Why:** Essential for seasonal promotions. Reduces manual management.

---

## 📈 P2 - Medium Priority

### [ ] Revenue Attribution Dashboard
**Impact:** 🔥🔥🔥 | **Effort:** Medium

- [ ] ROI calculator ("$5,240 revenue vs $29/month = 180x ROI")
- [ ] Attribution models (first-touch, last-touch)
- [ ] Comparative metrics ("25% above average")
- [ ] Cohort analysis for long-term impact

**Why:** Justifies pricing, reduces churn, drives upgrades.

### [ ] AI-Powered Copy Generation
**Impact:** 🔥🔥 | **Effort:** Medium

- [ ] Auto-generate headlines, CTAs, descriptions
- [ ] Suggest optimal timing from historical data
- [ ] Template recommendations based on goals
- [ ] A/B variant generation

**Why:** Reduces setup time, improves quality for non-experts.

### [ ] Advanced Discount Types
**Impact:** 🔥🔥 | **Effort:** Medium

- [ ] Tiered discounts ("Spend $100 = 15%, $200 = 25%")
- [ ] BOGO (Buy One Get One)
- [ ] Free gift with purchase
- [ ] First-time buyer exclusives
- [ ] Bundle discounts

**Why:** Matches competitor feature sets (Privy, Justuno).

### [ ] Cart Activity Social Proof
**Impact:** 🔥🔥 | **Effort:** Low

- [ ] "X people have this in cart" notifications
- [ ] Real-time cart activity tracking
- [ ] Add to cart event triggers

**Why:** Already planned in social proof TODO. High conversion impact.

---

## 💎 P3 - Future / Backlog

### [ ] Web Push Notifications
**Impact:** 🔥🔥🔥 | **Effort:** High

Inspired by Wisepops' multi-channel approach. Extends engagement beyond the current session.

- [ ] Web Push opt-in popup/banner
- [ ] Cart abandonment reminders via push
- [ ] Flash sale / promotional push campaigns
- [ ] Scheduled push notifications
- [ ] Push analytics (delivery, clicks, conversions)

**Why:** Re-engages visitors after they leave. Complements on-site popups. Key differentiator for retention.

### [ ] New Popup Templates
- [ ] Video popup (embed YouTube/Vimeo, product demos)
- [ ] Survey popup (multi-question feedback, NPS scores)
- [ ] Birthday Signup popup (collect DOB for birthday discounts)

### [ ] Custom Template Builder
- [ ] Drag-and-drop element editor
- [ ] Custom CSS injection
- [ ] Save campaign as reusable template
- [ ] Template sharing (for agencies)

### [ ] Embedded Widgets
- [ ] Inline banners (product pages, cart drawer)
- [ ] Sticky header/footer bars
- [ ] Embedded countdown timers
- [ ] Floating action buttons

### [ ] Webhook & API Access
- [ ] Outgoing webhooks on lead/conversion events
- [ ] REST API for campaign CRUD
- [ ] Zapier integration

### [ ] Exit Intent + Email Recovery Combo
- [ ] Multi-touch recovery flow
- [ ] Escalating discount offers
- [ ] Unified popup + email experience

### [ ] Shopify Segments Deep Integration
- [ ] Pre-built segment templates
- [ ] RFM-based targeting
- [ ] Segment performance comparison
- [ ] Real-time segment sync

---

## ⚡ Quick Wins

### [ ] Template Library Expansion
- [ ] Holiday templates (Halloween, Christmas, Valentine's)
- [ ] Industry templates (Fashion, Food, Beauty)
- [ ] Event templates (Product launch, Sale, Anniversary)

### [ ] Mobile Preview Mode
- [ ] Show mobile preview in admin editor

### [ ] Duplicate Campaign
- [ ] One-click campaign duplication for A/B testing

### [ ] Performance Alerts
- [ ] Email notifications on milestones
- [ ] Alerts for underperforming campaigns

---

## 📊 Prioritization Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| ESP Integrations | 🔥🔥🔥 | Medium | **P0** |
| Geo-Targeting | 🔥🔥🔥 | Medium | **P1** |
| Low Stock Alerts | 🔥🔥 | Low | **P1** |
| Campaign Scheduling | 🔥🔥 | Low | **P1** |
| Revenue Dashboard | 🔥🔥🔥 | Medium | **P2** |
| AI Copy Generation | 🔥🔥 | Medium | **P2** |
| Advanced Discounts | 🔥🔥 | Medium | **P2** |
| Custom Template Builder | 🔥🔥 | High | **P3** |
| Embedded Widgets | 🔥🔥 | High | **P3** |
| Webhook/API Access | 🔥 | Medium | **P3** |

