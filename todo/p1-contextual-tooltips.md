# Contextual Tooltips

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Inline help for complex features without leaving the current screen. Reduces confusion on advanced features.

## Why

Quick win with Polaris `Tooltip` component. Reduces support tickets for "what does this do?" questions.

## User Stories

- As a merchant, I want to understand what each targeting option does
- As a merchant, I want quick explanations without reading documentation

## Implementation Tasks

### Targeting Options
- [ ] Exit intent tooltip: "Shows when visitor moves mouse toward browser close button"
- [ ] Scroll depth tooltip: "Shows after visitor scrolls X% down the page"
- [ ] Time delay tooltip: "Shows after visitor has been on page for X seconds"

### Trigger Configuration
- [ ] Combination logic tooltip: "AND = all conditions must match, OR = any condition"
- [ ] Frequency capping tooltip: "Limits how often the same visitor sees this popup"

### Discount Types
- [ ] Percentage vs fixed tooltip: "Percentage: 10% off. Fixed: $10 off"
- [ ] Minimum requirements tooltip: "Customer must spend at least X to use discount"

### Audience Targeting
- [ ] New vs returning tooltip: "New = first visit, Returning = has visited before"
- [ ] Device types tooltip: "Target specific devices: Desktop, Mobile, Tablet"

### Design Settings
- [ ] Position tooltip: "Where the popup appears on screen"
- [ ] Animation tooltip: "How the popup enters the screen"
- [ ] Overlay tooltip: "Dark background behind popup, blocks page interaction"

## Technical Implementation

Use Polaris `Tooltip` component:

```tsx
<Tooltip content="Shows when visitor moves mouse toward browser close button">
  <Text>Exit Intent</Text>
</Tooltip>
```

## Related Files

- `app/domains/campaigns/components/form/TargetingSection.tsx`
- `app/domains/campaigns/components/form/DesignSection.tsx`
- `app/domains/campaigns/components/sections/*`

