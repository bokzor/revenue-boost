# Onboarding Wizard

> Priority: P1 | Impact: 🔥🔥🔥 | Effort: Medium

## Summary

First-time user guided setup flow to reduce time-to-value and support tickets. Users who complete setup are 3x more likely to convert to paid.

## Why

Critical for activation. Reduces time-to-first-campaign and support burden.

## User Stories

- As a new merchant, I want to be guided through initial setup
- As a new merchant, I want to create my first campaign quickly
- As an experienced user, I want to skip onboarding

## Implementation Tasks

### Welcome Modal
- [ ] Show welcome modal on first login
- [ ] Store `onboardingCompleted` flag in store settings
- [ ] "Skip" option for experienced users

### Step 1: Enable Theme Extension
- [ ] Check if theme extension is enabled
- [ ] Deep link to theme editor if not enabled
- [ ] Verification that extension is active

### Step 2: Create First Campaign
- [ ] Pre-select recommended template (Newsletter)
- [ ] Simplified campaign creation flow
- [ ] Pre-filled defaults for quick setup

### Step 3: Preview & Publish
- [ ] Live preview of popup
- [ ] Confirmation before publishing
- [ ] Success celebration (confetti? 🎉)

### Progress Tracking
- [ ] Track onboarding step in store settings
- [ ] Resume from last step if interrupted
- [ ] Show progress indicator

## Technical Design

```typescript
// Store settings addition
onboarding: {
  completed: boolean,
  currentStep: number,
  skipped: boolean,
  completedAt?: Date,
}
```

## UI/UX

- Use Shopify Polaris `Modal` for wizard steps
- Progress bar at top
- "Back" and "Next" navigation
- Inline help/tips for each step

## Related Files

- `app/routes/app._index.tsx` (entry point)
- `app/components/onboarding/OnboardingWizard.tsx` (new)
- `app/lib/store-settings.server.ts`

