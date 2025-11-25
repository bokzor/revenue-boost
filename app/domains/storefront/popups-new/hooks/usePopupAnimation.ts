/**
 * usePopupAnimation Hook
 * 
 * Manages popup entry/exit animation state.
 * Consolidates the common pattern of delayed content visibility
 * used across all popup components.
 */

import { useState, useEffect } from 'react';

export interface UsePopupAnimationOptions {
  isVisible: boolean;
  entryDelay?: number; // milliseconds
  exitDelay?: number; // milliseconds
}

export function usePopupAnimation(options: UsePopupAnimationOptions) {
  const { isVisible, entryDelay = 50, exitDelay = 300 } = options;
  
  const [showContent, setShowContent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      // Entry animation
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setShowContent(true);
        setIsAnimating(false);
      }, entryDelay);
      
      return () => clearTimeout(timer);
    } else {
      // Exit animation
      setShowContent(false);
      if (showContent) {
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, exitDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, entryDelay, exitDelay, showContent]);
  
  return {
    showContent,
    isAnimating,
  };
}

