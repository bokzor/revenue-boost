/**
 * GeoTargetingPanel - Configure geographic targeting for campaigns
 *
 * Uses Shopify's X-Country-Code header (ISO 3166-1 alpha-2) to filter
 * campaigns based on visitor location.
 */

import { useCallback, useState, useMemo } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Select,
  Tag,
  Autocomplete,
  Icon,
  Banner,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import type { GeoTargetingConfig } from "~/domains/campaigns/types/campaign";
import { COUNTRIES, getCountryName } from "~/domains/targeting/utils/countries";

export interface GeoTargetingPanelProps {
  config: GeoTargetingConfig;
  onConfigChange: (config: GeoTargetingConfig) => void;
  disabled?: boolean;
}

export function GeoTargetingPanel({
  config,
  onConfigChange,
  disabled = false,
}: GeoTargetingPanelProps) {
  const [searchValue, setSearchValue] = useState("");

  const updateConfig = useCallback(
    (updates: Partial<GeoTargetingConfig>) => {
      if (disabled) return;
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange, disabled]
  );

  const handleAddCountry = useCallback(
    (countryCode: string) => {
      const code = countryCode.toUpperCase();
      if (!config.countries.includes(code)) {
        updateConfig({ countries: [...config.countries, code] });
      }
      setSearchValue("");
    },
    [config.countries, updateConfig]
  );

  const handleRemoveCountry = useCallback(
    (countryCode: string) => {
      updateConfig({
        countries: config.countries.filter((c) => c !== countryCode),
      });
    },
    [config.countries, updateConfig]
  );

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchValue) return [];
    const search = searchValue.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        (c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search)) &&
        !config.countries.includes(c.code)
    ).slice(0, 10);
  }, [searchValue, config.countries]);

  const autocompleteOptions = useMemo(
    () =>
      filteredCountries.map((c) => ({
        value: c.code,
        label: `${c.flag} ${c.name} (${c.code})`,
      })),
    [filteredCountries]
  );

  const modeDescription =
    config.mode === "include"
      ? "Campaign will ONLY show to visitors from selected countries"
      : "Campaign will show to visitors from ALL countries EXCEPT selected ones";

  return (
    <Card>
      <BlockStack gap="400">
        <Checkbox
          label="Enable geographic targeting"
          checked={config.enabled}
          onChange={(checked) => updateConfig({ enabled: checked })}
          disabled={disabled}
          helpText="Show or hide this campaign based on visitor location (country)."
        />

        {config.enabled && (
          <BlockStack gap="400">
            <Select
              label="Targeting mode"
              options={[
                { label: "Show only to selected countries", value: "include" },
                { label: "Hide from selected countries", value: "exclude" },
              ]}
              value={config.mode}
              onChange={(value) =>
                updateConfig({ mode: value as "include" | "exclude" })
              }
              disabled={disabled}
              helpText={modeDescription}
            />

            <BlockStack gap="200">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Countries
              </Text>

              <Autocomplete
                options={autocompleteOptions}
                selected={[]}
                onSelect={(selected) => {
                  if (selected.length > 0) {
                    handleAddCountry(selected[0]);
                  }
                }}
                textField={
                  <Autocomplete.TextField
                    label="Search countries"
                    labelHidden
                    onChange={setSearchValue}
                    value={searchValue}
                    prefix={<Icon source={SearchIcon} />}
                    placeholder="Search countries..."
                    autoComplete="off"
                    disabled={disabled}
                  />
                }
              />

              {config.countries.length > 0 ? (
                <InlineStack gap="200" wrap>
                  {config.countries.map((code) => (
                    <Tag
                      key={code}
                      onRemove={disabled ? undefined : () => handleRemoveCountry(code)}
                    >
                      {getCountryName(code)} ({code})
                    </Tag>
                  ))}
                </InlineStack>
              ) : (
                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    No countries selected. Add countries to enable geographic targeting.
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}

