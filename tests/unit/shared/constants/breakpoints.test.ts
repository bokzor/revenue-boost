/**
 * Unit Tests for Breakpoints System
 */

import { describe, it, expect } from "vitest";

import {
  BREAKPOINTS,
  CONTAINER_BREAKPOINTS,
  mediaQuery,
  containerQuery,
  mq,
  cq,
} from "~/shared/constants/breakpoints";

describe("BREAKPOINTS", () => {
  it("should have expected breakpoint values", () => {
    expect(BREAKPOINTS.xs).toBe(380);
    expect(BREAKPOINTS.sm).toBe(480);
    expect(BREAKPOINTS.md).toBe(640);
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
    expect(BREAKPOINTS.wide).toBe(1280);
  });
});

describe("CONTAINER_BREAKPOINTS", () => {
  it("should have expected container breakpoint values", () => {
    expect(CONTAINER_BREAKPOINTS.compact).toBe(400);
    expect(CONTAINER_BREAKPOINTS.small).toBe(520);
    expect(CONTAINER_BREAKPOINTS.medium).toBe(640);
    expect(CONTAINER_BREAKPOINTS.large).toBe(700);
    expect(CONTAINER_BREAKPOINTS.xl).toBe(800);
  });
});

describe("mediaQuery", () => {
  it("should generate max-width query by default", () => {
    expect(mediaQuery("sm")).toBe("(max-width: 480px)");
    expect(mediaQuery("tablet")).toBe("(max-width: 768px)");
  });

  it("should generate min-width query when specified", () => {
    expect(mediaQuery("tablet", "min")).toBe("(min-width: 769px)");
    expect(mediaQuery("desktop", "min")).toBe("(min-width: 1025px)");
  });

  it("should accept custom pixel values", () => {
    expect(mediaQuery(500)).toBe("(max-width: 500px)");
    expect(mediaQuery(800, "min")).toBe("(min-width: 801px)");
  });
});

describe("containerQuery", () => {
  it("should generate max-width container query by default", () => {
    expect(containerQuery("compact")).toBe("(max-width: 400px)");
    expect(containerQuery("medium")).toBe("(max-width: 640px)");
  });

  it("should generate min-width container query when specified", () => {
    expect(containerQuery("medium", "min")).toBe("(min-width: 641px)");
    expect(containerQuery("large", "min")).toBe("(min-width: 701px)");
  });

  it("should accept custom pixel values", () => {
    expect(containerQuery(600)).toBe("(max-width: 600px)");
    expect(containerQuery(700, "min")).toBe("(min-width: 701px)");
  });
});

describe("mq (pre-built media queries)", () => {
  it("should have expected media query strings", () => {
    expect(mq.xs).toBe("(max-width: 380px)");
    expect(mq.sm).toBe("(max-width: 480px)");
    expect(mq.mobile).toBe("(max-width: 480px)");
    expect(mq.tablet).toBe("(max-width: 768px)");
    expect(mq.desktop).toBe("(max-width: 1024px)");
    expect(mq.wide).toBe("(min-width: 1025px)");
  });
});

describe("cq (pre-built container queries)", () => {
  it("should have expected container query strings", () => {
    expect(cq.compact).toBe("(max-width: 400px)");
    expect(cq.small).toBe("(max-width: 520px)");
    expect(cq.medium).toBe("(max-width: 640px)");
    expect(cq.mediumUp).toBe("(min-width: 641px)");
    expect(cq.large).toBe("(max-width: 700px)");
    expect(cq.largeUp).toBe("(min-width: 701px)");
    expect(cq.xlUp).toBe("(min-width: 801px)");
  });
});

