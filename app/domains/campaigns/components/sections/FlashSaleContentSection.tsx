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
  DatePicker,
  Popover,
  TextField as PolarisTextField,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid, ColorField, ProductPicker } from "../form";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import type { FlashSaleContentSchema, DesignConfig } from "../../types/campaign";
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
    const timer = (content.timer || {}) as Record<string, unknown>;
    updateField("timer", { ...timer, [field]: value } as Partial<FlashSaleContent>["timer"]);
  };

  const updateInventoryField = (field: string, value: unknown) => {
    const inventory = (content.inventory || {}) as Record<string, unknown>;
    updateField("inventory", {
      ...inventory,
      [field]: value,
    } as Partial<FlashSaleContent>["inventory"]);
  };

  const updateReserveField = (field: string, value: unknown) => {
    const reserve = (content.reserve || {}) as Record<string, unknown>;
    updateField("reserve", { ...reserve, [field]: value } as Partial<FlashSaleContent>["reserve"]);
  };

  const updateCtaField = (field: string, value: unknown) => {
    const cta = (content.cta || {}) as Record<string, unknown>;
    updateField("cta", { ...cta, [field]: value } as Partial<FlashSaleContent>["cta"]);
  };

  const updatePresentationField = (field: string, value: unknown) => {
    const presentation = (content.presentation || {}) as Record<string, unknown>;
    updateField("presentation", {
      ...presentation,
      [field]: value,
    } as Partial<FlashSaleContent>["presentation"]);
  };

  // Detect which theme matches the current design config
  const detectCurrentTheme = (): FlashSaleThemeKey | null => {
    for (const [key, theme] of Object.entries(FLASH_SALE_THEMES)) {
      const themeDesign = themeColorsToDesignConfig(theme);
      // Check if key colors match
      if (
        designConfig.backgroundColor === themeDesign.backgroundColor &&
        designConfig.buttonColor === themeDesign.buttonColor
      ) {
        return key as FlashSaleThemeKey;
      }
    }
    return null;
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
      <Card data-test-id="flash-sale-admin-form">
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
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Secondary button text that closes the popup"
              onChange={(value) => updateField("dismissLabel", value)}
            />

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
                  value={((content.timer as Record<string, unknown>)?.mode as string) || "duration"}
                  options={[
                    { label: "Duration - Fixed countdown from view", value: "duration" },
                    { label: "Fixed End - Absolute end time", value: "fixed_end" },
                    { label: "Personal - Per-visitor countdown", value: "personal" },
                    { label: "Stock Limited - Countdown until sold out", value: "stock_limited" },
                  ]}
                  onChange={(value) => updateTimerField("mode", value)}
                  helpText="How the timer should behave"
                />

                {(content.timer as Record<string, unknown>)?.mode === "fixed_end" && (
                  <DateTimePickerField
                    label="End Time"
                    value={((content.timer as Record<string, unknown>)?.endTimeISO as string) || ""}
                    onChange={(isoValue) => updateTimerField("endTimeISO", isoValue)}
                    helpText="Select the absolute end time for the countdown"
                  />
                )}

                {(content.timer as Record<string, unknown>)?.mode === "personal" && (
                  <TextField
                    label="Personal Window (seconds)"
                    name="timer.personalWindowSeconds"
                    value={
                      (
                        content.timer as Record<string, unknown>
                      )?.personalWindowSeconds?.toString() || "1800"
                    }
                    placeholder="1800"
                    helpText="Countdown from first view (e.g., 1800 = 30 min)"
                    onChange={(value) =>
                      updateTimerField("personalWindowSeconds", parseInt(value) || 1800)
                    }
                  />
                )}

                <FormGrid columns={2}>
                  <Select
                    label="Timezone"
                    value={
                      ((content.timer as Record<string, unknown>)?.timezone as string) || "shop"
                    }
                    options={[
                      { label: "Shop Timezone", value: "shop" },
                      { label: "Visitor Timezone", value: "visitor" },
                    ]}
                    onChange={(value) => updateTimerField("timezone", value)}
                  />

                  <Select
                    label="On Expire Action"
                    value={
                      ((content.timer as Record<string, unknown>)?.onExpire as string) ||
                      "auto_hide"
                    }
                    options={[
                      { label: "Auto Hide", value: "auto_hide" },
                      { label: "Collapse Timer", value: "collapse" },
                      { label: "Swap Message", value: "swap_message" },
                    ]}
                    onChange={(value) => updateTimerField("onExpire", value)}
                  />
                </FormGrid>

                {(content.timer as Record<string, unknown>)?.onExpire === "swap_message" && (
                  <TextField
                    label="Expired Message"
                    name="timer.expiredMessage"
                    value={
                      ((content.timer as Record<string, unknown>)?.expiredMessage as string) || ""
                    }
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
                  value={
                    ((content.inventory as Record<string, unknown>)?.mode as string) || "pseudo"
                  }
                  options={[
                    { label: "Pseudo - Simulated stock counter", value: "pseudo" },
                    { label: "Real - Live Shopify inventory", value: "real" },
                  ]}
                  onChange={(value) => updateInventoryField("mode", value)}
                  helpText="Use real inventory or simulated stock"
                />

                {(content.inventory as Record<string, unknown>)?.mode === "pseudo" && (
                  <TextField
                    label="Pseudo Max Inventory"
                    name="inventory.pseudoMax"
                    value={
                      (content.inventory as Record<string, unknown>)?.pseudoMax?.toString() || "8"
                    }
                    placeholder="8"
                    helpText="Simulated stock count. Set below threshold to show 'Only X Left' message."
                    onChange={(value) => updateInventoryField("pseudoMax", parseInt(value) || 8)}
                  />
                )}

                {(content.inventory as Record<string, unknown>)?.mode === "real" && (
                  <BlockStack gap="200">
                    <Text as="p" tone="subdued">
                      Select the product(s) whose inventory should be tracked for this flash sale.
                    </Text>
                    <ProductPicker
                      mode="product"
                      selectionType="multiple"
                      selectedIds={
                        ((content.inventory as Record<string, unknown>)?.productIds as string[]) ||
                        []
                      }
                      onSelect={(items) =>
                        updateInventoryField(
                          "productIds",
                          items.map((item) => item.id)
                        )
                      }
                      buttonLabel="Select products to track"
                      showSelected
                    />
                  </BlockStack>
                )}

                <FormGrid columns={2}>
                  <CheckboxField
                    label='Show "Only X Left"'
                    name="inventory.showOnlyXLeft"
                    checked={
                      (content.inventory as Record<string, unknown>)?.showOnlyXLeft !== false
                    }
                    onChange={(checked) => updateInventoryField("showOnlyXLeft", checked)}
                  />

                  {(content.inventory as Record<string, unknown>)?.showOnlyXLeft !== false && (
                    <TextField
                      label="Show Threshold"
                      name="inventory.showThreshold"
                      value={
                        (content.inventory as Record<string, unknown>)?.showThreshold?.toString() ||
                        "10"
                      }
                      placeholder="10"
                      helpText="Show warning when ≤ this value"
                      onChange={(value) =>
                        updateInventoryField("showThreshold", parseInt(value) || 10)
                      }
                    />
                  )}
                </FormGrid>

                {(content.inventory as Record<string, unknown>)?.showOnlyXLeft !== false && (
                  <>
                    <Select
                      label="Sold Out Behavior"
                      value={
                        ((content.inventory as Record<string, unknown>)
                          ?.soldOutBehavior as string) || "hide"
                      }
                      options={[
                        { label: "Hide Popup", value: "hide" },
                        { label: 'Show "You Missed It" Message', value: "missed_it" },
                      ]}
                      onChange={(value) => updateInventoryField("soldOutBehavior", value)}
                    />

                    {(content.inventory as Record<string, unknown>)?.soldOutBehavior ===
                      "missed_it" && (
                      <TextField
                        label="Sold Out Message"
                        name="inventory.soldOutMessage"
                        value={
                          ((content.inventory as Record<string, unknown>)
                            ?.soldOutMessage as string) || ""
                        }
                        placeholder="This deal is sold out. Check back later!"
                        onChange={(value) => updateInventoryField("soldOutMessage", value)}
                      />
                    )}
                  </>
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
                  checked={
                    ((content.reserve as Record<string, unknown>)?.enabled as boolean) || false
                  }
                  helpText='"X minutes to claim this offer" timer'
                  onChange={(checked) => updateReserveField("enabled", checked)}
                />

                {Boolean((content.reserve as Record<string, unknown>)?.enabled) && (
                  <>
                    <TextField
                      label="Reservation Minutes"
                      name="reserve.minutes"
                      value={
                        (content.reserve as Record<string, unknown>)?.minutes?.toString() || "10"
                      }
                      placeholder="10"
                      helpText="Minutes to claim the reserved offer"
                      onChange={(value) => updateReserveField("minutes", parseInt(value) || 10)}
                    />

                    <TextField
                      label="Reservation Label"
                      name="reserve.label"
                      value={((content.reserve as Record<string, unknown>)?.label as string) || ""}
                      placeholder="Offer reserved for:"
                      onChange={(value) => updateReserveField("label", value)}
                    />

                    <TextField
                      label="Disclaimer"
                      name="reserve.disclaimer"
                      value={
                        ((content.reserve as Record<string, unknown>)?.disclaimer as string) || ""
                      }
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
                    gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                    gap: "10px",
                    maxWidth: 560,
                  }}
                >
                  {Object.entries(FLASH_SALE_THEMES).map(([key, theme]) => {
                    const isSelected = detectCurrentTheme() === key;
                    const label = key
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ");

                    // Build swatch background: left half = background, right half = CTA color
                    const bg = theme.background || "#FFFFFF";
                    const isGradient = bg.includes("gradient");
                    const swatchBg = isGradient
                      ? bg
                      : `linear-gradient(90deg, ${bg} 50%, ${theme.ctaBg || theme.primary || "#007BFF"} 50%)`;

                    return (
                      <div
                        key={key}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                      >
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => handleThemeChange(key as FlashSaleThemeKey)}
                            aria-label={label}
                            title={label}
                            style={{
                              width: 52,
                              height: 36,
                              borderRadius: 8,
                              border: isSelected ? "2px solid #202223" : "1px solid #D2D5D8",
                              background: swatchBg,
                              cursor: "pointer",
                              boxShadow: isSelected ? "0 0 0 2px rgba(32,34,35,0.15)" : "none",
                            }}
                          />
                          {isSelected && (
                            <span
                              aria-hidden="true"
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#FFFFFF",
                                border: "1px solid #202223",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                lineHeight: "12px",
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: "#6D7175" }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </BlockStack>

              <Divider />

              {/* Position, Size & Display Mode */}
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
                  onChange={(value) =>
                    updateDesignField("position", value as DesignConfig["position"])
                  }
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

              <Select
                label="Display Mode"
                value={designConfig.displayMode || "modal"}
                options={[
                  { label: "Popup (modal)", value: "modal" },
                  { label: "Banner (top or bottom)", value: "banner" },
                ]}
                onChange={(value) =>
                  updateDesignField("displayMode", value as DesignConfig["displayMode"])
                }
                helpText="Choose whether this flash sale appears as a popup or a top/bottom banner on your store."
              />

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
                    value={
                      ((content.presentation as Record<string, unknown>)?.badgeStyle as string) ||
                      "pill"
                    }
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
                    checked={(content.presentation as Record<string, unknown>)?.showTimer !== false}
                    onChange={(checked) => updatePresentationField("showTimer", checked)}
                  />

                  <CheckboxField
                    label="Show Inventory in Popup"
                    name="presentation.showInventory"
                    checked={
                      (content.presentation as Record<string, unknown>)?.showInventory !== false
                    }
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
                    checked={
                      ((content as Record<string, unknown>).autoHideOnExpire as boolean) || false
                    }
                    helpText="Auto-hide 2 seconds after expiry"
                    onChange={(checked) => updateField("autoHideOnExpire", checked)}
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

// Custom DateTimePicker component using Polaris DatePicker + time selects
interface DateTimePickerFieldProps {
  label: string;
  value: string; // ISO string
  onChange: (isoValue: string) => void;
  helpText?: string;
}

function DateTimePickerField({ label, value, onChange, helpText }: DateTimePickerFieldProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Parse current value
  const currentDate = value ? new Date(value) : new Date();
  const selectedDate = value && !isNaN(currentDate.getTime()) ? currentDate : undefined;

  const currentHour = currentDate.getHours().toString().padStart(2, "0");
  const currentMinute = currentDate.getMinutes().toString().padStart(2, "0");

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    label: i.toString().padStart(2, "0"),
    value: i.toString().padStart(2, "0"),
  }));

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = [
    { label: "00", value: "00" },
    { label: "15", value: "15" },
    { label: "30", value: "30" },
    { label: "45", value: "45" },
  ];

  const handleDateChange = (newDate: any) => {
    try {
      console.log("DatePicker returned:", newDate);

      // Handle different return formats from DatePicker
      let dateToUse;

      if (newDate && typeof newDate === "object") {
        // If it's a range object with start/end, use the start date
        if (newDate.start) {
          dateToUse = newDate.start;
        }
        // If it's already a date object with year/month/day
        else if (
          newDate.year !== undefined &&
          newDate.month !== undefined &&
          newDate.day !== undefined
        ) {
          dateToUse = new Date(newDate.year, newDate.month, newDate.day);
        }
        // If it's a Date object
        else if (newDate instanceof Date) {
          dateToUse = newDate;
        }
      }

      if (!dateToUse) {
        console.error("Could not parse date from DatePicker:", newDate);
        return;
      }

      // Create the final date with current time
      const finalDate = new Date(
        dateToUse.getFullYear(),
        dateToUse.getMonth(),
        dateToUse.getDate(),
        parseInt(currentHour),
        parseInt(currentMinute)
      );

      // Validate the date
      if (isNaN(finalDate.getTime())) {
        console.error("Invalid final date created:", finalDate);
        return;
      }

      onChange(finalDate.toISOString());
      setDatePickerOpen(false);
    } catch (error) {
      console.error("Error handling date change:", error);
    }
  };

  const handleTimeChange = (hour: string, minute: string) => {
    try {
      const baseDate = selectedDate ?? new Date();

      const updatedDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        parseInt(hour, 10),
        parseInt(minute, 10)
      );

      // Validate the date
      if (isNaN(updatedDate.getTime())) {
        console.error("Invalid date created in time change");
        return;
      }

      onChange(updatedDate.toISOString());
    } catch (error) {
      console.error("Error handling time change:", error);
    }
  };

  const formatDateValue = () => {
    if (!selectedDate) return "";
    return `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-${selectedDate.getDate().toString().padStart(2, "0")}`;
  };

  const formatDisplayValue = () => {
    if (!value) return "";
    return currentDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="Polaris-Labelled">
      <div className="Polaris-Labelled__LabelWrapper">
        <div className="Polaris-Label">
          <label className="Polaris-Label__Text">{label}</label>
        </div>
      </div>

      <BlockStack gap="200">
        {/* Date Picker Row */}
        <BlockStack gap="100">
          <Text as="p" variant="bodySm" fontWeight="medium">
            Date
          </Text>
          <Popover
            active={datePickerOpen}
            activator={
              <Button onClick={() => setDatePickerOpen(!datePickerOpen)} textAlign="left" fullWidth>
                {formatDateValue() || "Select date"}
              </Button>
            }
            onClose={() => setDatePickerOpen(false)}
          >
            <DatePicker
              month={selectedDate?.getMonth() ?? new Date().getMonth()}
              year={selectedDate?.getFullYear() ?? new Date().getFullYear()}
              selected={selectedDate}
              onMonthChange={(month, year) => {
                // Handle month/year navigation if needed
              }}
              onChange={handleDateChange}
            />
          </Popover>
        </BlockStack>

        {/* Time Picker Row */}
        <BlockStack gap="100">
          <Text as="p" variant="bodySm" fontWeight="medium">
            Time
          </Text>
          <InlineStack gap="200">
            <div style={{ flex: 1 }}>
              <Select
                label=""
                options={hourOptions}
                value={currentHour}
                onChange={(hour) => handleTimeChange(hour, currentMinute)}
                placeholder="Hour"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label=""
                options={minuteOptions}
                value={currentMinute}
                onChange={(minute) => handleTimeChange(currentHour, minute)}
                placeholder="Min"
              />
            </div>
          </InlineStack>
        </BlockStack>

        {/* Display current selection */}
        {value && (
          <Text as="p" variant="bodySm" tone="subdued">
            Selected: {formatDisplayValue()}
          </Text>
        )}

        {helpText && (
          <Text as="p" variant="bodySm" tone="subdued">
            {helpText}
          </Text>
        )}
      </BlockStack>
    </div>
  );
}
