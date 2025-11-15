/**
 * Scratch Card Content Configuration Section
 *
 * Self-contained, well-structured admin form for Scratch Card campaigns
 * (mirrors the structure quality of NewsletterContentSection)
 */

import React, { useState, useEffect } from "react";
import { TextField, CheckboxField, FormGrid } from "../form";
import type { ScratchCardContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type ScratchCardContent = z.infer<typeof ScratchCardContentSchema>;

type Prize = ScratchCardContent["prizes"][number];

export interface ScratchCardContentSectionProps {
  content: Partial<ScratchCardContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<ScratchCardContent>) => void;
}

export function ScratchCardContentSection({ content, errors, onChange }: ScratchCardContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  // Initialize default prizes if empty
  const initialPrizes = content.prizes && content.prizes.length > 0
    ? content.prizes
    : [
        { id: "prize-5-off", label: "5% OFF", probability: 0.4, discountCode: "SCRATCH5", discountPercentage: 5 },
        { id: "prize-10-off", label: "10% OFF", probability: 0.3, discountCode: "SCRATCH10", discountPercentage: 10 },
        { id: "prize-15-off", label: "15% OFF", probability: 0.2, discountCode: "SCRATCH15", discountPercentage: 15 },
        { id: "prize-20-off", label: "20% OFF", probability: 0.1, discountCode: "SCRATCH20", discountPercentage: 20 },
      ];
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);

  useEffect(() => {
    if (!content.prizes || content.prizes.length === 0) {
      updateField("prizes", initialPrizes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPrize = () => {
    const p: Prize = { id: `prize-${Date.now()}`, label: "", probability: 0.1, discountCode: "", discountPercentage: 5 };
    const updated = [...prizes, p];
    setPrizes(updated);
    updateField("prizes", updated);
  };
  const updatePrize = (index: number, updates: Partial<Prize>) => {
    const updated = prizes.map((p, i) => (i === index ? { ...p, ...updates } : p));
    setPrizes(updated);
    updateField("prizes", updated);
  };
  const removePrize = (index: number) => {
    const updated = prizes.filter((_, i) => i !== index);
    setPrizes(updated);
    updateField("prizes", updated);
  };

  return (
    <>
      {/* CONTENT BASICS */}
      <s-section>
        <h3>📝 Content</h3>
        <p>Text and messaging for your scratch card popup</p>

        <TextField label="Headline" name="content.headline" value={content.headline || ""} error={errors?.headline} required placeholder="Scratch to reveal your prize!" onChange={(v) => updateField("headline", v)} />
        <TextField label="Subheadline" name="content.subheadline" value={content.subheadline || ""} placeholder="Play and save on your order" onChange={(v) => updateField("subheadline", v)} />

        <FormGrid columns={2}>
          <TextField label="Button Text" name="content.buttonText" value={content.buttonText || "Reveal"} required placeholder="Reveal" onChange={(v) => updateField("buttonText", v)} />
          <TextField label="Email Label" name="content.emailLabel" value={content.emailLabel || ""} placeholder="Email" onChange={(v) => updateField("emailLabel", v)} />
        </FormGrid>

        <TextField
          label="Dismiss Button Text"
          name="content.dismissLabel"
          value={content.dismissLabel || ""}
          error={errors?.dismissLabel}
          placeholder="No thanks"
          helpText="Secondary button text that closes the popup"
          onChange={(v) => updateField("dismissLabel", v)}
        />

        <FormGrid columns={2}>
          <TextField label="Email Placeholder" name="content.emailPlaceholder" value={content.emailPlaceholder || "Enter your email"} placeholder="Enter your email" onChange={(v) => updateField("emailPlaceholder", v)} />
          <CheckboxField label="Require Email" name="content.emailRequired" checked={content.emailRequired !== false} helpText="Ask for email before proceeding" onChange={(c) => updateField("emailRequired", c)} />
        </FormGrid>

        <CheckboxField label="Ask Email Before Scratching" name="content.emailBeforeScratching" checked={content.emailBeforeScratching || false} helpText="Collect email before starting the scratch interaction" onChange={(c) => updateField("emailBeforeScratching", c)} />

        <FormGrid columns={2}>
          <TextField label="Success Message" name="content.successMessage" value={content.successMessage || ""} error={errors?.successMessage} required placeholder="Congrats! You won {{prize}} (code: {{code}})" helpText="Use {{prize}} and {{code}} placeholders" onChange={(v) => updateField("successMessage", v)} />
          <TextField label="Failure Message" name="content.failureMessage" value={content.failureMessage || ""} placeholder="Thanks for playing!" onChange={(v) => updateField("failureMessage", v)} />
        </FormGrid>
      </s-section>

      {/* SCRATCH SETTINGS */}
      <s-section>
        <h3>🧩 Scratch Settings</h3>
        <p>Control the scratch experience</p>

        <TextField label="Scratch Instruction" name="content.scratchInstruction" value={content.scratchInstruction || "Scratch to reveal your prize!"} onChange={(v) => updateField("scratchInstruction", v)} />

        <FormGrid columns={2}>
          <TextField label="Scratch Threshold (%)" name="content.scratchThreshold" value={(content.scratchThreshold ?? 50).toString()} placeholder="50" helpText="How much must be scratched to reveal (0-100)" onChange={(v) => updateField("scratchThreshold", Math.max(0, Math.min(100, parseInt(v) || 0)))} />
          <TextField label="Brush Radius (px)" name="content.scratchRadius" value={(content.scratchRadius ?? 20).toString()} placeholder="20" helpText="Scratch brush radius in pixels" onChange={(v) => updateField("scratchRadius", Math.max(5, Math.min(100, parseInt(v) || 20)))} />
        </FormGrid>
      </s-section>

      {/* PRIZES */}
      <s-section>
        <h3>🎁 Prizes & Probabilities</h3>
        <p>Configure prize labels, chances, and discount details</p>

        {prizes.map((p, i) => (
          <s-section key={p.id}>
            <h4>Prize {i + 1}</h4>
            <FormGrid columns={2}>
              <TextField label="Label" name={`prizes.${i}.label`} value={p.label} required placeholder="10% OFF" onChange={(v) => updatePrize(i, { label: v })} />
              <TextField label="Probability (0-1)" name={`prizes.${i}.probability`} value={p.probability.toString()} required placeholder="0.25" onChange={(v) => updatePrize(i, { probability: parseFloat(v) || 0 })} />
            </FormGrid>
            <FormGrid columns={2}>
              <TextField label="Discount %" name={`prizes.${i}.discountPercentage`} value={(p.discountPercentage ?? 0).toString()} placeholder="10" onChange={(v) => updatePrize(i, { discountPercentage: parseInt(v) || 0 })} />
              <TextField label="Discount Code" name={`prizes.${i}.discountCode`} value={p.discountCode || ""} placeholder="SCRATCH10" onChange={(v) => updatePrize(i, { discountCode: v })} />
            </FormGrid>
            <s-button tone="critical" onClick={() => removePrize(i)}>Remove Prize</s-button>
          </s-section>
        ))}

        <s-button onClick={addPrize}>Add Prize</s-button>
      </s-section>
    </>
  );
}

