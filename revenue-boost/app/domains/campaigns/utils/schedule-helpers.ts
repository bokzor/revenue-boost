/**
 * Schedule Helpers - Utility functions for campaign scheduling
 * 
 * SOLID Compliance:
 * - Single Responsibility: Each function has one clear purpose
 * - All functions are <50 lines
 * - Extracted from ScheduleSettingsStep for better reusability
 */

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

// ============================================================================
// STATUS HELPERS
// ============================================================================

export function getStatusOptions() {
  return [
    { label: "Draft (Not Live)", value: "DRAFT" },
    { label: "Active (Live)", value: "ACTIVE" },
    { label: "Paused (Temporarily Disabled)", value: "PAUSED" },
    { label: "Archived (Ended)", value: "ARCHIVED" },
  ];
}

export interface StatusDescription {
  title: string;
  description: string;
  tone: "info" | "success" | "warning" | "critical";
}

export function getStatusDescription(status: CampaignStatus): StatusDescription {
  switch (status) {
    case "DRAFT":
      return {
        title: "📝 Draft Mode",
        description:
          "Campaign is not live. Use this while you're still configuring and testing.",
        tone: "info",
      };
    case "ACTIVE":
      return {
        title: "✅ Active",
        description:
          "Campaign is live and will be shown to visitors based on your trigger and audience settings.",
        tone: "success",
      };
    case "PAUSED":
      return {
        title: "⏸️ Paused",
        description:
          "Campaign is temporarily disabled. You can resume it anytime without losing settings.",
        tone: "warning",
      };
    case "ARCHIVED":
      return {
        title: "📦 Archived",
        description:
          "Campaign has ended. It won't be shown to visitors but data is preserved for reporting.",
        tone: "info",
      };
  }
}

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

export function getPriorityDescription(priority: number): string {
  if (priority === 0) {
    return "Default priority - campaigns will be shown in order of creation";
  }
  if (priority <= 3) {
    return "Low priority - shown after higher priority campaigns";
  }
  if (priority <= 6) {
    return "Medium priority - balanced visibility";
  }
  if (priority <= 9) {
    return "High priority - shown before lower priority campaigns";
  }
  return "Maximum priority - always shown first when multiple campaigns match";
}

// ============================================================================
// DATE HELPERS
// ============================================================================

export function formatDateForInput(date?: string): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function formatDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate).toLocaleString();
    const end = new Date(endDate).toLocaleString();
    return `Campaign will run from ${start} to ${end}`;
  } catch {
    return null;
  }
}

