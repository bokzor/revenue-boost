/**
 * PopupPortal Component
 *
 * A thin wrapper that handles all popup "chrome" concerns:
 * - Backdrop rendering (color, opacity, blur)
 * - Keyboard events (ESC to close)
 * - Click-outside-to-close
 * - Open/close animations with choreography
 * - Portal rendering (to document.body)
 * - Focus management
 * - Scroll locking
 * - Accessibility (aria-modal, role="dialog")
 *
 * Popup content remains fully autonomous - just renders inside the portal.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import type { PopupSize } from "./types";
import { getSizeDimensions } from "app/domains/storefront/popups-new/utils/utils";
import { PoweredByBadge } from "./components/primitives/PoweredByBadge";

export type AnimationType = "fade" | "slide" | "zoom" | "bounce" | "none";

/**
 * Mobile Presentation Mode
 * Determines how the popup is displayed on mobile devices (<520px)
 *
 * - "modal": Centered modal (same as desktop, scaled down)
 * - "bottom-sheet": Slides up from bottom with rounded top corners, swipe-to-dismiss
 * - "fullscreen": Full viewport height (100dvh), hero image layout
 */
export type MobilePresentationMode = "modal" | "bottom-sheet" | "fullscreen";

export interface BackdropConfig {
  color?: string; // Base color (hex, rgb, rgba)
  opacity?: number; // Applied opacity (0-1)
  blur?: number; // backdrop-filter blur in px
}

export interface AnimationConfig {
  type: AnimationType;
  duration?: number; // Override default duration
  backdropDelay?: number; // Custom delay for backdrop
  contentDelay?: number; // Custom delay for content
}

export type PopupPosition = "center" | "top" | "bottom" | "left" | "right";

export interface PopupPortalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  customCSS?: string;
  globalCustomCSS?: string;

  // Backdrop configuration
  backdrop?: BackdropConfig;

  // Animation configuration
  animation?: AnimationConfig;

  // Layout
  position?: PopupPosition;
  size?: PopupSize;

  /**
   * Mobile presentation mode (only applies on viewports < 520px)
   * - "modal": Centered modal (same as desktop)
   * - "bottom-sheet": Slides from bottom, swipe-to-dismiss (default)
   * - "fullscreen": Full viewport height, hero layout
   */
  mobilePresentationMode?: MobilePresentationMode;

  // Behavior
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  previewMode?: boolean;

  // Branding (for free tier)
  showBranding?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * Animation choreography timing
 * Defines when backdrop and content should animate
 */
const ANIMATION_CHOREOGRAPHY = {
  fade: {
    backdrop: { delay: 0, duration: 200 },
    content: { delay: 0, duration: 200 },
  },
  slide: {
    backdrop: { delay: 0, duration: 150 },
    content: { delay: 50, duration: 300 },
  },
  zoom: {
    backdrop: { delay: 0, duration: 250 },
    content: { delay: 0, duration: 300 },
  },
  bounce: {
    backdrop: { delay: 0, duration: 200 },
    content: { delay: 50, duration: 500 },
  },
  none: {
    backdrop: { delay: 0, duration: 0 },
    content: { delay: 0, duration: 0 },
  },
};

export const PopupPortal: React.FC<PopupPortalProps> = ({
  isVisible,
  onClose,
  children,
  customCSS,
  globalCustomCSS,
  backdrop = {},
  animation = { type: "fade" },
  position = "center",
  size,
  mobilePresentationMode = "bottom-sheet", // Default for backwards compatibility
  closeOnEscape = true,
  closeOnBackdropClick = true,
  previewMode = false,
  showBranding = false,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  // Swipe-to-dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);

  // Get animation timing
  const animationType = animation.type || "fade";
  const choreography = ANIMATION_CHOREOGRAPHY[animationType];

  const frameStyles = useMemo<React.CSSProperties | undefined>(() => {
    if (!size) return undefined;

    const { width, maxWidth } = getSizeDimensions(size, previewMode);
    return {
      width,
      maxWidth,
      // Note: maxHeight is set via CSS (not inline) so mobile can override it
      margin: "0 auto",
      display: "flex",
      justifyContent: "center",
    };
  }, [size, previewMode]);

  const backdropTiming = useMemo(
    () => ({
      delay: animation.backdropDelay ?? choreography.backdrop.delay,
      duration: animation.duration ?? choreography.backdrop.duration,
    }),
    [
      animation.backdropDelay,
      animation.duration,
      choreography.backdrop.delay,
      choreography.backdrop.duration,
    ]
  );

  const contentTiming = useMemo(
    () => ({
      delay: animation.contentDelay ?? choreography.content.delay,
      duration: animation.duration ?? choreography.content.duration,
    }),
    [
      animation.contentDelay,
      animation.duration,
      choreography.content.delay,
      choreography.content.duration,
    ]
  );

  // Calculate backdrop color with opacity
  const getBackdropColor = useCallback(() => {
    const opacity = backdrop.opacity ?? 0.6;
    const color = backdrop.color || "rgba(0, 0, 0, 1)";

    // If color is already rgba, extract RGB and apply opacity
    if (color.startsWith("rgba")) {
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
      }
    }

    // If color is rgb, convert to rgba with opacity
    if (color.startsWith("rgb")) {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
      }
    }

    // If color is hex, convert to rgba
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fallback
    return `rgba(0, 0, 0, ${opacity})`;
  }, [backdrop.color, backdrop.opacity]);

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    if (animationType !== "none") {
      setIsExiting(true);
      // Wait for the longest animation to complete
      const maxDuration = Math.max(
        backdropTiming.delay + backdropTiming.duration,
        contentTiming.delay + contentTiming.duration
      );
      setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, maxDuration);
    } else {
      onClose();
    }
  }, [animationType, backdropTiming, contentTiming, onClose]);

  // Handle ESC key press
  useEffect(() => {
    if (!isVisible || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isVisible, closeOnEscape, handleClose]);

  // Handle backdrop click
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (_e) => {
      if (closeOnBackdropClick) {
        handleClose();
      }
    },
    [closeOnBackdropClick, handleClose]
  );

  // Prevent content click from closing
  const handleContentClick: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // ========================================
  // SWIPE-TO-DISMISS (Mobile Bottom Sheet)
  // ========================================
  const SWIPE_THRESHOLD = 100; // px to trigger dismiss
  const VELOCITY_THRESHOLD = 0.5; // px/ms for fast swipe

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragStartTime.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - dragStartY.current;

      // Only allow dragging down (positive deltaY)
      if (deltaY > 0) {
        setDragOffset(deltaY);
        // Add resistance as you drag further
        // e.preventDefault(); // Prevent scroll - but be careful with this
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const elapsed = Date.now() - dragStartTime.current;
    const velocity = dragOffset / elapsed; // px/ms

    // Dismiss if dragged past threshold OR fast swipe
    if (dragOffset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      handleClose();
    }

    // Reset drag state
    setDragOffset(0);
    setIsDragging(false);
  }, [isDragging, dragOffset, handleClose]);

  // Focus management
  useEffect(() => {
    if (isVisible && !previewMode) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the content wrapper
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }

    return () => {
      // Restore focus on unmount
      if (previousFocusRef.current && !previewMode) {
        previousFocusRef.current.focus();
      }
    };
  }, [isVisible, previewMode]);

  // Scroll locking
  useEffect(() => {
    if (isVisible && !previewMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible, previewMode]);

  // Create Shadow DOM container
  useEffect(() => {
    if (previewMode) return; // Don't use Shadow DOM in preview mode

    // Create shadow host if it doesn't exist
    let host = document.getElementById("revenue-boost-popup-shadow-host") as HTMLDivElement;

    if (!host) {
      host = document.createElement("div");
      host.id = "revenue-boost-popup-shadow-host";
      // Shadow host MUST have display: block to have dimensions!
      // position: fixed with inset: 0 makes it fill the viewport
      host.style.cssText =
        "display: block; position: fixed; inset: 0; z-index: 9999; pointer-events: auto;";
      document.body.appendChild(host);
    }

    // Attach shadow root if not already attached
    if (!host.shadowRoot) {
      const shadowRoot = host.attachShadow({ mode: "open" });
      shadowRootRef.current = shadowRoot;

      // Add base styles using adoptedStyleSheets (modern approach for Shadow DOM)
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
          * {
            box-sizing: border-box;
          }
        `);
        shadowRoot.adoptedStyleSheets = [sheet];
      } catch (e) {
        console.warn("[PopupPortal] adoptedStyleSheets not supported, falling back to style tag");
      }
    } else {
      shadowRootRef.current = host.shadowRoot;
    }

    shadowHostRef.current = host;

    return () => {
      // Cleanup: remove host when component unmounts
      if (host && host.parentNode) {
        host.parentNode.removeChild(host);
      }
    };
  }, [previewMode]);

  // Mount/unmount management
  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
    } else if (!isExiting) {
      setIsMounted(false);
    }
  }, [isVisible, isExiting]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const effectiveAnimationType = prefersReducedMotion ? "none" : animationType;

  // Animation classes
  const getAnimationClass = () => {
    if (effectiveAnimationType === "none") return "";

    const direction = isExiting ? "exit" : "enter";
    return `popup-portal-${effectiveAnimationType}-${direction}`;
  };

  const backdropAnimationClass = getAnimationClass();
  const contentAnimationClass = getAnimationClass();

  // Styles
  // In Shadow DOM, position: fixed doesn't work relative to viewport
  // It's relative to the shadow host. Since shadow host is position:fixed with inset:0,
  // we use position:absolute inside to fill the shadow host (which fills the viewport)
  const overlayStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
    pointerEvents: "auto", // Enable pointer events in shadow DOM
  };

  const backdropStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: getBackdropColor(),
    backdropFilter: backdrop.blur ? `blur(${backdrop.blur}px)` : undefined,
    animationDelay: `${backdropTiming.delay}ms`,
    animationDuration: `${backdropTiming.duration}ms`,
  };

  const contentWrapperStyles: React.CSSProperties = {
    animationDelay: `${contentTiming.delay}ms`,
    animationDuration: `${contentTiming.duration}ms`,
    outline: "none",
  };

  const combinedCustomCSS = useMemo(
    () => [globalCustomCSS, customCSS].filter(Boolean).join("\n\n"),
    [customCSS, globalCustomCSS]
  );

  // Don't render if not mounted
  if (!isMounted && !isVisible) return null;

  // Render content
  const content = (
    <div
      className="popup-portal-root"
      style={{
        ...overlayStyles,
        // Make this a container for container queries
        containerType: "inline-size",
        containerName: "popup-viewport",
      }}
      role="presentation"
    >
      {/* Base styles for Shadow DOM - ensures proper rendering */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        * {
          box-sizing: border-box;
        }
        ${getAnimationKeyframes(position, mobilePresentationMode)}
      `,
        }}
      />
      {combinedCustomCSS && <style dangerouslySetInnerHTML={{ __html: combinedCustomCSS }} />}

      {/* Backdrop */}
      <div
        className={backdropAnimationClass}
        style={backdropStyles}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Content wrapper with animation */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={contentRef}
        className={`popup-portal-dialog-wrapper ${contentAnimationClass}`}
        style={{
          ...contentWrapperStyles,
          // Apply drag offset for swipe-to-dismiss
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onClick={handleContentClick}
        onKeyDown={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {frameStyles ? (
          <div className="popup-portal-frame" style={frameStyles}>
            {/* Drag Handle - Only visible on mobile, now inside frame */}
            <div className="popup-drag-handle" aria-hidden="true">
              <div className="popup-drag-handle-bar" />
            </div>
            {children}
            {showBranding && <PoweredByBadge position="bottom-right" />}
          </div>
        ) : (
          <>
            {/* Drag Handle - Only visible on mobile */}
            <div className="popup-drag-handle" aria-hidden="true">
              <div className="popup-drag-handle-bar" />
            </div>
            {children}
            {showBranding && <PoweredByBadge position="bottom-right" />}
          </>
        )}
      </div>
    </div>
  );

  // Render with portal
  if (previewMode) {
    // In preview mode, render directly without Shadow DOM
    return content;
  }

  // Render into Shadow DOM
  if (shadowRootRef.current) {
    return createPortal(content, shadowRootRef.current as unknown as Element);
  }

  // Fallback: render to body if Shadow DOM not ready
  return null;
};

/**
 * Generate CSS keyframes for animations
 */
function getAnimationKeyframes(
  position: PopupPosition,
  mobilePresentationMode: MobilePresentationMode
): string {
  // Map position to flexbox alignment
  const alignMap = {
    center: "center",
    top: "flex-start",
    bottom: "flex-end",
    left: "flex-start",
    right: "flex-end",
  };

  const justifyMap = {
    center: "center",
    top: "center",
    bottom: "center",
    left: "flex-start",
    right: "flex-end",
  };

  // Generate mobile-specific styles based on presentation mode
  const getMobileStyles = () => {
    switch (mobilePresentationMode) {
      case "modal":
        // Modal: Same as desktop, just scaled down. No special mobile treatment.
        return `
      .popup-portal-dialog-wrapper {
        padding: 0.5rem;
      }
      .popup-drag-handle {
        display: none;
      }
    `;

      case "fullscreen":
        // Fullscreen: Takes full container height, content fills space
        // Use 100% instead of 100dvh so it works in both preview and production
        // (PopupPortal root already fills viewport in production)
        return `
      .popup-portal-dialog-wrapper {
        align-items: stretch !important;
        justify-content: stretch !important;
        padding: 0 !important;
        height: 100%;
      }
      .popup-drag-handle {
        display: block;
      }
      .popup-portal-frame,
      .popup-grid-container {
        width: 100%;
        max-width: 100% !important;
        max-height: 100% !important; /* Override desktop constraint for fullscreen */
        height: 100%;
        border-radius: 0 !important;
        overflow-y: auto;
      }
      /* Slide-up animation for fullscreen */
      .popup-portal-dialog-wrapper.popup-portal-slide-enter,
      .popup-portal-dialog-wrapper.popup-portal-fade-enter,
      .popup-portal-dialog-wrapper.popup-portal-zoom-enter,
      .popup-portal-dialog-wrapper.popup-portal-bounce-enter {
        animation-name: popup-portal-mobile-slide-up-enter !important;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .popup-portal-dialog-wrapper.popup-portal-slide-exit,
      .popup-portal-dialog-wrapper.popup-portal-fade-exit,
      .popup-portal-dialog-wrapper.popup-portal-zoom-exit,
      .popup-portal-dialog-wrapper.popup-portal-bounce-exit {
        animation-name: popup-portal-mobile-slide-down-exit !important;
        animation-timing-function: ease-in !important;
      }
    `;

      case "bottom-sheet":
      default:
        // Bottom sheet: Slides from bottom, rounded top corners, swipe-to-dismiss
        return `
      .popup-portal-dialog-wrapper {
        align-items: flex-end !important;
        justify-content: center !important;
        padding: 0 !important;
        padding-bottom: env(safe-area-inset-bottom, 0) !important;
      }
      .popup-drag-handle {
        display: block;
      }
      .popup-portal-frame,
      .popup-grid-container {
        width: 100%;
        max-width: 100% !important;
        border-radius: 1.5rem 1.5rem 0 0 !important;
        max-height: 80vh !important;
        max-height: 80dvh !important; /* Override desktop constraint for bottom-sheet */
        overflow-y: auto;
      }
      /* Slide-up animation for bottom-sheet */
      .popup-portal-dialog-wrapper.popup-portal-slide-enter,
      .popup-portal-dialog-wrapper.popup-portal-fade-enter,
      .popup-portal-dialog-wrapper.popup-portal-zoom-enter,
      .popup-portal-dialog-wrapper.popup-portal-bounce-enter {
        animation-name: popup-portal-mobile-slide-up-enter !important;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .popup-portal-dialog-wrapper.popup-portal-slide-exit,
      .popup-portal-dialog-wrapper.popup-portal-fade-exit,
      .popup-portal-dialog-wrapper.popup-portal-zoom-exit,
      .popup-portal-dialog-wrapper.popup-portal-bounce-exit {
        animation-name: popup-portal-mobile-slide-down-exit !important;
        animation-timing-function: ease-in !important;
      }
    `;
    }
  };

  const mobileStyles = getMobileStyles();

  return `
    /* Base positioning for dialog wrapper - DESKTOP default */
    .popup-portal-dialog-wrapper {
      position: absolute;
      inset: 0;
      z-index: 1;
      padding: 1.5rem;
      display: flex;
      align-items: ${alignMap[position]};
      justify-content: ${justifyMap[position]};
      /* Enable container queries for popup content (used by PopupGridContainer) */
      container-type: inline-size;
      container-name: viewport;
    }

    /* ========================================
       POPUP FRAME (contains the actual popup)
       Properly constrains size and enables
       scrolling when content overflows
       ======================================== */
    .popup-portal-frame {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      /* Desktop: constrain height to leave breathing room */
      max-height: calc(100vh - 3rem);
      max-height: calc(100dvh - 3rem); /* Dynamic viewport height for mobile browsers */
      /* Enable container query for child components */
      container-type: inline-size;
      container-name: popup-viewport;
    }

    /* ========================================
       DRAG HANDLE (for swipe-to-dismiss)
       Hidden on desktop, visible based on mobile mode
       ======================================== */
    .popup-drag-handle {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 28px;
      z-index: 100;
      touch-action: none;
      cursor: grab;
    }

    .popup-drag-handle:active {
      cursor: grabbing;
    }

    .popup-drag-handle-bar {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 4px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }

    /* ========================================
       MOBILE STYLES (container < 520px)
       Mode-specific styles based on mobilePresentationMode
       Uses container query for preview compatibility
       AND media query fallback for storefront
       ======================================== */
    @container popup-viewport (max-width: 519px) {
      ${mobileStyles}
    }

    /* Fallback for storefront (where container queries may not apply) */
    @media (max-width: 519px) {
      ${mobileStyles}
    }

    /* Mobile slide-up animation (from bottom) - used by bottom-sheet and fullscreen */
    @keyframes popup-portal-mobile-slide-up-enter {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes popup-portal-mobile-slide-down-exit {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(100%);
      }
    }

    /* Fade animations */
    @keyframes popup-portal-fade-enter {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popup-portal-fade-exit {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .popup-portal-fade-enter {
      animation: popup-portal-fade-enter forwards;
      animation-timing-function: ease-out;
    }
    .popup-portal-fade-exit {
      animation: popup-portal-fade-exit forwards;
      animation-timing-function: ease-in;
    }

    /* Slide animations */
    @keyframes popup-portal-slide-enter {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes popup-portal-slide-exit {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
    .popup-portal-slide-enter {
      animation: popup-portal-slide-enter forwards;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    .popup-portal-slide-exit {
      animation: popup-portal-slide-exit forwards;
      animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
    }

    /* Zoom animations */
    @keyframes popup-portal-zoom-enter {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes popup-portal-zoom-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
    .popup-portal-zoom-enter {
      animation: popup-portal-zoom-enter forwards;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    .popup-portal-zoom-exit {
      animation: popup-portal-zoom-exit forwards;
      animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
    }

    /* Bounce animations */
    @keyframes popup-portal-bounce-enter {
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
    @keyframes popup-portal-bounce-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.8);
      }
    }
    .popup-portal-bounce-enter {
      animation: popup-portal-bounce-enter forwards;
      animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    .popup-portal-bounce-exit {
      animation: popup-portal-bounce-exit forwards;
      animation-timing-function: ease-in;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .popup-portal-fade-enter,
      .popup-portal-fade-exit,
      .popup-portal-slide-enter,
      .popup-portal-slide-exit,
      .popup-portal-zoom-enter,
      .popup-portal-zoom-exit,
      .popup-portal-bounce-enter,
      .popup-portal-bounce-exit {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;
}
