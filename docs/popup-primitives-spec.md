# Popup Primitives & Responsive Layout Spec

## 1. Goals & Scope

This spec defines **storefront popup primitives** and a **unified responsive model** for:
- Modal popups using `PopupPortal` (Newsletter, CartAbandonment, Upsell, Scratch, Spin, FlashSale modal)
- Banners/bars (Announcement, Countdown, FreeShipping, FlashSale banner)
- Toasts/slide-ins (SocialProof, SlideIn)

Constraints:
- Keep storefront bundles **very lean** (no external UI library).
- Use **Grid for macro layout**, **Flex for micro layout**.
- Drive responsiveness from the **card width (container queries)**, not viewport whenever possible.


## 2. Size System & Breakpoints

### 2.1 PopupDesignConfig

We keep `PopupDesignConfig` as the single source of truth:
- `size: PopupSize` – `"small" | "medium" | "large"` (global size).
- `popupSize?: "compact" | "standard" | "wide" | "full"` – FlashSale-specific.
- `position`, `borderRadius`, `maxWidth`, `fontFamily`, colors, etc.

### 2.2 Card size → maxWidth mapping

**Base modal card widths** (applied by `PopupCard` when `displayMode === "modal"`):
- `small`:   `max-width ≈ 400px`
- `medium`:  `max-width ≈ 560–600px`
- `large`:   `max-width ≈ 720–800px`

All modal cards use:
- `width: 100%` up to `max-width` and are centered in `PopupPortal`.
- `margin: 0 auto` inside the portal content area.

**Variant adjustments** (preliminary):
- `variant="cart"` (CartAbandonment): bias toward wider values in the above ranges.
- `variant="upsell"` / `"hero"` (Upsell, FlashSale): allow up to ~840–900px for `large`.

### 2.3 Container breakpoints (card-centric)

All modal cards declare:
```css
.popup-card {
  container-type: inline-size;
  container-name: popup-card;
}
```

Standard **card-width breakpoints**:
- `xs` (mobile): `< 480px`
- `sm/md` (tablet / small desktop): `480px – 800px`
- `lg` (desktop): `≥ 800px`

Behavior:
- `xs`: `grid-template-columns: 1fr` (single-column card).
- `sm/md`: optional 2-column layouts via `.popup-card--two-column`.
- `lg`: same columns, but increased padding/typography.


## 3. Core Primitives

### 3.1 PopupCard

Responsibilities:
- Wraps modal content inside `PopupPortal`.
- Applies consistent width, max-width, border radius, shadow.
- Sets card-level container query.

Props (conceptual):
- `variant?: "default" | "cart" | "upsell" | "hero" | "spin"`.
- `size?: PopupSize` (defaults to config.size).
- `design: Pick<PopupDesignConfig, "backgroundColor" | "textColor" | "borderRadius" | "boxShadow" | "fontFamily" | "maxWidth">`.
- `twoColumn?: boolean` – opt-in to 2-column card grid.

Layout:
- `display: grid; grid-template-columns: 1fr; gap: 1.5rem;`.
- If `twoColumn`, at `@container popup-card (min-width: 480px)`:
  - `grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr)`.

### 3.2 PopupHeading / PopupText

Responsibilities:
- Provide consistent typography for titles and body text.

PopupHeading (conceptual):
- `level?: "h1" | "h2" | "h3"`.
- `size?: "sm" | "md" | "lg"` (derived from card size).
- Uses card size + breakpoint to adjust `font-size` and `margin-bottom`.

PopupText:
- `tone?: "default" | "muted" | "accent" | "error" | "success"`.
- `variant?: "body" | "caption"`.
- Maps to appropriate `font-size`, `line-height`, and color (using `textColor`, `descriptionColor`, `accentColor`, `successColor`).

### 3.3 PopupButton

Responsibilities:
- Standard button styling for all popups (modals + banners + slide-ins).

Props (conceptual):
- `variant?: "primary" | "secondary" | "ghost" | "danger"`.
- `size?: "sm" | "md" | "lg"`.
- `fullWidth?: boolean`.
- `design: Pick<PopupDesignConfig, "buttonColor" | "buttonTextColor" | "borderRadius">` (plus override colors when needed).

Behavior:
- On `xs` cards and banners, primary buttons default to `fullWidth`.
- On wider cards, they can appear side-by-side using a parent flex/grid container.

### 3.4 PopupInput

Responsibilities:
- Unified styling for text/email inputs (modals + in-bar forms).

Props (conceptual):
- `type: "text" | "email"`.
- `error?: string | boolean`.
- `design: Pick<PopupDesignConfig, "inputBackgroundColor" | "inputTextColor" | "inputBorderColor">`.

Behavior:
- Full-width by default.
- Standard border radius, padding, and focus ring.
- Error state uses a common red tone and `PopupText tone="error"` for message.

### 3.5 CloseButton / IconButton

Responsibilities:
- Consistent close “×” and icon buttons across modals, banners, toasts.

Props (conceptual):
- `variant?: "circle" | "plain"`.
- `size?: "sm" | "md"`.
- `ariaLabel: string`.

Behavior:
- In modals: positioned absolutely in top-right of `PopupCard`.
- In banners: absolute inside inner container or as a grid cell.
- In toasts/slide-ins: inline in a flex row.


## 4. Layout Patterns by Family

### 4.1 Modal popups (displayMode = "modal")

- All use `PopupPortal` + `PopupCard`.
- `Newsletter`, `Scratch`, `Spin`:
  - `twoColumn = true` on `sm/md`+ widths for image/wheel vs form.
- `CartAbandonment`:
  - `variant="cart"`, `twoColumn = true` on `sm/md`+; left: items, right: summary/actions.
- `ProductUpsell`:
  - Uses `PopupCard` plus an internal **items grid** for products (`1/2/3+` columns based on card width).
- `FlashSale` modal:
  - `variant="hero"`; single column content but can use wider `max-width`.

### 4.2 Banners / bars

- No `PopupPortal`; full-width fixed/sticky at top/bottom.
- Inner container (`max-width: 1200px`) uses **Grid**:
  - Desktop: usually `grid-template-columns: 2fr 2fr auto` (left/center/right).
  - Mobile: `1fr` columns, rows stacked ([text], [timer/progress], [CTA]).
- All CTAs use `PopupButton` and closes use `CloseButton`.

### 4.3 Toasts / slide-ins

- SocialProof: small fixed card, **Flex** row for icon + text + close; no grid needed.
- SlideIn: single-column card; internals can use flex column + `PopupButton` + `CloseButton`.

These primitives + layout rules should be the foundation for refactoring each popup, starting with CartAbandonment and then cascading to other modals and banners.
