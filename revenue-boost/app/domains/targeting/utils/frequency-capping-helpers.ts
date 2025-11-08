/**
 * Frequency Capping Helpers
 * 
 * Constants and utilities for frequency capping configuration
 */

export const TIME_WINDOW_OPTIONS = [
  { label: "Per session", value: "0" },
  { label: "Per hour", value: "1" },
  { label: "Per day", value: "24" },
  { label: "Per week", value: "168" },
  { label: "Per month", value: "720" },
];

export const COOLDOWN_OPTIONS = [
  { label: "No cooldown", value: "0" },
  { label: "15 minutes", value: "0.25" },
  { label: "30 minutes", value: "0.5" },
  { label: "1 hour", value: "1" },
  { label: "2 hours", value: "2" },
  { label: "3 hours", value: "3" },
  { label: "6 hours", value: "6" },
  { label: "12 hours", value: "12" },
  { label: "24 hours", value: "24" },
];

