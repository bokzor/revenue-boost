/**
 * useCountdownTimer Hook
 * 
 * Manages countdown timer state with support for multiple timer modes:
 * - Duration-based (countdown from X seconds)
 * - Fixed end time (countdown to specific date/time)
 * - Personal window (countdown from user's first view)
 * 
 * Features:
 * - Automatic interval management
 * - Expiry handling with callbacks
 * - Auto-hide on expiry
 * - Formatted time display
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateTimeRemaining, formatTimeRemaining } from '../utils';

export type TimerMode = 'duration' | 'fixed_end' | 'personal';

export interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface UseCountdownTimerOptions {
  enabled: boolean;
  mode?: TimerMode;
  
  // Duration mode: countdown from X seconds
  duration?: number;
  
  // Fixed end mode: countdown to specific date/time
  endTime?: Date | string;
  
  // Personal window mode: countdown from X seconds per user
  personalWindowSeconds?: number;
  
  // Callbacks
  onExpire?: () => void;
  onTick?: (time: TimeRemaining) => void;
  
  // Behavior
  autoHide?: boolean;
  autoHideDelay?: number; // milliseconds
}

export function useCountdownTimer(options: UseCountdownTimerOptions) {
  const {
    enabled,
    mode = 'duration',
    duration,
    endTime,
    personalWindowSeconds,
    onExpire,
    onTick,
    autoHide = false,
    autoHideDelay = 0,
  } = options;
  
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => {
    if (!enabled) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    // Calculate initial time based on mode
    if (mode === 'fixed_end' && endTime) {
      return calculateTimeRemaining(endTime);
    } else if (mode === 'personal' && personalWindowSeconds) {
      const end = new Date(Date.now() + personalWindowSeconds * 1000);
      return calculateTimeRemaining(end);
    } else if (mode === 'duration' && duration) {
      const end = new Date(Date.now() + duration * 1000);
      return calculateTimeRemaining(end);
    }
    
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });
  
  const [hasExpired, setHasExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  
  // Update refs
  useEffect(() => {
    onExpireRef.current = onExpire;
    onTickRef.current = onTick;
  }, [onExpire, onTick]);
  
  // Timer logic
  useEffect(() => {
    if (!enabled || hasExpired) return;
    
    // Calculate end timestamp once
    let endTimestamp: number | null = null;
    
    if (mode === 'fixed_end' && endTime) {
      endTimestamp = new Date(endTime).getTime();
    } else if (mode === 'personal' && personalWindowSeconds) {
      endTimestamp = Date.now() + personalWindowSeconds * 1000;
    } else if (mode === 'duration' && duration) {
      endTimestamp = Date.now() + duration * 1000;
    }
    
    if (!endTimestamp) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, endTimestamp! - now);
      
      const newTime: TimeRemaining = {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
      
      setTimeRemaining(newTime);
      
      // Call onTick callback
      if (onTickRef.current) {
        onTickRef.current(newTime);
      }
      
      // Handle expiry
      if (newTime.total <= 0 && !hasExpired) {
        setHasExpired(true);
        
        if (onExpireRef.current) {
          if (autoHide && autoHideDelay > 0) {
            setTimeout(() => {
              onExpireRef.current?.();
            }, autoHideDelay);
          } else {
            onExpireRef.current();
          }
        }
      }
    };
    
    // Run immediately
    updateTimer();
    
    // Set up interval
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [enabled, mode, duration, endTime, personalWindowSeconds, hasExpired, autoHide, autoHideDelay]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setHasExpired(false);
    // Recalculate initial time
    if (mode === 'fixed_end' && endTime) {
      setTimeRemaining(calculateTimeRemaining(endTime));
    } else if (mode === 'personal' && personalWindowSeconds) {
      const end = new Date(Date.now() + personalWindowSeconds * 1000);
      setTimeRemaining(calculateTimeRemaining(end));
    } else if (mode === 'duration' && duration) {
      const end = new Date(Date.now() + duration * 1000);
      setTimeRemaining(calculateTimeRemaining(end));
    }
  }, [mode, endTime, personalWindowSeconds, duration]);

  return {
    timeRemaining,
    hasExpired,
    formattedTime: formatTimeRemaining(timeRemaining),
    resetTimer,
  };
}

