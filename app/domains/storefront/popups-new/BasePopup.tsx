/**
 * BasePopup Component
 *
 * Provides common functionality for all popup components including:
 * - Overlay display and portal rendering
 * - Close button and keyboard navigation
 * - Position and size logic
 * - Animation wrapper
 * - Focus management and accessibility
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import type { BasePopupProps } from './types';
import {
  getPositionStyles,
  getSizeDimensions,
  getAnimationClass,
  getAnimationKeyframes,
  prefersReducedMotion
} from './utils';

export const BasePopup: React.FC<BasePopupProps> = ({
  config,
  isVisible,
  onClose,
  children,
  className = '',
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && config.closeOnEscape !== false) {
      handleClose();
    }
  }, [config.closeOnEscape]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && config.closeOnOverlayClick !== false) {
      handleClose();
    }
  }, [config.closeOnOverlayClick]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (config.animation && config.animation !== 'none' && !prefersReducedMotion()) {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, 300);
    } else {
      onClose();
    }
  }, [config.animation, onClose]);

  // Setup keyboard listener
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isVisible, handleEscapeKey]);

  // Focus management
  useEffect(() => {
    if (isVisible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => popupRef.current?.focus(), 100);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isVisible]);

  // Auto-close timer
  useEffect(() => {
    if (isVisible && config.autoCloseDelay && config.autoCloseDelay > 0) {
      const timer = setTimeout(handleClose, config.autoCloseDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, config.autoCloseDelay, handleClose]);

  if (!isVisible && !isExiting) return null;

  const sizeDimensions = getSizeDimensions(config.size);
  const positionStyles = getPositionStyles(config.position);
  const animationClass = getAnimationClass(config.animation || 'fade', isExiting);

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: config.overlayColor || 'rgba(0, 0, 0, 0.5)',
    opacity: config.overlayOpacity ?? 1,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const popupStyles: React.CSSProperties = {
    ...positionStyles,
    width: config.maxWidth || sizeDimensions.width,
    maxWidth: config.maxWidth || sizeDimensions.maxWidth,
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    borderRadius: `${config.borderRadius ?? 8}px`,
    padding: config.padding ?? '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    outline: 'none',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const closeButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: config.textColor,
    opacity: 0.6,
    transition: 'opacity 0.2s',
    padding: '4px 8px',
    lineHeight: 1,
  };

  return (
    <>
      <style>{getAnimationKeyframes()}</style>
      <div style={overlayStyles} onClick={handleOverlayClick} role="presentation" data-testid="popup-overlay">
        <div
          ref={popupRef}
          className={`${className} ${animationClass}`.trim()}
          style={popupStyles}
          role="dialog"
          data-testid="popup-container"
          aria-modal="true"
          aria-label={config.ariaLabel || config.headline}
          aria-describedby={config.ariaDescribedBy}
          tabIndex={-1}
        >
          {config.showCloseButton !== false && (
            <button
              onClick={handleClose}
              style={closeButtonStyles}
              aria-label="Close popup"
              data-testid="popup-close"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              ×
            </button>
          )}
          {children}
        </div>
      </div>
    </>
  );
};

