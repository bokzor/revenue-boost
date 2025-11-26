/**
 * Spin-to-Win Content Configuration Section
 *
 * Form section for configuring spin-to-win gamification content
 */

import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid } from "../form";
import { WheelSegmentEditor } from "./WheelSegmentEditor";
import { FieldConfigurationSection } from "./FieldConfigurationSection";
import type { SpinToWinContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;

export interface SpinToWinContentSectionProps {
  content: Partial<SpinToWinContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<SpinToWinContent>) => void;
}

export function SpinToWinContentSection({
  content,
  errors,
  onChange,
}: SpinToWinContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
      <Card data-test-id="spin-to-win-admin-form">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎡 Content & capture
            </Text>
            <Text as="p" tone="subdued">
              Configure the copy and email capture behaviour for your wheel.
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
              placeholder="Spin to Win a Discount!"
              onChange={(value) => updateField("headline", value)}
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              placeholder="Try your luck and save on your order"
              onChange={(value) => updateField("subheadline", value)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Spin Button Text"
                name="content.spinButtonText"
                value={content.spinButtonText || "Spin to Win!"}
                error={errors?.spinButtonText}
                placeholder="Spin to Win!"
                onChange={(value) => updateField("spinButtonText", value)}
              />

              <TextField
                label="Email Placeholder"
                name="content.emailPlaceholder"
                value={content.emailPlaceholder || "Enter your email to spin"}
                placeholder="Enter your email to spin"
                onChange={(value) => updateField("emailPlaceholder", value)}
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

            <FormGrid columns={1}>
              <TextField
                label="Failure Message"
                name="content.failureMessage"
                value={content.failureMessage || ""}
                placeholder="Thanks for playing!"
                helpText="Message when no prize is won (optional)"
                onChange={(value) => updateField("failureMessage", value)}
              />
            </FormGrid>

            <FormGrid columns={1}>
              <TextField
                label="Loading Text"
                name="content.loadingText"
                value={content.loadingText || ""}
                placeholder="Spinning..."
                helpText="Text shown while spinning (optional)"
                onChange={(value) => updateField("loadingText", value)}
              />
            </FormGrid>

            {/* Field Configuration Section - Email, Name, GDPR */}
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                Field Configuration
              </Text>
              <FieldConfigurationSection
                emailRequired={content.emailRequired}
                emailLabel={content.emailLabel}
                emailPlaceholder={content.emailPlaceholder}
                collectName={content.collectName}
                nameFieldRequired={content.nameFieldRequired}
                nameFieldPlaceholder={content.nameFieldPlaceholder}
                showGdprCheckbox={content.showGdprCheckbox}
                consentFieldRequired={content.consentFieldRequired}
                gdprLabel={content.gdprLabel}
                onChange={(updates) => onChange({ ...content, ...updates })}
                errors={errors}
              />
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎯 Wheel configuration
            </Text>
            <Text as="p" tone="subdued">
              Control wheel visuals, spin behaviour, and configure prize segments.
            </Text>
          </BlockStack>

          <Divider />

          <div
            style={{ backgroundColor: "rgba(0, 0, 0, 0.02)", padding: "16px", borderRadius: "8px" }}
          >
            <BlockStack gap="400">
              <FormGrid columns={3}>
                <TextField
                  label="Wheel Size (px)"
                  name="content.wheelSize"
                  value={content.wheelSize?.toString() || "400"}
                  placeholder="400"
                  helpText="Diameter of the wheel in pixels"
                  onChange={(value) => updateField("wheelSize", parseInt(value) || 400)}
                />

                <TextField
                  label="Wheel Border Width (px)"
                  name="content.wheelBorderWidth"
                  value={content.wheelBorderWidth?.toString() || "2"}
                  placeholder="2"
                  helpText="Border thickness around wheel"
                  onChange={(value) => updateField("wheelBorderWidth", parseInt(value) || 2)}
                />

                <TextField
                  label="Wheel Border Color"
                  name="content.wheelBorderColor"
                  value={content.wheelBorderColor || ""}
                  placeholder="#FFFFFF"
                  helpText="Hex color code for border"
                  onChange={(value) => updateField("wheelBorderColor", value)}
                />
              </FormGrid>

              <FormGrid columns={2}>
                <TextField
                  label="Spin Duration (ms)"
                  name="content.spinDuration"
                  value={content.spinDuration?.toString() || "4000"}
                  placeholder="4000"
                  helpText="How long the spin animation lasts (milliseconds)"
                  onChange={(value) => updateField("spinDuration", parseInt(value) || 4000)}
                />

                <TextField
                  label="Minimum Spins"
                  name="content.minSpins"
                  value={content.minSpins?.toString() || "5"}
                  placeholder="5"
                  helpText="Minimum number of full rotations"
                  onChange={(value) => updateField("minSpins", parseInt(value) || 5)}
                />
              </FormGrid>
            </BlockStack>
          </div>

          <Divider />

          {/* Wheel Segments Editor - Now inside the Wheel Configuration card */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">
              Wheel Segments
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              Configure the prize segments on your wheel. Each segment can have its own discount
              configuration.
            </Text>
            <WheelSegmentEditor
              segments={content.wheelSegments || []}
              onChange={(updatedSegments) => updateField("wheelSegments", updatedSegments)}
              errors={errors}
            />
          </BlockStack>
        </BlockStack>
      </Card>
    </>
  );
}
