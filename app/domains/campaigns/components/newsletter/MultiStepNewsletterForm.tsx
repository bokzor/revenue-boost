/**
 * MultiStepNewsletterForm Component (Stub)
 * 
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should be created based on requirements.
 * 
 * Expected features:
 * - Multi-step form for newsletter signup
 * - Email collection
 * - Optional phone number
 * - Preferences selection
 * - Discount code delivery
 */

import React, { useState } from "react";

export interface MultiStepNewsletterConfig {
  headline?: string;
  subheadline?: string;
  steps?: Array<{
    title: string;
    fields: string[];
  }>;
  discountCode?: string;
  discountValue?: number;
  discountType?: "percentage" | "fixed";
  ctaText?: string;
  successMessage?: string;
}

interface FormSubmitData {
  email: string;
  phone: string;
  preferences: string[];
}

export interface MultiStepNewsletterFormProps {
  config: MultiStepNewsletterConfig;
  onSubmit?: (data: FormSubmitData) => void;
  onClose?: () => void;
  previewMode?: boolean;
}

export const MultiStepNewsletterForm: React.FC<MultiStepNewsletterFormProps> = ({
  config,
  onSubmit,
}) => {
  const [currentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    preferences: [],
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        padding: "32px",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      }}
    >
      {config.headline && (
        <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#333" }}>
          {config.headline}
        </h2>
      )}

      {config.subheadline && (
        <p style={{ margin: "0 0 24px 0", fontSize: "16px", color: "#666" }}>
          {config.subheadline}
        </p>
      )}

      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: currentStep >= step - 1 ? "#5C6AC4" : "#E0E0E0",
                marginRight: step < 3 ? "8px" : 0,
                borderRadius: "2px",
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
          Step {currentStep + 1} of 3
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #DDD",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>

        {config.discountCode && (
          <div
            style={{
              backgroundColor: "#F0F7FF",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#5C6AC4" }}>
              Get {config.discountValue}% off with code:
            </p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#5C6AC4" }}>
              {config.discountCode}
            </p>
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#5C6AC4",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {config.ctaText || "Continue"}
        </button>
      </form>

      <p style={{ fontSize: "12px", marginTop: "16px", color: "#999", textAlign: "center" }}>
        TODO: Implement multi-step form logic
      </p>
    </div>
  );
};

export default MultiStepNewsletterForm;

