/**
 * Flash Sale Content Configuration Section
 *
 * Enhanced self-contained section for Flash Sale campaigns.
 * Includes Content, Advanced Features, Discount (with tiers/BOGO/gifts), and Design subsections.
 *
 * Follows the Newsletter pattern with Card-based organization
 */

import { useState } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  Collapsible,
  Button,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid, ColorField } from "../form";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import type { FlashSaleContentSchema } from "../../types/campaign";
import type { DesignConfig } from "../../types/campaign";
import type { DiscountConfig } from "~/domains/commerce/services/discount.server";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import {
  FLASH_SALE_THEMES,
  type FlashSaleThemeKey,
  themeColorsToDesignConfig,
} from "~/config/color-presets";

export type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;

export interface FlashSaleContentSectionProps {
  content: Partial<FlashSaleContent>;
  designConfig?: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<FlashSaleContent>) => void;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function FlashSaleContentSection({
  content,
  designConfig = {},
  discountConfig,
  errors,
  onChange,
  onDesignChange,
  onDiscountChange,
}: FlashSaleContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);
  const [showAdvancedTimer, setShowAdvancedTimer] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showReservation, setShowReservation] = useState(false);

  // Design field updater
  const updateDesignField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    if (onDesignChange) {
      onDesignChange({ ...designConfig, [field]: value });
    }
  };

  // Nested field updaters for enhanced features
  const updateTimerField = (field: string, value: unknown) => {
    const timer = (content.timer || {}) as any;
    updateField("timer", { ...timer, [field]: value });
  };

  const updateInventoryField = (field: string, value: unknown) => {
    const inventory = (content.inventory || {}) as any;
    updateField("inventory", { ...inventory, [field]: value });
  };

  const updateReserveField = (field: string, value: unknown) => {
    const reserve = (content.reserve || {}) as any;
    updateField("reserve", { ...reserve, [field]: value });
  };

  const updateCtaField = (field: string, value: unknown) => {
    const cta = (content.cta || {}) as any;
    updateField("cta", { ...cta, [field]: value });
  };

  const updatePresentationField = (field: string, value: unknown) => {
    const presentation = (content.presentation || {}) as any;
    updateField("presentation", { ...presentation, [field]: value });
  };

  // Handle theme selection - applies all colors from the theme
  const handleThemeChange = (themeKey: FlashSaleThemeKey) => {
    if (!onDesignChange) return;

    const themeColors = FLASH_SALE_THEMES[themeKey];
    const designUpdates = themeColorsToDesignConfig(themeColors);

    // Apply all theme colors to design config
    onDesignChange({
      ...designConfig,
      ...designUpdates,
    });
  };

  return (
    <>
      {/* ========== CONTENT SECTION ========== */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              ⚡ Content
            </Text>
            <Text as="p" tone="subdued">
              Configure the text and messaging for your flash sale popup
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            <TextField
              label="Headline"
              name="content.headline"
              value={content.headline || ""}
              error={errors?.headline}
              required
              placeholder="Flash Sale! Limited Time Only"
              helpText="Main headline that grabs attention"
              onChange={(value) => updateField("headline", value)}
            />

            <TextField
              label="Urgency Message"
              name="content.urgencyMessage"
              value={content.urgencyMessage || ""}
              error={errors?.urgencyMessage}
              required
              placeholder="Hurry! Sale ends soon"
              helpText="Message that creates urgency"
              onChange={(value) => updateField("urgencyMessage", value)}
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              error={errors?.subheadline}
              placeholder="Don't miss out on these amazing deals"
              helpText="Supporting text (optional)"
              onChange={(value) => updateField("subheadline", value)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Button Text"
                name="content.buttonText"
                value={content.buttonText || "Shop Now"}
                error={errors?.buttonText}
                required
                placeholder="Shop Now"
                onChange={(value) => updateField("buttonText", value)}
              />

              <TextField
                label="CTA URL"
                name="content.ctaUrl"
                value={content.ctaUrl || ""}
                placeholder="/collections/sale"
                helpText="Where to send users when they click the button"
                onChange={(value) => updateField("ctaUrl", value)}
              />
            </FormGrid>

            <TextField
              label="Success Message"
              name="content.successMessage"
              value={content.successMessage || ""}
              error={errors?.successMessage}
              required
              placeholder="Discount applied! Happy shopping!"
              helpText="Message shown after successful discount application"
              onChange={(value) => updateField("successMessage", value)}
            />

            <TextField
              label="Failure Message"
              name="content.failureMessage"
              value={content.failureMessage || ""}
              error={errors?.failureMessage}
              placeholder="Oops! Something went wrong. Please try again."
              helpText="Message shown if discount fails (optional)"
              onChange={(value) => updateField("failureMessage", value)}
            />
          </BlockStack>
        </BlockStack>
      </Card>

      {/* ========== ADVANCED FEATURES SECTION ========== */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              ⚙️ Advanced Features
            </Text>
            <Text as="p" tone="subdued">
              Countdown timers, inventory tracking, and reservation options
            </Text>
          </BlockStack>

          <Divider />

          {/* Basic Timer Options */}
          <BlockStack gap="300">
            <CheckboxField
              label="Show Countdown Timer"
              name="content.showCountdown"
              checked={content.showCountdown !== false}
              helpText="Display a countdown timer for urgency"
              onChange={(checked) => updateField("showCountdown", checked)}
            />

            {content.showCountdown !== false && (
              <TextField
                label="Countdown Duration (seconds)"
                name="content.countdownDuration"
                value={content.countdownDuration?.toString() || "3600"}
                placeholder="3600"
                helpText="Duration in seconds (default: 3600 = 1 hour)"
                onChange={(value) => updateField("countdownDuration", parseInt(value) || 3600)}
              />
            )}

            {/* Advanced Timer Configuration - Collapsible */}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h4" variant="headingSm">
                Advanced Timer Settings
              </Text>
              <Button
                variant="plain"
                onClick={() => setShowAdvancedTimer(!showAdvancedTimer)}
                icon={showAdvancedTimer ? ChevronUpIcon : ChevronDownIcon}
              >
                {showAdvancedTimer ? "Hide" : "Show"}
              </Button>
            </InlineStack>

            <Collapsible
              open={showAdvancedTimer}
              id="advanced-timer-options"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <Select
                  label="Timer Mode"
                  value={(content.timer as any)?.mode || "duration"}
                  options={[
                    { label: "Duration - Fixed countdown from view", value: "duration" },
                    { label: "Fixed End - Absolute end time", value: "fixed_end" },
                    { label: "Personal - Per-visitor countdown", value: "personal" },
                    { label: "Stock Limited - Countdown until sold out", value: "stock_limited" },
                  ]}
                  onChange={(value) => updateTimerField("mode", value)}
                  helpText="How the timer should behave"
                />

                {(content.timer as any)?.mode === "fixed_end" && (
                  <TextField
                    label="End Time (ISO Format)"
                    name="timer.endTimeISO"
                    value={(content.timer as any)?.endTimeISO || ""}
                    placeholder="2025-12-31T23:59:59Z"
                    helpText="Absolute end time in ISO format"
                    onChange={(value) => updateTimerField("endTimeISO", value)}
                  />
                )}

                {(content.timer as any)?.mode === "personal" && (
                  <TextField
                    label="Personal Window (seconds)"
                    name="timer.personalWindowSeconds"
                    value={(content.timer as any)?.personalWindowSeconds?.toString() || "1800"}
                    placeholder="1800"
                    helpText="Countdown from first view (e.g., 1800 = 30 min)"
                    onChange={(value) => updateTimerField("personalWindowSeconds", parseInt(value) || 1800)}
                  />
                )}

                <FormGrid columns={2}>
                  <Select
                    label="Timezone"
                    value={(content.timer as any)?.timezone || "shop"}
                    options={[
                      { label: "Shop Timezone", value: "shop" },
                      { label: "Visitor Timezone", value: "visitor" },
                    ]}
                    onChange={(value) => updateTimerField("timezone", value)}
                  />

                  <Select
                    label="On Expire Action"
                    value={(content.timer as any)?.onExpire || "auto_hide"}
                    options={[
                      { label: "Auto Hide", value: "auto_hide" },
                      { label: "Collapse Timer", value: "collapse" },
                      { label: "Swap Message", value: "swap_message" },
                    ]}
                    onChange={(value) => updateTimerField("onExpire", value)}
                  />
                </FormGrid>

                {(content.timer as any)?.onExpire === "swap_message" && (
                  <TextField
                    label="Expired Message"
                    name="timer.expiredMessage"
                    value={(content.timer as any)?.expiredMessage || ""}
                    placeholder="Sale has ended. Check back soon!"
                    onChange={(value) => updateTimerField("expiredMessage", value)}
                  />
                )}
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Inventory Tracking - Collapsible */}
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h4" variant="headingSm">
                🔢 Inventory Tracking
              </Text>
              <Button
                variant="plain"
                onClick={() => setShowInventory(!showInventory)}
                icon={showInventory ? ChevronUpIcon : ChevronDownIcon}
              >
                {showInventory ? "Hide" : "Show"}
              </Button>
            </InlineStack>

            <Collapsible
              open={showInventory}
              id="inventory-options"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <Select
                  label="Inventory Mode"
                  value={(content.inventory as any)?.mode || "pseudo"}
                  options={[
                    { label: "Pseudo - Simulated stock counter", value: "pseudo" },
                    { label: "Real - Live Shopify inventory", value: "real" },
                  ]}
                  onChange={(value) => updateInventoryField("mode", value)}
                  helpText="Use real inventory or simulated stock"
                />

                {(content.inventory as any)?.mode === "pseudo" && (
                  <TextField
                    label="Pseudo Max Inventory"
                    name="inventory.pseudoMax"
                    value={(content.inventory as any)?.pseudoMax?.toString() || "50"}
                    placeholder="50"
                    helpText="Fake maximum inventory count"
                    onChange={(value) => updateInventoryField("pseudoMax", parseInt(value) || 50)}
                  />
                )}

                <FormGrid columns={2}>
                  <CheckboxField
                    label='Show "Only X Left"'
                    name="inventory.showOnlyXLeft"
                    checked={(content.inventory as any)?.showOnlyXLeft !== false}
                    onChange={(checked) => updateInventoryField("showOnlyXLeft", checked)}
                  />

                  <TextField
                    label="Show Threshold"
                    name="inventory.showThreshold"
                    value={(content.inventory as any)?.showThreshold?.toString() || "10"}
                    placeholder="10"
                    helpText="Show warning when ≤ this value"
                    onChange={(value) => updateInventoryField("showThreshold", parseInt(value) || 10)}
                  />
                </FormGrid>

                <Select
                  label="Sold Out Behavior"
                  value={(content.inventory as any)?.soldOutBehavior || "hide"}
                  options={[
                    { label: "Hide Popup", value: "hide" },
                    { label: 'Show "You Missed It" Message', value: "missed_it" },
                  ]}
                  onChange={(value) => updateInventoryField("soldOutBehavior", value)}
                />

                {(content.inventory as any)?.soldOutBehavior === "missed_it" && (
                  <TextField
                    label="Sold Out Message"
                    name="inventory.soldOutMessage"
                    value={(content.inventory as any)?.soldOutMessage || ""}
                    placeholder="This deal is sold out. Check back later!"
                    onChange={(value) => updateInventoryField("soldOutMessage", value)}
                  />
                )}
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Soft Reservation - Collapsible */}
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h4" variant="headingSm">
                🔒 Soft Reservation Timer
              </Text>
              <Button
                variant="plain"
                onClick={() => setShowReservation(!showReservation)}
                icon={showReservation ? ChevronUpIcon : ChevronDownIcon}
              >
                {showReservation ? "Hide" : "Show"}
              </Button>
            </InlineStack>

            <Collapsible
              open={showReservation}
              id="reservation-options"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <CheckboxField
                  label="Enable Reservation Timer"
                  name="reserve.enabled"
                  checked={(content.reserve as any)?.enabled || false}
                  helpText='"X minutes to claim this offer" timer'
                  onChange={(checked) => updateReserveField("enabled", checked)}
                />

                {(content.reserve as any)?.enabled && (
                  <>
                    <TextField
                      label="Reservation Minutes"
                      name="reserve.minutes"
                      value={(content.reserve as any)?.minutes?.toString() || "10"}
                      placeholder="10"
                      helpText="Minutes to claim the reserved offer"
                      onChange={(value) => updateReserveField("minutes", parseInt(value) || 10)}
                    />

                    <TextField
                      label="Reservation Label"
                      name="reserve.label"
                      value={(content.reserve as any)?.label || ""}
                      placeholder="Offer reserved for:"
                      onChange={(value) => updateReserveField("label", value)}
                    />

                    <TextField
                      label="Disclaimer"
                      name="reserve.disclaimer"
                      value={(content.reserve as any)?.disclaimer || ""}
                      placeholder="Inventory not guaranteed"
                      helpText="Optional disclaimer text"
                      onChange={(value) => updateReserveField("disclaimer", value)}
                    />
                  </>
                )}
              </BlockStack>
            </Collapsible>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* ========== DISCOUNT SECTION ========== */}
      {onDiscountChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                💰 Discount Configuration
              </Text>
              <Text as="p" tone="subdued">
                Configure advanced discount types: tiered discounts, BOGO deals, and free gifts
              </Text>
            </BlockStack>

            <Divider />

            <GenericDiscountComponent
              goal="INCREASE_REVENUE"
              discountConfig={discountConfig}
              onConfigChange={onDiscountChange}
            />
          </BlockStack>
        </Card>
      )}

      {/* ========== DESIGN SECTION ========== */}
      {onDesignChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                🎨 Design & Presentation
              </Text>
              <Text as="p" tone="subdued">
                Customize the visual appearance and placement of your flash sale popup
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              {/* Theme Selection with Visual Swatches */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Flash Sale Theme
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {Object.entries(FLASH_SALE_THEMES).map(([key, theme]) => {
                    const isGradient = theme.background.includes("gradient");
                    const gradientMatch = isGradient
                      ? theme.background.match(/#[0-9a-f]{6}/gi)
                      : null;
                    const bgStyle = isGradient && gradientMatch
                      ? {
                          background: `linear-gradient(135deg, ${gradientMatch[0]} 0%, ${gradientMatch[1]} 100%)`,
                        }
                      : { backgroundColor: theme.background };

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleThemeChange(key as FlashSaleThemeKey)}
                        style={{
                          width: "100%",
                          height: "52px",
                          borderRadius: "8px",
                          border: "2px solid #e5e7eb",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          padding: 0,
                          ...bgStyle,
                        }}
                        title={key
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      >
                        {/* CTA preview button */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "4px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "600",
                            backgroundColor: theme.ctaBg || theme.primary,
                            color: theme.ctaText || "#ffffff",
                          }}
                        >
                          CTA
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Theme Dropdown */}
                <Select
                  label="Theme"
                  labelHidden
                  value=""
                  placeholder="Select a Flash Sale theme"
                  options={Object.keys(FLASH_SALE_THEMES).map((key) => ({
                    label: key
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" "),
                    value: key,
                  }))}
                  onChange={(value) => handleThemeChange(value as FlashSaleThemeKey)}
                />
              </BlockStack>

              <Divider />

              {/* Position and Size */}
              <FormGrid columns={2}>
                <Select
                  label="Position"
                  value={designConfig.position || "center"}
                  options={[
                    { label: "Center", value: "center" },
                    { label: "Top", value: "top" },
                    { label: "Bottom", value: "bottom" },
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" },
                  ]}
                  onChange={(value) => updateDesignField("position", value as DesignConfig["position"])}
                />

                <Select
                  label="Size"
                  value={designConfig.size || "medium"}
                  options={[
                    { label: "Small", value: "small" },
                    { label: "Medium", value: "medium" },
                    { label: "Large", value: "large" },
                  ]}
                  onChange={(value) => updateDesignField("size", value as DesignConfig["size"])}
                />
              </FormGrid>

              <Divider />

              {/* Main Colors */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Main Colors
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                  }}
                >
                  <ColorField
                    label="Background Color"
                    name="design.backgroundColor"
                    value={designConfig.backgroundColor || "#ffffff"}
                    onChange={(value: string) => updateDesignField("backgroundColor", value)}
                  />
                  <ColorField
                    label="Text Color"
                    name="design.textColor"
                    value={designConfig.textColor || "#1f2937"}
                    onChange={(value: string) => updateDesignField("textColor", value)}
                  />
                  <ColorField
                    label="Description Color"
                    name="design.descriptionColor"
                    value={designConfig.descriptionColor || "#6b7280"}
                    onChange={(value: string) => updateDesignField("descriptionColor", value)}
                  />
                  <ColorField
                    label="Accent Color"
                    name="design.accentColor"
                    value={designConfig.accentColor || "#3b82f6"}
                    onChange={(value: string) => updateDesignField("accentColor", value)}
                  />
                  <ColorField
                    label="Success Color"
                    name="design.successColor"
                    value={designConfig.successColor || "#10b981"}
                    onChange={(value: string) => updateDesignField("successColor", value)}
                  />
                </div>
              </BlockStack>

              <Divider />

              {/* Button Colors */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Button Colors
                </Text>
                <FormGrid columns={2}>
                  <ColorField
                    label="Button Background"
                    name="design.buttonColor"
                    value={designConfig.buttonColor || "#3b82f6"}
                    onChange={(value: string) => updateDesignField("buttonColor", value)}
                  />
                  <ColorField
                    label="Button Text"
                    name="design.buttonTextColor"
                    value={designConfig.buttonTextColor || "#ffffff"}
                    onChange={(value: string) => updateDesignField("buttonTextColor", value)}
                  />
                </FormGrid>
              </BlockStack>

              <Divider />

              {/* Overlay Settings */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Overlay Settings
                </Text>
                <FormGrid columns={2}>
                  <ColorField
                    label="Overlay Color"
                    name="design.overlayColor"
                    value={designConfig.overlayColor || "#000000"}
                    onChange={(value: string) => updateDesignField("overlayColor", value)}
                  />
                  <Select
                    label="Overlay Opacity"
                    value={String(Math.round((designConfig.overlayOpacity ?? 0.7) * 100))}
                    options={[
                      { label: "0%", value: "0" },
                      { label: "10%", value: "10" },
                      { label: "20%", value: "20" },
                      { label: "30%", value: "30" },
                      { label: "40%", value: "40" },
                      { label: "50%", value: "50" },
                      { label: "60%", value: "60" },
                      { label: "70%", value: "70" },
                      { label: "80%", value: "80" },
                      { label: "90%", value: "90" },
                      { label: "100%", value: "100" },
                    ]}
                    onChange={(value) => updateDesignField("overlayOpacity", parseInt(value) / 100)}
                  />
                </FormGrid>
              </BlockStack>

              <Divider />

              {/* Presentation Options */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Presentation Options
                </Text>
                <FormGrid columns={2}>
                  <Select
                    label="Badge Style"
                    value={(content.presentation as any)?.badgeStyle || "pill"}
                    options={[
                      { label: "Pill", value: "pill" },
                      { label: "Tag", value: "tag" },
                    ]}
                    onChange={(value) => updatePresentationField("badgeStyle", value)}
                  />
                </FormGrid>

                <FormGrid columns={2}>
                  <CheckboxField
                    label="Show Timer in Popup"
                    name="presentation.showTimer"
                    checked={(content.presentation as any)?.showTimer !== false}
                    onChange={(checked) => updatePresentationField("showTimer", checked)}
                  />

                  <CheckboxField
                    label="Show Inventory in Popup"
                    name="presentation.showInventory"
                    checked={(content.presentation as any)?.showInventory !== false}
                    onChange={(checked) => updatePresentationField("showInventory", checked)}
                  />
                </FormGrid>
              </BlockStack>

              <Divider />

              {/* Legacy Options */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Legacy Options
                </Text>
                <FormGrid columns={2}>
                  <CheckboxField
                    label="Hide on Expiry (Legacy)"
                    name="content.hideOnExpiry"
                    checked={content.hideOnExpiry !== false}
                    helpText="Automatically hide popup when timer expires"
                    onChange={(checked) => updateField("hideOnExpiry", checked)}
                  />

                  <CheckboxField
                    label="Auto-Hide on Expire"
                    name="content.autoHideOnExpire"
                    checked={(content as any).autoHideOnExpire || false}
                    helpText="Auto-hide 2 seconds after expiry"
                    onChange={(checked) => (updateField as any)("autoHideOnExpire", checked)}
                  />
                </FormGrid>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      )}
    </>
  );
}
