# Storefront Popup Primitives & Responsive Behavior

## 7. Implementation Summary (2025-11-19)

The analysis led to the implementation of a set of shared primitives:
- `PopupCard`, `PopupHeading`, `PopupText`, `PopupButton`, `PopupInput`, `CloseButton`.
- These components are now located in `app/domains/storefront/popups-new/components/primitives`.
- `CartAbandonmentPopup` was refactored to use these primitives, reducing custom CSS and fixing the desktop sizing issue by using the new `PopupCard` logic which maps `medium` size to `640px` (vs ~448px previously) and `large` to `840px`.
- This sets the stage for refactoring other modals (Newsletter, etc.) to use the same primitives.

## 1. Overview

This document analyses all storefront popup templates and how we can introduce a small set of shared UI primitives while keeping bundles lean and responsive behavior consistent.

Primary goals:
- Reuse a handful of primitives across templates:
  - `PopupShell` (overlay, position, animation)
  - `PopupCard` (background, border radius, shadow, width)
  - `PopupHeading`, `PopupText`
  - `PopupButton`
  - `PopupInput`
  - `CloseButton` / `IconButton`
- Fix misaligned responsive behavior (notably, Cart Abandonment feeling too small on desktop).


## 2. Template families

Across `app/domains/storefront/popups-new` (plus `slideins`), we effectively have three UI families:

1. **Portal modals (centered popups)**
   - Use `PopupPortal`:
   - `NewsletterPopup`
   - `CartAbandonmentPopup`
   - `FlashSalePopup` (modal mode)
   - `ProductUpsellPopup`
   - `ScratchCardPopup`
   - `SpinToWinPopup`

2. **Banners / bars (top or bottom of viewport)**
   - Render directly in DOM (no `PopupPortal`):
   - `AnnouncementPopup`
   - `CountdownTimerPopup`
   - `FreeShippingPopup`
   - `FlashSalePopup` (banner mode)

3. **Toasts / slide-ins (small notifications)**
   - Corner or side cards:
   - `SocialProofPopup`
   - `slideins/SlideInPopup`

The primitives apply most strongly to **portal modals**; banners/toasts can still reuse buttons and close icons.


## 3. PopupShell (overlay, position, animation)

We already have a shell: **`PopupPortal`**.

Responsibilities:
- Overlay/backdrop (color, opacity, blur) and z-index
- Positioning (center, top, bottom, left, right)
- Animations (enter/exit classes + keyframes)
- ESC / backdrop click closing
- Shadow DOM host, scroll locking, focus handling

Conclusion: we **do not need a new `PopupShell`**. Instead, we can:
- Keep `PopupPortal` as the shell primitive.
- Optionally add a thin adapter that maps `PopupDesignConfig` → `PopupPortal` props.


## 4. Modal templates (per-file analysis)

### 4.1 NewsletterPopup

- Shell: uses `PopupPortal`.
- Card: `.email-popup-container` acts as the card.
- Sizing:
  - Uses `getSizeDimensions(config.size || 'medium', config.previewMode)`.
  - Production widths: `width: 90%`, `maxWidth`: 400/600/900px.
- Responsiveness:
  - `container-type: inline-size; container-name: popup`.
  - `@container popup (min-width: 480px)` switches layout from stacked to side-by-side for left/right image.
  - Uses a viewport container query for small screens.
- Controls:
  - Custom CSS for title, description, button(s), input, close button.

**Mapping to primitives**
- `PopupPortal` → `PopupShell`.
- `.email-popup-container` → `PopupCard` (`variant="modal"`).
- Title/description → `PopupHeading`, `PopupText`.
- Primary/secondary buttons → `PopupButton` variants.
- Email input → `PopupInput` (with error state).
- Close icon → `CloseButton`.


### 4.2 CartAbandonmentPopup

- Shell: uses `PopupPortal`.
- Card: `.cart-ab-popup-container`.
- Sizing:
  - `max-width` computed as:
    - small: `24rem` (~384px)
    - medium: `28rem` (~448px)
    - large: `32rem` (~512px)
  - Always `width: 100%` → **small card even on large desktops**.
- Responsiveness:
  - Only a simple `@media (min-width: 768px)` that increases padding.
  - No container queries or layout changes based on card width.
- Controls:
  - Buttons and input heavily inline-styled with repeated patterns.

**Why it feels too small on desktop**
- Max width is ~448px for medium vs 600px (Newsletter) and up to 900px for other modals.
- Dense content (cart items list, total, urgency message, email gate, multiple buttons) in a narrow card.
- Typography doesn’t scale up on wider viewports.

**Mapping to primitives**
- `.cart-ab-popup-container` → `PopupCard` with `variant="cart"` using **wider default widths**, e.g.:
  - small: ~480px, medium: ~640px, large: ~800px.
- Headline/subheadline → `PopupHeading` / `PopupText`.
- Primary CTA, "Save for later", dismiss → `PopupButton` variants.
- Email input → `PopupInput`.
- Close icon → `CloseButton`.


### 4.3 FlashSalePopup (modal mode)

- Shell: uses `PopupPortal` in modal mode.
- Card: `.flash-sale-container`.
- Sizing:
  - Custom `popupSize` (`compact|standard|wide|full`) + `config.size` scaling.
  - `max-width` computed from this combination.
- Responsiveness:
  - Uses `container-type: inline-size; container-name: flash-sale`.
  - Container query at `@container flash-sale (max-width: 640px)` tweaks layout/typography.

**Mapping to primitives**
- `.flash-sale-container` → `PopupCard` (`variant="hero"` / `"sales"`) with shared size helper.
- Headline/supporting text → `PopupHeading` / `PopupText`.
- Primary/secondary CTAs → `PopupButton` variants.
- Close icon → `CloseButton`.


### 4.4 ProductUpsellPopup

- Shell: uses `PopupPortal`.
- Card: `.upsell-container`.
- Sizing:
  - Uses `getSizeDimensions(config.size || 'medium', config.previewMode)`.
  - Applies `width`/`max-width` via CSS with fallback `56rem`.
- Responsiveness:
  - `container-type: inline-size; container-name: upsell`.
  - Container queries and fallback `@media` to adapt grid/cards.

**Mapping to primitives**
- `.upsell-container` → `PopupCard` (`variant="upsell"`).
- Headline/subheadline → `PopupHeading` / `PopupText`.
- Main CTA and dismiss button (currently using shared `buttonStyles`) → `PopupButton` primary/secondary.


### 4.5 ScratchCardPopup

- Shell: uses `PopupPortal`.
- Card: `.scratch-popup-container`.
- Sizing:
  - Uses `getSizeDimensions(config.size || 'medium', config.previewMode)`.
  - If vertical image layout is active, upgrades to `getSizeDimensions('large', ...)`.
- Responsiveness:
  - `container-type: inline-size; container-name: scratch-popup`.
  - Container queries to switch between vertical/side-by-side layouts and adjust padding.

**Mapping to primitives**
- `.scratch-popup-container` → `PopupCard` (image-aware variant if needed).
- Headline/description → `PopupHeading` / `PopupText`.
- Email form buttons (pre- and post-scratch) → `PopupButton` variants.
- Email inputs + checkboxes → `PopupInput` + shared checkbox style.
- Dismiss button → `PopupButton` (ghost/tertiary) or a dedicated text-link style.


### 4.6 SpinToWinPopup

- Shell: uses `PopupPortal`.
- Card: the `cardRef` container (currently a styled `<div>` without class).
- Sizing:
  - Does **not** use `getSizeDimensions`.
  - Custom responsive logic based on `ResizeObserver` and `window.innerWidth`, deriving `isMobile`, `isTablet`, `isDesktop`.
  - Card is `width: 100%; maxWidth: 100%`; wheel and form layout adapt inside.
- Controls:
  - Email/name inputs with `getInputStyles`.
  - Primary spin button and secondary dismiss button with shared `buttonStyles`.

**Mapping to primitives**
- `cardRef` container → `PopupCard` (`variant="spin"`) with a defined `maxWidth` profile (likely similar to `large` modal).
- Name/email fields → `PopupInput` with focus/error styling shared with other templates.
- Spin and dismiss buttons → `PopupButton` primary/secondary.
- Top-right close button → `CloseButton`.

Wheel drawing and spin animation remain custom; primitives only wrap the surrounding card and form.


## 5. Non-modal templates (banners & toasts)

### 5.1 Banners (Announcement, CountdownTimer, FreeShipping, FlashSale banner)

- All are full-width bars pinned to top/bottom via `position: fixed` or `sticky`.
- They dont use `PopupPortal`.
- Each defines its own CTA button and close button styling.

**Primitives reuse**
- Use `PopupButton` for banner CTAs (with props to control size/shape).
- Use `CloseButton` / `IconButton` for banner close actions.
- Optionally adopt `PopupText` for headings/subtext.


### 5.2 Toasts / slide-ins (SocialProofPopup, SlideInPopup)

- `SocialProofPopup` is a corner card with rotation logic and inline styles.
- `SlideInPopup` portals a side/bottom card with inline styles.

**Primitives reuse**
- Use `CloseButton` / `IconButton` for their close controls.
- Use `PopupButton` for primary actions (where present).


## 6. Cross-template conclusions

1. **Shell:** `PopupPortal` already fulfills the `PopupShell` role. A helper that maps `PopupDesignConfig` → `PopupPortal` props is enough.
2. **Card:** Most modals already have clear card containers; converting them to a shared `PopupCard` with variants (default, cart, upsell, hero, spin) unifies width, border radius, and shadows.
3. **Sizing:**
   - `getSizeDimensions` is used in several templates but not all.
   - CartAbandonment and SpinToWin are outliers with custom width logic.
   - A single helper (extended from `getSizeDimensions`) should define `width/maxWidth` per `size` + `variant`, fixing CartAbandonments too-small desktop sizing.
4. **Responsive behavior:**
   - Newsletter, ProductUpsell, ScratchCard already use container queries; these can be standardized around `PopupCard`.
   - CartAbandonment and SpinToWin should align with this approach rather than custom breakpoints and media-only rules.
5. **Controls:**
   - Buttons, inputs, and close icons are repeatedly re-implemented. `PopupButton`, `PopupInput`, and `CloseButton` primitives can centralize styling, reduce CSS, and keep the storefront bundle lean.

This analysis provides the basis for designing `PopupPrimitives` and then refactoring each template, starting with Cart Abandonment (to fix its size) and one of the simpler modals (e.g., Newsletter) as a reference implementation.
