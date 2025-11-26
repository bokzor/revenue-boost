# Storefront Components Refactoring Opportunities

This document identifies refactoring opportunities specifically for **storefront popup components** in `app/domains/storefront/popups-new/`.

## Executive Summary

After analyzing all 11 storefront popup components, I've identified **8 major refactoring opportunities** that could:
- Reduce code duplication by ~400-600 lines
- Improve consistency across popups
- Simplify maintenance and testing
- Enhance performance

---

## Current State Analysis

### ✅ What's Already Good (Phase 1-4 Complete)
- **Hooks centralized:** `usePopupForm`, `useDiscountCode`, `useCountdownTimer`, `usePopupAnimation`
- **Shared components created:** DiscountCodeDisplay, SuccessState, LeadCaptureForm, TimerDisplay, PopupHeader, Icons
- **6 popups migrated:** Newsletter, FreeShipping, CartAbandonment, FlashSale, SpinToWin, CountdownTimer
- **PopupStyles.ts exists:** Centralized styling functions (but underutilized)

### ⚠️ What Needs Improvement
- **Inline styles still prevalent:** ~2,000+ lines of inline CSS across popups
- **CTA button logic duplicated:** 4 popups have identical CTA handling
- **Color scheme logic duplicated:** 3 popups implement custom color schemes
- **Responsive breakpoints duplicated:** Same media queries in 8+ popups
- **Animation patterns duplicated:** Similar animation logic in 5+ popups
- **PopupStyles.ts underutilized:** Only used in preview, not in actual popups

---

## Opportunity 1: Adopt PopupStyles.ts Utilities

### Current State
`PopupStyles.ts` exists with comprehensive styling functions, but **actual popup components don't use it**:

```typescript
// PopupStyles.ts has these utilities:
export const getPopupButtonStyles = (config, buttonType) => { ... }
export const getPopupTitleStyles = (config) => { ... }
export const getPopupCloseButtonStyles = (textColor) => { ... }
export const getBasePopupStyles = (config, templateType) => { ... }

// But popups use inline styles instead:
// AnnouncementPopup.tsx
const bannerStyles: React.CSSProperties = {
  position: config.sticky ? "sticky" : "fixed",
  [config.position === "bottom" ? "bottom" : "top"]: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.backgroundColor,
  color: colors.textColor,
  padding: "14px 20px",
  zIndex: 10000,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
```

### Proposed Solution
**Adopt existing PopupStyles.ts utilities** across all popups:

```typescript
// AnnouncementPopup.tsx (refactored)
import { getBannerStyles, getPopupButtonStyles } from "~/domains/storefront/shared/PopupStyles";

const bannerStyles = getBannerStyles(config, {
  position: config.position,
  sticky: config.sticky,
});

const buttonStyles = getPopupButtonStyles(config, "primary");
```

### Impact
- **Lines saved:** ~200-300 lines
- **Files affected:** 8 popups (Announcement, CountdownTimer, ProductUpsell, SocialProof, ScratchCard, FlashSale, Newsletter, CartAbandonment)
- **Consistency:** Guaranteed visual consistency
- **Risk:** Low (utilities already exist and tested)

### Implementation Steps
1. Extend PopupStyles.ts with missing utilities (banner styles, notification styles)
2. Replace inline styles in each popup with utility calls
3. Test visual parity
4. Remove duplicate style objects

---

## Opportunity 2: CTA Button Component

### Current State
CTA button logic is duplicated in **4 popups** with identical patterns:

```typescript
// AnnouncementPopup.tsx
const handleCtaClick = useCallback(() => {
  if (onCtaClick) {
    onCtaClick();
  }
  
  if (config.ctaUrl) {
    if (config.ctaOpenInNewTab) {
      window.open(config.ctaUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = config.ctaUrl;
    }
  }
}, [config, onCtaClick]);

// CountdownTimerPopup.tsx - IDENTICAL CODE
// ProductUpsellPopup.tsx - IDENTICAL CODE  
// SocialProofPopup.tsx - SIMILAR CODE
```

### Proposed Solution
Create a shared `CTAButton` component:

```typescript
// app/domains/storefront/popups-new/components/shared/CTAButton.tsx

export interface CTAButtonProps {
  text: string;
  url?: string;
  openInNewTab?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  accentColor?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  text,
  url,
  openInNewTab,
  onClick,
  variant = "primary",
  accentColor,
  textColor,
  className,
  style,
}) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
    
    if (url) {
      if (openInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = url;
      }
    }
  }, [url, openInNewTab, onClick]);
  
  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        ...getButtonStyles(variant, accentColor, textColor),
        ...style,
      }}
    >
      {text}
    </button>
  );
};
```

### Impact
- **Lines saved:** ~80-100 lines
- **Files affected:** 4 popups (Announcement, CountdownTimer, ProductUpsell, SocialProof)
- **Consistency:** Standardized CTA behavior
- **Risk:** Low (simple component)

---

## Opportunity 3: Color Scheme Utility Hook

### Current State
Color scheme logic is duplicated in **3 popups**:

```typescript
// AnnouncementPopup.tsx
const getColorScheme = useCallback(() => {
  if (config.colorScheme === "custom") {
    return {
      backgroundColor: config.backgroundColor || "#ffffff",
      textColor: config.textColor || "#111827",
    };
  }
  
  switch (config.colorScheme) {
    case "info":
      return { backgroundColor: "#3b82f6", textColor: "#ffffff" };
    case "success":
      return { backgroundColor: "#10b981", textColor: "#ffffff" };
    case "urgent":
      return { backgroundColor: "#ef4444", textColor: "#ffffff" };
    default:
      return { backgroundColor: "#ffffff", textColor: "#111827" };
  }
}, [config]);

// CountdownTimerPopup.tsx - IDENTICAL CODE
// SocialProofPopup.tsx - SIMILAR CODE
```

### Proposed Solution
Create a `useColorScheme` hook:

```typescript
// app/domains/storefront/popups-new/hooks/useColorScheme.ts

export function useColorScheme(
  colorScheme: "custom" | "info" | "success" | "urgent",
  customColors?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  }
) {
  return useMemo(() => {
    if (colorScheme === "custom") {
      return {
        backgroundColor: customColors?.backgroundColor || "#ffffff",
        textColor: customColors?.textColor || "#111827",
        accentColor: customColors?.accentColor || "#3b82f6",
      };
    }
    
    const schemes = {
      info: { backgroundColor: "#3b82f6", textColor: "#ffffff", accentColor: "#2563eb" },
      success: { backgroundColor: "#10b981", textColor: "#ffffff", accentColor: "#059669" },
      urgent: { backgroundColor: "#ef4444", textColor: "#ffffff", accentColor: "#dc2626" },
    };
    
    return schemes[colorScheme] || schemes.info;
  }, [colorScheme, customColors]);
}
```

### Impact
- **Lines saved:** ~60-80 lines
- **Files affected:** 3 popups (Announcement, CountdownTimer, SocialProof)
- **Consistency:** Standardized color schemes
- **Risk:** Low (pure utility hook)

---

## Opportunity 4: Responsive Breakpoint Constants

### Current State
Responsive breakpoints are duplicated across **8+ popups**:

```typescript
// NewsletterPopup.tsx
@container popup (min-width: 600px) {
  .email-popup-form-section {
    padding: 3rem;
  }
}

// FlashSalePopup.tsx
@media (max-width: 640px) {
  .flash-sale-container {
    padding: 1.5rem;
  }
}

// ProductUpsellPopup.tsx
@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
```

### Proposed Solution
Create centralized breakpoint constants:

```typescript
// app/domains/storefront/popups-new/breakpoints.ts

export const POPUP_BREAKPOINTS = {
  // Container queries (for popups using @container)
  container: {
    sm: "400px",
    md: "600px",
    lg: "800px",
  },

  // Media queries (for full-screen elements)
  media: {
    mobile: "640px",
    tablet: "768px",
    desktop: "1024px",
  },
} as const;

// Helper to generate media query strings
export const mediaQuery = {
  mobile: `@media (max-width: ${POPUP_BREAKPOINTS.media.mobile})`,
  tablet: `@media (max-width: ${POPUP_BREAKPOINTS.media.tablet})`,
  desktop: `@media (min-width: ${POPUP_BREAKPOINTS.media.desktop})`,
  container: {
    sm: `@container popup (min-width: ${POPUP_BREAKPOINTS.container.sm})`,
    md: `@container popup (min-width: ${POPUP_BREAKPOINTS.container.md})`,
    lg: `@container popup (min-width: ${POPUP_BREAKPOINTS.container.lg})`,
  },
};
```

### Impact
- **Lines saved:** ~40-60 lines
- **Files affected:** 8 popups (all except SocialProof, Announcement, CountdownTimer)
- **Consistency:** Standardized responsive behavior
- **Risk:** Very Low (constants only)

---

## Opportunity 5: Animation Utilities

### Current State
Similar animation patterns are duplicated in **5+ popups**:

```typescript
// FlashSalePopup.tsx
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// CartAbandonmentPopup.tsx
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// SpinToWinPopup.tsx
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Proposed Solution
Extend `animations.css` with common patterns:

```css
/* app/domains/storefront/popups-new/components/shared/animations.css */

/* Already exists: fadeIn, slideIn, scaleIn, spin, checkmark */

/* Add these common patterns: */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDownFade {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor;
  }
}
```

### Impact
- **Lines saved:** ~50-70 lines
- **Files affected:** 5 popups (FlashSale, CartAbandonment, SpinToWin, ScratchCard, ProductUpsell)
- **Consistency:** Standardized animations
- **Risk:** Low (CSS only)

---

## Opportunity 6: Gradient Background Utility

### Current State
Gradient background logic is duplicated in **2 popups**:

```typescript
// AnnouncementPopup.tsx
const hasGradientBg =
  typeof colors.backgroundColor === "string" && colors.backgroundColor.includes("gradient");

const bannerBackgroundStyles: React.CSSProperties = hasGradientBg
  ? {
      backgroundImage: colors.backgroundColor,
      backgroundColor: "transparent",
    }
  : {
      backgroundColor: colors.backgroundColor,
    };

// CountdownTimerPopup.tsx - IDENTICAL CODE
```

### Proposed Solution
Create a utility function:

```typescript
// app/domains/storefront/popups-new/utils.ts (add to existing file)

export function getBackgroundStyles(backgroundColor: string): React.CSSProperties {
  const hasGradient = backgroundColor.includes("gradient");

  return hasGradient
    ? {
        backgroundImage: backgroundColor,
        backgroundColor: "transparent",
      }
    : {
        backgroundColor,
      };
}
```

### Impact
- **Lines saved:** ~20-30 lines
- **Files affected:** 2 popups (Announcement, CountdownTimer)
- **Consistency:** Standardized gradient handling
- **Risk:** Very Low (simple utility)

---

## Opportunity 7: Close Button Component

### Current State
Close button implementation varies across popups:

```typescript
// CartAbandonmentPopup.tsx
{config.showCloseButton !== false && (
  <button className="cart-ab-close" onClick={onClose} aria-label="Close popup">
    <CloseIcon size={20} color={config.textColor} />
  </button>
)}

// FlashSalePopup.tsx
<button onClick={onClose} className="flash-sale-close" aria-label="Close popup">
  <CloseIcon size={20} color={config.textColor} />
</button>

// NewsletterPopup.tsx - Uses PopupPortal's built-in close button
```

### Proposed Solution
Create a standardized `PopupCloseButton` component:

```typescript
// app/domains/storefront/popups-new/components/shared/PopupCloseButton.tsx

export interface PopupCloseButtonProps {
  onClose: () => void;
  color?: string;
  size?: number;
  className?: string;
  position?: "top-right" | "top-left" | "custom";
  show?: boolean;
}

export const PopupCloseButton: React.FC<PopupCloseButtonProps> = ({
  onClose,
  color = "#111827",
  size = 20,
  className,
  position = "top-right",
  show = true,
}) => {
  if (!show) return null;

  const positionStyles: React.CSSProperties = position === "custom" ? {} : {
    position: "absolute",
    top: "10px",
    [position === "top-right" ? "right" : "left"]: "10px",
  };

  return (
    <button
      onClick={onClose}
      className={className}
      aria-label="Close popup"
      style={{
        ...positionStyles,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.7,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
    >
      <CloseIcon size={size} color={color} />
    </button>
  );
};
```

### Impact
- **Lines saved:** ~30-40 lines
- **Files affected:** 3 popups (CartAbandonment, FlashSale, FreeShipping)
- **Consistency:** Standardized close button behavior
- **Risk:** Low (simple component)

---

## Opportunity 8: Scoped CSS Builder Adoption

### Current State
Only **3 popups** use `buildScopedCss` utility:

```typescript
// AnnouncementPopup.tsx ✅
const scopedCss = useMemo(
  () => buildScopedCss(
    config.globalCustomCSS,
    config.customCSS,
    "data-rb-banner",
    "announcement",
  ),
  [config.customCSS, config.globalCustomCSS],
);

// CountdownTimerPopup.tsx ✅
// SocialProofPopup.tsx ✅

// But 8 other popups DON'T use it:
// NewsletterPopup.tsx - inline <style> tag
// FlashSalePopup.tsx - inline <style> tag
// etc.
```

### Proposed Solution
Adopt `buildScopedCss` consistently across all popups:

```typescript
// Before (NewsletterPopup.tsx)
<style>
  {`
    .email-popup-image {
      position: relative;
      overflow: hidden;
      ...
    }
  `}
</style>

// After
const scopedCss = useMemo(
  () => buildScopedCss(
    config.globalCustomCSS,
    config.customCSS,
    "data-rb-popup",
    "newsletter",
  ),
  [config.customCSS, config.globalCustomCSS],
);

{scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
```

### Impact
- **Lines saved:** ~0 lines (refactoring for consistency)
- **Files affected:** 8 popups (all except Announcement, CountdownTimer, SocialProof)
- **Consistency:** Standardized custom CSS handling
- **Risk:** Low (utility already exists)

---

## Priority Ranking

| Opportunity | Impact | Effort | Risk | Lines Saved | Priority |
|-------------|--------|--------|------|-------------|----------|
| 1. Adopt PopupStyles.ts | High | Medium | Low | 200-300 | 🔥 High |
| 2. CTA Button Component | Medium | Low | Low | 80-100 | 🔥 High |
| 3. Color Scheme Hook | Medium | Low | Low | 60-80 | 🔥 High |
| 5. Animation Utilities | Medium | Low | Low | 50-70 | ⚠️ Medium |
| 4. Breakpoint Constants | Low | Very Low | Very Low | 40-60 | ⚠️ Medium |
| 7. Close Button Component | Low | Low | Low | 30-40 | ⚠️ Medium |
| 6. Gradient Utility | Low | Very Low | Very Low | 20-30 | ❄️ Low |
| 8. Scoped CSS Adoption | Low | Low | Low | 0 | ❄️ Low |

**Total Potential Savings:** ~480-680 lines

---

## Recommended Implementation Plan

### Phase A: Quick Wins (Week 1)
**Focus:** High-impact, low-effort improvements

1. **CTA Button Component** (Opportunity 2)
   - Create component
   - Migrate 4 popups
   - Test behavior
   - **Estimated time:** 2-3 hours

2. **Color Scheme Hook** (Opportunity 3)
   - Create hook
   - Migrate 3 popups
   - Test color schemes
   - **Estimated time:** 1-2 hours

3. **Gradient Utility** (Opportunity 6)
   - Add utility function
   - Migrate 2 popups
   - **Estimated time:** 30 minutes

**Total Phase A:** ~4-6 hours, ~160-210 lines saved

### Phase B: Medium Wins (Week 2)
**Focus:** Styling consistency

1. **Adopt PopupStyles.ts** (Opportunity 1)
   - Extend PopupStyles.ts with missing utilities
   - Migrate 8 popups one by one
   - Test visual parity
   - **Estimated time:** 8-10 hours

2. **Close Button Component** (Opportunity 7)
   - Create component
   - Migrate 3 popups
   - **Estimated time:** 1-2 hours

**Total Phase B:** ~9-12 hours, ~230-340 lines saved

### Phase C: Polish (Week 3)
**Focus:** Consistency and maintainability

1. **Animation Utilities** (Opportunity 5)
   - Extend animations.css
   - Migrate 5 popups
   - **Estimated time:** 2-3 hours

2. **Breakpoint Constants** (Opportunity 4)
   - Create constants file
   - Migrate 8 popups
   - **Estimated time:** 2-3 hours

3. **Scoped CSS Adoption** (Opportunity 8)
   - Migrate 8 popups
   - **Estimated time:** 2-3 hours

**Total Phase C:** ~6-9 hours, ~90-130 lines saved

---

## Success Metrics

### Code Quality
- **Duplication reduction:** Target 480-680 lines removed
- **Consistency score:** 100% of popups use shared utilities
- **Test coverage:** Maintain 100% passing tests

### Developer Experience
- **Time to add new popup:** Reduce by additional 20-30%
- **Time to fix styling bugs:** Reduce by 50%
- **Onboarding time:** Reduce by additional 20%

### Performance
- **Bundle size:** Reduce by ~2-3% (shared utilities vs. inline code)
- **Runtime performance:** No regression (utilities are optimized)

---

## Next Steps

**Option 1: Implement Phase A (Quick Wins)**
- Start with CTA Button, Color Scheme Hook, Gradient Utility
- Low effort, high impact improvements
- Can be completed in 1 day

**Option 2: Full Implementation (All Phases)**
- Complete all 8 opportunities
- Estimated time: 3 weeks
- Total impact: ~480-680 lines saved

**Option 3: Cherry-Pick Specific Opportunities**
- Choose specific opportunities based on priorities
- Flexible approach

Would you like me to proceed with any of these options?


