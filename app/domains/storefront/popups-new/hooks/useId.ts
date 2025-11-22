/**
 * useId Hook Polyfill for Preact
 * 
 * React 18 introduced useId for generating unique IDs.
 * Preact doesn't have this hook, so we provide a polyfill.
 * 
 * This generates stable, unique IDs that persist across re-renders.
 */

import { useRef } from 'react';

let idCounter = 0;

/**
 * Generate a unique ID that persists across re-renders
 * 
 * @returns A unique string ID
 */
export const useId = (): string => {
  const idRef = useRef<string | null>(null);
  
  if (idRef.current === null) {
    idRef.current = `rb-id-${++idCounter}`;
  }
  
  return idRef.current;
};

