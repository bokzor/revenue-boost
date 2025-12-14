/**
 * useDiscountCode Hook
 *
 * Manages discount code state and copy-to-clipboard functionality.
 * Used across multiple popup components that display discount codes.
 */

import { useState, useCallback, useEffect } from "react";
import { copyToClipboard } from "../utils/utils";

export function useDiscountCode(initialCode?: string) {
  const [discountCode, setDiscountCode] = useState<string | null>(initialCode || null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Update discount code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setDiscountCode(initialCode);
    }
  }, [initialCode]);

  const handleCopyCode = useCallback(
    async (code?: string) => {
      const codeToCopy = code || discountCode;

      if (!codeToCopy) {
        setCopyError("No discount code available");
        return false;
      }

      try {
        const success = await copyToClipboard(codeToCopy);

        if (success) {
          setCopiedCode(true);
          setCopyError(null);

          // Reset copied state after 2 seconds
          setTimeout(() => {
            setCopiedCode(false);
          }, 2000);

          return true;
        } else {
          setCopyError("Failed to copy code");
          return false;
        }
      } catch (error) {
        console.error("Copy to clipboard error:", error);
        setCopyError("Failed to copy code");
        return false;
      }
    },
    [discountCode]
  );

  const resetCopyState = useCallback(() => {
    setCopiedCode(false);
    setCopyError(null);
  }, []);

  return {
    discountCode,
    setDiscountCode,
    copiedCode,
    copyError,
    handleCopyCode,
    resetCopyState,
  };
}
