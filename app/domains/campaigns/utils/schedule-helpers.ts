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
        description: "Campaign is not live. Use this while you're still configuring and testing.",
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

/**
 * Format date for HTML datetime-local input
 *
 * @param date - ISO date string
 * @param timezone - IANA timezone (e.g., "America/New_York"), defaults to local
 * @returns Formatted date string for input (YYYY-MM-DDTHH:mm)
 */
export function formatDateForInput(date?: string, timezone?: string): string {
  if (!date) return "";
  try {
    const d = new Date(date);

    // If timezone provided, format in that timezone
    if (timezone) {
      // Get formatted date parts in the specified timezone
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(d);

      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      const hour = parts.find((p) => p.type === "hour")?.value;
      const minute = parts.find((p) => p.type === "minute")?.value;

      if (year && month && day && hour && minute) {
        return `${year}-${month}-${day}T${hour}:${minute}`;
      }
    }

    // Fallback to UTC
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/**
 * Format date range for display
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @param timezone - IANA timezone (e.g., "America/New_York"), defaults to local
 * @returns Formatted date range string or null
 */
export function formatDateRange(
  startDate?: string,
  endDate?: string,
  timezone?: string
): string | null {
  if (!startDate || !endDate) return null;

  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(timezone && { timeZone: timezone }),
    };

    const start = new Date(startDate).toLocaleString("en-US", options);
    const end = new Date(endDate).toLocaleString("en-US", options);

    const timezoneLabel = timezone ? ` (${timezone})` : "";
    return `Campaign will run from ${start} to ${end}${timezoneLabel}`;
  } catch {
    return null;
  }
}

// ============================================================================
// SCHEDULE VALIDATION HELPERS
// ============================================================================

export interface ScheduleDateValidationErrors {
  startDateError?: string;
  endDateError?: string;
}

/**
 * Validate schedule dates for campaign form
 *
 * @param startDate - Start date string (ISO or datetime-local format)
 * @param endDate - End date string (ISO or datetime-local format)
 * @returns Object with validation errors (empty if valid)
 *
 * Validates:
 * - Start date cannot be in the past
 * - End date cannot be in the past
 * - End date must be after start date
 */
export function validateScheduleDates(
  startDate?: string,
  endDate?: string
): ScheduleDateValidationErrors {
  const errors: ScheduleDateValidationErrors = {};
  const now = new Date();

  if (startDate) {
    const start = new Date(startDate);
    if (start < now) {
      errors.startDateError = "Start date cannot be in the past";
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end < now) {
      errors.endDateError = "End date cannot be in the past";
    }
  }

  // Check end > start only if both are provided and neither has a "past" error
  if (startDate && endDate && !errors.startDateError && !errors.endDateError) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.endDateError = "End date must be after start date";
    }
  }

  return errors;
}

/**
 * Check if current time is within campaign schedule (timezone-aware)
 *
 * @param startDate - Campaign start date (Date object or ISO string or undefined)
 * @param endDate - Campaign end date (Date object or ISO string or undefined)
 * @param timezone - IANA timezone (e.g., "America/New_York"), defaults to UTC
 * @returns true if current time is within schedule, false otherwise
 *
 * Logic:
 * - If no startDate and no endDate: always active (returns true)
 * - If only startDate: active if current time >= startDate
 * - If only endDate: active if current time <= endDate
 * - If both: active if startDate <= current time <= endDate
 */
export function isWithinSchedule(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  timezone: string = "UTC"
): boolean {
  // No schedule constraints = always active
  if (!startDate && !endDate) {
    return true;
  }

  try {
    // Get current time in the shop's timezone
    const now = new Date();
    const nowInTimezone = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );

    // Check start date constraint
    if (startDate) {
      const start = typeof startDate === "string" ? new Date(startDate) : startDate;
      const startInTimezone = new Date(
        start.toLocaleString("en-US", { timeZone: timezone })
      );

      if (nowInTimezone < startInTimezone) {
        return false; // Campaign hasn't started yet
      }
    }

    // Check end date constraint
    if (endDate) {
      const end = typeof endDate === "string" ? new Date(endDate) : endDate;
      const endInTimezone = new Date(
        end.toLocaleString("en-US", { timeZone: timezone })
      );

      if (nowInTimezone > endInTimezone) {
        return false; // Campaign has ended
      }
    }

    return true; // Within schedule
  } catch (error) {
    console.error("[Schedule Helper] Error checking schedule:", error);
    // On error, default to allowing the campaign (fail open)
    return true;
  }
}
