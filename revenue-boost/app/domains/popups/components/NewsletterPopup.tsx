/**
 * NewsletterPopup Component
 *
 * Base newsletter popup component that works in both admin preview and storefront.
 * Uses plain React and CSS only (no Remix-specific features).
 *
 * Features:
 * - Email input with validation
 * - Optional name field
 * - Optional consent checkbox
 * - Submit button with loading state
 * - Success/error message display
 * - Discount code display (if enabled)
 */

import React, { useState, useEffect } from "react";
import { BasePopup, type PopupConfig } from "./BasePopup";
import type { NewsletterTemplateConfig } from "~/lib/template-configs";

// Newsletter config that combines PopupConfig with template-specific fields
export interface NewsletterConfig extends PopupConfig {
  // Template type (optional, for type checking)
  templateType?: string;

  // Email field
  emailPlaceholder?: string;
  emailLabel?: string;
  emailRequired?: boolean;
  emailErrorMessage?: string;

  // Name field
  nameFieldEnabled?: boolean;
  nameFieldPlaceholder?: string;
  nameFieldRequired?: boolean;

  // Consent field
  consentFieldEnabled?: boolean;
  consentFieldText?: string;
  consentFieldRequired?: boolean;

  // Submit button
  submitButtonText?: string;
  successMessage?: string;

  // Discount
  discountEnabled?: boolean;
  discountCode?: string;
  discountValue?: number;
  discountPercentage?: number; // Alternative to discountValue for percentage-based discounts
  discountType?: string;
  deliveryMode?:
    | "show_code"
    | "send_email"
    | "show_code_fallback"
    | "show_in_popup_authorized_only";
  valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

  // Headline/subheadline (from base)
  headline?: string;
  subheadline?: string;
}

export interface NewsletterPopupProps {
  config: NewsletterConfig;
  isVisible: boolean;
  onClose: () => void;
  campaignId: string;
  onSubscribe?: (data: SubscribeData) => Promise<void>;
}

export interface SubscribeData {
  email: string;
  firstName?: string;
  lastName?: string;
  consent: boolean;
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({
  config,
  isVisible,
  onClose,
  campaignId,
  onSubscribe,
}) => {
  console.log("[NewsletterPopup] 🎨 Component rendering", {
    campaignId,
    isVisible,
    hasConfig: !!config,
    config,
  });

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [discountCode, setDiscountCode] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  // Reset form when popup closes
  useEffect(() => {
    if (!isVisible) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setConsent(false);
      setIsSuccess(false);
      setError("");
    }
  }, [isVisible]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate email
    if (!email || !validateEmail(email)) {
      setError(
        config.emailErrorMessage || "Please enter a valid email address",
      );
      return;
    }

    // Validate consent if required
    if (config.consentFieldRequired && !consent) {
      setError("Please accept the terms to continue");
      return;
    }

    // Debug: Log campaignId
    console.log("[NewsletterPopup] Submitting with campaignId:", campaignId);
    if (!campaignId || campaignId === "") {
      console.error("[NewsletterPopup] ERROR: campaignId is empty!");
      setError(
        "Configuration error: Campaign ID is missing. Please contact support.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const subscribeData: SubscribeData = {
        email,
        consent,
      };

      if (config.nameFieldEnabled) {
        subscribeData.firstName = firstName;
        subscribeData.lastName = lastName;
      }

      // Call onSubscribe callback if provided
      if (onSubscribe) {
        await onSubscribe(subscribeData);
      } else {
        // Default API call (for storefront via app proxy)
        const response = await fetch(
          "/apps/split-pop/commerce/leads/subscribe",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              campaignId,
              consent,
              sessionId:
                typeof window !== "undefined"
                  ? window.sessionStorage?.getItem("sessionId") ||
                    `session-${Date.now()}`
                  : `session-${Date.now()}`,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              pageUrl:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
              referrer:
                typeof window !== "undefined" ? document.referrer : undefined,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Subscription failed");
        }

        const result = await response.json();

        console.log("[NewsletterPopup] Subscription result:", result);

        // Store discount code from response
        if (result.discountCode) {
          console.log(
            "[NewsletterPopup] Setting discount code:",
            result.discountCode,
          );
          setDiscountCode(result.discountCode);
        } else {
          console.log("[NewsletterPopup] No discount code in response");
        }
      }

      setIsSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Newsletter subscription error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {/* Email Field */}
      <div style={{ marginBottom: "16px" }}>
        {config.emailLabel && (
          <label
            htmlFor="newsletter-email"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: config.textColor,
            }}
          >
            {config.emailLabel}
            {config.emailRequired && (
              <span style={{ color: "#DC2626" }}> *</span>
            )}
          </label>
        )}
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={config.emailPlaceholder || "Enter your email"}
          required={config.emailRequired !== false}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "16px",
            backgroundColor: "#FFFFFF",
            border: `1px solid ${error ? "#DC2626" : "#D1D5DB"}`,
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.2s, background-color 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = config.buttonColor || "#007BFF";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#DC2626" : "#D1D5DB";
          }}
        />
      </div>

      {/* Name Fields (if enabled) */}
      {config.nameFieldEnabled && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input
            type="text"
            name="given-name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required={config.nameFieldRequired}
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none",
            }}
          />
          <input
            type="text"
            name="family-name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required={config.nameFieldRequired}
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Consent Checkbox (if enabled) */}
      {config.consentFieldEnabled && (
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "14px",
              color: config.textColor,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required={config.consentFieldRequired}
              style={{
                marginTop: "2px",
                cursor: "pointer",
              }}
            />
            <span style={{ opacity: 0.8 }}>
              {config.consentFieldText || "I agree to receive marketing emails"}
            </span>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: "16px",
          fontWeight: "600",
          color: config.buttonTextColor || "#FFFFFF",
          backgroundColor: config.buttonColor || "#007BFF",
          border: "none",
          borderRadius: "8px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
          transition: "opacity 0.2s, transform 0.1s",
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {isSubmitting
          ? "Submitting..."
          : config.submitButtonText || config.buttonText || "Subscribe"}
      </button>
    </form>
  );

  // Helper function to interpolate template placeholders in success message
  const interpolateSuccessMessage = (message: string): string => {
    const actualDiscountCode =
      discountCode || config.discountCode || "WELCOME10";

    // Determine a friendly display value for {DISCOUNT_VALUE}
    let displayValue = "";
    const isFreeShipping =
      config.valueType === "FREE_SHIPPING" ||
      config.discountType === "FREE_SHIPPING" ||
      config.discountType === "free_shipping";
    if (isFreeShipping) {
      displayValue = "Free Shipping";
    } else if (
      typeof config.discountPercentage === "number" &&
      !Number.isNaN(config.discountPercentage)
    ) {
      displayValue = `${config.discountPercentage}%`;
    } else if (
      typeof config.discountValue === "number" &&
      !Number.isNaN(config.discountValue)
    ) {
      displayValue = `$${config.discountValue}`;
    } else {
      // Fallback
      displayValue = "10%";
    }

    return message
      .replace(/\{CODE\}/g, actualDiscountCode)
      .replace(/\{code\}/g, actualDiscountCode) // Support lowercase version too
      .replace(/\{DISCOUNT_CODE\}/g, actualDiscountCode)
      .replace(/\{DISCOUNT_VALUE\}/g, displayValue);
  };

  const handleCopy = async () => {
    const code = discountCode || config.discountCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // ignore
    }
  };

  const renderSuccess = () => {
    // Debug: Log the config values
    console.log("[NewsletterPopup] Success Message Debug:", {
      "config.successMessage": config.successMessage,
      "discountCode state": discountCode,
      "config.discountCode": config.discountCode,
      "config.discountEnabled": config.discountEnabled,
      "config.discountValue": config.discountValue,
      "config.discountPercentage": config.discountPercentage,
    });

    // If we have a discount code but no success message template, provide a default
    const defaultSuccessMessage =
      discountCode || config.discountCode
        ? config.valueType === "FREE_SHIPPING" ||
          config.discountType === "FREE_SHIPPING"
          ? "Thanks for subscribing! Your free shipping code {CODE} is ready to use."
          : "Thanks for subscribing! Your discount code {CODE} is ready to use."
        : "Thank you for subscribing!";

    const messageToUse = config.successMessage || defaultSuccessMessage;
    const processedMessage = interpolateSuccessMessage(messageToUse);

    console.log("[NewsletterPopup] Message to use:", messageToUse);
    console.log(
      "[NewsletterPopup] Processed success message:",
      processedMessage,
    );

    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        {/* Success Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            backgroundColor: "#D1FAE5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Success Message with Template Interpolation */}
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: "12px",
            color: config.textColor,
          }}
        >
          {processedMessage}
        </h3>

        {/* Discount Code (if enabled) - Show if discount is enabled OR if we have a discount code */}
        {(() => {
          const shouldShowDiscount =
            (config.discountEnabled || discountCode || config.discountCode) &&
            (discountCode || config.discountCode);
          const codeToShow = discountCode || config.discountCode;
          console.log("[NewsletterPopup] Discount display check:", {
            "config.discountEnabled": config.discountEnabled,
            "discountCode state": discountCode,
            "config.discountCode": config.discountCode,
            shouldShowDiscount: shouldShowDiscount,
            codeToShow: codeToShow,
            "config.discountType": config.discountType,
            "config.valueType": config.valueType,
          });
          return shouldShowDiscount;
        })() && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "14px", marginBottom: "8px", opacity: 0.8 }}>
              {config.valueType === "FREE_SHIPPING" ||
              config.discountType === "FREE_SHIPPING"
                ? "Your free shipping code:"
                : "Your discount code:"}
            </p>
            <div
              style={{
                padding: "12px 20px",
                backgroundColor: "#F3F4F6",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "700",
                letterSpacing: "1px",
                color: config.buttonColor || "#007BFF",
              }}
            >
              {discountCode || config.discountCode}
            </div>
            <div>
              <button
                onClick={handleCopy}
                style={{
                  marginTop: 8,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: config.buttonColor || "#007BFF",
                  color: config.buttonTextColor || "#fff",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copied" : "Copy Code"}
              </button>
            </div>
            {config.deliveryMode === "show_in_popup_authorized_only" ? (
              <div style={{ marginTop: "8px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#E97317",
                    marginBottom: "4px",
                  }}
                >
                  ⚠️ This code is authorized for your email only
                </p>
                <p style={{ fontSize: "11px", opacity: 0.6 }}>
                  You must use the same email address at checkout
                </p>
              </div>
            ) : (
              <p style={{ fontSize: "12px", marginTop: "8px", opacity: 0.6 }}>
                {config.valueType === "FREE_SHIPPING" ||
                config.discountType === "FREE_SHIPPING"
                  ? "Copy this code for free shipping at checkout"
                  : "Copy this code to use at checkout"}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Disable overlay click when showing success state with discount code
  const popupConfig = {
    ...config,
    // Keep popup open (disable overlay close) after success when a discount code is present
    closeOnOverlayClick: !(isSuccess && (discountCode || config.discountCode)),
  };

  return (
    <BasePopup
      config={popupConfig}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}}
      className="newsletter-popup"
    >
      <div style={{ padding: "32px", textAlign: "center" }}>
        {/* Headline */}
        {(config.headline || config.title) && (
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "12px",
              color: config.textColor,
              lineHeight: "1.2",
            }}
          >
            {config.headline || config.title}
          </h2>
        )}

        {/* Subheadline */}
        {(config.subheadline || config.description) && (
          <p
            style={{
              fontSize: "16px",
              marginBottom: "24px",
              color: config.textColor,
              opacity: 0.8,
              lineHeight: "1.5",
            }}
          >
            {config.subheadline || config.description}
          </p>
        )}

        {/* Form or Success Message */}
        {isSuccess ? renderSuccess() : renderForm()}
      </div>
    </BasePopup>
  );
};
