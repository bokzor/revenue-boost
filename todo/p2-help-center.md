# Help Center Link

> Priority: P2 | Impact: 🔥 | Effort: Low

## Summary

Add "Help" link in app navigation pointing to external documentation. Standard for Shopify apps.

## Why

Low effort, immediate support value. Users expect help to be accessible.

## Implementation Tasks

- [ ] Add help link to app navigation bar
- [ ] Link to website FAQ section (already exists)
- [ ] Consider Intercom/Zendesk widget integration
- [ ] "Contact Support" mailto or form link

## Options

### Option 1: Simple Link
- Add "Help" to nav, links to `/help` on website
- Lowest effort

### Option 2: Help Modal
- In-app modal with FAQ accordions
- Search functionality
- Links to full docs

### Option 3: Chat Widget
- Intercom or similar
- Live chat support
- Knowledge base integration

## UI Placement

```
App Navigation:
├── Dashboard
├── Campaigns
├── Analytics
├── Experiments
├── Settings
└── Help  ← NEW (links to external docs or opens modal)
```

## Related Files

- `app/root.tsx` (navigation)
- Website: `website/app/help/page.tsx`

