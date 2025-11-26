# Revenue Boost - Feature Roadmap & TODO

> Last updated: 2025-11-26

## Priority Legend
- **P0** - Critical / Next Sprint
- **P1** - High Priority / This Quarter
- **P2** - Medium Priority / Next Quarter
- **P3** - Future / Backlog

---

## 🚀 P0 - Critical Features

### [ ] Email Marketing Integrations
**Impact:** 🔥🔥🔥 | **Effort:** Medium

Native integrations with popular ESPs:
- [ ] **Klaviyo** - OAuth flow + subscriber sync with tags
- [ ] **Mailchimp** - OAuth flow + list/audience sync
- [ ] **Omnisend** - API integration
- [ ] **ActiveCampaign** - API integration

**Why:** Leads without ESP sync have limited value. Table stakes for popup apps.

**Implementation Notes:**
- Extend `Lead` submission to sync with configured ESP
- Add ESP config to Store settings
- Support tag mapping from campaign metadata

---

## 🎯 P1 - High Priority

### [ ] Geo-Targeting & Localization
**Impact:** 🔥🔥🔥 | **Effort:** Medium

- [ ] Country/region targeting (IP-based via MaxMind GeoLite2)
- [ ] Multi-language content variants per campaign
- [ ] Currency-aware discount display
- [ ] Timezone-aware scheduling

**Why:** Essential for international stores. Enables regional campaigns (Black Friday US-only).

### [ ] Low Stock & Urgency Alerts
**Impact:** 🔥🔥 | **Effort:** Low

- [ ] Inventory API integration for real stock levels
- [ ] "Only X left!" notifications
- [ ] Stock threshold triggers (show popup when inventory < N)
- [ ] Restock notifications

**Why:** +15-25% conversion per research. Already in social proof roadmap.

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

