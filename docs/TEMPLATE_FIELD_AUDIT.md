# Template Field Mapping Audit

This document audits all 11 template types, mapping form fields to popup component props to identify mismatches.

**Legend:**
- ✅ = Form field exists AND popup uses it
- ❌ Form = Form field exists but popup doesn't use it
- ❌ Popup = Popup uses prop but no form field exists
- ⚠️ = Naming mismatch between form and popup

---

## 1. NEWSLETTER

**Form:** `NewsletterContentSection.tsx` (197 lines)
**Popup:** `NewsletterPopup.tsx` (875 lines)
**Schema:** `NewsletterContentSchema`

### Content Fields
| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `buttonText` | ✅ | ⚠️ `submitButtonText` | ⚠️ Naming |
| `emailLabel` | ✅ | ✅ | ✅ |
| `dismissLabel` | ✅ | ✅ | ✅ |
| `emailPlaceholder` | ✅ | ✅ | ✅ |
| `successMessage` | ✅ | ✅ | ✅ |
| `nameFieldEnabled` | ✅ | ✅ | ✅ |
| `nameFieldRequired` | ❌ | ✅ | ❌ Popup |
| `nameFieldPlaceholder` | ❌ | ✅ | ❌ Popup |
| `firstNameLabel` | ❌ | ✅ | ❌ Popup |
| `consentFieldEnabled` | ✅ | ✅ | ✅ |
| `consentFieldRequired` | ❌ | ✅ | ❌ Popup |
| `consentFieldText` | ❌ | ✅ | ❌ Popup |
| `emailRequired` | ❌ | ✅ | ❌ Popup |
| `emailErrorMessage` | ❌ | ✅ | ❌ Popup |
| `privacyPolicyUrl` | ❌ | ✅ | ❌ Popup |

### Design Fields (used by popup but not in content form)
| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `titleFontSize` | ❌ | ✅ | ❌ Popup |
| `titleFontWeight` | ❌ | ✅ | ❌ Popup |
| `descriptionFontSize` | ❌ | ✅ | ❌ Popup |
| `descriptionFontWeight` | ❌ | ✅ | ❌ Popup |
| `descriptionColor` | ❌ | ✅ | ❌ Popup |
| `inputBackgroundColor` | ❌ | ✅ | ❌ Popup |
| `inputTextColor` | ❌ | ✅ | ❌ Popup |
| `inputBorderColor` | ❌ | ✅ | ❌ Popup |
| `inputBackdropFilter` | ❌ | ✅ | ❌ Popup |
| `inputBoxShadow` | ❌ | ✅ | ❌ Popup |
| `accentColor` | ❌ | ✅ | ❌ Popup |
| `successColor` | ❌ | ✅ | ❌ Popup |
| `imageBgColor` | ❌ | ✅ | ❌ Popup |
| `autoCloseDelay` | ❌ | ✅ | ❌ Popup |
| `showCloseButton` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 22 fields missing from form

---

## 2. SPIN_TO_WIN

**Form:** `SpinToWinContentSection.tsx` (228 lines)
**Popup:** `SpinToWinPopup.tsx` (1738 lines)
**Schema:** `SpinToWinContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `spinButtonText` | ✅ | ✅ | ✅ |
| `emailPlaceholder` | ✅ | ✅ | ✅ |
| `dismissLabel` | ✅ | ❌ Not rendered | ❌ Form |
| `failureMessage` | ✅ | ✅ | ✅ |
| `loadingText` | ✅ | ✅ | ✅ |
| `collectName` | ✅ | ⚠️ mapped to `nameFieldEnabled` | ⚠️ Naming |
| `showGdprCheckbox` | ✅ | ⚠️ mapped to `consentFieldEnabled` | ⚠️ Naming |
| `wheelSegments` | ✅ | ✅ | ✅ |
| `wheelSize` | ✅ | ✅ | ✅ |
| `wheelBorderWidth` | ✅ | ✅ | ✅ |
| `wheelBorderColor` | ✅ | ✅ | ✅ |
| `spinDuration` | ✅ | ✅ | ✅ |
| `minSpins` | ✅ | ✅ | ✅ |
| `animationDuration` | ❌ | ✅ (storefront only) | ❌ Popup |
| `showConfetti` | ❌ | ✅ | ❌ Popup |
| `enableSound` | ❌ | ✅ | ❌ Popup |
| `enableHaptic` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 7 fields

---

## 3. FLASH_SALE

**Form:** `FlashSaleContentSection.tsx` (802 lines)
**Popup:** `FlashSalePopup.tsx` (1313 lines)
**Schema:** `FlashSaleContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `urgencyMessage` | ✅ | ✅ | ✅ |
| `buttonText` | ✅ | ✅ | ✅ |
| `ctaUrl` | ✅ | ✅ | ✅ |
| `showCountdown` | ✅ | ✅ | ✅ |
| `countdownDuration` | ✅ | ✅ | ✅ |
| `timer.mode` | ✅ | ✅ | ✅ |
| `timer.endTimeISO` | ✅ | ✅ | ✅ |
| `inventory.mode` | ✅ | ⚠️ Partial | ⚠️ |
| `reserve.*` | ✅ | ⚠️ Partial | ⚠️ |
| `presentation.*` | ✅ | ✅ | ✅ |
| `ctaOpenInNewTab` | ❌ | ✅ | ❌ Popup |
| `currentCartTotal` | ❌ | ✅ (runtime) | N/A |

**Mismatch Count:** 3 fields

---

## 4. SCRATCH_CARD

**Form:** `ScratchCardContentSection.tsx` (494 lines)
**Popup:** `ScratchCardPopup.tsx` (2134 lines)
**Schema:** `ScratchCardContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `buttonText` | ✅ | ✅ | ✅ |
| `emailLabel` | ✅ | ✅ | ✅ |
| `dismissLabel` | ✅ | ✅ | ✅ |
| `emailPlaceholder` | ✅ | ✅ | ✅ |
| `scratchInstruction` | ✅ | ✅ | ✅ |
| `emailBeforeScratching` | ✅ | ✅ | ✅ |
| `scratchThreshold` | ✅ | ✅ | ✅ |
| `scratchRadius` | ✅ | ✅ | ✅ |
| `failureMessage` | ✅ | ✅ | ✅ |
| `prizes` | ✅ | ✅ | ✅ |
| `showGdprCheckbox` | ✅ | ✅ | ✅ |
| `enableSound` | ❌ | ✅ | ❌ Popup |
| `enableHaptic` | ❌ | ✅ | ❌ Popup |
| `enableParticles` | ❌ | ✅ | ❌ Popup |
| `enableMetallicOverlay` | ❌ | ✅ | ❌ Popup |
| `scratchOverlayColor` | ❌ | ✅ | ❌ Popup |
| `scratchCardWidth` | ❌ | ✅ | ❌ Popup |
| `scratchCardHeight` | ❌ | ✅ | ❌ Popup |
| `scratchCardBackgroundColor` | ❌ | ✅ | ❌ Popup |
| `scratchCardTextColor` | ❌ | ✅ | ❌ Popup |
| `gdprLabel` | ❌ | ✅ | ❌ Popup |
| `privacyPolicyUrl` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 11 fields (all missing from form)

---

## 5. FREE_SHIPPING

**Form:** `FreeShippingContentSection.tsx` (366 lines)
**Popup:** `FreeShippingPopup.tsx` (986 lines)
**Schema:** `FreeShippingContentSchema`

### Content Fields
| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `threshold` | ✅ | ✅ | ✅ |
| `currency` | ✅ | ✅ | ✅ |
| `nearMissThreshold` | ✅ | ✅ | ✅ |
| `emptyMessage` | ✅ | ✅ | ✅ |
| `progressMessage` | ✅ | ✅ | ✅ |
| `nearMissMessage` | ✅ | ✅ | ✅ |
| `unlockedMessage` | ✅ | ✅ | ✅ |
| `barPosition` | ✅ | ✅ | ✅ |
| `dismissible` | ✅ | ✅ | ✅ |
| `showIcon` | ✅ | ✅ | ✅ |
| `celebrateOnUnlock` | ✅ | ✅ | ✅ |
| `requireEmailToClaim` | ✅ | ✅ | ✅ |
| `dismissLabel` | ❌ | ✅ | ❌ Popup |
| `animationDuration` | ❌ | ✅ | ❌ Popup |
| `fontFamily` | ❌ | ✅ | ❌ Popup |
| `size` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 4 fields missing from form

---

## 6. CART_ABANDONMENT

**Form:** `CartAbandonmentContentSection.tsx` (541 lines)
**Popup:** `CartAbandonmentPopup.tsx` (1173 lines)
**Schema:** `CartAbandonmentContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `showCartItems` | ✅ | ✅ | ✅ |
| `maxItemsToShow` | ✅ | ✅ | ✅ |
| `showCartTotal` | ✅ | ✅ | ✅ |
| `showUrgency` | ✅ | ✅ | ✅ |
| `urgencyTimer` | ✅ | ✅ | ✅ |
| `urgencyMessage` | ✅ | ✅ | ✅ |
| `buttonText` | ✅ | ✅ | ✅ |
| `ctaUrl` | ✅ | ✅ | ✅ |
| `enableEmailRecovery` | ✅ | ✅ | ✅ |

**Mismatch Count:** 0 fields ✅

---

## 7. PRODUCT_UPSELL

**Form:** `ProductUpsellContentSection.tsx` (540 lines)
**Popup:** `ProductUpsellPopup.tsx` (2733 lines)
**Schema:** `ProductUpsellContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `subheadline` | ✅ | ✅ | ✅ |
| `productSelectionMethod` | ✅ | ✅ | ✅ |
| `selectedProducts` | ✅ | ✅ | ✅ |
| `maxProducts` | ✅ | ✅ | ✅ |
| `layout` | ✅ | ⚠️ `layoutMode` | ⚠️ Naming |
| `bundleDiscount` | ✅ | ✅ | ✅ |
| `enableHaptic` | ❌ | ✅ | ❌ Popup |
| `enableParticles` | ❌ | ✅ | ❌ Popup |
| `showSocialProof` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 4 fields

---

## 8. SOCIAL_PROOF

**Form:** `SocialProofContentSection.tsx` (423 lines)
**Popup:** `SocialProofPopup.tsx` (374 lines)
**Schema:** `SocialProofContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `enablePurchaseNotifications` | ✅ | ✅ | ✅ |
| `enableVisitorNotifications` | ✅ | ✅ | ✅ |
| `enableReviewNotifications` | ✅ | ✅ | ✅ |
| `displayDuration` | ✅ | ✅ | ✅ |
| `rotationInterval` | ✅ | ✅ | ✅ |
| `position` | ✅ | ✅ | ✅ |
| `messageTemplates.*` | ✅ | ✅ | ✅ |
| `maxNotifications` | ✅ | ✅ | ✅ |

**Mismatch Count:** 0 fields ✅

---

## 9. ANNOUNCEMENT

**Form:** `AnnouncementContentSection.tsx` (211 lines)
**Popup:** `AnnouncementPopup.tsx` (417 lines)
**Schema:** `AnnouncementContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `icon` | ✅ | ✅ | ✅ |
| `ctaText` | ✅ | ✅ | ✅ |
| `ctaUrl` | ✅ | ✅ | ✅ |
| `colorScheme` | ✅ | ✅ | ✅ |
| `ctaOpenInNewTab` | ❌ | ✅ (default in schema) | ⚠️ Hidden |
| `dismissible` | ✅ | ✅ | ✅ |
| `borderRadius` | ❌ | ✅ | ❌ Popup |

**Mismatch Count:** 2 fields

---

## 10. COUNTDOWN_TIMER

**Form:** `CountdownTimerContentSection.tsx` (implied by ContentConfigSection)
**Popup:** `CountdownTimerPopup.tsx` (719 lines)
**Schema:** `CountdownTimerContentSchema`

| Field | Form | Popup | Status |
|-------|------|-------|--------|
| `headline` | ✅ | ✅ | ✅ |
| `endTime` | ✅ | ✅ | ✅ |
| `countdownDuration` | ✅ | ✅ | ✅ |
| `ctaText` | ✅ | ✅ | ✅ |
| `ctaUrl` | ✅ | ✅ | ✅ |
| `hideOnExpiry` | ✅ | ✅ | ✅ |
| `colorScheme` | ✅ | ✅ | ✅ |
| `ctaOpenInNewTab` | ❌ | ✅ (default in schema) | ⚠️ Hidden |

**Mismatch Count:** 1 field

---

## 11. EXIT_INTENT

**Form:** Uses `NewsletterContentSection.tsx` (shared)
**Popup:** Uses `NewsletterPopup.tsx` (shared)
**Schema:** `ExitIntentContentSchema` (extends Newsletter)

Same as Newsletter - inherits its mismatches.

**Mismatch Count:** 22 fields (inherited from Newsletter)

---

# Summary

## Mismatch Statistics

| Template | Mismatch Count | Severity |
|----------|---------------|----------|
| NEWSLETTER | 22 | 🔴 Critical |
| EXIT_INTENT | 22 | 🔴 Critical (inherited) |
| SCRATCH_CARD | 11 | 🔴 High |
| SPIN_TO_WIN | 7 | 🟡 Medium |
| PRODUCT_UPSELL | 4 | 🟡 Medium |
| FREE_SHIPPING | 4 | 🟡 Medium |
| FLASH_SALE | 3 | 🟡 Medium |
| ANNOUNCEMENT | 2 | 🟢 Low |
| COUNTDOWN_TIMER | 1 | 🟢 Low |
| CART_ABANDONMENT | ~0 | 🟢 Good |
| SOCIAL_PROOF | ~0 | 🟢 Good |

**Total Mismatches:** ~76 fields across 11 templates

**Note:** "~0" means core fields are wired but some design fields may be missing. The high counts for Newsletter and Scratch Card reflect missing design customization fields that the popup components support but aren't exposed in the form.

---

## Patterns Identified

### 1. Missing Content Form Fields (popup uses, no form control)
**High Impact - affects user-facing text:**
- `nameFieldRequired`, `nameFieldPlaceholder`, `firstNameLabel` - Name field options
- `consentFieldRequired`, `consentFieldText` - GDPR options
- `emailRequired`, `emailErrorMessage` - Email validation
- `privacyPolicyUrl` - Legal compliance

### 2. Missing Design Form Fields (popup uses, hidden from user)
**Medium Impact - affects visual appearance:**
- `titleFontSize`, `titleFontWeight` - Headline typography
- `descriptionFontSize`, `descriptionFontWeight`, `descriptionColor` - Subheadline typography
- `inputBackgroundColor`, `inputTextColor`, `inputBorderColor` - Input styling
- `inputBackdropFilter`, `inputBoxShadow` - Advanced input effects
- `accentColor`, `successColor` - Color variations
- `imageBgColor` - Image container background
- `autoCloseDelay`, `showCloseButton` - Behavior controls

### 3. Missing Enhancement Fields (popup uses, not exposed)
**Low Impact - "nice to have" features:**
- `enableSound`, `enableHaptic`, `enableParticles` - Gamification effects
- `showConfetti`, `enableMetallicOverlay` - Visual effects
- `animationDuration` - Animation timing

### 4. Naming Inconsistencies
- `buttonText` vs `submitButtonText` vs `spinButtonText`
- `collectName` vs `nameFieldEnabled`
- `showGdprCheckbox` vs `consentFieldEnabled`
- `layout` vs `layoutMode`

---

## Recommendations

### Option A: Block-Based Architecture
**Best for:** Maximum flexibility, reusable blocks
**Migration effort:** High (major refactor)

Split each template into composable blocks:
```
HeadlineBlock, EmailCaptureBlock, TimerBlock,
DiscountBlock, ProductGridBlock, BackgroundBlock
```

### Option B: Template-Specific Forms
**Best for:** Simpler mental model, 1:1 mapping
**Migration effort:** Medium

Each template has its own complete form:
```
templates/
├── newsletter/
│   ├── NewsletterPopup.tsx
│   ├── NewsletterForm.tsx      ← Co-located form
│   └── newsletter.schema.ts    ← Single source of truth
```

### Decision Matrix

| Criteria | Block-Based | Template-Specific |
|----------|-------------|-------------------|
| Reusability | ✅ High | ❌ Low |
| Complexity | ❌ High | ✅ Low |
| Migration effort | ❌ 3-4 weeks | ✅ 1-2 weeks |
| Maintenance | ✅ Easy (per block) | ⚠️ Okay (per template) |
| Recipe integration | ✅ Excellent | ✅ Good |

**Recommendation:** Start with **Template-Specific (Option B)** for faster iteration, then extract common blocks (Hybrid) as patterns emerge.

