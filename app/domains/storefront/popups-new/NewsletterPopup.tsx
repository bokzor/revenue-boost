/**
 * NewsletterPopup Component - Redesigned
 *
 * Based on mockup design at docs/mockup/newsletter/components/email-popup.tsx
 *
 * Features:
 * - 10 theme presets (modern, minimal, elegant, bold, glass, dark, gradient, luxury, neon, ocean)
 * - Image positioning support (left, right, top, bottom, none)
 * - Enhanced animations and accessibility
 * - GDPR compliance with consent checkbox
 * - Discount code display with copy-to-clipboard
 * - Responsive design with mobile optimization
 */

import React, { useEffect } from "react";
import type { PopupDesignConfig, DiscountConfig, ImagePosition } from "./types";
import type { NewsletterContent } from "~/domains/campaigns/types/campaign";

import { PopupPortal } from "./PopupPortal";
import { PopupGridContainer } from "./PopupGridContainer";
import { getSizeDimensions } from "./utils";
import { SPACING_GUIDELINES } from "./spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import shared components from Phase 1 & 2
import {
  LeadCaptureForm,
  PopupHeader,
  SuccessState,
} from "./components/shared";

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

  // Extract configuration with defaults
  const imagePosition: ImagePosition = config.imagePosition || "left";

  // Background image configuration (preset vs Shopify file vs none)
  const backgroundImageMode: "none" | "preset" | "file" =
    (config.backgroundImageMode as "none" | "preset" | "file" | undefined) ?? (config.imageUrl ? "file" : "none");

  // Use image URL from config when mode is not "none" (admin sets this for preset/file)
  const imageUrl = backgroundImageMode === "none" ? undefined : config.imageUrl;

  const _title = config.headline || "Join Our Newsletter";
  const _description =
    config.subheadline || "Subscribe to get special offers, free giveaways, and exclusive deals.";
  const buttonText = config.submitButtonText || config.buttonText || "Subscribe";
  const behavior = config.discount?.behavior || "SHOW_CODE_AND_AUTO_APPLY";
  const _successMessage =
    config.successMessage ??
    (behavior === "SHOW_CODE_AND_AUTO_APPLY"
      ? "Thanks for subscribing! Your discount will be automatically applied when you checkout."
      : behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL"
        ? "Thanks for subscribing! Your discount code is authorized for your email address only."
        : "Thanks for subscribing! Your discount code is ready to use.");
  const showGdprCheckbox = config.consentFieldEnabled ?? false;
  const gdprLabel =
    config.consentFieldText || "I agree to receive marketing emails and accept the privacy policy";
  const collectName = config.nameFieldEnabled ?? false;
  const _sizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);

  // Auto-close after delay
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;
    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  if (!isVisible) return null;

  // Full background mode - image covers entire popup with overlay
  const isFullBackground = imagePosition === "full";
  const showImage = imagePosition !== "none" && !isFullBackground;
  const isVertical = imagePosition === "left" || imagePosition === "right";
  const imageFirst = imagePosition === "left" || imagePosition === "top";
  const _defaultImage =
    imageUrl || `/placeholder.svg?height=600&width=500&query=modern email newsletter subscription`;

  // Content class for layout
  const _contentClass = showImage
    ? isVertical
      ? `vertical ${imageFirst ? "" : "reverse"}`
      : `horizontal ${imageFirst ? "" : "reverse"}`
    : "single-column";

  // Detect glass effect
  const _isGlass =
    config.backgroundColor?.includes("rgba") &&
    parseFloat(config.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || "1") < 1;

  // Detect gradient background
  const hasGradientBg = config.backgroundColor?.includes("gradient");

  // Background overlay opacity for full background mode
  const bgOverlayOpacity = config.backgroundOverlayOpacity ?? 0.6;

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
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.headline || "Newsletter Signup"}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>
        {`
        /* Full Background Mode - responsive with optional 4:3 on larger screens */
        .newsletter-full-bg-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: ${config.borderRadius ?? 16}px;
          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
        }

        /* Mobile: auto height based on content */
        .newsletter-full-bg-container {
          min-height: auto;
        }

        /* Tablet and up: use 4:3 aspect ratio */
        @container popup (min-width: 520px) {
          .newsletter-full-bg-container {
            aspect-ratio: 4 / 3;
            max-height: 80vh;
          }
        }

        .newsletter-full-bg-image {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .newsletter-full-bg-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .newsletter-full-bg-overlay {
          position: absolute;
          inset: 0;
          background: ${config.backgroundColor || "#ffffff"};
          opacity: ${bgOverlayOpacity};
          z-index: 1;
        }

        .newsletter-full-bg-content {
          position: relative;
          z-index: 2;
          padding: 1.5rem;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Mobile: more padding and ensure content fits */
        @container popup (max-width: 399px) {
          .newsletter-full-bg-content {
            padding: 1.25rem 1rem;
          }
        }

        /* Medium: balanced padding */
        @container popup (min-width: 400px) and (max-width: 519px) {
          .newsletter-full-bg-content {
            padding: 2rem 1.5rem;
          }
        }

        /* Large: generous padding */
        @container popup (min-width: 520px) {
          .newsletter-full-bg-content {
            padding: 2.5rem;
          }
        }

        /* Image Cell - Responsive */
        .email-popup-image {
          position: relative;
          overflow: hidden;
          display: block;
          background: ${config.imageBgColor || config.inputBackgroundColor || "#f4f4f5"};
          width: 100%;
          height: 180px;
          flex-shrink: 0;
        }

        .email-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Form Cell - Responsive padding */
        .email-popup-form-section {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: ${hasGradientBg && !isFullBackground ? config.backgroundColor : "transparent"};
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

        .email-popup-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.875rem;
          border-radius: 0.5rem;
          border: 2px solid ${config.inputBorderColor || "#d4d4d8"};
          background: ${config.inputBackgroundColor || "#ffffff"};
          color: ${config.inputTextColor || "#111827"};
          font-size: 0.9375rem;
          transition: all 0.2s;
          outline: none;
          ${config.inputBackdropFilter ? `backdrop-filter: ${config.inputBackdropFilter};` : ""}
          ${config.inputBoxShadow ? `box-shadow: ${config.inputBoxShadow};` : ""}
        }

        .email-popup-input::placeholder {
          color: ${config.inputTextColor ? `${config.inputTextColor}b3` : "#9ca3af"};
          opacity: 1;
        }

        .email-popup-input:focus {
          border-color: ${config.accentColor || config.buttonColor || "#3b82f6"};
          box-shadow: 0 0 0 3px ${config.accentColor || config.buttonColor || "#3b82f6"}33;
        }

        .email-popup-input.error {
          border-color: #ef4444;
        }

        .email-popup-error {
          color: #ef4444;
          font-size: 0.8125rem;
          margin-top: 0.25rem;
        }

        .email-popup-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          margin-bottom: 0.375rem;
          color: ${config.textColor || "#111827"};
        }

        .email-popup-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          margin-top: 0.25rem;
        }

        .email-popup-checkbox {
          margin-top: 0.125rem;
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          flex-shrink: 0;
        }

        .email-popup-checkbox-label {
          font-size: 0.8125rem;
          color: ${config.descriptionColor || "#52525b"};
          line-height: 1.4;
        }

        .email-popup-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: none;
          background: ${config.buttonColor || "#3b82f6"};
          color: ${config.buttonTextColor || "#ffffff"};
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .email-popup-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px ${config.buttonColor || "#3b82f6"}60;
        }

        .email-popup-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .email-popup-secondary-button {
          margin-top: 0.625rem;
          width: 100%;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || "#6b7280"};
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
        }

        .email-popup-secondary-button:hover {
          text-decoration: underline;
        }

        /* ========================================
           CONTAINER QUERY RESPONSIVE STYLES
           Adapts to container width, not viewport
           ======================================== */

        /* Small containers: Compact layout (stacked) */
        @container popup (max-width: 399px) {
          .email-popup-form-section {
            padding: 1.25rem 1rem;
          }

          .email-popup-image {
            height: 140px;
          }

          .email-popup-input {
            height: 2.5rem;
            font-size: 0.875rem;
          }

          .email-popup-button {
            padding: 0.625rem 0.875rem;
            font-size: 0.875rem;
          }
        }

        /* Medium containers: Balanced layout (stacked) */
        @container popup (min-width: 400px) and (max-width: 519px) {
          .email-popup-form-section {
            padding: 2rem 1.5rem;
          }

          .email-popup-image {
            height: 200px;
          }
        }

        /* Wide containers (side-by-side): Image fills height */
        @container popup (min-width: 520px) {
          .email-popup-form-section {
            padding: 2rem 2rem;
          }

          .email-popup-image {
            height: auto;
            min-height: 380px;
            flex: 1;
          }

          .email-popup-input {
            height: 3rem;
            padding: 0 1rem;
            font-size: 1rem;
          }

          .email-popup-button {
            padding: 0.875rem 1.25rem;
            font-size: 1rem;
            margin-top: 1rem;
          }

          .email-popup-label {
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }

          .email-popup-checkbox {
            width: 1.125rem;
            height: 1.125rem;
          }

          .email-popup-checkbox-label,
          .email-popup-error {
            font-size: 0.875rem;
          }
        }

        /* Large containers: Maximum comfort */
        @container popup (min-width: 700px) {
          .email-popup-form-section {
            padding: 2.5rem 3rem;
          }

          .email-popup-button {
            padding: 1rem 1.5rem;
            margin-top: 1.25rem;
          }

          .email-popup-secondary-button {
            margin-top: 0.75rem;
            font-size: 0.875rem;
          }
        }

        /* Premium animations */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes successPop {
          0% { opacity: 0; transform: scale(0.5); }
          50% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes confettiDrop {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(100px) rotate(360deg) scale(0.5); }
        }

        /* Loading shimmer effect on button */
        .email-popup-button.loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: inherit;
        }

        /* Button ripple effect container */
        .email-popup-button {
          position: relative;
          overflow: hidden;
        }

        .email-popup-button .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
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

      {isFullBackground && imageUrl ? (
        /* Full Background Mode - Image covers entire popup with overlay */
        <div className="newsletter-full-bg-container NewsletterPopup" data-splitpop="true" data-template="newsletter">
          <div className="newsletter-full-bg-image">
            <img src={imageUrl} alt="" aria-hidden="true" />
          </div>
          <div className="newsletter-full-bg-overlay" />
          <div className="newsletter-full-bg-content">
            {/* Close button for full background mode */}
            {config.showCloseButton !== false && (
              <button
                type="button"
                onClick={onClose}
                className="email-popup-close-btn"
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  zIndex: 10,
                  background: "rgba(0,0,0,0.3)",
                  border: "none",
                  borderRadius: "50%",
                  width: "2rem",
                  height: "2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            {/* Form Section for Full Background Mode */}
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
                      message={config.successMessage || "Thanks for subscribing!"}
                      discountCode={displayDiscountCode || undefined}
                      onCopyCode={handleCopyCode}
                      copiedCode={copiedCode}
                      discountLabel="Your discount code:"
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
                    headline={config.headline || "Join Our Newsletter"}
                    subheadline={config.subheadline}
                    textColor={config.textColor}
                    descriptionColor={config.descriptionColor}
                    headlineFontSize={config.titleFontSize || config.fontSize}
                    subheadlineFontSize={config.descriptionFontSize || config.fontSize}
                    headlineFontWeight={config.titleFontWeight || config.fontWeight}
                    subheadlineFontWeight={config.descriptionFontWeight || config.fontWeight}
                    align="center"
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
                      name: config.firstNameLabel || "Name",
                      gdpr: gdprLabel,
                      submit: buttonText,
                    }}
                    placeholders={{
                      email: config.emailPlaceholder || "Enter your email",
                      name: config.nameFieldPlaceholder || "Your name",
                    }}
                    accentColor={config.accentColor}
                    buttonColor={config.buttonColor}
                    textColor={config.textColor}
                    backgroundColor={config.inputBackgroundColor || config.backgroundColor}
                    buttonTextColor={config.buttonTextColor}
                    inputTextColor={config.inputTextColor}
                    inputBorderColor={config.inputBorderColor}
                    privacyPolicyUrl={config.privacyPolicyUrl}
                    extraFields={
                      config.dismissLabel ? (
                        <button
                          type="button"
                          className="email-popup-secondary-button"
                          onClick={onClose}
                          disabled={isSubmitting}
                        >
                          {config.dismissLabel}
                        </button>
                      ) : undefined
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Grid Layout Mode */
        <PopupGridContainer
          config={config}
          onClose={onClose}
          imagePosition={imagePosition === "right" ? "right" : "left"}
          singleColumn={!imageUrl || imagePosition === "none"}
          className="NewsletterPopup"
          data-splitpop="true"
          data-template="newsletter"
        >
          {/* Image Section */}
          {imageUrl && (
            <div className="email-popup-image">
              <img src={imageUrl} alt={config.headline || "Newsletter"} />
            </div>
          )}

          {/* Form Section */}
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
                    message={config.successMessage || "Thanks for subscribing!"}
                    discountCode={displayDiscountCode || undefined}
                    onCopyCode={handleCopyCode}
                    copiedCode={copiedCode}
                    discountLabel="Your discount code:"
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
                  headline={config.headline || "Join Our Newsletter"}
                  subheadline={config.subheadline}
                  textColor={config.textColor}
                  descriptionColor={config.descriptionColor}
                  headlineFontSize={config.titleFontSize || config.fontSize}
                  subheadlineFontSize={config.descriptionFontSize || config.fontSize}
                  headlineFontWeight={config.titleFontWeight || config.fontWeight}
                  subheadlineFontWeight={config.descriptionFontWeight || config.fontWeight}
                  align="center"
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
                    name: config.firstNameLabel || "Name",
                    gdpr: gdprLabel,
                    submit: buttonText,
                  }}
                  placeholders={{
                    email: config.emailPlaceholder || "Enter your email",
                    name: config.nameFieldPlaceholder || "Your name",
                  }}
                  accentColor={config.accentColor}
                  buttonColor={config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor || config.backgroundColor}
                  buttonTextColor={config.buttonTextColor}
                  inputTextColor={config.inputTextColor}
                  inputBorderColor={config.inputBorderColor}
                  privacyPolicyUrl={config.privacyPolicyUrl}
                  extraFields={
                    config.dismissLabel ? (
                      <button
                        type="button"
                        className="email-popup-secondary-button"
                        onClick={onClose}
                        disabled={isSubmitting}
                      >
                        {config.dismissLabel}
                      </button>
                    ) : undefined
                  }
                />
              </>
            )}
          </div>
        </PopupGridContainer>
      )}
    </PopupPortal>
  );
};
