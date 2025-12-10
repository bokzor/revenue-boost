/**
 * Logger Module with Environment Variable Level Control
 *
 * Provides structured logging with pino. Log level is controlled via
 * the LOG_LEVEL environment variable.
 *
 * Usage:
 *   import { logger } from '~/lib/logger.server';
 *   logger.info({ shopDomain }, 'Processing request');
 *   logger.error({ error }, 'Failed to fetch data');
 *
 * Log Levels (from most to least verbose):
 *   trace < debug < info < warn < error < fatal < silent
 *
 * Runtime level change (Google Cloud Run):
 *   gcloud run services update SERVICE_NAME --update-env-vars LOG_LEVEL=debug
 *   (Instances will restart with new level - no code deploy needed)
 */

import * as pino from "pino";
import type { Logger } from "pino";

// Valid log levels
export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Check if a string is a valid log level
 */
export function isValidLogLevel(level: string): level is LogLevel {
  return LOG_LEVELS.includes(level as LogLevel);
}

/**
 * Get log level from environment variable
 * Falls back to 'info' in production, 'debug' in development
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();

  if (envLevel && isValidLogLevel(envLevel)) {
    return envLevel;
  }

  // Default based on environment
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

// Create the base pino logger
// In production, outputs JSON for Cloud Logging
// In development, outputs pretty-printed logs
const pinoConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  // Use ISO timestamps for Cloud Logging compatibility
  timestamp: pino.stdTimeFunctions.isoTime,
  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
  },
  // Format for Google Cloud Logging severity levels
  formatters: {
    level: (label) => {
      // Map pino levels to Google Cloud Logging severity
      const severityMap: Record<string, string> = {
        trace: "DEBUG",
        debug: "DEBUG",
        info: "INFO",
        warn: "WARNING",
        error: "ERROR",
        fatal: "CRITICAL",
      };
      return {
        severity: severityMap[label] || "DEFAULT",
        level: label,
      };
    },
  },
};

// Create logger instance
const logger: Logger = pino.default(pinoConfig);

/**
 * Create a child logger with additional context
 * Useful for adding shop domain, request ID, etc.
 */
export function createLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

export { logger };
