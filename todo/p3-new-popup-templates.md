# New Popup Templates

> Priority: P3 | Impact: 🔥🔥 | Effort: Medium

## Summary

Expand template library with new popup types: Video, Survey, Birthday Signup.

## Templates to Add

### Video Popup
- [ ] Embed YouTube/Vimeo videos
- [ ] Product demo videos
- [ ] Brand story videos
- [ ] Auto-play options (muted)
- [ ] CTA overlay on video end

**Use cases:**
- Product launch announcements
- How-to guides
- Brand storytelling

### Survey Popup
- [ ] Multi-question forms
- [ ] NPS score collection
- [ ] Star ratings
- [ ] Multiple choice questions
- [ ] Open-ended text responses
- [ ] Conditional logic (show Q2 based on Q1 answer)

**Use cases:**
- Post-purchase feedback
- Exit surveys
- Product interest surveys

### Birthday Signup Popup
- [ ] Collect date of birth
- [ ] Month/day only option (privacy-friendly)
- [ ] Birthday discount automation
- [ ] Reminder email before birthday

**Use cases:**
- Birthday discount programs
- Customer loyalty
- Personalization data

## Implementation Pattern

Follow existing template pattern:
1. Add to `TemplateTypeSchema` in `campaign.ts`
2. Create content schema (e.g., `VideoContentSchema`)
3. Create popup component in `popups-new/`
4. Create content section in `content-sections/`
5. Register in step renderers
6. Add seed template

## Technical Considerations

### Video Popup
- Use lite-youtube-embed for performance
- Lazy load video player
- Handle video end events

### Survey Popup
- Form validation per question type
- Progress indicator for multi-step
- Data storage for responses

## Related Files

- `app/domains/campaigns/types/campaign.ts`
- `app/domains/storefront/popups-new/`
- `app/domains/campaigns/components/content-sections/`

