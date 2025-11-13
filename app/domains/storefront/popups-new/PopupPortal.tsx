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

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

export type AnimationType = 'fade' | 'slide' | 'zoom' | 'bounce' | 'none';

export interface BackdropConfig {
  color?: string;      // Base color (hex, rgb, rgba)
  opacity?: number;    // Applied opacity (0-1)
  blur?: number;       // backdrop-filter blur in px
}

export interface AnimationConfig {
  type: AnimationType;
  duration?: number;         // Override default duration
  backdropDelay?: number;    // Custom delay for backdrop
  contentDelay?: number;     // Custom delay for content
}

export type PopupPosition = "center" | "top" | "bottom" | "left" | "right";

export interface PopupPortalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Backdrop configuration
  backdrop?: BackdropConfig;

  // Animation configuration
  animation?: AnimationConfig;

  // Layout
  position?: PopupPosition;

  // Behavior
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  previewMode?: boolean;

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
  backdrop = {},
  animation = { type: 'fade' },
  position = 'center',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  previewMode = false,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  // Get animation timing
  const animationType = animation.type || 'fade';
  const choreography = ANIMATION_CHOREOGRAPHY[animationType];
  const backdropTiming = useMemo(() => ({
    delay: animation.backdropDelay ?? choreography.backdrop.delay,
    duration: animation.duration ?? choreography.backdrop.duration,
  }), [animation.backdropDelay, animation.duration, choreography.backdrop.delay, choreography.backdrop.duration]);

  const contentTiming = useMemo(() => ({
    delay: animation.contentDelay ?? choreography.content.delay,
    duration: animation.duration ?? choreography.content.duration,
  }), [animation.contentDelay, animation.duration, choreography.content.delay, choreography.content.duration]);

  // Calculate backdrop color with opacity
  const getBackdropColor = useCallback(() => {
    const opacity = backdrop.opacity ?? 0.6;
    const color = backdrop.color || 'rgba(0, 0, 0, 1)';

    // If color is already rgba, extract RGB and apply opacity
    if (color.startsWith('rgba')) {
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
      }
    }

    // If color is rgb, convert to rgba with opacity
    if (color.startsWith('rgb')) {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
      }
    }

    // If color is hex, convert to rgba
    if (color.startsWith('#')) {
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
    if (animationType !== 'none') {
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
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, closeOnEscape, handleClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      handleClose();
    }
  }, [closeOnBackdropClick, handleClose]);

  // Prevent content click from closing
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, previewMode]);

  // Create Shadow DOM container
  useEffect(() => {
    if (previewMode) return; // Don't use Shadow DOM in preview mode

    // Create shadow host if it doesn't exist
    let host = document.getElementById('revenue-boost-popup-shadow-host') as HTMLDivElement;

    if (!host) {
      host = document.createElement('div');
      host.id = 'revenue-boost-popup-shadow-host';
      // Shadow host MUST have display: block to have dimensions!
      // position: fixed with inset: 0 makes it fill the viewport
      host.style.cssText = 'display: block; position: fixed; inset: 0; z-index: 9999; pointer-events: auto;';
      document.body.appendChild(host);
    }

    // Attach shadow root if not already attached
    if (!host.shadowRoot) {
      const shadowRoot = host.attachShadow({ mode: 'open' });
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
        console.warn('[PopupPortal] adoptedStyleSheets not supported, falling back to style tag');
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

  // Don't render if not mounted
  if (!isMounted && !isVisible) return null;

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const effectiveAnimationType = prefersReducedMotion ? 'none' : animationType;

  // Animation classes
  const getAnimationClass = () => {
    if (effectiveAnimationType === 'none') return '';

    const direction = isExiting ? 'exit' : 'enter';
    return `popup-portal-${effectiveAnimationType}-${direction}`;
  };

  const backdropAnimationClass = getAnimationClass();
  const contentAnimationClass = getAnimationClass();

  // Styles
  // In Shadow DOM, position: fixed doesn't work relative to viewport
  // It's relative to the shadow host. Since shadow host is position:fixed with inset:0,
  // we use position:absolute inside to fill the shadow host (which fills the viewport)
  const overlayStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    pointerEvents: 'auto', // Enable pointer events in shadow DOM
  };

  const backdropStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: getBackdropColor(),
    backdropFilter: backdrop.blur ? `blur(${backdrop.blur}px)` : undefined,
    animationDelay: `${backdropTiming.delay}ms`,
    animationDuration: `${backdropTiming.duration}ms`,
  };

  const contentWrapperStyles: React.CSSProperties = {
    animationDelay: `${contentTiming.delay}ms`,
    animationDuration: `${contentTiming.duration}ms`,
    outline: 'none',
  };

  // Render content
  const content = (
    <div style={overlayStyles} role="presentation">
      {/* Base styles for Shadow DOM - ensures proper rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          box-sizing: border-box;
        }
        ${getAnimationKeyframes(previewMode, position)}
      ` }} />

      {/* Backdrop */}
      <div
        className={backdropAnimationClass}
        style={backdropStyles}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Content wrapper with animation */}
      <div
        ref={contentRef}
        className={`popup-portal-dialog-wrapper ${contentAnimationClass}`}
        style={contentWrapperStyles}
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {children}
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
function getAnimationKeyframes(previewMode: boolean, position: PopupPosition): string {
  // Map position to flexbox alignment
  const alignMap = {
    center: 'center',
    top: 'flex-start',
    bottom: 'flex-end',
    left: 'flex-start',
    right: 'flex-end',
  };

  const justifyMap = {
    center: 'center',
    top: 'center',
    bottom: 'center',
    left: 'flex-start',
    right: 'flex-end',
  };

  return `
    /* Base positioning for dialog wrapper */
    .popup-portal-dialog-wrapper {
      position: absolute;
      inset: 0;
      z-index: 1;
      padding: 1rem;
      display: flex;
      align-items: ${alignMap[position]};
      justify-content: ${justifyMap[position]};
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

