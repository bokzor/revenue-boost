/**
 * FooterDisclaimer Component
 *
 * A small disclaimer text displayed at the bottom of popup forms.
 * Used for text like "Unsubscribe anytime. We respect your privacy."
 *
 * Uses CSS variables for styling:
 * - --rb-popup-fg: Text color (with opacity)
 */

import React from "react";

export interface FooterDisclaimerProps {
  /** Disclaimer text content */
  text: string;
  /** Custom text color (overrides CSS variable) */
  textColor?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Additional className */
  className?: string;
}

export function FooterDisclaimer({
  text,
  textColor,
  align = "center",
  className = "",
}: FooterDisclaimerProps) {
  return (
    <p
      className={`rb-footer-disclaimer ${className}`}
      style={{
        fontSize: "0.75rem",
        lineHeight: 1.5,
        color: textColor || "var(--rb-popup-fg, #6B7280)",
        opacity: 0.7,
        textAlign: align,
        marginTop: "1rem",
        marginBottom: 0,
      }}
    >
      {text}
    </p>
  );
}

export default FooterDisclaimer;

