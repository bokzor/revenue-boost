/**
 * Spin-to-Win Content Configuration Section
 *
 * Form section for configuring spin-to-win gamification content
 */

import { useState } from "react";
import { TextField, CheckboxField, FormGrid } from "../form";
import type { SpinToWinContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;
type WheelSegment = SpinToWinContent["wheelSegments"][0];

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
  const [segments, setSegments] = useState<WheelSegment[]>(
    content.wheelSegments || []
  );

  const updateField = useFieldUpdater(content, onChange);

  const addSegment = () => {
    const newSegment: WheelSegment = {
      id: `segment-${Date.now()}`,
      label: "",
      probability: 0.1,
      color: "#3b82f6",
      discountType: "percentage",
      discountValue: 10,
      discountCode: "",
    };
    const updated = [...segments, newSegment];
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const updated = segments.map((seg, idx) =>
      idx === index ? { ...seg, ...updates } : seg
    );
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  const removeSegment = (index: number) => {
    const updated = segments.filter((_, idx) => idx !== index);
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  return (
    <>
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

      <FormGrid columns={2}>
        <TextField
          label="Success Message"
          name="content.successMessage"
          value={content.successMessage || ""}
          error={errors?.successMessage}
          required
          placeholder="Congratulations! You won {prize}!"
          onChange={(value) => updateField("successMessage", value)}
        />

        <TextField
          label="Max Attempts Per User"
          name="content.maxAttemptsPerUser"
          value={content.maxAttemptsPerUser?.toString() || "1"}
          error={errors?.maxAttemptsPerUser}
          placeholder="1"
          helpText="Number of spins allowed per user"
          onChange={(value) => updateField("maxAttemptsPerUser", parseInt(value) || 1)}
        />
      </FormGrid>

      <CheckboxField
        label="Require Email"
        name="content.emailRequired"
        checked={content.emailRequired !== false}
        helpText="Require email before allowing spin"
        onChange={(checked) => updateField("emailRequired", checked)}
      />

      {/* Wheel Segments */}
      <div className="wheel-segments">
        <h3>Wheel Segments</h3>
        <p>Configure the prizes and probabilities for the wheel (minimum 2 segments required)</p>
        
        {segments.map((segment, index) => (
          <s-section key={segment.id}>
            <h4>Segment {index + 1}</h4>
            <FormGrid columns={2}>
              <TextField
                label="Label"
                name={`segment.${index}.label`}
                value={segment.label}
                required
                placeholder="10% OFF"
                onChange={(value) => updateSegment(index, { label: value })}
              />

              <TextField
                label="Probability"
                name={`segment.${index}.probability`}
                value={segment.probability.toString()}
                required
                placeholder="0.25"
                helpText="Value between 0 and 1 (e.g., 0.25 = 25%)"
                onChange={(value) => updateSegment(index, { probability: parseFloat(value) || 0 })}
              />
            </FormGrid>
            
            {/* Additional segment fields will be added */}
            
            <s-button onClick={() => removeSegment(index)} tone="critical">
              Remove Segment
            </s-button>
          </s-section>
        ))}
        
        <s-button onClick={addSegment}>Add Segment</s-button>
      </div>
    </>
  );
}

