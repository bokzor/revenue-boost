import React, { useState } from "react";
import {
  Card,
  Text,
  Box,
  Button,
  TextField,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
} from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";

interface QuickTriggerSetupProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
  disabled?: boolean;
}

// Default configuration with all required fields
const DEFAULT_ENHANCED_TRIGGERS: EnhancedTriggerConfig = {
  enabled: false,
  page_targeting: {
    enabled: false,
    pages: [],
    custom_patterns: [],
    exclude_pages: [],
  },
  page_load: {
    enabled: false,
    delay: 3,
    require_dom_ready: true,
    require_images_loaded: false,
  },
  exit_intent: {
    enabled: false,
    sensitivity: "medium",
    delay: 1000,
    mobile_enabled: false,
  },
  scroll_depth: {
    enabled: false,
    depth_percentage: 50,
    direction: "down",
    debounce_time: 500,
    require_engagement: false,
  },
  idle_timer: {
    enabled: false,
    idle_duration: 30,
    mouse_movement_threshold: 10,
    keyboard_activity: true,
    page_visibility: false,
  },
  device_targeting: {
    enabled: false,
    device_types: ["desktop", "tablet", "mobile"],
    operating_systems: [],
    browsers: [],
    connection_type: [],
  },
  add_to_cart: { enabled: false, delay: 500, immediate: false },
  cart_drawer_open: {
    enabled: false,
    delay: 1000,
    max_triggers_per_session: 2,
  },
  product_view: { enabled: false, time_on_page: 5, require_scroll: false },
  cart_value: { enabled: false, min_value: 50, check_interval: 2000 },
  custom_event: { enabled: false, event_names: [], debounce_time: 100 },
  trigger_combination: { operator: "OR" },
  frequency_capping: {
    max_triggers_per_session: 1,
    max_triggers_per_day: 3,
    cooldown_between_triggers: 300,
  },
};

const QUICK_TEMPLATES = [
  {
    id: "page-load",
    name: "Page Load",
    description: "Show popup after page loads with optional delay",
    icon: "⚡",
    expectedLift: "+20% immediate engagement",
    config: {
      ...DEFAULT_ENHANCED_TRIGGERS,
      enabled: true,
      page_load: {
        enabled: true,
        delay: 3,
        require_dom_ready: true,
        require_images_loaded: false,
      },
      trigger_combination: { operator: "OR" },
      frequency_capping: {
        max_triggers_per_session: 1,
        max_triggers_per_day: 3,
        cooldown_between_triggers: 600,
      },
    },
  },
  {
    id: "exit-intent",
    name: "Exit Intent",
    description: "Show popup when visitor is about to leave",
    icon: "🚪",
    expectedLift: "+25% conversion recovery",
    config: {
      ...DEFAULT_ENHANCED_TRIGGERS,
      enabled: true,
      exit_intent: {
        enabled: true,
        sensitivity: "medium",
        delay: 1000,
        mobile_enabled: true,
      },
      trigger_combination: { operator: "OR" },
      frequency_capping: {
        max_triggers_per_session: 1,
        max_triggers_per_day: 2,
        cooldown_between_triggers: 1800,
      },
    },
  },
  {
    id: "time-delay",
    name: "Time Delay",
    description: "Show popup after visitor spends time on page",
    icon: "⏰",
    expectedLift: "+18% engagement",
    config: {
      ...DEFAULT_ENHANCED_TRIGGERS,
      enabled: true,
      idle_timer: {
        enabled: true,
        idle_duration: 15,
        mouse_movement_threshold: 10,
        keyboard_activity: true,
        page_visibility: true,
      },
      trigger_combination: { operator: "OR" },
      frequency_capping: {
        max_triggers_per_session: 1,
        max_triggers_per_day: 3,
        cooldown_between_triggers: 900,
      },
    },
  },
  {
    id: "scroll-depth",
    name: "Scroll Depth",
    description: "Show popup when visitor scrolls down the page",
    icon: "📜",
    expectedLift: "+15% engagement",
    config: {
      ...DEFAULT_ENHANCED_TRIGGERS,
      enabled: true,
      scroll_depth: {
        enabled: true,
        depth_percentage: 50,
        direction: "down",
        debounce_time: 2000,
        require_engagement: false,
      },
      trigger_combination: { operator: "OR" },
      frequency_capping: {
        max_triggers_per_session: 1,
        max_triggers_per_day: 3,
        cooldown_between_triggers: 600,
      },
    },
  },
  {
    id: "post-add-upsell",
    name: "Post-Add Upsell",
    description: "Show an upsell right after a product is added to cart",
    icon: "🛒",
    expectedLift: "+10–20% AOV on upsell orders",
    config: {
      ...DEFAULT_ENHANCED_TRIGGERS,
      enabled: true,
      add_to_cart: {
        enabled: true,
        delay: 500,
        immediate: false,
      },
      trigger_combination: { operator: "OR" },
      frequency_capping: {
        max_triggers_per_session: 1,
        max_triggers_per_day: 3,
        cooldown_between_triggers: 600,
      },
    },
  },
];

// Template detection logic for Advanced → Quick mode switching
const detectActiveTemplate = (config: EnhancedTriggerConfig): string | null => {
  if (
    config.page_load?.enabled &&
    !config.exit_intent?.enabled &&
    !config.scroll_depth?.enabled &&
    !config.idle_timer?.enabled
  ) {
    return "page-load";
  }
  if (
    config.exit_intent?.enabled &&
    !config.page_load?.enabled &&
    !config.scroll_depth?.enabled &&
    !config.idle_timer?.enabled
  ) {
    return "exit-intent";
  }
  if (
    config.idle_timer?.enabled &&
    !config.page_load?.enabled &&
    !config.exit_intent?.enabled &&
    !config.scroll_depth?.enabled
  ) {
    return "time-delay";
  }
  if (
    config.scroll_depth?.enabled &&
    !config.page_load?.enabled &&
    !config.exit_intent?.enabled &&
    !config.idle_timer?.enabled
  ) {
    return "scroll-depth";
  }
  return null; // Custom configuration
};

export const QuickTriggerSetup: React.FC<QuickTriggerSetupProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    detectActiveTemplate(config) || "",
  );

  const handleTemplateSelect = (templateId: string) => {
    const template = QUICK_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      onChange(template.config as EnhancedTriggerConfig);
    }
  };

  const updateFrequency = (field: string, value: number) => {
    onChange({
      ...config,
      frequency_capping: {
        ...config.frequency_capping,
        [field]: value,
      },
    });
  };

  const updatePageLoadDelay = (delay: number) => {
    onChange({
      ...config,
      page_load: {
        enabled: true,
        delay,
        require_dom_ready: true,
        require_images_loaded: false,
        ...config.page_load,
      },
    });
  };

  return (
    <BlockStack gap="400">
      {/* Header */}
      <Card>
        <Box padding="600">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Quick Trigger Setup
            </Text>
            <Text as="span" variant="bodySm">
              Choose a proven trigger pattern with smart defaults. You can
              customize further in Advanced Mode.
            </Text>
          </BlockStack>
        </Box>
      </Card>

      {/* Template Selection */}
      <Card>
        <Box padding="600">
          <BlockStack gap="400">
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              Choose Trigger Type
            </Text>

            <BlockStack gap="300">
              {QUICK_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  background={
                    selectedTemplate === template.id
                      ? "bg-surface-selected"
                      : "bg-surface"
                  }
                >
                  <Box padding="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <Text as="span" variant="headingLg">
                          {template.icon}
                        </Text>
                        <BlockStack gap="100">
                          <Text
                            as="span"
                            variant="bodyMd"
                            fontWeight="semibold"
                          >
                            {template.name}
                          </Text>
                          <Text as="span" variant="bodySm">
                            {template.description}
                          </Text>
                          <Badge tone="info">{template.expectedLift}</Badge>
                        </BlockStack>
                      </InlineStack>
                      <Button
                        variant={
                          selectedTemplate === template.id
                            ? "primary"
                            : "secondary"
                        }
                        onClick={() => handleTemplateSelect(template.id)}
                        disabled={disabled}
                      >
                        {selectedTemplate === template.id
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </InlineStack>
                  </Box>
                </Card>
              ))}
            </BlockStack>
          </BlockStack>
        </Box>
      </Card>

      {/* Page Load Delay Configuration */}
      {selectedTemplate === "page-load" && (
        <Card>
          <Box padding="600">
            <BlockStack gap="400">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Page Load Settings
              </Text>

              <TextField
                autoComplete="off"
                label="Delay after page load (seconds)"
                type="number"
                value={config.page_load?.delay?.toString() || "3"}
                onChange={(value) => updatePageLoadDelay(parseInt(value) || 3)}
                disabled={disabled}
                helpText="How many seconds to wait after page loads before showing popup (0 = immediate)"
                min={0}
                max={60}
              />
            </BlockStack>
          </Box>
        </Card>
      )}

      {/* Frequency Settings */}
      {selectedTemplate && (
        <Card>
          <Box padding="600">
            <BlockStack gap="400">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Frequency Settings
              </Text>

              <BlockStack gap="300">
                <TextField
                  autoComplete="off"
                  label="Max triggers per session"
                  type="number"
                  value={
                    config.frequency_capping?.max_triggers_per_session?.toString() ||
                    "1"
                  }
                  onChange={(value) =>
                    updateFrequency(
                      "max_triggers_per_session",
                      parseInt(value) || 1,
                    )
                  }
                  disabled={disabled}
                  helpText="How many times to show popup per visitor session"
                />

                <TextField
                  autoComplete="off"
                  label="Max triggers per day"
                  type="number"
                  value={
                    config.frequency_capping?.max_triggers_per_day?.toString() ||
                    "3"
                  }
                  onChange={(value) =>
                    updateFrequency(
                      "max_triggers_per_day",
                      parseInt(value) || 3,
                    )
                  }
                  disabled={disabled}
                  helpText="Maximum times to show popup per visitor per day"
                />

                <TextField
                  autoComplete="off"
                  label="Cooldown between triggers (seconds)"
                  type="number"
                  value={
                    config.frequency_capping?.cooldown_between_triggers?.toString() ||
                    "300"
                  }
                  onChange={(value) =>
                    updateFrequency(
                      "cooldown_between_triggers",
                      parseInt(value) || 300,
                    )
                  }
                  disabled={disabled}
                  helpText="Wait time between popup displays"
                />
              </BlockStack>
            </BlockStack>
          </Box>
        </Card>
      )}

      {/* Current Configuration Preview */}
      {selectedTemplate && (
        <Card>
          <Box padding="600">
            <BlockStack gap="300">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Active Triggers
              </Text>
              <InlineStack gap="200">
                {config.page_load?.enabled && (
                  <Badge tone="success">{`Page Load (${config.page_load.delay}s delay)`}</Badge>
                )}
                {config.exit_intent?.enabled && (
                  <Badge tone="success">Exit Intent</Badge>
                )}
                {config.scroll_depth?.enabled && (
                  <Badge tone="success">Scroll Depth</Badge>
                )}
                {config.idle_timer?.enabled && (
                  <Badge tone="success">Time Delay</Badge>
                )}
                {config.device_targeting?.enabled && (
                  <Badge tone="success">Device Targeting</Badge>
                )}
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>
      )}

      {/* Custom Configuration Notice */}
      {!selectedTemplate && (
        <Banner tone="info">
          <Text as="span" variant="bodySm">
            You have a custom trigger configuration. Select a template above to
            use Quick Setup, or switch to Advanced Mode to modify your current
            settings.
          </Text>
        </Banner>
      )}
    </BlockStack>
  );
};
