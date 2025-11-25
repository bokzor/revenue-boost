import { useState, useCallback } from "react";
import { Card, BlockStack, Text, TextField, InlineStack, Badge } from "@shopify/polaris";
import type { StoreSettings } from "~/domains/store/types/settings";
import { CUSTOM_CSS_MAX_LENGTH } from "~/lib/css-guards";

interface GlobalCSSSettingsProps {
  settings: StoreSettings;
  onChange: (newSettings: Partial<StoreSettings>) => void;
}

export function GlobalCSSSettings({ settings, onChange }: GlobalCSSSettingsProps) {
  const [cssValue, setCssValue] = useState<string>(settings.globalCustomCSS || "");

  const handleChange = useCallback(
    (value: string) => {
      setCssValue(value);
      onChange({ globalCustomCSS: value });
    },
    [onChange]
  );

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="200" align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h2" variant="headingMd">
              Global Custom CSS
            </Text>
            <Text as="p" tone="subdued">
              Add CSS applied to all campaigns. Use carefully to keep popups consistent with your
              theme.
            </Text>
          </BlockStack>
          <Badge tone="info">{`${CUSTOM_CSS_MAX_LENGTH.toLocaleString()} char max`}</Badge>
        </InlineStack>

        <TextField
          label="Global CSS"
          multiline={6}
          autoComplete="off"
          value={cssValue}
          onChange={handleChange}
          helpText="Injected in previews and storefront before per-campaign CSS. Avoid selectors like body/html to reduce bleed."
          maxLength={CUSTOM_CSS_MAX_LENGTH}
        />
      </BlockStack>
    </Card>
  );
}
