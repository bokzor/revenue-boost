# Empty State Guidance

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Helpful empty states when no data exists yet. Prevents user confusion and guides next action naturally.

## Why

Empty screens are confusing. Good empty states convert confused users into active users.

## User Stories

- As a new merchant with no campaigns, I want guidance on what to do first
- As a merchant with no analytics data, I want to understand why and what to do

## Implementation Tasks

### Dashboard Empty State
- [ ] "Create your first campaign" prominent CTA
- [ ] Template suggestions carousel
- [ ] Quick stats preview (what you'll see once active)

### Analytics Empty State
- [ ] "No data yet" with explanation
- [ ] Tips to drive traffic to store
- [ ] Estimated time for data to appear
- [ ] Link to preview campaigns

### Experiments Empty State
- [ ] Explain A/B testing benefits
- [ ] "Create your first experiment" CTA
- [ ] Example of what you'll learn

### Campaign List Empty State
- [ ] Template showcase grid
- [ ] "Start from template" button for each
- [ ] "Create blank campaign" secondary option

## Design Guidelines

Use Polaris `EmptyState` component:

```tsx
<EmptyState
  heading="Create your first campaign"
  image="https://..."
  action={{ content: "Create campaign", url: "/app/campaigns/new" }}
>
  <p>Popups help you capture leads and boost sales.</p>
</EmptyState>
```

### Content Principles
- Be encouraging, not critical ("Let's get started!" not "No campaigns yet")
- Show value proposition (what they'll gain)
- Clear single action (one primary CTA)
- Optional secondary action for advanced users

## Related Files

- `app/routes/app._index.tsx` (dashboard)
- `app/routes/app.campaigns._index.tsx` (campaign list)
- `app/routes/app.analytics._index.tsx` (analytics)
- `app/routes/app.experiments._index.tsx` (experiments)

