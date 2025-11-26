/**
 * Cart Abandonment Content Configuration Section
 *
 * Form section for configuring cart abandonment popup content
 * Organized into collapsible sections for better UX
 */

import { useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Button,
  Collapsible,
  InlineStack,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

export interface CartAbandonmentContent {
  headline?: string;
  subheadline?: string;
  showCartItems?: boolean;
  maxItemsToShow?: number;
  showCartTotal?: boolean;
  showUrgency?: boolean;
  urgencyTimer?: number;
  urgencyMessage?: string;
  showStockWarnings?: boolean;
  stockWarningMessage?: string;
  ctaUrl?: string;
  buttonText?: string;
  saveForLaterText?: string;
  dismissLabel?: string;
  currency?: string;

  // Optional email recovery flow
  enableEmailRecovery?: boolean;
  emailPlaceholder?: string;
  emailSuccessMessage?: string;
  emailErrorMessage?: string;
  emailButtonText?: string;
  requireEmailBeforeCheckout?: boolean;
}

export interface CartAbandonmentContentSectionProps {
  content: Partial<CartAbandonmentContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<CartAbandonmentContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function CartAbandonmentContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
}: CartAbandonmentContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicContent: true, // Basic content open by default for first-time setup
    cartDisplay: false,
    urgencyScarcity: false,
    callToAction: false,
    emailRecovery: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleKeyDown = (section: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection(section);
    }
  };

  return (
    <>
      <Card data-test-id="cart-abandonment-admin-form">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🛒 Cart recovery content
            </Text>
            <Text as="p" tone="subdued">
              Configure copy, cart details, urgency and CTAs for your recovery popup.
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            {/* Basic Content Section */}
            <BlockStack gap="300">
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => toggleSection("basicContent")}
                onKeyDown={handleKeyDown("basicContent")}
              >
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={openSections.basicContent ? ChevronUpIcon : ChevronDownIcon}
                  />
                  <Text as="h4" variant="headingSm">
                    Basic Content
                  </Text>
                </InlineStack>
              </div>

              <Collapsible
                open={openSections.basicContent}
                id="basic-content-section"
                transition={{
                  duration: "200ms",
                  timingFunction: "ease-in-out",
                }}
              >
                <BlockStack gap="300">
                  <TextField
                    label="Headline"
                    name="content.headline"
                    value={content.headline || ""}
                    error={errors?.headline}
                    required
                    placeholder="You left something behind"
                    helpText="Main headline to grab attention"
                    onChange={(value) => updateField("headline", value)}
                  />

                  <TextField
                    label="Subheadline"
                    name="content.subheadline"
                    value={content.subheadline || ""}
                    error={errors?.subheadline}
                    placeholder="Complete your purchase before it's gone"
                    helpText="Supporting text (optional)"
                    onChange={(value) => updateField("subheadline", value)}
                  />
                </BlockStack>
              </Collapsible>
            </BlockStack>

            <Divider />

            {/* Cart Display Section */}
            <BlockStack gap="300">
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => toggleSection("cartDisplay")}
                onKeyDown={handleKeyDown("cartDisplay")}
              >
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={openSections.cartDisplay ? ChevronUpIcon : ChevronDownIcon}
                  />
                  <Text as="h4" variant="headingSm">
                    Cart Display
                  </Text>
                </InlineStack>
              </div>

              <Collapsible
                open={openSections.cartDisplay}
                id="cart-display-section"
                transition={{
                  duration: "200ms",
                  timingFunction: "ease-in-out",
                }}
              >
                <BlockStack gap="300">
                  <FormGrid columns={2}>
                    <CheckboxField
                      label="Show Cart Items"
                      name="content.showCartItems"
                      checked={content.showCartItems !== false}
                      helpText="Display items in the abandoned cart"
                      onChange={(checked) => updateField("showCartItems", checked)}
                    />

                    <CheckboxField
                      label="Show Cart Total"
                      name="content.showCartTotal"
                      checked={content.showCartTotal !== false}
                      helpText="Display total cart value"
                      onChange={(checked) => updateField("showCartTotal", checked)}
                    />
                  </FormGrid>

                  {content.showCartItems && (
                    <TextField
                      label="Max Items to Show"
                      name="content.maxItemsToShow"
                      value={content.maxItemsToShow?.toString() || "3"}
                      error={errors?.maxItemsToShow}
                      placeholder="3"
                      helpText="Maximum number of cart items to display"
                      onChange={(value) => updateField("maxItemsToShow", parseInt(value) || 3)}
                    />
                  )}
                </BlockStack>
              </Collapsible>
            </BlockStack>

            <Divider />

            {/* Urgency & Scarcity Section */}
            <BlockStack gap="300">
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => toggleSection("urgencyScarcity")}
                onKeyDown={handleKeyDown("urgencyScarcity")}
              >
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={openSections.urgencyScarcity ? ChevronUpIcon : ChevronDownIcon}
                  />
                  <Text as="h4" variant="headingSm">
                    Urgency & Scarcity
                  </Text>
                </InlineStack>
              </div>

              <Collapsible
                open={openSections.urgencyScarcity}
                id="urgency-scarcity-section"
                transition={{
                  duration: "200ms",
                  timingFunction: "ease-in-out",
                }}
              >
                <BlockStack gap="300">
                  <CheckboxField
                    label="Enable Urgency Timer"
                    name="content.showUrgency"
                    checked={content.showUrgency !== false}
                    helpText="Show countdown timer to create urgency"
                    onChange={(checked) => updateField("showUrgency", checked)}
                  />

                  {content.showUrgency && (
                    <>
                      <FormGrid columns={2}>
                        <TextField
                          label="Urgency Timer (seconds)"
                          name="content.urgencyTimer"
                          value={content.urgencyTimer?.toString() || "300"}
                          error={errors?.urgencyTimer}
                          placeholder="300"
                          helpText="Timer duration (default: 5 minutes)"
                          onChange={(value) => updateField("urgencyTimer", parseInt(value) || 300)}
                        />

                        <TextField
                          label="Urgency Message"
                          name="content.urgencyMessage"
                          value={content.urgencyMessage || ""}
                          placeholder="Complete your order in {{time}} to save 10%"
                          helpText="Use {{time}} for timer placeholder"
                          onChange={(value) => updateField("urgencyMessage", value)}
                        />
                      </FormGrid>
                    </>
                  )}

                  <CheckboxField
                    label="Show Stock Warnings"
                    name="content.showStockWarnings"
                    checked={content.showStockWarnings || false}
                    helpText="Display low stock warnings for cart items"
                    onChange={(checked) => updateField("showStockWarnings", checked)}
                  />

                  {content.showStockWarnings && (
                    <TextField
                      label="Stock Warning Message"
                      name="content.stockWarningMessage"
                      value={content.stockWarningMessage || ""}
                      placeholder="⚠️ Items in your cart are selling fast!"
                      onChange={(value) => updateField("stockWarningMessage", value)}
                    />
                  )}
                </BlockStack>
              </Collapsible>
            </BlockStack>

            <Divider />

            {/* Call to Action Section */}
            <BlockStack gap="300">
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => toggleSection("callToAction")}
                onKeyDown={handleKeyDown("callToAction")}
              >
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={openSections.callToAction ? ChevronUpIcon : ChevronDownIcon}
                  />
                  <Text as="h4" variant="headingSm">
                    Call to Action
                  </Text>
                </InlineStack>
              </div>

              <Collapsible
                open={openSections.callToAction}
                id="call-to-action-section"
                transition={{
                  duration: "200ms",
                  timingFunction: "ease-in-out",
                }}
              >
                <BlockStack gap="300">
                  <FormGrid columns={2}>
                    <TextField
                      label="Button Text"
                      name="content.buttonText"
                      value={content.buttonText || ""}
                      error={errors?.buttonText}
                      required
                      placeholder="Resume Checkout"
                      onChange={(value) => updateField("buttonText", value)}
                    />

                    <TextField
                      label="CTA URL"
                      name="content.ctaUrl"
                      value={content.ctaUrl || ""}
                      error={errors?.ctaUrl}
                      placeholder="/checkout"
                      helpText="Where to send users when they click the button"
                      onChange={(value) => updateField("ctaUrl", value)}
                    />
                  </FormGrid>

                  <TextField
                    label="Save for Later Text"
                    name="content.saveForLaterText"
                    value={content.saveForLaterText || ""}
                    placeholder="Save for Later"
                    helpText="Secondary action text (optional)"
                    onChange={(value) => updateField("saveForLaterText", value)}
                  />

                  <TextField
                    label="Dismiss Button Text"
                    name="content.dismissLabel"
                    value={content.dismissLabel || ""}
                    error={errors?.dismissLabel}
                    placeholder="No thanks"
                    helpText="Text for the small link that closes the popup without saving or resuming checkout"
                    onChange={(value) => updateField("dismissLabel", value)}
                  />
                </BlockStack>
              </Collapsible>
            </BlockStack>

            <Divider />

            {/* Email Recovery Section */}
            <BlockStack gap="300">
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => toggleSection("emailRecovery")}
                onKeyDown={handleKeyDown("emailRecovery")}
              >
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={openSections.emailRecovery ? ChevronUpIcon : ChevronDownIcon}
                  />
                  <Text as="h4" variant="headingSm">
                    Email Recovery
                  </Text>
                </InlineStack>
              </div>

              <Collapsible
                open={openSections.emailRecovery}
                id="email-recovery-section"
                transition={{
                  duration: "200ms",
                  timingFunction: "ease-in-out",
                }}
              >
                <BlockStack gap="300">
                  {/* Recovery Flow Selector - behaves like a single-choice mode selector */}
                  <CheckboxField
                    label="Classic flow"
                    name="content.recoveryFlowClassic"
                    checked={!content.enableEmailRecovery && !content.requireEmailBeforeCheckout}
                    helpText="Show discount and send customers directly to checkout."
                    onChange={(checked) => {
                      if (checked) {
                        onChange({
                          ...content,
                          enableEmailRecovery: false,
                          requireEmailBeforeCheckout: false,
                        });
                      } else {
                        // If classic is turned off and nothing else is selected yet, default to email-first
                        if (!content.enableEmailRecovery && !content.requireEmailBeforeCheckout) {
                          onChange({
                            ...content,
                            enableEmailRecovery: true,
                            requireEmailBeforeCheckout: true,
                          });
                        }
                      }
                    }}
                  />

                  <CheckboxField
                    label="Email first flow"
                    name="content.recoveryFlowEmailFirst"
                    checked={!!content.enableEmailRecovery && !!content.requireEmailBeforeCheckout}
                    helpText="Ask for an email, then unlock the discount and show the checkout button."
                    onChange={(checked) => {
                      if (checked) {
                        onChange({
                          ...content,
                          enableEmailRecovery: true,
                          requireEmailBeforeCheckout: true,
                        });
                      } else {
                        // If email-first is turned off, fall back to classic
                        onChange({
                          ...content,
                          enableEmailRecovery: false,
                          requireEmailBeforeCheckout: false,
                        });
                      }
                    }}
                  />

                  {content.enableEmailRecovery && (
                    <>
                      <TextField
                        label="Email field placeholder"
                        name="content.emailPlaceholder"
                        value={content.emailPlaceholder || ""}
                        placeholder="Enter your email to receive your cart and discount"
                        helpText="Shown inside the email input field."
                        onChange={(value) => updateField("emailPlaceholder", value)}
                      />

                      <TextField
                        label="Email success message"
                        name="content.emailSuccessMessage"
                        value={content.emailSuccessMessage || ""}
                        placeholder="We'll take you to checkout and email you your cart."
                        helpText="Shown after a successful email submission."
                        onChange={(value) => updateField("emailSuccessMessage", value)}
                      />

                      <TextField
                        label="Email error message"
                        name="content.emailErrorMessage"
                        value={content.emailErrorMessage || ""}
                        placeholder="Something went wrong. Please try again."
                        helpText="Optional custom error message on failed email submission."
                        onChange={(value) => updateField("emailErrorMessage", value)}
                      />

                      <TextField
                        label="Email button text"
                        name="content.emailButtonText"
                        value={content.emailButtonText || ""}
                        placeholder="Email me my cart"
                        helpText="Text on the email submit button."
                        onChange={(value) => updateField("emailButtonText", value)}
                      />

                      <CheckboxField
                        label="Require email before checkout"
                        name="content.requireEmailBeforeCheckout"
                        checked={content.requireEmailBeforeCheckout || false}
                        helpText="Hide the main checkout button and only allow continuing after entering an email."
                        onChange={(checked) => updateField("requireEmailBeforeCheckout", checked)}
                      />
                    </>
                  )}
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Discount Configuration */}
      {onDiscountChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                💰 Discount
              </Text>
              <Text as="p" tone="subdued">
                Configure the discount shown in your cart recovery popup.
              </Text>
            </BlockStack>

            <Divider />

            <DiscountSection
              goal="CART_RECOVERY"
              discountConfig={discountConfig}
              onConfigChange={onDiscountChange}
            />
          </BlockStack>
        </Card>
      )}
    </>
  );
}
