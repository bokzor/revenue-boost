/**
 * PageTargetingTrigger - Page targeting configuration
 *
 * Single Responsibility: Configure page-based targeting rules
 */

import { Text, FormLayout, ChoiceList, TextField } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface PageTargetingTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function PageTargetingTrigger({ config, onChange }: PageTargetingTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      page_targeting: {
        enabled: false,
        ...(typeof config.page_targeting === "object" && config.page_targeting !== null
          ? config.page_targeting
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Page Targeting"
      enabled={config.page_targeting?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Control which pages this campaign appears on. This applies to all enabled triggers below.
      </Text>

      <FormLayout>
        <ChoiceList
          title="Show on pages"
          allowMultiple
          choices={[
            { label: "Homepage (/)", value: "/" },
            { label: "All product pages (/products/*)", value: "/products/*" },
            { label: "All collection pages (/collections/*)", value: "/collections/*" },
            { label: "Cart page (/cart)", value: "/cart" },
          ]}
          selected={config.page_targeting?.pages || []}
          onChange={(selected) => updateConfig({ pages: selected })}
        />

        <TextField
          autoComplete="off"
          label="Custom URL patterns (comma-separated)"
          value={config.page_targeting?.customPatterns?.join(", ") || ""}
          onChange={(value) =>
            updateConfig({
              customPatterns: value
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean),
            })
          }
          helpText="Use * as wildcard. Example: /collections/summer-*, /pages/about"
          placeholder="/collections/sale, /pages/special-offer"
        />

        <TextField
          autoComplete="off"
          label="Exclude pages (comma-separated)"
          value={config.page_targeting?.excludePages?.join(", ") || ""}
          onChange={(value) =>
            updateConfig({
              excludePages: value
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean),
            })
          }
          helpText="Pages where campaign should NOT show"
          placeholder="/checkout, /account"
        />
      </FormLayout>
    </TriggerCard>
  );
}
