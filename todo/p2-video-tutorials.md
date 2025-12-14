# Video Tutorials

> Priority: P2 | Impact: 🔥🔥 | Effort: Medium

## Summary

Short (1-2 min) video walkthroughs for key features. Visual learners prefer video. Reduces support burden.

## Why

Complex features are easier to understand with video. Reduces "how do I...?" support tickets.

## Videos to Create

### Getting Started (Priority 1)
- [ ] "Getting Started" overview video (2 min)
  - Install app
  - Enable theme extension
  - Create first campaign
  - Preview and publish

### Template Tutorials (Priority 2)
- [ ] Spin-to-Win setup walkthrough
- [ ] Newsletter popup best practices
- [ ] Flash Sale with countdown timer
- [ ] Cart Abandonment recovery flow

### Advanced Features (Priority 3)
- [ ] Targeting & triggers deep dive
- [ ] A/B testing walkthrough
- [ ] Analytics interpretation
- [ ] Discount code strategies

## Implementation Tasks

- [ ] Record videos (screen capture + voiceover)
- [ ] Host on YouTube/Vimeo (or self-host)
- [ ] Create video player component
- [ ] Embed in relevant admin screens
- [ ] Add to help modal/center

## UI Integration

### Option 1: Contextual Videos
Show video icon next to complex features, opens modal with video.

### Option 2: Video Gallery
Dedicated "Learn" or "Tutorials" section in app.

### Option 3: Onboarding Videos
Show during onboarding wizard steps.

## Technical Notes

```tsx
// Video player component
<VideoTutorial
  id="getting-started"
  title="Getting Started with Revenue Boost"
  duration="2:15"
  thumbnailUrl="..."
  videoUrl="..."
/>
```

## Related Files

- `app/components/VideoTutorial.tsx` (new)
- `app/routes/app.learn.tsx` (new, optional)

