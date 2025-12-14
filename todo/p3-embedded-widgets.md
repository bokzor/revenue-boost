# Embedded Widgets

> Priority: P3 | Impact: 🔥🔥 | Effort: High

## Summary

Non-popup display options: inline banners, sticky bars, embedded elements. Less intrusive than popups.

## Why

Some merchants prefer non-popup approaches. Sticky bars for announcements, inline forms for product pages.

## Widget Types

### Inline Banners
- [ ] Embed in product pages
- [ ] Cart drawer integration
- [ ] Collection page banners
- [ ] Theme block placement

### Sticky Header/Footer Bars
- [ ] Announcement bars
- [ ] Free shipping progress
- [ ] Countdown timers
- [ ] Cookie consent

### Embedded Countdown Timers
- [ ] Product page timers
- [ ] Collection sale timers
- [ ] Cart page urgency

### Floating Action Buttons
- [ ] Chat/help button
- [ ] Discount reveal button
- [ ] Scroll-to-top with offer

## Technical Challenges

### Theme Integration
- Need theme app blocks for inline placement
- Different themes have different structures
- Responsive design across themes

### App Blocks vs App Embed

```
App Embed: Single script, positions self
App Block: Theme editor placement, multiple instances
```

Need both approaches for flexibility.

## Implementation

### Phase 1: Sticky Bar
Simplest widget, uses existing app embed approach.

### Phase 2: Theme App Blocks
Requires Shopify theme app extensions with blocks.

### Phase 3: Advanced Widgets
Full widget library with preview.

## Related Files

- `extensions/storefront-popup/shopify.extension.toml`
- `extensions/storefront-popup/blocks/` (new)

