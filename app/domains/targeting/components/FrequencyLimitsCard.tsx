/**
 * Frequency Limits Card Component
 *
 * Configure session/day limits and cooldown period
 * Uses server format directly (max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers)
 */

import {
  Card,
  BlockStack,
  Text,
  TextField,
  Banner,
  Box,
} from "@shopify/polaris";

interface FrequencyLimitsCardProps {
  maxTriggersPerSession?: number;
  maxTriggersPerDay?: number;
  cooldownBetweenTriggers?: number; // in seconds
  onMaxTriggersPerSessionChange: (value: string) => void;
  onMaxTriggersPerDayChange: (value: string) => void;
  onCooldownChange: (value: string) => void;
}

export function FrequencyLimitsCard({
  maxTriggersPerSession,
  maxTriggersPerDay,
  cooldownBetweenTriggers = 0,
  onMaxTriggersPerSessionChange,
  onMaxTriggersPerDayChange,
  onCooldownChange,
}: FrequencyLimitsCardProps) {
  // Convert seconds to hours for display
  const cooldownHours = cooldownBetweenTriggers ? cooldownBetweenTriggers / 3600 : 0;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Frequency Limits
          </Text>

          <Text as="p" variant="bodySm" tone="subdued">
            Control how often this popup can be shown to the same visitor
          </Text>

          <TextField
            label="Max triggers per session"
            type="number"
            value={maxTriggersPerSession?.toString() || ""}
            onChange={onMaxTriggersPerSessionChange}
            min={1}
            autoComplete="off"
            helpText="Maximum times this popup can show in a single browsing session (leave empty for unlimited)"
            placeholder="Unlimited"
            data-test-id="frequency-max-triggers-per-session"
          />

          <TextField
            label="Max triggers per day"
            type="number"
            value={maxTriggersPerDay?.toString() || ""}
            onChange={onMaxTriggersPerDayChange}
            min={1}
            autoComplete="off"
            helpText="Maximum times this popup can show in a 24-hour period (leave empty for unlimited)"
            placeholder="Unlimited"
            data-test-id="frequency-max-triggers-per-day"
          />

          <TextField
            label="Cooldown between triggers (seconds)"
            type="number"
            value={cooldownBetweenTriggers?.toString() || ""}
            onChange={onCooldownChange}
            min={0}
            autoComplete="off"
            helpText="Minimum time between popup displays (0 = no cooldown)"
            placeholder="0"
            data-test-id="frequency-cooldown-between-triggers"
          />

          <Banner tone="info">
            <p>
              <strong>Current setting:</strong>{" "}
              {!maxTriggersPerSession && !maxTriggersPerDay ? (
                <span>No frequency limits (popup can show unlimited times)</span>
              ) : (
                <>
                  {maxTriggersPerSession && (
                    <span>
                      Max <strong>{maxTriggersPerSession}</strong> time{maxTriggersPerSession !== 1 ? "s" : ""} per session
                    </span>
                  )}
                  {maxTriggersPerSession && maxTriggersPerDay && <span>, </span>}
                  {maxTriggersPerDay && (
                    <span>
                      Max <strong>{maxTriggersPerDay}</strong> time{maxTriggersPerDay !== 1 ? "s" : ""} per day
                    </span>
                  )}
                </>
              )}
              {cooldownBetweenTriggers && cooldownBetweenTriggers > 0 && (
                <span>
                  {" "}
                  with a <strong>{cooldownHours < 1 ? `${Math.round(cooldownHours * 60)} minute` : `${cooldownHours} hour`}</strong>{" "}
                  cooldown between displays
                </span>
              )}
            </p>
          </Banner>
        </BlockStack>
      </Box>
    </Card>
  );
}

