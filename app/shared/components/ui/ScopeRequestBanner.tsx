/**
 * ScopeRequestBanner - Displays a banner prompting users to grant optional permissions
 *
 * Used for just-in-time permission requests when a feature requires scopes
 * that weren't requested at install time.
 */

import { Banner, Button, BlockStack, Text, InlineStack } from "@shopify/polaris";
import { useScopeRequest, SCOPE_DEFINITIONS } from "~/shared/hooks/useScopeRequest";
import { useCallback, useState } from "react";

export interface ScopeRequestBannerProps {
  /** The scope(s) that need to be granted */
  requiredScopes: string[];
  /** Custom message to display (optional - will use scope definitions if not provided) */
  message?: string;
  /** Custom title for the banner */
  title?: string;
  /** Callback when scopes are successfully granted */
  onGranted?: () => void;
  /** Callback when user declines */
  onDeclined?: () => void;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
}

export function ScopeRequestBanner({
  requiredScopes,
  message,
  title,
  onGranted,
  onDeclined,
  dismissible = false,
  onDismiss,
}: ScopeRequestBannerProps) {
  const { requestScopes, isRequesting, error } = useScopeRequest();
  const [dismissed, setDismissed] = useState(false);

  // Build default message from scope definitions
  const defaultMessage = requiredScopes
    .map((scope) => SCOPE_DEFINITIONS[scope]?.description)
    .filter(Boolean)
    .join(" ");

  const featureName = requiredScopes
    .map((scope) => SCOPE_DEFINITIONS[scope]?.feature)
    .filter(Boolean)[0];

  const displayTitle = title || `Permission required${featureName ? ` for ${featureName}` : ""}`;
  const displayMessage = message || defaultMessage || "Additional permissions are required for this feature.";

  const handleGrantAccess = useCallback(async () => {
    const granted = await requestScopes(requiredScopes);
    if (granted) {
      onGranted?.();
    } else {
      onDeclined?.();
    }
  }, [requestScopes, requiredScopes, onGranted, onDeclined]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) {
    return null;
  }

  return (
    <Banner
      title={displayTitle}
      tone="info"
      onDismiss={dismissible ? handleDismiss : undefined}
    >
      <BlockStack gap="300">
        <Text as="p" variant="bodyMd">
          {displayMessage}
        </Text>

        {error && (
          <Text as="p" variant="bodySm" tone="critical">
            {error}
          </Text>
        )}

        <InlineStack gap="200">
          <Button
            onClick={handleGrantAccess}
            loading={isRequesting}
            variant="primary"
          >
            Grant Access
          </Button>
          {dismissible && (
            <Button onClick={handleDismiss} disabled={isRequesting}>
              Not Now
            </Button>
          )}
        </InlineStack>
      </BlockStack>
    </Banner>
  );
}

/**
 * Compact variant for inline use in form sections
 */
export function ScopeRequestInline({
  requiredScopes,
  message,
  onGranted,
}: Pick<ScopeRequestBannerProps, "requiredScopes" | "message" | "onGranted">) {
  const { requestScopes, isRequesting, error } = useScopeRequest();

  const defaultMessage = requiredScopes
    .map((scope) => SCOPE_DEFINITIONS[scope]?.description)
    .filter(Boolean)
    .join(" ");

  const handleGrantAccess = useCallback(async () => {
    const granted = await requestScopes(requiredScopes);
    if (granted) {
      onGranted?.();
    }
  }, [requestScopes, requiredScopes, onGranted]);

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" tone="subdued">
        {message || defaultMessage}
      </Text>
      {error && (
        <Text as="p" variant="bodySm" tone="critical">
          {error}
        </Text>
      )}
      <Button size="slim" onClick={handleGrantAccess} loading={isRequesting}>
        Grant Access
      </Button>
    </BlockStack>
  );
}

