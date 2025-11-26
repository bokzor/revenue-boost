import { Banner, BlockStack, Text } from "@shopify/polaris";
import type { ReactNode } from "react";
import { CustomCSSEditor as AdvancedCustomCSSEditor } from "~/domains/popups/components/design/CustomCSSEditor";

interface CustomCSSEditorProps {
  value?: string;
  onChange: (value: string) => void;
  globalCustomCSS?: string;
  templateType?: string;
}

export function CustomCSSEditor({
  value = "",
  onChange,
  globalCustomCSS,
  templateType,
}: CustomCSSEditorProps) {
  const hasGlobalCss = !!globalCustomCSS?.trim();
  const helperText: ReactNode | undefined = hasGlobalCss ? (
    <Banner tone="info" title="Global CSS is applied first">
      <Text as="p" variant="bodySm">
        Campaign CSS overrides the global rules you set in Store settings.
      </Text>
    </Banner>
  ) : undefined;

  return (
    <BlockStack gap="300">
      {helperText}
      <AdvancedCustomCSSEditor value={value} onChange={onChange} templateType={templateType} />
    </BlockStack>
  );
}
