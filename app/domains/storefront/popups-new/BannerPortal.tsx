/**
 * BannerPortal Component
 *
 * A wrapper that handles banner-specific concerns:
 * - Fixed positioning (top or bottom)
 * - Slide in/out animations
 * - Portal rendering (to document.body)
 * - Reduced motion support
 *
 * Banner content remains fully autonomous - just renders inside the portal.
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type BannerPosition = "top" | "bottom";

export interface BannerPortalProps {
  isVisible: boolean;
  onClose?: () => void; // Optional - banner content handles its own close
  children: React.ReactNode;
  position?: BannerPosition;
  previewMode?: boolean;
  animationDuration?: number;
  zIndex?: number;
}

const ANIMATION_DURATION = 300;

export const BannerPortal: React.FC<BannerPortalProps> = ({
  isVisible,
  children,
  position = "top",
  previewMode = false,
  animationDuration = ANIMATION_DURATION,
  zIndex = 9999,
}) => {
  // Initialize based on isVisible to avoid flash of no content
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting" | "hidden">(
    isVisible ? "entering" : "hidden"
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasInitialized = useRef(false);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const effectiveDuration = prefersReducedMotion ? 0 : animationDuration;

  // Handle visibility state transitions
  useEffect(() => {
    // Skip the first render if we already initialized with the correct state
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // If we started visible, we're already in "entering" state, just need to transition to visible
      if (isVisible && animState === "entering") {
        const timer = setTimeout(() => setAnimState("visible"), effectiveDuration);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (isVisible && (animState === "hidden" || animState === "exiting")) {
      setAnimState("entering");
    } else if (!isVisible && (animState === "visible" || animState === "entering")) {
      setAnimState("exiting");
    }
  }, [isVisible, animState, effectiveDuration]);

  // Handle animation completion timers for subsequent state changes
  useEffect(() => {
    if (!hasInitialized.current) return;

    if (animState === "entering") {
      const timer = setTimeout(() => setAnimState("visible"), effectiveDuration);
      return () => clearTimeout(timer);
    } else if (animState === "exiting") {
      const timer = setTimeout(() => setAnimState("hidden"), effectiveDuration);
      return () => clearTimeout(timer);
    }
  }, [animState, effectiveDuration]);

  // Don't render if hidden and not visible
  if (animState === "hidden" && !isVisible) {
    return null;
  }

  // Determine animation class
  const getAnimationClass = () => {
    if (prefersReducedMotion) return "";
    
    if (animState === "entering") {
      return position === "top" ? "banner-portal-slide-in-top" : "banner-portal-slide-in-bottom";
    }
    if (animState === "exiting") {
      return position === "top" ? "banner-portal-slide-out-top" : "banner-portal-slide-out-bottom";
    }
    return "";
  };

  const animationStyles = `
    @keyframes banner-portal-slide-in-from-top {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes banner-portal-slide-out-to-top {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(-100%); opacity: 0; }
    }
    @keyframes banner-portal-slide-in-from-bottom {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes banner-portal-slide-out-to-bottom {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
    .banner-portal-slide-in-top {
      animation: banner-portal-slide-in-from-top ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .banner-portal-slide-out-top {
      animation: banner-portal-slide-out-to-top ${effectiveDuration}ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
    }
    .banner-portal-slide-in-bottom {
      animation: banner-portal-slide-in-from-bottom ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .banner-portal-slide-out-bottom {
      animation: banner-portal-slide-out-to-bottom ${effectiveDuration}ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
    }
  `;

  const containerStyle: React.CSSProperties = {
    position: previewMode ? "absolute" : "fixed",
    [position]: 0,
    left: 0,
    right: 0,
    zIndex,
  };

  const content = (
    <div
      ref={containerRef}
      className={`banner-portal ${getAnimationClass()}`}
      style={containerStyle}
      data-banner-position={position}
    >
      <style>{animationStyles}</style>
      {children}
    </div>
  );

  // In preview mode, render directly without portal
  if (previewMode) {
    return content;
  }

  // Render into body via portal
  return createPortal(content, document.body);
};

