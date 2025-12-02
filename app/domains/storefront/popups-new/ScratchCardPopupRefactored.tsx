/**
 * ScratchCardPopup Component - Refactored with LeadCaptureLayout
 *
 * Uses the unified LeadCaptureLayout grid system for consistent responsive behavior.
 * ScratchCardCanvas is rendered in the visualSlot, form content in formSlot.
 */

import React, { useState, useCallback, useEffect } from "react";
import type { PopupDesignConfig, Prize, LayoutConfig } from "./types";
import type { ScratchCardContent } from "~/domains/campaigns/types/campaign";

import { PopupPortal } from "./PopupPortal";
import { LeadCaptureLayout } from "./LeadCaptureLayout";
import { SPACING_GUIDELINES, POPUP_SPACING } from "./spacing";
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";
import { LeadCaptureForm, PopupHeader, SuccessState } from "./components/shared";
import { ScratchCardCanvas } from "./components/ScratchCardCanvas";

import "./components/shared/animations.css";

export interface ScratchCardConfig extends PopupDesignConfig, ScratchCardContent {
  scratchCardWidth?: number;
  scratchCardHeight?: number;
  scratchCardBackgroundColor?: string;
  scratchCardTextColor?: string;
  scratchOverlayColor?: string;
  scratchOverlayImage?: string;
  loadingText?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  descriptionFontSize?: string;
  enableSound?: boolean;
  enableHaptic?: boolean;
  enableParticles?: boolean;
  enableMetallicOverlay?: boolean;
  successMessage?: string;
}

export interface ScratchCardPopupProps {
  config: ScratchCardConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: { email: string; name?: string; gdprConsent?: boolean }) => Promise<void>;
  onReveal?: (prize: Prize) => void;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  desktop: "split-left",
  mobile: "stacked",
  visualSizeDesktop: "50%",
  visualSizeMobile: "45%",
};

export const ScratchCardPopupRefactored: React.FC<ScratchCardPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
  onReveal,
}) => {
  // Form hooks
  const {
    formState, setEmail, setName, setGdprConsent,
    errors, handleSubmit, isSubmitting, isSubmitted,
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
    onSubmit: onSubmit ? async (data) => { await onSubmit(data); return undefined; } : undefined,
  });

  const { discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();
  const { showContent } = usePopupAnimation({ isVisible });

  // State
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [scratchPercentage, setScratchPercentage] = useState(0);

  // Layout config
  const layout = config.leadCaptureLayout || DEFAULT_LAYOUT;
  const hasImage = !!config.imageUrl;
  const isOverlay = layout.desktop === "overlay";

  // Flow control
  const showEmailFirst = config.emailRequired && config.emailBeforeScratching;
  const showEmailForm = showEmailFirst && !emailSubmitted;
  const showScratchCard = !showEmailForm && !isSubmitted;
  const showEmailAfterReveal = isRevealed && config.emailRequired && !config.emailBeforeScratching && !emailSubmitted;
  const showSuccess = isSubmitted || (isRevealed && emailSubmitted);

  // Card dimensions
  const cardWidth = config.scratchCardWidth || 384;
  const cardHeight = config.scratchCardHeight || 216;
  const threshold = config.scratchThreshold || 50;

  // Fetch prize
  const fetchPrize = useCallback(async () => {
    if (config.previewMode) {
      const prizes = config.prizes || [{ id: "preview", label: "10% OFF", discountCode: "PREVIEW10" }];
      setWonPrize(prizes[0] as Prize);
      return;
    }
    try {
      const { securePost } = await import("./utils/popup-api");
      const data = await securePost<{ success: boolean; prize?: Prize }>(
        "/apps/revenue-boost/api/popups/scratch-prize", config.campaignId || "", {}
      );
      if (data.success && data.prize) setWonPrize(data.prize);
    } catch (err) {
      console.error("[ScratchCard] Error fetching prize:", err);
    }
  }, [config.previewMode, config.prizes, config.campaignId]);

  useEffect(() => {
    if (isVisible && !wonPrize && !showEmailFirst) fetchPrize();
  }, [isVisible, wonPrize, showEmailFirst, fetchPrize]);

  // Handle email submission
  const handleEmailFormSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (showEmailFirst) {
      await handleSubmit(e);
      setEmailSubmitted(true);
      await fetchPrize();
    } else {
      await handleSubmit(e);
      setEmailSubmitted(true);
      if (wonPrize?.discountCode) setDiscountCode(wonPrize.discountCode);
    }
  }, [showEmailFirst, handleSubmit, fetchPrize, wonPrize, setDiscountCode]);

  // Handle reveal
  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    if (wonPrize) {
      onReveal?.(wonPrize);
      if (wonPrize.discountCode) setDiscountCode(wonPrize.discountCode);
    }
  }, [wonPrize, onReveal, setDiscountCode]);

  if (!isVisible) return null;

  return (
    <PopupPortal
      isVisible={isVisible && showContent}
      onClose={onClose}
      backdrop={{ color: config.overlayColor || "rgba(0,0,0,1)", opacity: config.overlayOpacity ?? 0.6, blur: 4 }}
      animation={{ type: config.animation || "fade" }}
      position={config.position || "center"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>{`
        .scratch-popup-form { display: flex; flex-direction: column; gap: 1rem; }
        .scratch-popup-dismiss { background: none; border: none; color: inherit; opacity: 0.7; cursor: pointer; padding: 0.5rem; font-size: 0.875rem; }
        .scratch-popup-dismiss:hover { opacity: 1; }
      `}</style>

      <LeadCaptureLayout
        desktopLayout={layout.desktop}
        mobileLayout={layout.mobile}
        visualSize={{ desktop: layout.visualSizeDesktop || "50%", mobile: layout.visualSizeMobile || "45%" }}
        contentOverlap={layout.contentOverlap || "0"}
        visualGradient={layout.visualGradient || false}
        gradientColor={config.backgroundColor}
        backgroundColor={config.backgroundColor}
        borderRadius={typeof config.borderRadius === "number" ? config.borderRadius : 16}
        overlayOpacity={config.backgroundOverlayOpacity ?? 0.6}
        showCloseButton={config.showCloseButton !== false}
        onClose={onClose}
        className="ScratchCardPopup"
        data-splitpop="true"
        data-template="scratch-card"
        visualSlot={
          showScratchCard && !showEmailAfterReveal ? (
            <ScratchCardCanvas
              width={cardWidth}
              height={cardHeight}
              threshold={threshold}
              brushRadius={config.scratchRadius || 20}
              prize={wonPrize}
              onReveal={handleReveal}
              onScratchProgress={setScratchPercentage}
              overlayColor={config.scratchOverlayColor}
              overlayImage={config.scratchOverlayImage}
              accentColor={config.accentColor || config.buttonColor}
              prizeBackgroundColor={config.scratchCardBackgroundColor}
              prizeTextColor={config.scratchCardTextColor}
              instruction={config.scratchInstruction}
              enableMetallic={config.enableMetallicOverlay !== false}
              enableSound={config.enableSound !== false}
              enableHaptic={config.enableHaptic !== false}
              enableParticles={config.enableParticles !== false}
              isRevealed={isRevealed}
              onCopyCode={handleCopyCode}
              codeCopied={copiedCode}
              showCodeOverlay={isRevealed && !config.emailRequired}
              borderRadius={12}
            />
          ) : hasImage ? (
            <img src={config.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : undefined
        }
        formSlot={
          <div className="scratch-popup-form" style={{ padding: POPUP_SPACING.padding.medium, color: config.textColor }}>
            {showSuccess ? (
              <SuccessState
                message={config.successMessage || "Congratulations! 🎉"}
                discountCode={discountCode || wonPrize?.discountCode}
                onCopyCode={handleCopyCode}
                copiedCode={copiedCode}
                discountLabel="Your discount code:"
                accentColor={config.accentColor || config.buttonColor}
                textColor={config.textColor}
                animation="bounce"
              />
            ) : (
              <>
                <PopupHeader
                  headline={config.headline}
                  subheadline={
                    showEmailForm ? "Enter your email to unlock your scratch card!"
                    : showEmailAfterReveal ? "Enter your email to claim your prize!"
                    : config.subheadline
                  }
                  textColor={config.textColor}
                  descriptionColor={config.descriptionColor}
                  headlineFontSize={config.titleFontSize}
                  headlineFontWeight={config.titleFontWeight}
                  align={isOverlay ? "center" : "left"}
                  marginBottom={SPACING_GUIDELINES.afterDescription}
                />

                {(showEmailForm || showEmailAfterReveal) && (
                  <LeadCaptureForm
                    data={formState}
                    errors={errors}
                    onEmailChange={setEmail}
                    onNameChange={setName}
                    onGdprChange={setGdprConsent}
                    onSubmit={handleEmailFormSubmit}
                    isSubmitting={isSubmitting}
                    showName={config.nameFieldEnabled}
                    nameRequired={config.nameFieldRequired}
                    showGdpr={config.consentFieldEnabled}
                    gdprRequired={config.consentFieldRequired}
                    emailRequired={config.emailRequired !== false}
                    labels={{
                      email: config.emailLabel,
                      name: config.nameFieldLabel,
                      gdpr: config.consentFieldText,
                      submit: showEmailForm ? "Unlock Scratch Card" : (config.buttonText || "Claim Prize"),
                    }}
                    placeholders={{ email: config.emailPlaceholder, name: config.nameFieldPlaceholder }}
                    accentColor={config.accentColor}
                    buttonColor={config.buttonColor}
                    textColor={config.textColor}
                    backgroundColor={config.inputBackgroundColor}
                    buttonTextColor={config.buttonTextColor}
                    inputTextColor={config.inputTextColor}
                    inputBorderColor={config.inputBorderColor}
                    privacyPolicyUrl={config.privacyPolicyUrl}
                  />
                )}

                {showScratchCard && !showEmailAfterReveal && !isRevealed && (
                  <p style={{ textAlign: "center", opacity: 0.7, fontSize: "0.875rem" }}>
                    {scratchPercentage > 0 ? `${Math.round(scratchPercentage)}% revealed` : "Scratch the card above!"}
                  </p>
                )}

                <button type="button" className="scratch-popup-dismiss" onClick={onClose}>
                  {config.dismissLabel || "No thanks"}
                </button>
              </>
            )}
          </div>
        }
      />
    </PopupPortal>
  );
};

export default ScratchCardPopupRefactored;

