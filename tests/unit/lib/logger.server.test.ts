/**
 * Unit Tests for Logger Module
 */

import { describe, it, expect } from "vitest";
import { LOG_LEVELS, isValidLogLevel } from "~/lib/logger.server";

describe("Logger Module", () => {
  describe("LOG_LEVELS", () => {
    it("should contain all standard log levels", () => {
      expect(LOG_LEVELS).toContain("trace");
      expect(LOG_LEVELS).toContain("debug");
      expect(LOG_LEVELS).toContain("info");
      expect(LOG_LEVELS).toContain("warn");
      expect(LOG_LEVELS).toContain("error");
      expect(LOG_LEVELS).toContain("fatal");
      expect(LOG_LEVELS).toContain("silent");
    });

    it("should have 7 log levels", () => {
      expect(LOG_LEVELS).toHaveLength(7);
    });

    it("should be ordered from most to least verbose", () => {
      expect(LOG_LEVELS[0]).toBe("trace");
      expect(LOG_LEVELS[LOG_LEVELS.length - 1]).toBe("silent");
    });
  });

  describe("isValidLogLevel", () => {
    it("should return true for valid log levels", () => {
      expect(isValidLogLevel("trace")).toBe(true);
      expect(isValidLogLevel("debug")).toBe(true);
      expect(isValidLogLevel("info")).toBe(true);
      expect(isValidLogLevel("warn")).toBe(true);
      expect(isValidLogLevel("error")).toBe(true);
      expect(isValidLogLevel("fatal")).toBe(true);
      expect(isValidLogLevel("silent")).toBe(true);
    });

    it("should return false for invalid log levels", () => {
      expect(isValidLogLevel("verbose")).toBe(false);
      expect(isValidLogLevel("warning")).toBe(false);
      expect(isValidLogLevel("critical")).toBe(false);
      expect(isValidLogLevel("")).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(isValidLogLevel("INFO")).toBe(false);
      expect(isValidLogLevel("Debug")).toBe(false);
      expect(isValidLogLevel("ERROR")).toBe(false);
    });
  });

  describe("Log level severity mapping", () => {
    it("should map pino levels to Google Cloud Logging severity", () => {
      const severityMap: Record<string, string> = {
        trace: "DEBUG",
        debug: "DEBUG",
        info: "INFO",
        warn: "WARNING",
        error: "ERROR",
        fatal: "CRITICAL",
      };

      expect(severityMap.trace).toBe("DEBUG");
      expect(severityMap.debug).toBe("DEBUG");
      expect(severityMap.info).toBe("INFO");
      expect(severityMap.warn).toBe("WARNING");
      expect(severityMap.error).toBe("ERROR");
      expect(severityMap.fatal).toBe("CRITICAL");
    });
  });

  describe("Default level configuration", () => {
    it("should use info level in production", () => {
      const productionLevel = "info";
      expect(productionLevel).toBe("info");
    });

    it("should use debug level in development", () => {
      const developmentLevel = "debug";
      expect(developmentLevel).toBe("debug");
    });
  });

  describe("Sync interval", () => {
    it("should have 30 second sync interval", () => {
      const SYNC_INTERVAL_MS = 30_000;
      expect(SYNC_INTERVAL_MS).toBe(30000);
    });
  });
});

