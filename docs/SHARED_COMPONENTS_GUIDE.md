# Shared Popup Components Guide

This guide documents the shared components created during the UI refactoring (Phases 1-3) and provides best practices for using them in popup templates.

## Overview

The shared components are located in `app/domains/storefront/popups-new/components/shared/` and provide reusable UI patterns for all popup templates.

## Component Catalog

### Phase 1: Foundation Components

#### Icons

**CloseIcon** - Close/dismiss button icon
```tsx
import { CloseIcon } from "./components/shared";

<CloseIcon size={20} color="#000000" />
```

**CheckmarkIcon** - Success indicator icon
```tsx
import { CheckmarkIcon } from "./components/shared";

<CheckmarkIcon size={24} color="#10B981" />
```

**SpinnerIcon** - Loading indicator icon
```tsx
import { SpinnerIcon } from "./components/shared";

<SpinnerIcon size={20} color="#3B82F6" />
```

**ChevronIcon** - Directional arrow icon
```tsx
import { ChevronIcon } from "./components/shared";

<ChevronIcon direction="down" size={16} color="#6B7280" />
```

#### LoadingSpinner

Animated loading indicator with optional text.

```tsx
import { LoadingSpinner } from "./components/shared";

<LoadingSpinner size="md" color="#3B82F6" text="Loading..." />
```

**Props:**
- `size`: "sm" | "md" | "lg" (default: "md")
- `color`: string (default: "#3B82F6")
- `text`: string (optional)

**When to use:** Form submissions, data fetching, async operations

---

### Phase 2: Core Components

#### DiscountCodeDisplay

Displays discount codes with copy functionality in multiple visual styles.

```tsx
import { DiscountCodeDisplay } from "./components/shared";

<DiscountCodeDisplay
  code="SAVE20"
  onCopy={handleCopyCode}
  copied={copiedCode}
  label="Your Discount Code"
  variant="dashed"
  size="md"
  accentColor="#3B82F6"
  textColor="#111827"
/>
```

**Props:**
- `code`: string (required) - The discount code to display
- `onCopy`: () => void (required) - Copy handler
- `copied`: boolean (required) - Copy state
- `label`: string (optional) - Label above code
- `variant`: "dashed" | "solid" | "minimal" (default: "dashed")
- `size`: "sm" | "md" | "lg" (default: "md")
- `accentColor`: string (optional)
- `textColor`: string (optional)
- `backgroundColor`: string (optional)

**Variants:**
- **dashed**: Dashed border, prominent display (default)
- **solid**: Solid border, card-like appearance
- **minimal**: No border, inline text style

**When to use:**
- Newsletter success states
- Spin-to-win prize reveals
- Cart abandonment incentives
- Flash sale promotions

---

#### SuccessState

Animated success message with optional discount code display.

```tsx
import { SuccessState } from "./components/shared";

<SuccessState
  message="Thanks for subscribing!"
  discountCode="SAVE20"
  onCopyCode={handleCopyCode}
  copiedCode={copiedCode}
  animation="bounce"
  accentColor="#10B981"
  textColor="#111827"
/>
```

**Props:**
- `message`: string (required) - Success message
- `discountCode`: string (optional) - Discount code to display
- `onCopyCode`: () => void (optional) - Copy handler
- `copiedCode`: boolean (optional) - Copy state
- `icon`: React.ReactNode (optional) - Custom icon (default: CheckmarkIcon)
- `animation`: "fade" | "bounce" | "zoom" | "slideUp" (default: "bounce")
- `accentColor`: string (optional)
- `textColor`: string (optional)

**When to use:**
- Form submission success
- Email capture confirmation
- Prize win notifications
- Goal completion states

---

#### LeadCaptureForm

Composable form for capturing email, name, and GDPR consent.

```tsx
import { LeadCaptureForm } from "./components/shared";

<LeadCaptureForm
  data={formState}
  errors={errors}
  onEmailChange={setEmail}
  onNameChange={setName}
  onGdprChange={setGdprConsent}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  showName={true}
  nameRequired={false}
  showGdpr={true}
  gdprRequired={true}
  labels={{
    email: "Email Address",
    name: "Full Name",
    gdpr: "I agree to receive emails",
    submit: "Subscribe"
  }}
  placeholders={{
    email: "you@example.com",
    name: "John Doe"
  }}
  accentColor="#3B82F6"
  textColor="#111827"
/>
```

**Props:**
- `data`: { email, name, gdprConsent } (required)
- `errors`: { email?, name?, gdpr? } (required)
- `onEmailChange`: (value: string) => void (required)
- `onNameChange`: (value: string) => void (required)
- `onGdprChange`: (checked: boolean) => void (required)
- `onSubmit`: (e?: FormEvent) => void (required)
- `isSubmitting`: boolean (required)
- `showName`: boolean (default: false)
- `nameRequired`: boolean (default: false)
- `showGdpr`: boolean (default: false)
- `gdprRequired`: boolean (default: false)
- `hideSubmitButton`: boolean (default: false)
- `labels`: { email?, name?, gdpr?, submit? }
- `placeholders`: { email?, name? }
- `accentColor`: string (optional)
- `textColor`: string (optional)
- `backgroundColor`: string (optional)

**When to use:**
- Newsletter signups
- Lead generation forms
- Email gates
- Contest entries

**Note:** For unique flows (like SpinToWinPopup with separate spin button), use individual FormFields instead.

---

#### TimerDisplay

Countdown timer display in multiple formats.

```tsx
import { TimerDisplay } from "./components/shared";

<TimerDisplay
  timeRemaining={{ days: 0, hours: 2, minutes: 30, seconds: 45, total: 9045000 }}
  format="full"
  showDays={true}
  showLabels={true}
  backgroundColor="rgba(0, 0, 0, 0.1)"
  textColor="#111827"
  separatorColor="#6B7280"
/>
```

**Props:**
- `timeRemaining`: { days, hours, minutes, seconds, total } (required)
- `format`: "full" | "compact" | "minimal" (default: "full")
- `showDays`: boolean (default: true)
- `showLabels`: boolean (default: true)
- `backgroundColor`: string (optional)
- `textColor`: string (optional)
- `separatorColor`: string (optional)
- `className`: string (optional)
- `style`: CSSProperties (optional)

**Formats:**
- **full**: Large display with labels (Days, Hours, Mins, Secs)
- **compact**: Medium display with abbreviated labels (D, H, M, S)
- **minimal**: Small inline display (2:30:45)

**When to use:**
- Flash sale countdowns
- Cart abandonment urgency
- Limited-time offers
- Countdown timer banners

**Integration:** Works seamlessly with `useCountdownTimer` hook.

---

#### PopupHeader

Flexible headline and subheadline component.

```tsx
import { PopupHeader } from "./components/shared";

<PopupHeader
  headline="Join Our Newsletter"
  subheadline="Get 10% off your first order"
  textColor="#111827"
  headlineFontSize="28px"
  headlineFontWeight="700"
  subheadlineFontSize="16px"
  align="center"
/>
```

**Props:**
- `headline`: string (required)
- `subheadline`: string (optional)
- `textColor`: string (optional)
- `headlineFontSize`: string (optional)
- `headlineFontWeight`: string (optional)
- `subheadlineFontSize`: string (optional)
- `subheadlineFontWeight`: string (optional)
- `align`: "left" | "center" | "right" (default: "center")
- `spacing`: string (optional) - Gap between headline and subheadline
- `className`: string (optional)
- `style`: CSSProperties (optional)

**When to use:**
- All popup types for consistent header styling
- Replaces inline headline/subheadline markup

---

### Animations

Shared animation keyframes are available in `components/shared/animations.css`.

**Available animations:**
- `fadeIn`, `fadeOut`, `fadeInUp`, `fadeOutDown`
- `zoomIn`, `zoomOut`
- `bounceIn`, `bounceOut`
- `slideInLeft`, `slideInRight`, `slideInUp`, `slideInDown`
- `slideOutLeft`, `slideOutRight`
- `spin`, `pulse`, `slideUpFade`

**Usage:**
```tsx
import "./components/shared/animations.css";

// Then use in CSS
.my-element {
  animation: fadeIn 0.3s ease-out;
}
```

**Accessibility:** All animations respect `prefers-reduced-motion` media query.

---

## Best Practices

### When to Use Shared Components

✅ **DO use shared components when:**
- The UI pattern matches an existing shared component
- You need consistent styling across popups
- The component provides the exact functionality needed
- You want to reduce code duplication

❌ **DON'T force shared components when:**
- The popup has unique visual requirements (e.g., ScratchCard glassmorphism overlay)
- The flow is non-standard (e.g., SpinToWin with separate spin button)
- Custom animations or interactions are required
- The shared component would need extensive customization

### Component Composition

Shared components are designed to compose well together:

```tsx
// Example: Newsletter success state
<SuccessState
  message="Thanks for subscribing!"
  discountCode={displayDiscountCode}
  onCopyCode={handleCopyCode}
  copiedCode={copiedCode}
  animation="bounce"
/>

// Example: Cart abandonment with timer and discount
<>
  <TimerDisplay
    timeRemaining={timeRemaining}
    format="compact"
  />
  <DiscountCodeDisplay
    code="SAVE10"
    variant="dashed"
    size="lg"
  />
</>
```

### Theming

All shared components accept color props that should be passed from `PopupDesignConfig`:

```tsx
<LeadCaptureForm
  accentColor={config.buttonColor}
  textColor={config.textColor}
  backgroundColor={config.inputBackgroundColor}
  // ... other props
/>
```

### Testing

All shared components have comprehensive unit tests. When using shared components:
- Existing tests should continue to pass
- Update test selectors if component structure changes
- Test custom props and variants

---

## Migration Examples

### Before: Inline Success State
```tsx
{isSubmitted && (
  <div className="success-message">
    <div className="checkmark-icon">✓</div>
    <p>Thanks for subscribing!</p>
    {discountCode && (
      <div className="discount-code">
        <span>{discountCode}</span>
        <button onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    )}
  </div>
)}
```

### After: Shared Component
```tsx
{isSubmitted && (
  <SuccessState
    message="Thanks for subscribing!"
    discountCode={discountCode}
    onCopyCode={handleCopyCode}
    copiedCode={copied}
    animation="bounce"
    accentColor={config.buttonColor}
  />
)}
```

**Benefits:** ~50 lines reduced, consistent styling, built-in animations, accessibility support.

---

## Component Reference Table

| Component | Lines Saved | Used By | Key Features |
|-----------|-------------|---------|--------------|
| CloseIcon | ~15/popup | All popups | Consistent close button |
| CheckmarkIcon | ~15/popup | Success states | Animated checkmark |
| SpinnerIcon | ~15/popup | Loading states | Rotating spinner |
| LoadingSpinner | ~20/popup | 4 popups | Size variants, optional text |
| DiscountCodeDisplay | ~40/popup | 5 popups | 3 variants, copy functionality |
| SuccessState | ~50/popup | 4 popups | Animated, optional discount |
| LeadCaptureForm | ~80/popup | 5 popups | Composable, flexible fields |
| TimerDisplay | ~75/popup | 3 popups | 3 formats, countdown integration |
| PopupHeader | ~20/popup | All popups | Consistent headers |

**Total lines saved:** ~455 lines across 11 popups

---

## Future Enhancements

Potential additions for Phase 5:
- `PopupFooter` component (if patterns emerge)
- QR code variant for `DiscountCodeDisplay`
- Storybook stories for visual testing
- Shared package for Preact storefront

---

## Support

For questions or issues with shared components:
1. Check component JSDoc comments for detailed prop documentation
2. Review unit tests in `tests/unit/domains/storefront/popups-new/components/shared/`
3. See `ARCHITECTURE_DIAGRAM.md` for system architecture
4. Refer to `UI_REFACTORING_PLAN.md` for refactoring context


