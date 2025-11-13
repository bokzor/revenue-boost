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

import React, { useState, useCallback, useEffect } from 'react';
import type { PopupDesignConfig, DiscountConfig, ImagePosition } from './types';
import type { NewsletterContent } from '~/domains/campaigns/types/campaign';

import { PopupPortal } from './PopupPortal';

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
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string; gdpr?: string }>({});
  const [generatedDiscountCode, setGeneratedDiscountCode] = useState<string | null>(null);

  // Extract configuration with defaults
  const imagePosition: ImagePosition = config.imagePosition || 'left';

  // Use image URL from config (set by admin)
  const imageUrl = config.imageUrl;

  const title = config.headline || 'Join Our Newsletter';
  const description = config.subheadline || 'Subscribe to get special offers, free giveaways, and exclusive deals.';
  const buttonText = config.submitButtonText || config.buttonText || 'Subscribe';
  const deliveryMode = config.discount?.deliveryMode || 'show_code_fallback';
  const successMessage =
    config.successMessage ??
    (deliveryMode === 'auto_apply_only'
      ? 'Thanks for subscribing! Your discount will be automatically applied when you checkout.'
      : deliveryMode === 'show_in_popup_authorized_only'
      ? 'Thanks for subscribing! Your discount code is authorized for your email address only.'
      : 'Thanks for subscribing! Your discount code is ready to use.');
  const discountCode = config.discount?.enabled ? config.discount.code : undefined;
  const showGdprCheckbox = config.consentFieldEnabled ?? false;
  const gdprLabel = config.consentFieldText || 'I agree to receive marketing emails and accept the privacy policy';
  const collectName = config.nameFieldEnabled ?? false;

  // Reset form when popup closes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
        setName('');
        setGdprConsent(false);
        setErrors({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Note: Scroll locking and ESC key handling are now handled by PopupPortal

  const validateForm = () => {
    const newErrors: { email?: string; name?: string; gdpr?: string } = {};

    // Email validation (only if required)
    if (config.emailRequired !== false) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        newErrors.email = config.emailErrorMessage || 'Email is required';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    // Name validation (only if enabled and required)
    if (config.nameFieldEnabled && config.nameFieldRequired && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Consent validation (only if enabled and required)
    if (config.consentFieldEnabled && config.consentFieldRequired && !gdprConsent) {
      newErrors.gdpr = 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (config.previewMode) {
        // Preview mode - simulate success
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitted(true);
      } else if (onSubmit) {
        const code = await onSubmit({
          email,
          name: collectName ? name : undefined,
          gdprConsent,
        });
        if (code) setGeneratedDiscountCode(code);
        setIsSubmitted(true);
      } else {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Popup form submission error:', error);
      setErrors({ email: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const showImage = imagePosition !== 'none';
  const isVertical = imagePosition === 'left' || imagePosition === 'right';
  const imageFirst = imagePosition === 'left' || imagePosition === 'top';
  const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=modern email newsletter subscription`;

  // Content class for layout
  const contentClass = showImage
    ? isVertical
      ? `vertical ${imageFirst ? '' : 'reverse'}`
      : `horizontal ${imageFirst ? '' : 'reverse'}`
    : 'single-column';

  // Detect glass effect
  const isGlass = config.backgroundColor?.includes('rgba') &&
    parseFloat(config.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || '1') < 1;

  // Detect gradient background
  const hasGradientBg = config.backgroundColor?.includes('gradient');

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || 'rgba(0, 0, 0, 1)',
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'fade',
      }}
      position={config.position || 'center'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || title}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <style>{`

        .email-popup-container {
          position: relative;
          width: 100%;
          max-width: 56rem;
          border-radius: ${typeof config.borderRadius === 'number' ? config.borderRadius : parseFloat(config.borderRadius || '12')}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: zoomIn 0.2s ease-out;
          ${isGlass ? 'backdrop-filter: blur(12px);' : ''}
          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
          /* Apply font family to entire popup */
          font-family: ${config.fontFamily || 'inherit'};
        }

        .email-popup-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          color: ${config.descriptionColor || '#52525b'};
        }

        .email-popup-close:hover {
          background: rgba(0, 0, 0, 0.2);
          color: ${config.descriptionColor || '#52525b'};
        }

        .email-popup-content {
          display: flex;
        }

        .email-popup-content.horizontal {
          flex-direction: column;
        }

        .email-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }

        /* Base: Mobile-first (vertical stacking) */
        .email-popup-content.vertical {
          flex-direction: column;
        }

        .email-popup-content.vertical.reverse {
          flex-direction: column-reverse;
        }

        .email-popup-content.single-column {
          flex-direction: column;
        }

        .email-popup-content.single-column .email-popup-form-section {
          max-width: 32rem;
          margin: 0 auto;
        }

        /* Mobile-first: Image sizing */
        .email-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${config.imageBgColor || config.inputBackgroundColor || '#f4f4f5'};
          min-height: 200px;
          max-height: 300px;
        }

        .email-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Mobile-first: Form section */
        .email-popup-form-section {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: ${hasGradientBg ? config.backgroundColor : 'transparent'};
        }

        .email-popup-title {
          font-size: ${config.titleFontSize || config.fontSize || '1.875rem'};
          font-weight: ${config.titleFontWeight || config.fontWeight || '700'};
          margin-bottom: 0.75rem;
          color: ${config.textColor || '#111827'};
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ''}
        }

        .email-popup-description {
          font-size: ${config.descriptionFontSize || config.fontSize || '1rem'};
          line-height: 1.6;
          margin-bottom: 1.5rem;
          color: ${config.descriptionColor || '#52525b'};
          font-weight: ${config.descriptionFontWeight || config.fontWeight || '400'};
        }

        .email-popup-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .email-popup-input-wrapper {
          position: relative;
        }

        .email-popup-input {
          width: 100%;
          height: 3rem;
          padding: 0 1rem;
          border-radius: 0.5rem;
          border: 2px solid ${config.inputBorderColor || '#d4d4d8'};
          background: ${config.inputBackgroundColor || '#ffffff'};
          color: ${config.inputTextColor || '#111827'};
          font-size: 1rem;
          transition: all 0.2s;
          outline: none;
          ${config.inputBackdropFilter ? `backdrop-filter: ${config.inputBackdropFilter};` : ''}
          ${config.inputBoxShadow ? `box-shadow: ${config.inputBoxShadow};` : ''}
        }

        .email-popup-input::placeholder {
          color: ${config.inputTextColor ? `${config.inputTextColor}80` : '#9ca3af'};
          opacity: 1;
        }

        .email-popup-input:focus {
          border-color: ${config.accentColor || config.buttonColor || '#3b82f6'};
          box-shadow: 0 0 0 3px ${config.accentColor || config.buttonColor || '#3b82f6'}33;
        }

        .email-popup-input.error {
          border-color: #ef4444;
        }

        .email-popup-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .email-popup-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: ${config.textColor || '#111827'};
        }

        .email-popup-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .email-popup-checkbox {
          margin-top: 0.25rem;
          width: 1rem;
          height: 1rem;
          cursor: pointer;
        }

        .email-popup-checkbox-label {
          font-size: 0.875rem;
          color: ${config.descriptionColor || '#52525b'};
          line-height: 1.4;
        }

        .email-popup-button {
          width: 100%;
          height: 3rem;
          border-radius: 0.5rem;
          border: none;
          background: ${config.buttonColor || '#3b82f6'};
          color: ${config.buttonTextColor || '#ffffff'};
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .email-popup-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${config.buttonColor || '#3b82f6'}40;
        }

        .email-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .email-popup-success {
          text-align: center;
          padding: 2rem 0;
          animation: fadeInUp 0.5s ease-out;
        }

        .email-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: ${config.successColor ? `${config.successColor}20` : '#dcfce7'};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          animation: bounceIn 0.6s ease-out;
        }

        .email-popup-success-icon svg {
          stroke: ${config.successColor || '#16a34a'};
        }

        .email-popup-success-message {
          font-size: ${config.titleFontSize || config.fontSize || '1.875rem'};
          font-weight: ${config.titleFontWeight || config.fontWeight || '700'};
          color: ${config.textColor || '#111827'};
          margin-bottom: 1.5rem;
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ''}
        }

        .email-popup-discount {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: 2px dashed ${config.accentColor || config.buttonColor || '#3b82f6'};
          background: ${config.accentColor ? `${config.accentColor}15` : config.inputBackgroundColor || '#f4f4f5'};
        }

        .email-popup-discount-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: ${config.descriptionColor || '#52525b'};
        }

        .email-popup-discount-code {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: ${config.accentColor || config.buttonColor || config.textColor || '#111827'};
        }

        .email-popup-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid ${config.buttonTextColor || '#ffffff'}40;
          border-top-color: ${config.buttonTextColor || '#ffffff'};
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Container Query: Desktop layout (≥768px container width) */
        @container popup (min-width: 768px) {
          .email-popup-content.vertical {
            flex-direction: row;
          }

          .email-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }

          .email-popup-image {
            flex: 1;
            min-height: 500px;
            max-height: none;
          }

          .email-popup-form-section {
            flex: 1;
            padding: 3rem;
          }
        }

        /* Fallback media query for non-preview mode */
        @media (min-width: 768px) {
          .email-popup-container {
            max-width: 80rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .email-popup-container,
          .email-popup-success,
          .email-popup-success-icon {
            animation: none;
          }
        }


      `}</style>

      <div className="email-popup-container" style={{ background: hasGradientBg ? 'transparent' : config.backgroundColor || '#ffffff' }}>

          {config.showCloseButton !== false && (
            <button
              className="email-popup-close"
              onClick={onClose}
              aria-label="Close popup"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          <div
            className={`email-popup-content ${contentClass}`}
          >
            {showImage && imageUrl && (
              <div className="email-popup-image">
                <img src={imageUrl} alt="" />
              </div>
            )}

            <div className="email-popup-form-section">
              {!isSubmitted ? (
                <>
                  <h2 id="popup-title" className="email-popup-title">{title}</h2>
                  <p className="email-popup-description">{description}</p>

                  <form className="email-popup-form" onSubmit={handleSubmit}>
                    {collectName && (
                      <div className="email-popup-input-wrapper">
                        <label htmlFor="name-input" className="email-popup-label">
                          Name
                        </label>
                        <input
                          id="name-input"
                          type="text"
                          className={`email-popup-input ${errors.name ? 'error' : ''}`}
                          placeholder={config.nameFieldPlaceholder || "Your name"}
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors({ ...errors, name: undefined });
                          }}
                          disabled={isSubmitting}
                          required={config.nameFieldRequired}
                        />
                        {errors.name && <div className="email-popup-error">{errors.name}</div>}
                      </div>
                    )}

                    <div className="email-popup-input-wrapper">
                      <label htmlFor="email-input" className="email-popup-label">
                        {config.emailLabel || "Email"}
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        className={`email-popup-input ${errors.email ? 'error' : ''}`}
                        placeholder={config.emailPlaceholder || "Enter your email"}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        disabled={isSubmitting}
                        required={config.emailRequired !== false}
                      />
                      {errors.email && <div className="email-popup-error">{errors.email}</div>}
                    </div>

                    {showGdprCheckbox && (
                      <div className="email-popup-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="gdpr-consent"
                          className="email-popup-checkbox"
                          checked={gdprConsent}
                          onChange={(e) => {
                            setGdprConsent(e.target.checked);
                            if (errors.gdpr) setErrors({ ...errors, gdpr: undefined });
                          }}
                          disabled={isSubmitting}
                          required={config.consentFieldRequired}
                        />
                        <label htmlFor="gdpr-consent" className="email-popup-checkbox-label">
                          {gdprLabel}
                        </label>
                      </div>
                    )}
                    {errors.gdpr && <div className="email-popup-error">{errors.gdpr}</div>}

                    <button
                      type="submit"
                      className="email-popup-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="email-popup-spinner" />
                          Subscribing...
                        </>
                      ) : (
                        buttonText
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="email-popup-success">
                  <div className="email-popup-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="email-popup-success-message">{successMessage}</h3>
                  {(generatedDiscountCode || discountCode) && (
                    <div className="email-popup-discount">
                      <p className="email-popup-discount-label">Your discount code:</p>
                      <p className="email-popup-discount-code">{generatedDiscountCode || discountCode}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </PopupPortal>
  );
};

