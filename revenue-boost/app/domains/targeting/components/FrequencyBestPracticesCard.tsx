/**
 * Frequency Best Practices Card Component
 * 
 * Display best practices for frequency capping
 */

import { Card, BlockStack, Text, Box } from "@shopify/polaris";

export function FrequencyBestPracticesCard() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="300">
          <Text as="h3" variant="headingMd">
            💡 Best Practices
          </Text>

          <BlockStack gap="200">
            <Box>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                For promotional popups:
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Show 1-2 times per day to avoid annoying visitors
              </Text>
            </Box>

            <Box>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                For exit-intent popups:
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Show 1 time per session or 1-2 times per week
              </Text>
            </Box>

            <Box>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                For email capture:
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Show 1 time per visitor (use per month with maxViews: 1)
              </Text>
            </Box>

            <Box>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                For urgent announcements:
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Show 3-5 times per day until acknowledged
              </Text>
            </Box>
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

