/**
 * FormSection Component
 *
 * Reusable section wrapper for grouping related form fields
 * Follows Open/Closed Principle - extensible through composition
 */

import type { ReactNode } from "react";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
}: FormSectionProps) {
  if (collapsible) {
    return (
      <s-collapsible open={defaultOpen}>
        <s-section heading={title}>
          {description && <p>{description}</p>}
          {children}
        </s-section>
      </s-collapsible>
    );
  }

  return (
    <s-section heading={title}>
      {description && <p>{description}</p>}
      {children}
    </s-section>
  );
}

/**
 * FormGrid Component
 * Layout component for arranging form fields in a grid
 */
export interface FormGridProps {
  columns?: 1 | 2 | 3;
  gap?: "tight" | "loose";
  children: ReactNode;
}

export function FormGrid({ columns = 2, gap = "loose", children }: FormGridProps) {
  const gridClass = `form-grid form-grid--${columns}-col form-grid--${gap}`;

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}

/**
 * ValidationMessage Component
 * Displays validation errors in a consistent format
 */
export interface ValidationMessageProps {
  errors?: string[];
  type?: "error" | "warning" | "info";
}

export function ValidationMessage({ errors, type = "error" }: ValidationMessageProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  const tone = type === "error" ? "critical" : type === "warning" ? "warning" : "info";

  return (
    <s-banner tone={tone}>
      {errors.length === 1 ? (
        <p>{errors[0]}</p>
      ) : (
        <ul>
          {errors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      )}
    </s-banner>
  );
}

/**
 * FormActions Component
 * Consistent action buttons for forms
 */
export interface FormActionsProps {
  primaryLabel?: string;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  cancelUrl?: string;
}

export function FormActions({
  primaryLabel = "Save",
  primaryLoading = false,
  primaryDisabled = false,
  secondaryLabel,
  secondaryAction,
  cancelUrl,
}: FormActionsProps) {
  return (
    <s-page-actions>
      <s-button
        type="submit"
        variant="primary"
        loading={primaryLoading}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </s-button>

      {secondaryLabel && secondaryAction && (
        <s-button onClick={secondaryAction}>
          {secondaryLabel}
        </s-button>
      )}

      {cancelUrl && (
        <s-button href={cancelUrl}>
          Cancel
        </s-button>
      )}
    </s-page-actions>
  );
}

/**
 * StepIndicator Component
 * Shows progress through multi-step form
 */
export interface Step {
  id: string;
  label: string;
  completed?: boolean;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed || index < currentIndex;
        const status = isCompleted ? "complete" : isActive ? "current" : "incomplete";

        return (
          <div key={step.id} className={`step step--${status}`}>
            <span className="step__number">{index + 1}</span>
            <span className="step__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

