/**
 * ShadowDomWrapper Component
 *
 * Wraps children in a Shadow DOM to isolate styles.
 * Uses ReactDOM.createPortal to render into the shadow root,
 * keeping the React tree connected (unlike createRoot).
 *
 * Used for popup previews to prevent CSS leakage between instances.
 *
 * Note: Falls back to regular rendering during SSR since Shadow DOM
 * is only available in the browser.
 */

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ShadowDomWrapperProps {
  /** Content to render inside the shadow DOM */
  children: React.ReactNode;
  /** Optional styles to inject into the shadow DOM */
  styles?: string;
  /** CSS class for the host element */
  className?: string;
  /** Inline styles for the host element */
  style?: React.CSSProperties;
}

export function ShadowDomWrapper({
  children,
  styles,
  className,
  style,
}: ShadowDomWrapperProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowContainer, setShadowContainer] = useState<HTMLElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Detect client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize shadow DOM on mount (client-side only)
  useEffect(() => {
    if (!isClient || !hostRef.current) return;

    // Check if shadow root already exists
    let shadowRoot = hostRef.current.shadowRoot;

    if (!shadowRoot) {
      // Create shadow root
      shadowRoot = hostRef.current.attachShadow({ mode: "open" });
    }

    // Create or get container for React content
    let container = shadowRoot.querySelector(".shadow-content") as HTMLElement;
    if (!container) {
      container = document.createElement("div");
      container.className = "shadow-content";
      container.style.display = "contents";
      shadowRoot.appendChild(container);
    }

    setShadowContainer(container);
  }, [isClient]);

  // During SSR or before hydration, render children directly (no isolation)
  // This prevents hydration mismatch and ensures content is visible
  if (!isClient) {
    return (
      <div className={className} style={{ display: "contents", ...style }}>
        {styles && <style>{styles}</style>}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        display: "contents",
        ...style,
      }}
    >
      {shadowContainer &&
        createPortal(
          <>
            {styles && <style>{styles}</style>}
            {children}
          </>,
          shadowContainer
        )}
    </div>
  );
}

