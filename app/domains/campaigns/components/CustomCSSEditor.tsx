import { Card, BlockStack, Text, TextField, Badge } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { CUSTOM_CSS_MAX_LENGTH } from "~/lib/css-guards";

interface CustomCSSEditorProps {
  value?: string;
  onChange: (value: string) => void;
  globalCustomCSS?: string;
}

export function CustomCSSEditor({ value = "", onChange, globalCustomCSS }: CustomCSSEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (next: string) => {
      setLocalValue(next);
      onChange(next);
    },
    [onChange]
  );

  const hasGlobalCss = !!globalCustomCSS?.trim();

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="050">
          <Text as="h3" variant="headingMd">
            Custom CSS
          </Text>
          <Text as="p" tone="subdued">
            Optional CSS scoped to this campaign. Applied after global CSS so it can override
            store-wide rules.
          </Text>
        </BlockStack>

        <TextField
          label="Campaign CSS"
          value={localValue}
          multiline={6}
          autoComplete="off"
          onChange={handleChange}
          maxLength={CUSTOM_CSS_MAX_LENGTH}
          helpText={
            hasGlobalCss ? "Global CSS is applied first; campaign CSS can override it." : undefined
          }
        />

        <Badge tone="info">{`Max ${CUSTOM_CSS_MAX_LENGTH.toLocaleString()} characters`}</Badge>
      </BlockStack>
    </Card>
  );
}
