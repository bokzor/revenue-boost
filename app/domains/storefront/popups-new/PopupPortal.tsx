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

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import type { PopupSize } from "./types";
import { getSizeDimensions } from "app/domains/storefront/popups-new/utils/utils";
import { PoweredByBadge } from "./components/primitives/PoweredByBadge";

/**
 * Shallow comparison for BackdropConfig objects
 */
function areBackdropConfigsEqual(
  prev: BackdropConfig | undefined,
  next: BackdropConfig | undefined
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;
  return prev.color === next.color && prev.opacity === next.opacity && prev.blur === next.blur;
}

/**
 * Shallow comparison for AnimationConfig objects
 */
function areAnimationConfigsEqual(
  prev: AnimationConfig | undefined,
  next: AnimationConfig | undefined
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;
  return (
    prev.type === next.type &&
    prev.duration === next.duration &&
    prev.backdropDelay === next.backdropDelay &&
    prev.contentDelay === next.contentDelay
  );
}

/**
 * Custom comparison function for PopupPortalProps
 * Performs shallow comparison for primitive props and deep comparison for object props
 */
function arePropsEqual(prevProps: PopupPortalProps, nextProps: PopupPortalProps): boolean {
  // Check primitive props
  if (
    prevProps.isVisible !== nextProps.isVisible ||
    prevProps.customCSS !== nextProps.customCSS ||
    prevProps.globalCustomCSS !== nextProps.globalCustomCSS ||
    prevProps.designTokensCSS !== nextProps.designTokensCSS ||
    prevProps.position !== nextProps.position ||
    prevProps.size !== nextProps.size ||
    prevProps.mobilePresentationMode !== nextProps.mobilePresentationMode ||
    prevProps.closeOnEscape !== nextProps.closeOnEscape ||
    prevProps.closeOnBackdropClick !== nextProps.closeOnBackdropClick ||
    prevProps.previewMode !== nextProps.previewMode ||
    prevProps.showBranding !== nextProps.showBranding ||
    prevProps.ariaLabel !== nextProps.ariaLabel ||
    prevProps.ariaDescribedBy !== nextProps.ariaDescribedBy
  ) {
    return false;
  }

  // Check callback reference (onClose should be stable via useCallback in parent)
  if (prevProps.onClose !== nextProps.onClose) {
    return false;
  }

  // Check children reference
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  // Deep compare object props
  if (!areBackdropConfigsEqual(prevProps.backdrop, nextProps.backdrop)) {
    return false;
  }

  if (!areAnimationConfigsEqual(prevProps.animation, nextProps.animation)) {
    return false;
  }

  return true;
}

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

  /**
   * Pre-resolved CSS custom properties for design tokens.
   * Format: "--rb-background: #fff; --rb-primary: #000; ..."
   * Applied as inline styles on the popup container so child components
   * can reference these variables (e.g., `var(--rb-primary)`).
   */
  designTokensCSS?: string;

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
    backdrop: { delay: 0, duration: 300 },
    content: { delay: 0, duration: 300 },
  },
  slide: {
    backdrop: { delay: 0, duration: 300 },
    content: { delay: 50, duration: 400 },
  },
  zoom: {
    backdrop: { delay: 0, duration: 300 },
    content: { delay: 0, duration: 350 },
  },
  bounce: {
    backdrop: { delay: 0, duration: 300 },
    content: { delay: 50, duration: 500 },
  },
  none: {
    backdrop: { delay: 0, duration: 0 },
    content: { delay: 0, duration: 0 },
  },
};

/**
 * Animation State Machine
 *
 * States:
 * - 'unmounted': Not in DOM
 * - 'entering': Playing enter animation
 * - 'visible': Fully visible, interactive
 * - 'exiting': Playing exit animation
 *
 * Transitions:
 * - unmounted -> entering: when isVisible becomes true
 * - entering -> visible: after enter animation completes
 * - visible -> exiting: when isVisible becomes false (or swipe dismiss)
 * - exiting -> unmounted: after exit animation completes
 */
type AnimationState = "unmounted" | "entering" | "visible" | "exiting";

// Swipe-to-dismiss constants
const SWIPE_THRESHOLD = 100; // px
const VELOCITY_THRESHOLD = 0.5; // px/ms
const SWIPE_DISMISS_DURATION = 300; // ms

const PopupPortalComponent: React.FC<PopupPortalProps> = ({
  isVisible,
  onClose,
  children,
  customCSS,
  globalCustomCSS,
  designTokensCSS,
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
  // Animation state machine
  const [animationState, setAnimationState] = useState<AnimationState>("unmounted");

  // Swipe-to-dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Handle close - just call onClose, the state machine handles animation
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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
        e.preventDefault(); // Prevent scroll while dragging
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

      // Animate to bottom of screen then close
      setIsDragging(false);
      setDragOffset(window.innerHeight);
      setAnimationState("exiting");

      // After swipe animation completes, trigger close
      setTimeout(() => {
        onClose?.();
      }, SWIPE_DISMISS_DURATION);
    } else {
      // Not enough to dismiss - snap back
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isDragging, dragOffset, onClose]);

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

  // ========================================
  // ANIMATION STATE MACHINE
  // ========================================

  // Calculate max animation duration
  const animationDuration = useMemo(() => {
    if (animationType === "none") return 0;
    return Math.max(
      backdropTiming.delay + backdropTiming.duration,
      contentTiming.delay + contentTiming.duration
    );
  }, [animationType, backdropTiming, contentTiming]);

  // Handle state transitions based on isVisible prop
  useEffect(() => {
    // Clear any pending animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (isVisible && animationState === "unmounted") {
      // Start entering
      setAnimationState("entering");

      // Transition to visible after animation
      animationTimerRef.current = setTimeout(() => {
        setAnimationState("visible");
      }, animationDuration);
    } else if (!isVisible && (animationState === "visible" || animationState === "entering")) {
      // Start exiting
      setAnimationState("exiting");

      // Reset drag state
      setDragOffset(0);
      setIsDragging(false);

      // Transition to unmounted after animation
      animationTimerRef.current = setTimeout(() => {
        setAnimationState("unmounted");
      }, animationDuration);
    } else if (!isVisible && animationState === "exiting") {
      // Already exiting (from swipe), just wait for unmount timer
      animationTimerRef.current = setTimeout(() => {
        setAnimationState("unmounted");
      }, animationDuration);
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isVisible, animationState, animationDuration]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const effectiveAnimationType = prefersReducedMotion ? "none" : animationType;

  // Derive animation class from state machine
  // Backdrop always uses fade, content uses the configured animation type
  const getAnimationClass = useCallback(
    (forBackdrop: boolean = false) => {
      if (effectiveAnimationType === "none") return "";
      if (isDragging) return ""; // No animation class while dragging

      const type = forBackdrop ? "fade" : effectiveAnimationType;

      switch (animationState) {
        case "entering":
          return `popup-portal-${type}-enter`;
        case "exiting":
          return `popup-portal-${type}-exit`;
        default:
          return ""; // 'visible' and 'unmounted' have no animation class
      }
    },
    [effectiveAnimationType, animationState, isDragging]
  );

  const backdropAnimationClass = getAnimationClass(true); // Always fade
  const contentAnimationClass = getAnimationClass(false); // Uses configured animation

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
    zIndex: 0, // Ensure backdrop is below content (dialog-wrapper has z-index: 1)
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

  // Don't render when unmounted
  if (animationState === "unmounted") {
    return null;
  }

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
        ${getAnimationKeyframes(position, mobilePresentationMode, size)}
      `,
        }}
      />
      {/* Design tokens as CSS custom properties (--rb-background, --rb-primary, etc.) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Default design token values (fallbacks) - 14 tokens */
            .popup-portal-root {
              /* Tier 1: Essential */
              --rb-background: #ffffff;
              --rb-foreground: #1a1a1a;
              --rb-primary: #000000;
              --rb-muted: rgba(26, 26, 26, 0.6);
              --rb-radius: 8px;
              /* Tier 2: Common */
              --rb-primary-foreground: #ffffff;
              --rb-surface: #f5f5f5;
              --rb-border: rgba(26, 26, 26, 0.15);
              --rb-overlay: rgba(0, 0, 0, 0.6);
              --rb-font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              /* Tier 3: Advanced */
              --rb-success: #10B981;
              --rb-error: #EF4444;
              --rb-ring: rgba(0, 0, 0, 0.1);
              --rb-heading-font-family: var(--rb-font-family);
              /* Structural */
              --rb-popup-radius: 16px;
              ${designTokensCSS || ""}
            }
          `,
        }}
      />
      {combinedCustomCSS && <style dangerouslySetInnerHTML={{ __html: combinedCustomCSS }} />}

      {/* Backdrop */}
      <div
        className={backdropAnimationClass}
        style={{
          ...backdropStyles,
          // Backdrop opacity follows drag distance
          // At 0px drag: full opacity (1), at 300px drag: zero opacity (0)
          opacity:
            isDragging || (animationState === "exiting" && dragOffset > 0)
              ? Math.max(0, 1 - dragOffset / 300)
              : undefined,
          // Smooth transition when snapping back, no transition while dragging
          transition: isDragging
            ? "none"
            : animationState === "exiting" && dragOffset > 0
              ? `opacity ${SWIPE_DISMISS_DURATION}ms ease-out`
              : "opacity 0.2s ease-out",
        }}
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
          // No transition while dragging, smooth snap-back when releasing, slide out when exiting
          transition: isDragging
            ? "none"
            : animationState === "exiting" && dragOffset > 0
              ? `transform ${SWIPE_DISMISS_DURATION}ms ease-out, opacity ${SWIPE_DISMISS_DURATION}ms ease-out`
              : "transform 0.2s ease-out",
          // Fade out during swipe-triggered exit
          opacity: animationState === "exiting" && dragOffset > 0 ? 0 : undefined,
          // Allow touch gestures for swipe-to-dismiss
          touchAction: "pan-x pinch-zoom",
        }}
        onClick={handleContentClick}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        <div className="popup-portal-frame" style={frameStyles}>
          {/* Drag Handle - Only visible on mobile, swipe-to-dismiss only on this element */}
          <div
            className="popup-drag-handle"
            aria-hidden="true"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="popup-drag-handle-bar" />
          </div>
          {children}
          {showBranding && <PoweredByBadge position="bottom-right" />}
        </div>
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
 * Memoized PopupPortal component
 * Uses custom comparison to handle inline object props (backdrop, animation)
 * that would otherwise cause unnecessary re-renders
 */
export const PopupPortal = memo(PopupPortalComponent, arePropsEqual);
PopupPortal.displayName = "PopupPortal";

/**
 * Generate CSS keyframes for animations
 */
function getAnimationKeyframes(
  position: PopupPosition,
  mobilePresentationMode: MobilePresentationMode,
  size?: PopupSize
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

  // Fullscreen size styles (applied on all viewports)
  const fullscreenStyles = size === "fullscreen" ? `
    /* Fullscreen size - takes entire viewport */
    .popup-portal-dialog-wrapper {
      padding: 0 !important;
      align-items: stretch !important;
      justify-content: stretch !important;
    }
    .popup-portal-frame {
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
  ` : "";

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
      /* Allow clicks to pass through to backdrop, children re-enable pointer-events */
      pointer-events: none;
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
      /* Re-enable pointer events for the actual popup content */
      pointer-events: auto;
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
       FULLSCREEN SIZE STYLES
       Applied when size="fullscreen" on all viewports
       ======================================== */
    ${fullscreenStyles}

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
