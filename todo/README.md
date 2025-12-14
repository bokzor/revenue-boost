# Revenue Boost - Feature Roadmap

> Last updated: 2024-12-14

This directory contains detailed feature specifications for Revenue Boost. Each feature has its own file with user stories, technical design, and implementation tasks.

## Priority Legend

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Critical blocker | This week |
| **P1** | High priority | This quarter |
| **P2** | Medium priority | Next quarter |
| **P3** | Future / Backlog | TBD |

---

## ✅ Completed Features

See [`completed/`](./completed/) for shipped features.

| Feature | Shipped | File |
|---------|---------|------|
| ESP Integrations (Shopify Native Sync) | 2025-11-30 | [esp-integrations.md](./completed/esp-integrations.md) |
| Campaign Duplication | 2025-11-30 | [campaign-duplication.md](./completed/campaign-duplication.md) |
| Real Inventory API for Flash Sale | 2025-11-30 | [real-inventory-api.md](./completed/real-inventory-api.md) |

---

## 🚀 P0 - Critical

*No critical blockers remaining!*

---

## 🎯 P1 - High Priority (This Quarter)

| Feature | Impact | Effort | File |
|---------|--------|--------|------|
| WhatsApp Cart Recovery | 🔥🔥🔥 | High | [p1-whatsapp-cart-recovery.md](./p1-whatsapp-cart-recovery.md) |
| Geo-Targeting & Localization | 🔥🔥🔥 | Medium | [p1-geo-targeting.md](./p1-geo-targeting.md) |
| Low Stock Threshold Triggers | 🔥🔥 | Low | [p1-low-stock-alerts.md](./p1-low-stock-alerts.md) |
| Campaign Scheduling | 🔥🔥 | Low | [p1-campaign-scheduling.md](./p1-campaign-scheduling.md) |
| Onboarding Wizard | 🔥🔥🔥 | Medium | [p1-onboarding-wizard.md](./p1-onboarding-wizard.md) |
| Contextual Tooltips | 🔥🔥 | Low | [p1-contextual-tooltips.md](./p1-contextual-tooltips.md) |
| Empty State Guidance | 🔥🔥 | Low | [p1-empty-state-guidance.md](./p1-empty-state-guidance.md) |

---

## 📈 P2 - Medium Priority (Next Quarter)

| Feature | Impact | Effort | File |
|---------|--------|--------|------|
| Revenue Attribution Dashboard | 🔥🔥🔥 | Medium | [p2-revenue-dashboard.md](./p2-revenue-dashboard.md) |
| AI-Powered Copy Generation | 🔥🔥 | Medium | [p2-ai-copy-generation.md](./p2-ai-copy-generation.md) |
| Advanced Discount Types | 🔥🔥 | Medium | [p2-advanced-discounts.md](./p2-advanced-discounts.md) |
| Cart Activity Social Proof | 🔥🔥 | Low | [p2-cart-social-proof.md](./p2-cart-social-proof.md) |
| Help Center Link | 🔥 | Low | [p2-help-center.md](./p2-help-center.md) |
| Video Tutorials | 🔥🔥 | Medium | [p2-video-tutorials.md](./p2-video-tutorials.md) |

---

## 💎 P3 - Future / Backlog

| Feature | Impact | Effort | File |
|---------|--------|--------|------|
| Web Push Notifications | 🔥🔥🔥 | High | [p3-web-push-notifications.md](./p3-web-push-notifications.md) |
| New Popup Templates | 🔥🔥 | Medium | [p3-new-popup-templates.md](./p3-new-popup-templates.md) |
| Custom Template Builder | 🔥🔥 | High | [p3-custom-template-builder.md](./p3-custom-template-builder.md) |
| Embedded Widgets | 🔥🔥 | High | [p3-embedded-widgets.md](./p3-embedded-widgets.md) |
| Webhook & API Access | 🔥 | Medium | [p3-webhook-api.md](./p3-webhook-api.md) |
| Exit Intent + Email Combo | 🔥🔥 | Medium | [p3-exit-intent-email-combo.md](./p3-exit-intent-email-combo.md) |
| Shopify Segments Integration | 🔥🔥 | Medium | [p3-shopify-segments.md](./p3-shopify-segments.md) |

---

## 🔧 Technical Debt

For implementation details, refactoring tasks, and technical issues, see:
- [technical-debt.md](./technical-debt.md)

---

## Quick Wins

Small improvements that can be shipped quickly:

- [ ] Template Library Expansion (Holiday, Industry, Event templates)
- [ ] Mobile Preview Mode in admin editor
- [ ] Performance Alerts (email notifications on milestones)

---

## How to Use This Directory

1. **Adding a new feature**: Create `pX-feature-name.md` using the template below
2. **Completing a feature**: Move to `completed/` folder
3. **Tracking progress**: Use checkboxes in individual feature files

### Feature File Template

```markdown
# Feature Name

> Priority: P1 | Impact: 🔥🔥🔥 | Effort: Medium

## Summary
One-paragraph description of what and why.

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Technical Design
Architecture, schemas, affected files.

## Implementation Tasks
- [ ] Task 1
- [ ] Task 2

## Research / References
Links, competitor analysis, etc.
```

