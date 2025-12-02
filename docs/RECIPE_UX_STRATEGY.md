# Recipe UX Strategy

## Overview

This document defines the UX strategy for recipe-based campaign creation, designed to reduce campaign launch time from 10+ minutes to under 2 minutes.

## Core Concepts

### Templates vs Recipes

| Concept | Definition | Example |
|---------|------------|---------|
| **Template** | Defines popup TYPE and structural schema (what fields exist) | `NEWSLETTER`, `SPIN_TO_WIN`, `FLASH_SALE` |
| **Recipe** | Pre-configured instance with content, theme, background, settings filled in | "Welcome Discount", "Spring Sale" |

**Key Insight:** Recipes should feel like "ready-to-launch solutions" - not empty forms to fill out.

---

## Strategic Decisions

### 1. Recipes vs Templates: Fundamentally Different UX

- **Templates** = Building blocks (the "what")
- **Recipes** = Ready-to-launch solutions (the "how")

Recipes provide a different mental model: "customize and go" vs "fill out a form"

### 2. Build from Scratch: Blank Recipes

Instead of a separate "build from scratch" flow, offer **Blank Recipes**:
- "📝 Blank Newsletter"
- "🎡 Blank Spin to Win"
- "⚡ Blank Flash Sale"

This makes recipes THE universal entry point with a simpler mental model.

### 3. Form Steps: Single-Page Quick Editor

Replace the 5-step wizard with a **single-page customize view** for recipes:

```
┌─────────────────────────────────────────────────────────────────────┐
│  New Campaign                                                        │
│  Based on: 🎁 Welcome Discount                    [Use Full Editor] │
├───────────────────────────────────┬─────────────────────────────────┤
│  Content (Primary)                │        Live Preview             │
│  ┌─────────────────────────────┐  │        ┌─────────────────┐      │
│  │ Headline                    │  │        │                 │      │
│  │ [Join our community!     ]  │  │        │     Popup       │      │
│  │ Subheadline                 │  │        │     Preview     │      │
│  │ [Get 10% off your order ]  │  │        │                 │      │
│  │ Button Text                 │  │        └─────────────────┘      │
│  │ [Subscribe              ]   │  │                                 │
│  └─────────────────────────────┘  │        [Mobile] [Desktop]       │
│                                   │                                 │
│  Collapsed Settings               │                                 │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ▸ Theme          Elegant Dark                          [Edit]  ││
│  │ ▸ Discount       10% off, auto-apply                   [Edit]  ││
│  │ ▸ Targeting      All visitors, All pages               [Edit]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Save as Draft]                              [Launch Campaign →]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Principles:**
- Content fields are PRIMARY (what users most often change)
- Other settings are COLLAPSED with current values visible
- Click [Edit] to expand inline or open drawer
- Live preview ALWAYS visible
- Two CTAs: "Save as Draft" (safe) or "Launch" (bold action)

### 4. Pre-filled Data Behavior

| Field | Behavior |
|-------|----------|
| Template Type | **Locked** (defines the recipe) |
| Content | Editable, pre-filled from recipe |
| Theme/Design | Editable, pre-filled from recipe |
| Discount | Editable, pre-filled from modal input |
| Targeting | Smart defaults (All), expandable |

**Additional Feature:** "Reset to recipe defaults" button in each section

### 5. Recipe Origin Indicator

Subtle but present:
- Page subtitle: "Based on: 🎁 Welcome Discount"
- Helps user understand they're building on a proven recipe

---

## Route Structure

```
/app/campaigns/recipe          → Recipe Picker (full-width with categories)
/app/campaigns/new/quick       → Single-page editor for recipes (NEW)
/app/campaigns/new             → Full 5-step wizard (advanced users)
```

---

## User Flow

```
Recipe Picker
     │
     ▼
Configuration Modal (quick inputs like discount %)
     │
     ▼
Single-Page Quick Editor ──────────► Full Editor (escape hatch)
     │
     ▼
[Save Draft] or [Launch]
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to launch | < 2 minutes |
| Form completion rate | > 80% |
| User satisfaction | Measured via feedback |

---

## Implementation Status

- [x] Recipe Picker with categories
- [x] Configuration Modal
- [ ] Single-Page Quick Editor (`/app/campaigns/new/quick`)
- [ ] Block-based form architecture (see BLOCK_ARCHITECTURE.md)

