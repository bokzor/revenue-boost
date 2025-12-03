/**
 * NewsletterPopup Component - Refactored with LeadCaptureLayout
 *
 * Uses the unified LeadCaptureLayout grid system for consistent responsive behavior.
 *
 * Features:
 * - Unified layout system (split, stacked, overlay, content-only)
 * - Automatic desktop/mobile responsive switching
 * - GDPR compliance with consent checkbox
 * - Discount code display with copy-to-clipboard
 * - Container query based responsive design
 */

import React, { useEffect } from "react";
import type { PopupDesignConfig, DiscountConfig, LayoutConfig } from "./types";
import type { NewsletterContent } from "~/domains/campaigns/types/campaign";

import { PopupPortal } from "./PopupPortal";
import type { MobilePresentationMode } from "./PopupPortal";
import { LeadCaptureLayout } from "app/domains/storefront/popups-new/components/shared/LeadCaptureLayout";
import { SPACING_GUIDELINES } from "app/domains/storefront/popups-new/utils/spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import shared components from Phase 1 & 2
import { LeadCaptureForm, PopupHeader, SuccessState } from "./components/shared";

// Import shared animations
import "./components/shared/animations.css";

/**
 * Newsletter-specific configuration
 */
export interface NewsletterConfig extends PopupDesignConfig, NewsletterContent {
  discount?: DiscountConfig;
  successTitle?: string;
  successEmoji?: string;

  // Typography (should be set by admin based on theme)
  titleFontSize?: string;
  titleFontWeight?: string;
  titleTextShadow?: string;
  descriptionFontSize?: string;
  descriptionFontWeight?: string;

  // Input styling (should be set by admin based on theme)
  inputBackdropFilter?: string;
  inputBoxShadow?: string;
}

export interface NewsletterPopupProps {
  config: NewsletterConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: NewsletterFormData) => Promise<string | undefined>;
}

export interface NewsletterFormData {
  email: string;
  name?: string;
  gdprConsent: boolean;
}

// =============================================================================
// DEFAULT LAYOUT CONFIG
// =============================================================================

const DEFAULT_LAYOUT: LayoutConfig = {
  desktop: "split-left",
  mobile: "content-only",
  visualSizeDesktop: "50%",
  visualSizeMobile: "0",
  contentOverlap: "0",
  visualGradient: false,
};

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
}) => {
  // Use custom hooks for form management
  const {
    formState,
    setEmail,
    setName,
    setGdprConsent,
    errors,
    handleSubmit,
    isSubmitting,
    isSubmitted,
    generatedDiscountCode,
  } = usePopupForm({
    config: {
      emailRequired: config.emailRequired,
      emailErrorMessage: config.emailErrorMessage,
      nameFieldEnabled: config.nameFieldEnabled,
      nameFieldRequired: config.nameFieldRequired,
      consentFieldEnabled: config.consentFieldEnabled,
      consentFieldRequired: config.consentFieldRequired,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
    onSubmit,
  });

  // Use discount code hook
  const {
    discountCode: displayDiscountCode,
    copiedCode,
    handleCopyCode,
  } = useDiscountCode(
    generatedDiscountCode || (config.discount?.enabled ? config.discount.code : undefined)
  );

  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

  // Get layout config from design config (or use default)
  const layout = config.leadCaptureLayout || DEFAULT_LAYOUT;

  // Background image configuration
  const imageUrl = config.imageUrl;
  const hasVisual = !!imageUrl && layout.desktop !== "content-only";

  const showGdprCheckbox = config.consentFieldEnabled ?? false;
  const collectName = config.nameFieldEnabled ?? false;

  // Auto-close after delay
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;
    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  if (!isVisible) return null;

  // Infer mobile presentation mode from layout:
  // - "fullscreen" layout → "fullscreen" presentation (fills viewport)
  // - Other layouts → "bottom-sheet" presentation (slides from bottom)
  const mobilePresentationMode: MobilePresentationMode =
    layout.mobile === "fullscreen" ? "fullscreen" : "bottom-sheet";

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0, 0, 0, 0.5)",
        opacity: config.overlayOpacity ?? 0.5,
        blur: 4,
      }}
      animation={{
        type: config.animation || "fade",
        duration: 300,
      }}
      position="center"
      size={config.size || "medium"}
      mobilePresentationMode={mobilePresentationMode}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.headline}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>
        {`
        /* ========================================
           NEWSLETTER POPUP - FORM STYLES
           Layout is handled by LeadCaptureLayout
           ======================================== */

        /* Form Cell - Responsive padding */
        .email-popup-form-section {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          min-width: 0;
        }

        .email-popup-form {
          display: flex;
          flex-direction: column;
          gap: ${SPACING_GUIDELINES.betweenFields};
        }

        .email-popup-input-wrapper {
          position: relative;
        }

        /* Secondary dismiss button */
        .email-popup-secondary-button {
          margin-top: ${SPACING_GUIDELINES.betweenButtons};
          background: transparent;
          border: none;
          color: ${config.textColor || "#666"};
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        .email-popup-secondary-button:hover {
          opacity: 1;
        }
        .email-popup-secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }

        /* ========================================
           ANIMATIONS
           ======================================== */

        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes confettiDrop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* Button ripple effect */
        .email-popup-button::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          transform: scale(0);
          opacity: 0;
          border-radius: inherit;
        }
        .email-popup-button:active::after {
          animation: ripple 0.6s ease-out forwards;
          pointer-events: none;
        }

        /* Success state animation */
        .email-popup-success {
          animation: successPop 0.6s ease-out forwards;
        }

        .email-popup-success-title {
          animation: staggerIn 0.4s ease-out 0.2s both;
        }

        .email-popup-success-code {
          animation: staggerIn 0.5s ease-out 0.4s both;
        }

        /* Confetti for success */
        .email-popup-confetti {
          position: absolute;
          pointer-events: none;
          z-index: 100;
        }

        .email-popup-confetti:nth-child(1) { width: 8px; height: 8px; background: #fbbf24; left: 10%; top: 15%; animation: confettiDrop 1.3s ease-out 0s forwards; }
        .email-popup-confetti:nth-child(2) { width: 6px; height: 6px; background: #ec4899; left: 25%; top: 10%; animation: confettiDrop 1.5s ease-out 0.1s forwards; border-radius: 50%; }
        .email-popup-confetti:nth-child(3) { width: 10px; height: 10px; background: #8b5cf6; left: 80%; top: 12%; animation: confettiDrop 1.4s ease-out 0.15s forwards; }
        .email-popup-confetti:nth-child(4) { width: 7px; height: 7px; background: #06b6d4; left: 90%; top: 18%; animation: confettiDrop 1.6s ease-out 0.08s forwards; border-radius: 50%; }
        .email-popup-confetti:nth-child(5) { width: 9px; height: 9px; background: #10b981; left: 50%; top: 8%; animation: confettiDrop 1.35s ease-out 0.2s forwards; }
        .email-popup-confetti:nth-child(6) { width: 8px; height: 8px; background: ${config.accentColor || config.buttonColor || "#3b82f6"}; left: 65%; top: 20%; animation: confettiDrop 1.45s ease-out 0.12s forwards; border-radius: 50%; }

        /* Form field focus glow */
        .email-popup-input:focus {
          animation: subtlePulse 0.3s ease-out;
        }

        @keyframes subtlePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        /* Hover effect on input */
        .email-popup-input:not(:focus):hover {
          border-color: ${config.accentColor || config.buttonColor || "#3b82f6"}80;
        }

        @media (prefers-reduced-motion: reduce) {
          .email-popup-success,
          .email-popup-success-icon,
          .email-popup-spinner,
          .email-popup-button::after,
          .email-popup-confetti {
            animation: none !important;
            transition: none !important;
          }
        }
        `}
      </style>

      {/* Unified Layout using LeadCaptureLayout */}
      <LeadCaptureLayout
        desktopLayout={layout.desktop}
        mobileLayout={layout.mobile}
        visualSize={{
          desktop: layout.visualSizeDesktop || "50%",
          mobile: layout.visualSizeMobile || "45%",
        }}
        contentOverlap={layout.contentOverlap || "0"}
        visualGradient={layout.visualGradient || false}
        gradientColor={config.backgroundColor}
        backgroundColor={config.backgroundColor}
        borderRadius={typeof config.borderRadius === "number" ? config.borderRadius : 16}
        overlayOpacity={config.backgroundOverlayOpacity ?? 0.6}
        showCloseButton={config.showCloseButton !== false}
        onClose={onClose}
        className="NewsletterPopup"
        data-splitpop="true"
        data-template="newsletter"
        visualSlot={
          hasVisual ? (
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          ) : undefined
        }
        formSlot={
          <div className="email-popup-form-section" style={{ position: "relative" }}>
            {isSubmitted ? (
              <>
                <div className="email-popup-confetti" />
                <div className="email-popup-confetti" />
                <div className="email-popup-confetti" />
                <div className="email-popup-confetti" />
                <div className="email-popup-confetti" />
                <div className="email-popup-confetti" />
                <div className="email-popup-success">
                  <SuccessState
                    message={config.successMessage}
                    discountCode={displayDiscountCode || undefined}
                    onCopyCode={handleCopyCode}
                    copiedCode={copiedCode}
                    discountLabel={config.discountCodeLabel}
                    accentColor={config.accentColor || config.buttonColor}
                    successColor={config.successColor}
                    textColor={config.textColor}
                    animation="bounce"
                    fontSize={config.titleFontSize || config.fontSize}
                    fontWeight={config.titleFontWeight || config.fontWeight}
                  />
                </div>
              </>
            ) : (
              <>
                <PopupHeader
                  headline={config.headline}
                  subheadline={config.subheadline}
                  textColor={config.textColor}
                  descriptionColor={config.descriptionColor}
                  headlineFontSize={config.titleFontSize || config.fontSize}
                  subheadlineFontSize={config.descriptionFontSize || config.fontSize}
                  headlineFontWeight={config.titleFontWeight || config.fontWeight}
                  subheadlineFontWeight={config.descriptionFontWeight || config.fontWeight}
                  align={layout.desktop === "overlay" ? "center" : "left"}
                  marginBottom={SPACING_GUIDELINES.afterDescription}
                />
                <LeadCaptureForm
                  data={formState}
                  errors={errors}
                  onEmailChange={setEmail}
                  onNameChange={setName}
                  onGdprChange={setGdprConsent}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  showName={collectName}
                  nameRequired={config.nameFieldRequired}
                  showGdpr={showGdprCheckbox}
                  gdprRequired={config.consentFieldRequired}
                  emailRequired={config.emailRequired !== false}
                  labels={{
                    email: config.emailLabel,
                    name: config.nameFieldLabel,
                    gdpr: config.consentFieldText,
                    submit: config.submitButtonText,
                  }}
                  placeholders={{
                    email: config.emailPlaceholder,
                    name: config.nameFieldPlaceholder,
                  }}
                  accentColor={config.accentColor}
                  buttonColor={config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor || config.backgroundColor}
                  buttonTextColor={config.buttonTextColor}
                  inputTextColor={config.inputTextColor}
                  inputBorderColor={config.inputBorderColor}
                  privacyPolicyUrl={config.privacyPolicyUrl}
                />
                <button
                  type="button"
                  className="email-popup-secondary-button"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {config.dismissLabel}
                </button>
              </>
            )}
          </div>
        }
      />
    </PopupPortal>
  );
};
