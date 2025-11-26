import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineGrid,
  Text,
  TextField,
  Tabs,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import type { GlobalFrequencyCappingSettings, StoreSettings } from "~/domains/store/types/settings";

interface GlobalCappingSettingsProps {
  settings: StoreSettings;
  onChange: (newSettings: Partial<StoreSettings>) => void;
}

function FrequencyGroupSettings({
  title,
  settings,
  onChange,
}: {
  title: string;
  settings?: GlobalFrequencyCappingSettings;
  onChange: (settings: GlobalFrequencyCappingSettings) => void;
}) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [maxPerSession, setMaxPerSession] = useState(settings?.max_per_session?.toString() ?? "");
  const [maxPerDay, setMaxPerDay] = useState(settings?.max_per_day?.toString() ?? "");
  const [cooldown, setCooldown] = useState(settings?.cooldown_between_popups?.toString() ?? "");

  const handleChange = useCallback(
    (
      updates: Partial<{
        enabled: boolean;
        max_per_session: string;
        max_per_day: string;
        cooldown_between_popups: string;
      }>
    ) => {
      const newEnabled = updates.enabled ?? enabled;
      const newMaxPerSession =
        updates.max_per_session !== undefined ? updates.max_per_session : maxPerSession;
      const newMaxPerDay = updates.max_per_day !== undefined ? updates.max_per_day : maxPerDay;
      const newCooldown =
        updates.cooldown_between_popups !== undefined ? updates.cooldown_between_popups : cooldown;

      if (updates.enabled !== undefined) setEnabled(updates.enabled);
      if (updates.max_per_session !== undefined) setMaxPerSession(updates.max_per_session);
      if (updates.max_per_day !== undefined) setMaxPerDay(updates.max_per_day);
      if (updates.cooldown_between_popups !== undefined)
        setCooldown(updates.cooldown_between_popups);

      onChange({
        enabled: newEnabled,
        max_per_session: newMaxPerSession ? parseInt(newMaxPerSession, 10) : undefined,
        max_per_day: newMaxPerDay ? parseInt(newMaxPerDay, 10) : undefined,
        cooldown_between_popups: newCooldown ? parseInt(newCooldown, 10) : undefined,
      });
    },
    [enabled, maxPerSession, maxPerDay, cooldown, onChange]
  );

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">
        {title}
      </Text>
      <Checkbox
        label={`Enable global frequency capping for ${title.toLowerCase()}`}
        checked={enabled}
        onChange={(checked) => handleChange({ enabled: checked })}
      />

      {enabled && (
        <InlineGrid columns={3} gap="400">
          <TextField
            label="Max per session"
            type="number"
            value={maxPerSession}
            onChange={(value) => handleChange({ max_per_session: value })}
            autoComplete="off"
            helpText="Maximum times shown per visitor session"
          />
          <TextField
            label="Max per day"
            type="number"
            value={maxPerDay}
            onChange={(value) => handleChange({ max_per_day: value })}
            autoComplete="off"
            helpText="Maximum times shown per 24 hours"
          />
          <TextField
            label="Cooldown (seconds)"
            type="number"
            value={cooldown}
            onChange={(value) => handleChange({ cooldown_between_popups: value })}
            autoComplete="off"
            helpText={`Minimum time between ${title.toLowerCase()} displays`}
          />
        </InlineGrid>
      )}
    </BlockStack>
  );
}

export function GlobalCappingSettings({ settings, onChange }: GlobalCappingSettingsProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      id: "popups",
      content: "Popups",
      panelID: "popups-content",
    },
    {
      id: "social-proof",
      content: "Social Proof",
      panelID: "social-proof-content",
    },
    {
      id: "banners",
      content: "Banners",
      panelID: "banners-content",
    },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Global Frequency Capping
          </Text>
          <Text as="p" tone="subdued">
            Set limits on how often campaigns are shown to visitors across your entire store. These
            settings override individual campaign rules when &quot;Respect global limits&quot; is enabled.
          </Text>
        </BlockStack>

        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
          <Box paddingBlockStart="400">
            {selectedTab === 0 && (
              <FrequencyGroupSettings
                title="Popups"
                settings={settings.frequencyCapping}
                onChange={(newSettings) => onChange({ frequencyCapping: newSettings })}
              />
            )}
            {selectedTab === 1 && (
              <FrequencyGroupSettings
                title="Social Proof"
                settings={settings.socialProofFrequencyCapping}
                onChange={(newSettings) => onChange({ socialProofFrequencyCapping: newSettings })}
              />
            )}
            {selectedTab === 2 && (
              <FrequencyGroupSettings
                title="Banners"
                settings={settings.bannerFrequencyCapping}
                onChange={(newSettings) => onChange({ bannerFrequencyCapping: newSettings })}
              />
            )}
          </Box>
        </Tabs>
      </BlockStack>
    </Card>
  );
}
