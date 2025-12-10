/**
 * CampaignErrorBoundary Component
 *
 * Error boundary for campaign creation flows.
 * Catches and displays errors gracefully with recovery options.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";
import {
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Box,
  InlineStack,
} from "@shopify/polaris";

interface Props {
  children: ReactNode;
  /** Fallback UI when error occurs */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Context for error reporting (e.g., "SingleCampaignFlow", "VariantEditor") */
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CampaignErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    console.error("[CampaignErrorBoundary]", this.props.context || "Unknown", {
      error,
      errorInfo,
    });

    // Call optional error callback (for Sentry, etc.)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, context } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Box padding="600">
          <Card>
            <BlockStack gap="400">
              <Banner tone="critical" title="Something went wrong">
                <BlockStack gap="200">
                  <Text as="p">
                    {context
                      ? `An error occurred in ${context}.`
                      : "An unexpected error occurred."}
                  </Text>
                  {error && process.env.NODE_ENV !== "production" && (
                    <Text as="p" tone="subdued" variant="bodySm">
                      {error.message}
                    </Text>
                  )}
                </BlockStack>
              </Banner>

              <InlineStack gap="300">
                <Button onClick={this.handleRetry}>Try Again</Button>
                <Button
                  variant="plain"
                  url="/app/campaigns"
                >
                  Return to Campaigns
                </Button>
              </InlineStack>

              {/* Development-only stack trace */}
              {process.env.NODE_ENV !== "production" && error && (
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Error Details (Development Only)
                    </Text>
                    <pre
                      style={{
                        fontSize: "12px",
                        overflow: "auto",
                        maxHeight: "200px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {error.stack}
                    </pre>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Box>
      );
    }

    return children;
  }
}

export default CampaignErrorBoundary;

