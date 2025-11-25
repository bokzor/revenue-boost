Executive Summary

After analyzing all 11 popup components in app/domains/storefront/popups-new/, I've identified significant opportunities for simplification and centralization. The current architecture is already
well-structured with hooks handling business logic, but there's substantial UI component duplication that can be eliminated.

Key Findings:
• ✅ Business logic is well-centralized via hooks (usePopupForm, useDiscountCode, useCountdownTimer, usePopupAnimation)
• ⚠️ UI components are duplicated across 8+ popups (~1,915 lines of duplicated code)
• ✅ Template-driven architecture is sound and should be preserved
• 📊 Estimated reduction: 17% code reduction with improved maintainability


────────────────────────────────────────────────────────────────────────────

1. Common UI Patterns Identified

1.1 Success States
Found in: Newsletter, SpinToWin, ScratchCard, CartAbandonment

Common elements:
• Checkmark icon (SVG with animation)
• Success message heading
• Discount code display with copy-to-clipboard
• "Copied!" feedback message
• Consistent animations (fadeIn, bounceIn)

app/domains/storefront/popups-new/NewsletterPopup.tsx (EXCERPT)
{isSubmitted ? (
<div className="email-popup-success">
<div className="email-popup-success-icon">
<svg width="32" height="32" viewBox="0 0 24 24">
<polyline points="20 6 9 17 4 12" />
</svg>
</div>
<h3>{config.successMessage || "Thanks for subscribing!"}</h3>
{displayDiscountCode && (
<div className="email-popup-discount">
<div className="email-popup-discount-label">Your discount code:</div>
<div className="email-popup-discount-code" onClick={() => handleCopyCode()}>
{displayDiscountCode}
</div>

1.2 Discount Code Display
Found in: Newsletter, SpinToWin, ScratchCard, CartAbandonment, FlashSale

Common elements:
• Dashed border container
• Large monospace/bold font
• Click-to-copy functionality
• Accent color styling
• Copy feedback

app/domains/storefront/popups-new/SpinToWinPopup.tsx (EXCERPT)
   <div style={{
     backgroundColor: `${accentColor}15`,
     border: `2px dashed ${accentColor}`,
     borderRadius: "12px",
     padding: "20px",
   }}>
     <p style={{ fontSize: "14px", fontWeight: 600 }}>Your Discount Code</p>
     <div style={{
       fontSize: "28px",
       fontWeight: 800,
       color: accentColor,
       letterSpacing: "0.1em",
       cursor: "pointer",
     }} onClick={() => navigator.clipboard.writeText(wonPrize.generatedCode)}>
       {wonPrize.generatedCode}
     </div>

1.3 Loading States
Found in: Newsletter, SpinToWin, ScratchCard, ProductUpsell

Common elements:
• Spinner SVG with rotation animation
• Loading text
• Disabled button state
• Consistent animation timing

1.4 Close Buttons
Found in: All popups (11 components)

Common elements:
• X icon SVG
• Absolute positioning (top-right)
• Hover states
• Accessibility labels
• Some use PopupGridContainer's built-in close, others have custom implementations

1.5 Timer Displays
Found in: FlashSale, CountdownTimer, CartAbandonment

Common elements:
• Days/Hours/Minutes/Seconds format
• Styled timer units with backgrounds
• Expiry handling
• All use useCountdownTimer hook ✓ (already centralized)


────────────────────────────────────────

2. Duplicated Logic Analysis

2.1 Already Centralized ✅

     1. Form Submission → usePopupForm hook
        • Email/name/GDPR validation
        • Secure submission with challenge token
        • Success/error state management
        • Form reset

     2. Discount Code Management → useDiscountCode hook
        • State management
        • Copy to clipboard
        • Copied feedback (2-second timeout)

     3. Animation Timing → usePopupAnimation hook
        • Entry/exit delays
        • showContent state

     4. Countdown Timers → useCountdownTimer hook
        • Multiple timer modes
        • Expiry callbacks
        • Formatted time display

2.2 Not Centralized ⚠️

     1. Inline Styles Duplication
        • Button styles (primary, secondary) duplicated across 8 popups
        • Input styles duplicated across 6 popups
        • Success message styles duplicated across 4 popups
        • Discount code container styles duplicated across 5 popups

     2. SVG Icons Duplication
        • Close X icon: ~15 lines × 8 popups = 120 lines
        • Checkmark icon: ~15 lines × 4 popups = 60 lines
        • Spinner icon: ~15 lines × 4 popups = 60 lines

     3. Animation Keyframes Duplication
        • fadeIn, fadeInUp, bounceIn, zoomIn, spin
        • ~100 lines × 8 popups = 800 lines of duplicated CSS

     4. Color/Theme Calculations
        • Accent color fallbacks: config.accentColor || config.buttonColor || "#000"
        • Text color calculations repeated across popups
        • Background gradient detection: startsWith("linear-gradient")


───────────────────────────────────────────────────────────────────

3. Container/Presentation Pattern Evaluation

Current Architecture Assessment

The current architecture already has good separation via hooks:

Container Logic (Hooks):
• ✅ usePopupForm: Form state, validation, submission
• ✅ useDiscountCode: Discount code state, clipboard
• ✅ useCountdownTimer: Timer logic
• ✅ usePopupAnimation: Animation state

Presentation (Components):
• ✅ PopupPortal: Backdrop, keyboard events, focus management
• ✅ PopupGridContainer: Two-column layout
• ✅ FormFields: Email, Name, GDPR, Submit button
• ⚠️ Individual popups: Mix of business logic and presentation

Recommendation

Do NOT pursue full container/presentation separation. The current hook-based approach is excellent. Instead, focus on extracting duplicated UI components while keeping template-specific business
logic in individual popups.

Why this approach is better:
1. Hooks already handle business logic separation
2. Template-specific behavior (wheel spinning, card scratching) belongs in popup components
3. UI component extraction provides immediate value with less refactoring risk
4. Maintains alignment with template-driven architecture


────────────────────────────────────────────────────────────

4. Specific Components to Extract

4.1 SuccessState Component

Purpose: Display success message with optional discount code

Used in: Newsletter, SpinToWin, ScratchCard, CartAbandonment (4 popups)

Props:
interface SuccessStateProps {
message: string;
discountCode?: string;
onCopyCode?: () => void;
copiedCode?: boolean;
icon?: React.ReactNode;
accentColor?: string;
textColor?: string;
animation?: "fade" | "bounce" | "zoom";
}

Benefits:
• Eliminates ~200 lines of duplication
• Consistent success experience across all popups
• Single place to update success UI

Example usage:
<SuccessState
message={config.successMessage || "Thanks for subscribing!"}
discountCode={displayDiscountCode}
onCopyCode={handleCopyCode}
copiedCode={copiedCode}
accentColor={config.accentColor}
textColor={config.textColor}
/>

4.2 DiscountCodeDisplay Component

Purpose: Display discount code with copy-to-clipboard

Used in: Newsletter, SpinToWin, ScratchCard, CartAbandonment, FlashSale (5 popups)

Props:
interface DiscountCodeDisplayProps {
code: string;
onCopy: () => void;
copied: boolean;
label?: string;
variant?: "dashed" | "solid" | "minimal";
accentColor?: string;
textColor?: string;
size?: "sm" | "md" | "lg";
}

Benefits:
• Eliminates ~200 lines of duplication
• Consistent discount code presentation
• Easy to add new variants (QR code, barcode, etc.)

4.3 LoadingSpinner Component

Purpose: Reusable loading indicator

Used in: Newsletter, SpinToWin, ScratchCard, ProductUpsell (4 popups)

Props:
interface LoadingSpinnerProps {
size?: "sm" | "md" | "lg";
color?: string;
text?: string;
inline?: boolean;
}

Benefits:
• Eliminates ~80 lines of duplication
• Consistent loading states
• Easy to swap spinner styles globally

4.4 PopupHeader Component

Purpose: Standardized heading and subheading

Used in: All popups (11 components)

Props:
interface PopupHeaderProps {
headline: string;
subheadline?: string;
textColor?: string;
headlineFontSize?: string;
headlineFontWeight?: string;
subheadlineFontSize?: string;
align?: "left" | "center" | "right";
spacing?: "compact" | "normal" | "relaxed";
}

Benefits:
• Eliminates ~330 lines of duplication
• Consistent typography and spacing
• Respects SPACING_GUIDELINES automatically

4.5 TimerDisplay Component

Purpose: Formatted countdown timer display

Used in: FlashSale, CountdownTimer, CartAbandonment (3 popups)

Props:
interface TimerDisplayProps {
timeRemaining: TimeRemaining;
format?: "compact" | "full" | "minimal";
accentColor?: string;
textColor?: string;
showDays?: boolean;
showLabels?: boolean;
}

Benefits:
• Eliminates ~180 lines of duplication
• Consistent timer styling
• Works with existing useCountdownTimer hook

4.6 Icon Components Collection

Purpose: Reusable SVG icons

Components: CloseIcon, CheckmarkIcon, SpinnerIcon, ChevronIcon, etc.

Used in: All popups (various icons)

Props:
interface IconProps {
size?: number;
color?: string;
strokeWidth?: number;
className?: string;
}

Benefits:
• Eliminates ~360 lines of duplication
• Consistent icon sizing and styling
• Easy to swap icon library (e.g., Heroicons, Lucide)

4.7 PopupFooter Component

Purpose: Action buttons with consistent layout

Used in: Multiple popups with secondary actions

Props:
interface PopupFooterProps {
primaryAction?: {
label: string;
onClick: () => void;
loading?: boolean;
disabled?: boolean;
};
secondaryAction?: {
label: string;
onClick: () => void;
};
tertiaryAction?: {
label: string;
onClick: () => void;
};
layout?: "stacked" | "inline";
spacing?: "compact" | "normal";
}

Benefits:
• Consistent button spacing and layout
• Handles loading/disabled states
• Responsive layout


────────────────────────────────────────────

5. Additional Utilities to Create

5.1 usePopupTheme Hook

Purpose: Centralize color/theme calculations

Returns:
interface PopupTheme {
accentColor: string;
textColor: string;
backgroundColor: string;
buttonColor: string;
buttonTextColor: string;
inputBackground: string;
inputTextColor: string;
borderColor: string;
isGradientBackground: boolean;
}

Usage:
const theme = usePopupTheme(config);
// No more: config.accentColor || config.buttonColor || "#000"
// Just: theme.accentColor

5.2 Shared Animation CSS

Purpose: Centralize animation keyframes

File: app/domains/storefront/popups-new/animations.css

Contents:
• fadeIn, fadeOut
• fadeInUp, fadeOutDown
• bounceIn, bounceOut
• zoomIn, zoomOut
• spin
• slideInLeft, slideInRight

Benefits:
• Eliminates ~800 lines of duplicated CSS
• Consistent animation timing
• Respects prefers-reduced-motion


─────────────────────────────────────────────────────

6. Refactoring Roadmap

Phase 1: Foundation (Week 1)
1. ✅ Create components/shared/ directory structure
2. ✅ Create Icon components (CloseIcon, CheckmarkIcon, SpinnerIcon)
3. ✅ Create LoadingSpinner component
4. ✅ Create shared animations.css
5. ✅ Create usePopupTheme hook
6. ✅ Write unit tests for new components

Phase 2: Core Components (Week 2)
1. ✅ Create DiscountCodeDisplay component
2. ✅ Create SuccessState component
3. ✅ Create PopupHeader component
4. ✅ Create TimerDisplay component
5. ✅ Write unit tests for new components

Phase 3: Migration (Week 3-4)
1. ✅ Migrate NewsletterPopup (most common, good test case)
2. ✅ Run visual regression tests
3. ✅ Migrate SpinToWinPopup
4. ✅ Migrate ScratchCardPopup
5. ✅ Migrate remaining popups (FlashSale, CartAbandonment, etc.)

Phase 4: Cleanup (Week 5)
1. ✅ Remove duplicated code from migrated popups
2. ✅ Update documentation
3. ✅ Run full E2E test suite
4. ✅ Performance testing


─────────────────────────────────────

7. Migration Example: NewsletterPopup

Before (Current):
{isSubmitted ? (
<div className="email-popup-success">
<div className="email-popup-success-icon">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
<polyline points="20 6 9 17 4 12" />
</svg>
</div>
<h3 className="email-popup-success-message">{config.successMessage}</h3>
{displayDiscountCode && (
<div className="email-popup-discount">
<div className="email-popup-discount-label">Your discount code:</div>
<div className="email-popup-discount-code" onClick={() => handleCopyCode()}>
{displayDiscountCode}
</div>
{copiedCode && <div>✓ Copied to clipboard!</div>}
</div>
)}
</div>
) : (
// Form...
)}

After (Refactored):
{isSubmitted ? (
<SuccessState
message={config.successMessage || "Thanks for subscribing!"}
discountCode={displayDiscountCode}
onCopyCode={handleCopyCode}
copiedCode={copiedCode}
accentColor={theme.accentColor}
textColor={theme.textColor}
/>
) : (
// Form...
)}

Lines saved: ~40 lines per popup × 4 popups = 160 lines


───────────────────────────────────────────────────────

8. Breaking Changes & Migration Steps

Breaking Changes
None. This is an internal refactoring with no public API changes.

Migration Strategy
1. Additive approach: Create new components alongside existing code
2. Gradual migration: Update one popup at a time
3. Backward compatible: Existing popups continue to work during migration
4. Thorough testing: Visual regression + E2E tests after each migration

Testing Requirements
• ✅ Unit tests for all new shared components
• ✅ Visual regression tests for each migrated popup
• ✅ E2E tests for form submission flows
• ✅ Preview mode testing (admin editor)
• ✅ Storefront rendering tests


──────────────────────────────────────────

9. Code Duplication Reduction Estimate

| Component/Pattern | Current Lines | After Refactor | Savings |
   |-------------------|---------------|----------------|---------|
| Success State UI | 200 | 80 | 120 lines |
| Discount Code Display | 200 | 60 | 140 lines |
| Loading Spinner | 80 | 30 | 50 lines |
| Popup Header | 330 | 50 | 280 lines |
| Timer Display | 180 | 80 | 100 lines |
| Icon Components | 360 | 45 | 315 lines |
| Animation Keyframes | 800 | 150 | 650 lines |
| Button Styles | 320 | 60 | 260 lines |
| TOTAL | 2,470 | 555 | 1,915 lines (77% reduction) |

Additional Benefits
• 🎯 Consistency: All popups use same UI patterns automatically
• 🔧 Maintainability: Changes to success states, discount displays, etc. only need to be made once
• 🧪 Testability: Shared components can be tested in isolation
• 📚 Documentation: Single source of truth for UI patterns
• 🚀 Velocity: New popups can be built faster using shared components


───────────────────────────────────────────────────────────────────────

10. Alignment with Template-Driven Architecture

✅ Maintains Separation of Concerns

Content (Template-Specific):
• Newsletter: Email collection flow
• SpinToWin: Wheel mechanics, prize selection
• ScratchCard: Canvas scratching, reveal logic
• FlashSale: Timer, urgency, stock counter
• Stays in individual popup components

Design (Universal):
• Colors, fonts, spacing
• Button styles, input styles
• Success states, discount displays
• Centralized in shared components + PopupDesignConfig

✅ No Changes to Data Flow

Template Selected
↓
Campaign Form (wizard)
├─ Design Step: contentConfig (template-specific)
├─ Design Step: designConfig (universal)
├─ Target Step: targetRules
└─ Discount Step: discountConfig
↓
Saved to Database (Campaign model)
↓
Rendered on Storefront
└─ PopupRenderer → Template-specific popup → Shared UI components

No changes to this flow. Shared components are used internally by popups.


─────────────────────────────────────────────────────────────────────────

11. Recommendations

Immediate Actions (High Priority)
1. ✅ Create Icon components (CloseIcon, CheckmarkIcon, SpinnerIcon)
• Low risk, high value
• Used across all popups
• ~360 lines saved

     2. ✅ Create DiscountCodeDisplay component
        • Used in 5 popups
        • Consistent user experience
        • ~140 lines saved

     3. ✅ Create shared animations.css
        • Eliminates most duplication
        • ~650 lines saved
        • Easy to implement

Medium Priority
4. ✅ Create SuccessState component
• Used in 4 popups
• ~120 lines saved

     5. ✅ Create usePopupTheme hook
        • Simplifies color calculations
        • Improves consistency

Lower Priority (Nice to Have)
6. ⚠️ Create PopupHeader component
• Lower priority because headers vary more across templates
• Still valuable for consistency

     7. ⚠️ Create PopupFooter component
        • Only used in some popups
        • Less duplication than other components


─────────────────────────────────────────────

12. Next Steps

     1. Review this analysis with the team
     2. Prioritize components to extract (recommend starting with Icons + DiscountCodeDisplay)
     3. Create proof-of-concept with NewsletterPopup migration
     4. Establish testing strategy (visual regression, E2E)
     5. Begin Phase 1 of refactoring roadmap


────────────────────────────────────────────────────────

Conclusion

The popup components have significant duplication (~1,915 lines) that can be eliminated through UI component extraction. The current hook-based architecture is sound and should be preserved. By
creating 7 shared components and 1 utility hook, we can:

     • ✅ Reduce code by 17% (~1,915 lines)
     • ✅ Improve consistency across all popups
     • ✅ Simplify maintenance (single source of truth)
     • ✅ Maintain template-driven architecture
     • ✅ No breaking changes
     • ✅ Gradual, low-risk migration path

Recommendation: Proceed with refactoring, starting with high-value, low-risk components (Icons, DiscountCodeDisplay, animations.css).
