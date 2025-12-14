# Campaign Scheduling Improvements

> Priority: P1 | Impact: 🔥🔥 | Effort: Low

## Summary

Enhanced scheduling UI and features for time-based campaign management. Visual calendar, recurring schedules, and timezone-aware display.

## Why

Essential for seasonal promotions. Reduces manual management for merchants running regular sales.

## User Stories

- As a merchant, I want to see all my campaigns on a calendar view
- As a merchant, I want to set up recurring campaigns (e.g., "Every Friday 4-6 PM")
- As a merchant, I want campaigns to auto-pause when end date is reached

## Implementation Tasks

### Visual Calendar
- [ ] Calendar view component showing campaign schedules
- [ ] Drag-and-drop to reschedule campaigns
- [ ] Color coding by campaign type/status
- [ ] Week/Month view toggle

### Recurring Campaigns
- [ ] Add `recurrence` field to campaign schema
- [ ] Cron-like expression or simple UI (daily/weekly/monthly)
- [ ] Auto-create new campaign instances from recurring template
- [ ] "Next occurrence" preview in UI

### Auto-Pause on End Date
- [ ] Enforce existing `endDate` field
- [ ] Background job to check and pause expired campaigns
- [ ] Or: check in `filterCampaigns()` before returning

### Timezone Display
- [ ] Store times in UTC
- [ ] Display in merchant's timezone in admin UI
- [ ] Show "Campaign runs 9 AM - 5 PM EST"

## Technical Design

```typescript
// Campaign schema addition
schedule?: {
  startDate: Date,
  endDate?: Date,
  timezone: string,  // "America/New_York"
  recurrence?: {
    type: "daily" | "weekly" | "monthly",
    daysOfWeek?: number[],  // [5, 6] = Fri, Sat
    timeStart: string,  // "09:00"
    timeEnd: string,    // "17:00"
  }
}
```

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/domains/campaigns/components/form/ScheduleSection.tsx`
- `app/routes/app.campaigns._index.tsx` (for calendar view)

