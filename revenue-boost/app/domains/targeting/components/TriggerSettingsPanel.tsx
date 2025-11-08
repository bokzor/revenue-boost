import { useState, useEffect } from "react";
import {
  Card,
  InlineStack,
  BlockStack,
  Text,
  Select,
  TextField,
  Checkbox,
  Button,
  Banner,
  Badge,
  Icon,
  Grid,
} from "@shopify/polaris";
import {
  TargetIcon,
  MobileIcon,
  CheckCircleIcon,
  ChartDonutIcon,
  AlertCircleIcon,
} from "@shopify/polaris-icons";
import type { CampaignGoal } from "@prisma/client";
import type {
  TriggerConfig,
  TriggerCondition,
  TriggerScheduling,
 TriggerType } from "~/domains/targeting/models/Trigger";
import {
  TriggerConfigManager,
  TRIGGER_TYPE_METADATA,
} from "~/domains/targeting/models/Trigger";

interface TriggerSettingsPanelProps {
  goal: CampaignGoal;
  value: TriggerConfig;
  onChange: (value: TriggerConfig) => void;
  onSave?: (value: TriggerConfig) => Promise<void>;
  disabled?: boolean;
}

export function TriggerSettingsPanel({
  goal,
  value,
  onChange,
  disabled = false,
}: TriggerSettingsPanelProps) {
  const [recommendedTriggers, setRecommendedTriggers] = useState<TriggerType[]>(
    [],
  );
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    // Get recommended triggers for this goal
    const templates = TriggerConfigManager.getTemplatesByGoal(goal);
    const recommended = templates.map((t) => t.type);
    setRecommendedTriggers(recommended);
  }, [goal]);

  useEffect(() => {
    // Validate trigger configuration
    const validation = TriggerConfigManager.validateTriggerConfig(value);
    setValidationResult(validation);
  }, [value]);

  const handleTriggerTypeChange = (triggerType: TriggerType) => {
    const newConfig = TriggerConfigManager.getDefaultTriggerConfig(triggerType);
    onChange(newConfig);
  };

  const handleConditionChange = (
    index: number,
    field: string,
    conditionValue: any,
  ) => {
    const newConditions = [...(value.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: conditionValue };

    onChange({
      ...value,
      conditions: newConditions,
    });
  };

  const handleAddCondition = () => {
    const newCondition: TriggerCondition = {
      field: "",
      operator: "equals",
      value: "",
      required: false,
    };

    onChange({
      ...value,
      conditions: [...(value.conditions || []), newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...(value.conditions || [])];
    newConditions.splice(index, 1);
    onChange({
      ...value,
      conditions: newConditions,
    });
  };

  const handleSchedulingChange = (scheduling: TriggerScheduling) => {
    onChange({
      ...value,
      scheduling,
    });
  };

  const formatTriggerType = (type: TriggerType): string => {
    return type
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getTriggerTypeDescription = (type: TriggerType): string => {
    return TRIGGER_TYPE_METADATA[type]?.description || "";
  };

  const triggerTypeOptions = (Object.keys(TRIGGER_TYPE_METADATA) as TriggerType[]).map((type) => ({
    label: formatTriggerType(type),
    value: type as string,
    description: getTriggerTypeDescription(type),
  }));

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            Campaign Triggers
          </Text>
          {/* Trigger Type Selection */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">
              Trigger Type
            </Text>

            <Select
              label="When should this campaign appear?"
              options={triggerTypeOptions}
              value={value.type || ""}
              onChange={(val) => handleTriggerTypeChange(val as TriggerType)}
              disabled={disabled}
            />

            {recommendedTriggers.length > 0 && (
              <Banner tone="info" title="Recommended for this goal">
                <InlineStack gap="200">
                  <Text as="p">
                    Based on your goal, we recommend these trigger types:
                  </Text>
                  <InlineStack gap="100">
                    {recommendedTriggers.map((trigger) => (
                      <Badge key={trigger} tone="info">
                        {formatTriggerType(trigger)}
                      </Badge>
                    ))}
                  </InlineStack>
                </InlineStack>
              </Banner>
            )}

            {/* Trigger Type Metadata */}
            {value.type && TRIGGER_TYPE_METADATA[value.type] && (
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="center" gap="200">
                    <Icon source={TargetIcon} />
                    <Text variant="headingSm" as="h4">
                      {formatTriggerType(value.type)} Details
                    </Text>
                  </InlineStack>

                  <Text as="p" variant="bodySm" tone="subdued">
                    {getTriggerTypeDescription(value.type)}
                  </Text>

                  <InlineStack gap="200">
                    {TRIGGER_TYPE_METADATA[value.type].supportsMobile && (
                      <InlineStack gap="100" align="center">
                        <Icon source={MobileIcon} />
                        <Text as="p" variant="bodySm">
                          Mobile supported
                        </Text>
                      </InlineStack>
                    )}
                    {TRIGGER_TYPE_METADATA[value.type].requiresEngagement && (
                      <InlineStack gap="100" align="center">
                        <Icon source={ChartDonutIcon} />
                        <Text as="p" variant="bodySm">
                          Requires engagement
                        </Text>
                      </InlineStack>
                    )}
                  </InlineStack>
                </BlockStack>
              </Card>
            )}
          </BlockStack>

          {/* Trigger Conditions */}
          {value.type && (
            <BlockStack gap="300">
              <InlineStack align="center" gap="200">
                <Text variant="headingSm" as="h3">
                  Trigger Conditions
                </Text>
                <Button
                  size="micro"
                  onClick={handleAddCondition}
                  disabled={disabled}
                >
                  Add Condition
                </Button>
              </InlineStack>

              {(value.conditions || []).map(
                (condition: TriggerCondition, index: number) => (
                  <Card key={index}>
                    <BlockStack gap="200">
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4 }}>
                          <TextField
                            label="Field"
                            value={condition.field}
                            onChange={(val) =>
                              handleConditionChange(index, "field", val)
                            }
                            disabled={disabled || condition.required}
                            placeholder="e.g., scrollDepth, timeOnPage"
                            autoComplete="off"
                          />
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                          <Select
                            label="Operator"
                            options={[
                              { label: "Equals", value: "equals" },
                              { label: "Not equals", value: "not_equals" },
                              { label: "Contains", value: "contains" },
                              { label: "Greater than", value: "greater_than" },
                              { label: "Less than", value: "less_than" },
                              { label: "Exists", value: "exists" },
                              { label: "Not exists", value: "not_exists" },
                            ]}
                            value={condition.operator}
                            onChange={(val) =>
                              handleConditionChange(index, "operator", val)
                            }
                            disabled={disabled}
                          />
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                          <TextField
                            label="Value"
                            value={condition.value?.toString() || ""}
                            onChange={(val) => {
                              const numericValue = isNaN(Number(val))
                                ? val
                                : Number(val);
                              handleConditionChange(
                                index,
                                "value",
                                numericValue,
                              );
                            }}
                            type={
                              typeof condition.value === "number"
                                ? "number"
                                : "text"
                            }
                            disabled={disabled}
                            autoComplete="off"
                          />
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 2 }}>
                          <BlockStack gap="100">
                            <Checkbox
                              label="Required"
                              checked={condition.required}
                              onChange={(val) =>
                                handleConditionChange(index, "required", val)
                              }
                              disabled={disabled}
                            />
                            {!condition.required && (
                              <Button
                                size="micro"
                                onClick={() => handleRemoveCondition(index)}
                                disabled={disabled}
                                variant="primary"
                                tone="critical"
                              >
                                Remove
                              </Button>
                            )}
                          </BlockStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>
                  </Card>
                ),
              )}

              {(!value.conditions || value.conditions.length === 0) && (
                <Text as="p" variant="bodySm" tone="subdued">
                  No conditions specified. This trigger will fire whenever the
                  trigger event occurs.
                </Text>
              )}
            </BlockStack>
          )}

          {/* Frequency Capping moved to dedicated Frequency Capping tab */}

          {/* Scheduling */}
          <Card>
            <BlockStack gap="300">
              <InlineStack align="center" gap="200">
                <Icon source={TargetIcon} />
                <Text variant="headingSm" as="h3">
                  Schedule (Optional)
                </Text>
              </InlineStack>

              <Checkbox
                label="Enable scheduling"
                checked={value.scheduling?.enabled || false}
                onChange={(enabled) =>
                  handleSchedulingChange({
                    enabled,
                    schedule: {
                      days: [0, 1, 2, 3, 4, 5, 6], // All days
                      startTime: "09:00",
                      endTime: "18:00",
                      timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                    exceptions: [],
                  })
                }
                disabled={disabled}
              />

              {value.scheduling?.enabled && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Show campaigns only during specific days and hours
                  </Text>

                  <TextField
                    label="Start time"
                    type="time"
                    value={value.scheduling?.schedule?.startTime || ""}
                    onChange={(startTime) =>
                      handleSchedulingChange({
                        ...value.scheduling!,
                        schedule: { ...value.scheduling!.schedule, startTime },
                      })
                    }
                    disabled={disabled}
                    autoComplete="off"
                  />

                  <TextField
                    label="End time"
                    type="time"
                    value={value.scheduling?.schedule?.endTime || ""}
                    onChange={(endTime) =>
                      handleSchedulingChange({
                        ...value.scheduling!,
                        schedule: { ...value.scheduling!.schedule, endTime },
                      })
                    }
                    disabled={disabled}
                    autoComplete="off"
                  />

                  <TextField
                    label="Timezone"
                    value={value.scheduling?.schedule?.timezone || ""}
                    onChange={(timezone) =>
                      handleSchedulingChange({
                        ...value.scheduling!,
                        schedule: { ...value.scheduling!.schedule, timezone },
                      })
                    }
                    disabled={disabled}
                    placeholder={
                      Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                    autoComplete="off"
                  />

                  <Text as="p" variant="bodySm" fontWeight="medium">
                    Days of week:
                  </Text>
                  <Grid>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <Grid.Cell
                          key={day}
                          columnSpan={{ xs: 3, sm: 3, md: 2, lg: 2 }}
                        >
                          <Checkbox
                            label={day}
                            checked={
                              value.scheduling?.schedule?.days?.includes(
                                index,
                              ) || false
                            }
                            onChange={(checked) => {
                              const currentDays =
                                value.scheduling?.schedule?.days || [];
                              const newDays = checked
                                ? [...currentDays, index]
                                : currentDays.filter((d: number) => d !== index);
                              handleSchedulingChange({
                                ...value.scheduling!,
                                schedule: {
                                  ...value.scheduling!.schedule,
                                  days: newDays,
                                },
                              });
                            }}
                            disabled={disabled}
                          />
                        </Grid.Cell>
                      ),
                    )}
                  </Grid>
                </BlockStack>
              )}
            </BlockStack>
          </Card>

          {/* Validation Results */}
          {validationResult && !validationResult.isValid && (
            <Banner tone="critical" title="Configuration Issues">
              <BlockStack gap="200">
                {validationResult.errors.map((error: any, index: number) => (
                  <InlineStack key={index} gap="100" align="center">
                    <Icon source={AlertCircleIcon} />
                    <Text as="p" variant="bodySm">
                      {error.message}
                    </Text>
                  </InlineStack>
                ))}
              </BlockStack>
            </Banner>
          )}

          {validationResult && validationResult.warnings.length > 0 && (
            <Banner tone="warning" title="Recommendations">
              <BlockStack gap="200">
                {validationResult.warnings.map(
                  (warning: any, index: number) => (
                    <InlineStack key={index} gap="100" align="center">
                      <Icon source={AlertCircleIcon} />
                      <Text as="p" variant="bodySm">
                        {warning.message}
                      </Text>
                    </InlineStack>
                  ),
                )}
                {validationResult.recommendations.map(
                  (recommendation: string, index: number) => (
                    <InlineStack key={index} gap="100" align="center">
                      <Icon source={CheckCircleIcon} />
                      <Text as="p" variant="bodySm">
                        {recommendation}
                      </Text>
                    </InlineStack>
                  ),
                )}
              </BlockStack>
            </Banner>
          )}
        </BlockStack>
      </Card>
    </>
  );
}
