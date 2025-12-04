/**
 * StyledCheckbox Component
 *
 * A custom styled checkbox with rounded corners and check icon.
 * Matches the Spa Serenity design with smooth transitions.
 *
 * Uses CSS variables for styling:
 * - --rb-popup-checkbox-radius: Border radius (default 6px)
 * - --rb-popup-checkbox-size: Size in pixels (default 20px)
 * - --rb-popup-accent: Primary/accent color
 * - --rb-popup-input-border: Border color
 * - --rb-popup-input-focus-ring-color: Focus ring color
 * - --rb-popup-input-focus-ring-width: Focus ring width
 */

import React from "react";

export interface StyledCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Accent/primary color for checked state */
  accentColor?: string;
  /** Border color for unchecked state */
  borderColor?: string;
  /** Size of the checkbox in pixels */
  size?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Error state */
  hasError?: boolean;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Additional className */
  className?: string;
}

export function StyledCheckbox({
  checked,
  onChange,
  disabled = false,
  required = false,
  accentColor,
  borderColor,
  size,
  borderRadius,
  hasError = false,
  ariaLabel,
  className = "",
}: StyledCheckboxProps) {
  const checkboxSize = size || 20;
  const checkboxRadius = borderRadius || 6;
  const effectiveAccentColor = accentColor || "var(--rb-popup-accent, #4F46E5)";
  const effectiveBorderColor = borderColor || "var(--rb-popup-input-border, #D1D5DB)";

  return (
    <div
      className={`rb-styled-checkbox ${className}`}
      style={{
        position: "relative",
        width: checkboxSize,
        height: checkboxSize,
        flexShrink: 0,
      }}
    >
      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        style={{
          position: "absolute",
          opacity: 0,
          width: "100%",
          height: "100%",
          cursor: disabled ? "not-allowed" : "pointer",
          margin: 0,
          zIndex: 1,
        }}
      />
      {/* Custom checkbox visual */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: `var(--rb-popup-checkbox-radius, ${checkboxRadius}px)`,
          border: `2px solid ${checked ? effectiveAccentColor : hasError ? "#EF4444" : effectiveBorderColor}`,
          backgroundColor: checked ? effectiveAccentColor : "transparent",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: checked ? undefined : undefined,
        }}
      >
        {/* Check icon */}
        {checked && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: "70%",
              height: "70%",
            }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {/* Focus ring styles via CSS */}
      <style>{`
        .rb-styled-checkbox input:focus-visible + div {
          box-shadow: 0 0 0 var(--rb-popup-input-focus-ring-width, 4px) 
                      var(--rb-popup-input-focus-ring-color, rgba(79, 70, 229, 0.1));
        }
        .rb-styled-checkbox:hover input:not(:disabled) + div {
          border-color: ${checked ? effectiveAccentColor : "var(--rb-popup-fg, #6B7280)"};
        }
      `}</style>
    </div>
  );
}

export default StyledCheckbox;

