/**
 * useScopeRequest - Hook for requesting optional Shopify scopes at use-time
 *
 * Uses App Bridge scopes.request() API to display a permission grant modal
 * for optional scopes that weren't requested at install time.
 *
 * Usage:
 * ```tsx
 * const { requestScopes, isRequesting, error, isGranted } = useScopeRequest();
 *
 * // Check and request scope
 * if (!hasScope) {
 *   await requestScopes(['read_customers']);
 * }
 * ```
 */

import { useCallback, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export interface ScopeRequestResult {
  /** Request one or more optional scopes */
  requestScopes: (scopes: string[]) => Promise<boolean>;
  /** Whether a scope request is in progress */
  isRequesting: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Last request result - true if granted, false if denied */
  lastResult: boolean | null;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for requesting optional Shopify scopes using App Bridge
 */
export function useScopeRequest(): ScopeRequestResult {
  const shopify = useAppBridge();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const requestScopes = useCallback(
    async (scopes: string[]): Promise<boolean> => {
      if (!scopes.length) {
        console.warn("[useScopeRequest] No scopes provided to request");
        return false;
      }

      setIsRequesting(true);
      setError(null);

      try {
        // Use App Bridge scopes API to request permissions
        // This displays a modal overlay in the embedded app
        // Returns ScopesRequestResponse with result and detail.granted
        const response = await shopify.scopes.request(scopes);

        // Extract granted scopes from the response
        // The detail object contains the granted scopes after the request
        const grantedScopes = response?.detail?.granted || [];

        // Check if all requested scopes were granted
        const allGranted = scopes.every((scope) =>
          grantedScopes.includes(scope)
        );

        setLastResult(allGranted);

        if (!allGranted) {
          const denied = scopes.filter(
            (scope) => !grantedScopes.includes(scope)
          );
          console.log(
            "[useScopeRequest] Some scopes were denied:",
            denied
          );
        }

        return allGranted;
      } catch (err) {
        console.error("[useScopeRequest] Failed to request scopes:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to request permissions. Please try again."
        );
        setLastResult(false);
        return false;
      } finally {
        setIsRequesting(false);
      }
    },
    [shopify]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    requestScopes,
    isRequesting,
    error,
    lastResult,
    clearError,
  };
}

/**
 * Scope definitions with user-friendly descriptions
 */
export const SCOPE_DEFINITIONS: Record<
  string,
  { title: string; description: string; feature: string }
> = {
  read_customers: {
    title: "Read customer data",
    description:
      "Access customer segment data to target specific audiences like VIP customers or first-time buyers.",
    feature: "Customer Segment Targeting",
  },
  write_customers: {
    title: "Write customer data",
    description:
      "Update customer information when they interact with your campaigns.",
    feature: "Customer Segment Targeting",
  },
  read_orders: {
    title: "Read order data",
    description:
      "Access recent orders to show real purchase notifications and social proof.",
    feature: "Social Proof Notifications",
  },
  write_files: {
    title: "Upload files",
    description:
      "Upload custom images for your popup backgrounds and designs.",
    feature: "Custom Image Uploads",
  },
  write_marketing_events: {
    title: "Create marketing events",
    description:
      "Track your campaigns in Shopify's Marketing section for attribution and analytics.",
    feature: "Marketing Attribution",
  },
  read_marketing_events: {
    title: "Read marketing events",
    description:
      "View marketing event data for campaign performance tracking.",
    feature: "Marketing Attribution",
  },
};

