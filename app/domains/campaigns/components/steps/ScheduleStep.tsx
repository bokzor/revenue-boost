/**
 * ScheduleStep - Campaign scheduling and settings
 */
import { Card, BlockStack, Select, TextField } from "@shopify/polaris";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

interface ScheduleStepProps {
  data: Partial<CampaignFormData>;
  onChange: (updates: Partial<CampaignFormData>) => void;
}

export function ScheduleStep({ data, onChange }: ScheduleStepProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Select
          label="Status"
          value={data.status || "DRAFT"}
          onChange={(value) => onChange({ status: value as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED" })}
          options={[
            { label: "Draft", value: "DRAFT" },
            { label: "Active", value: "ACTIVE" },
            { label: "Paused", value: "PAUSED" },
          ]}
        />

        <TextField
          label="Priority"
          type="number"
          value={String(data.priority || 0)}
          onChange={(value) => onChange({ priority: parseInt(value) || 0 })}
          autoComplete="off"
        />

        <TextField
          label="Start Date"
          type="datetime-local"
          value={data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : ""}
          onChange={(value) => onChange({ startDate: value || undefined })}
          autoComplete="off"
        />

        <TextField
          label="End Date"
          type="datetime-local"
          value={data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : ""}
          onChange={(value) => onChange({ endDate: value || undefined })}
          autoComplete="off"
        />

        <TextField
          label="Tags (comma-separated)"
          value={data.tags?.join(", ") || ""}
          onChange={(value) => onChange({ tags: value.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="summer, sale, newsletter"
          autoComplete="off"
        />
      </BlockStack>
    </Card>
  );
}

