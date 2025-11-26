# UI Refactoring Plan: Shared Popup Components

## Overview
This plan outlines the extraction of shared UI components from the popup system to reduce code duplication (~1,915 lines), improve consistency, and simplify maintenance—while preserving the existing hook-based architecture.

**Approach:** UI Component Extraction (Analysis B) + LeadCaptureForm (from Analysis A)
**Estimated Duration:** 5-6 weeks
**Risk Level:** Low (additive changes, gradual migration)

---

## Goals
- [ ] Reduce duplicated code by ~17% (~1,915 lines)
- [ ] Improve UI consistency across all 11 popup types
- [ ] Maintain backwards compatibility (no breaking changes)
- [ ] Preserve template-driven architecture and Zod validation
- [ ] Enable faster development of future popup templates

---

## Phase 1: Foundation (Week 1)
**Focus:** Low-risk, high-value extractions

### Tasks
- [ ] **1.1** Create directory structure `app/domains/storefront/popups-new/components/shared/`
- [ ] **1.2** Create `animations.css` with shared keyframes (fadeIn, fadeOut, bounceIn, zoomIn, spin, slideIn)
- [ ] **1.3** Create Icon components collection
  - [ ] `CloseIcon.tsx`
  - [ ] `CheckmarkIcon.tsx`
  - [ ] `SpinnerIcon.tsx`
  - [ ] `ChevronIcon.tsx`
- [ ] **1.4** Create `LoadingSpinner.tsx` component
- [ ] **1.5** Create `usePopupTheme.ts` hook (centralize color/theme calculations)
- [ ] **1.6** Write unit tests for all Phase 1 components
- [ ] **1.7** Export shared components via `index.ts` barrel file

### Acceptance Criteria
- All icon components render correctly with configurable size/color
- LoadingSpinner supports sm/md/lg sizes and optional text
- usePopupTheme returns consistent theme object from any PopupDesignConfig
- animations.css respects `prefers-reduced-motion`
- 100% test coverage for new components

---

## Phase 2: Core Components (Week 2-3)
**Focus:** High-impact shared components

### Tasks
- [ ] **2.1** Create `DiscountCodeDisplay.tsx` component
  - [ ] Props: code, onCopy, copied, label, variant (dashed/solid/minimal), accentColor, size
  - [ ] Integrates with existing `useDiscountCode` hook
  - [ ] Supports inline, card, and overlay variants
- [ ] **2.2** Create `SuccessState.tsx` component
  - [ ] Props: message, discountCode, onCopyCode, copiedCode, icon, accentColor, animation
  - [ ] Includes checkmark icon with animation
  - [ ] Optional discount code display integration
- [ ] **2.3** Create `LeadCaptureForm.tsx` component
  - [ ] Props: data, errors, onChange handlers, onSubmit, isSubmitting, showName, showGdpr, labels, placeholders
  - [ ] Composes existing FormFields (EmailInput, NameInput, GdprCheckbox, SubmitButton)
  - [ ] Supports extraFields slot for template-specific inputs
- [ ] **2.4** Create `TimerDisplay.tsx` component
  - [ ] Props: timeRemaining, format (compact/full/minimal), showDays, showLabels
  - [ ] Works with existing `useCountdownTimer` hook
- [ ] **2.5** Create `PopupHeader.tsx` component
  - [ ] Props: headline, subheadline, textColor, fontSize, fontWeight, align, spacing
- [ ] **2.6** Write unit tests for all Phase 2 components
- [ ] **2.7** Document component APIs in JSDoc comments

### Acceptance Criteria
- DiscountCodeDisplay handles all 3 variants with consistent copy behavior
- SuccessState renders correctly with/without discount code
- LeadCaptureForm validates and submits via usePopupForm integration
- All components respect PopupDesignConfig theming
- Visual parity with existing inline implementations

---

## Phase 3: Migration (Week 3-4)
**Focus:** Migrate popups to use shared components

### Migration Order (by risk/impact)
1. NewsletterPopup (most common, best test case)
2. FreeShippingPopup (simple, email-only)
3. CartAbandonmentPopup (email + discount)
4. FlashSalePopup (discount + timer)
5. SpinToWinPopup (complex, lead capture + discount)
6. ScratchCardPopup (most complex)
7. CountdownTimerPopup (timer only)
8. AnnouncementPopup (simple)
9. ProductUpsellPopup (no lead capture)
10. SocialProofPopup (no lead capture)
11. SlideInPopup / BannerPopup

### Tasks
- [ ] **3.1** Migrate NewsletterPopup
  - [ ] Replace inline success state with `<SuccessState />`
  - [ ] Replace inline discount display with `<DiscountCodeDisplay />`
  - [ ] Replace form assembly with `<LeadCaptureForm />`
  - [ ] Replace icons with shared Icon components
  - [ ] Import animations from animations.css
  - [ ] Run visual regression test
- [ ] **3.2** Migrate FreeShippingPopup
  - [ ] Replace email form with `<LeadCaptureForm showName={false} showGdpr={false} />`
  - [ ] Replace discount display with `<DiscountCodeDisplay variant="inline" />`
- [ ] **3.3** Migrate CartAbandonmentPopup
  - [ ] Replace email form with `<LeadCaptureForm />`
  - [ ] Replace discount card with `<DiscountCodeDisplay variant="card" />`
  - [ ] Replace timer with `<TimerDisplay />`
- [ ] **3.4** Migrate FlashSalePopup
  - [ ] Replace discount text with `<DiscountCodeDisplay variant="inline" />`
  - [ ] Replace timer with `<TimerDisplay />`
- [ ] **3.5** Migrate SpinToWinPopup
  - [ ] Replace form section with `<LeadCaptureForm />`
  - [ ] Replace win state discount with `<DiscountCodeDisplay />`
  - [ ] Replace success UI with `<SuccessState />`
- [ ] **3.6** Migrate ScratchCardPopup
  - [ ] Replace email forms (before/after scratch) with `<LeadCaptureForm />`
  - [ ] Replace overlay discount with `<DiscountCodeDisplay variant="overlay" />`
- [ ] **3.7** Migrate remaining popups (CountdownTimer, Announcement, ProductUpsell, SocialProof, SlideIn, Banner)
- [ ] **3.8** Run full E2E test suite after each migration batch

### Acceptance Criteria
- Each migrated popup passes visual regression test
- Form submission flows work identically to before
- Discount code copy-to-clipboard works in all contexts
- Admin preview renders correctly
- Storefront rendering works correctly

---

## Phase 4: Cleanup & Documentation (Week 5)
**Focus:** Remove duplication, document patterns

### Tasks
- [ ] **4.1** Remove duplicated inline styles from migrated popups
- [ ] **4.2** Remove duplicated SVG definitions
- [ ] **4.3** Remove duplicated animation keyframes
- [ ] **4.4** Audit remaining duplication (run code analysis)
- [ ] **4.5** Update component documentation
  - [ ] Add usage examples to each shared component
  - [ ] Document when to use each variant
  - [ ] Add to ARCHITECTURE_DIAGRAM.md
- [ ] **4.6** Create "Adding a New Popup" guide using shared components
- [ ] **4.7** Run full test suite (unit + E2E)
- [ ] **4.8** Performance testing (bundle size comparison)

### Acceptance Criteria
- No duplicated animation keyframes remain
- No duplicated icon SVGs remain
- Bundle size is equal or smaller
- Documentation is complete and accurate

---

## Phase 5: Optional Enhancements (Week 6+)
**Focus:** Nice-to-have improvements

### Tasks
- [ ] **5.1** Create `PopupFooter.tsx` component (if patterns emerge)
- [ ] **5.2** Add QR code variant to DiscountCodeDisplay
- [ ] **5.3** Add Storybook stories for all shared components
- [ ] **5.4** Consider extracting to a shared package for Preact storefront

---

## Component Reference

### New Components
| Component | Location | Used By |
|-----------|----------|---------|
| `CloseIcon` | `components/shared/icons/` | All popups |
| `CheckmarkIcon` | `components/shared/icons/` | Success states |
| `SpinnerIcon` | `components/shared/icons/` | Loading states |
| `LoadingSpinner` | `components/shared/` | Newsletter, SpinToWin, ScratchCard, ProductUpsell |
| `DiscountCodeDisplay` | `components/shared/` | Newsletter, SpinToWin, ScratchCard, CartAbandonment, FlashSale |
| `SuccessState` | `components/shared/` | Newsletter, SpinToWin, ScratchCard, CartAbandonment |
| `LeadCaptureForm` | `components/shared/` | Newsletter, SpinToWin, ScratchCard, FreeShipping, CartAbandonment |
| `TimerDisplay` | `components/shared/` | FlashSale, CountdownTimer, CartAbandonment |
| `PopupHeader` | `components/shared/` | All popups |

### New Hooks
| Hook | Location | Purpose |
|------|----------|---------|
| `usePopupTheme` | `hooks/` | Centralize color/theme calculations |

### New CSS
| File | Location | Purpose |
|------|----------|---------|
| `animations.css` | `components/shared/` | Shared animation keyframes |

---

## Testing Strategy

### Unit Tests
- Each shared component has isolated unit tests
- Test all prop combinations and edge cases
- Mock useDiscountCode/usePopupForm for integration tests

### Visual Regression
- Screenshot comparison before/after each popup migration
- Use admin preview for consistent rendering environment

### E2E Tests
- Run `npm run test:e2e` after each migration batch
- Key flows to verify:
  - Newsletter signup with discount code
  - Spin-to-win game completion
  - Scratch card reveal
  - Cart abandonment email capture
  - Flash sale timer expiry

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| DOM structure changes break CSS | Preserve key class names, accept className props |
| Storefront extension compatibility | Test in Preact environment, maintain prop interfaces |
| Performance regression | Measure bundle size before/after |
| Visual inconsistencies | Visual regression tests after each migration |

---

## Success Metrics
- [ ] ~1,915 lines of code removed
- [ ] 0 visual regressions reported
- [ ] All E2E tests passing
- [ ] Bundle size ≤ current size
- [ ] New popup development time reduced by 50%

---

## Notes
- This plan preserves the existing hook-based architecture (usePopupForm, useDiscountCode, etc.)
- No changes to Zod schemas or database models required
- No changes to PopupManagerCore/PopupManagerReact
- Admin preview and storefront rendering use the same shared components
