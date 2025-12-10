/**
 * Unit Tests for Quick Config Transformer
 */

import { describe, it, expect } from "vitest";

import {
  extractIds,
  valuesAreEqual,
} from "~/domains/campaigns/utils/quick-config-transformer";

describe("extractIds", () => {
  it("should return empty array for null/undefined", () => {
    expect(extractIds(null)).toEqual([]);
    expect(extractIds(undefined)).toEqual([]);
  });

  it("should return empty array for empty array", () => {
    expect(extractIds([])).toEqual([]);
  });

  it("should extract IDs from string array", () => {
    const ids = ["id-1", "id-2", "id-3"];
    expect(extractIds(ids)).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("should filter out empty strings from string array", () => {
    const ids = ["id-1", "", "id-3"];
    expect(extractIds(ids)).toEqual(["id-1", "id-3"]);
  });

  it("should extract IDs from object array with id property", () => {
    const items = [{ id: "id-1" }, { id: "id-2" }];
    expect(extractIds(items)).toEqual(["id-1", "id-2"]);
  });

  it("should filter out items without id from object array", () => {
    const items = [{ id: "id-1" }, { name: "no-id" }, { id: "id-3" }];
    expect(extractIds(items)).toEqual(["id-1", "id-3"]);
  });

  it("should extract IDs from object with ids property", () => {
    const obj = { ids: ["id-1", "id-2"] };
    expect(extractIds(obj)).toEqual(["id-1", "id-2"]);
  });

  it("should return empty array for object without ids property", () => {
    const obj = { other: "value" };
    expect(extractIds(obj)).toEqual([]);
  });
});

describe("valuesAreEqual", () => {
  it("should return true for equal primitives", () => {
    expect(valuesAreEqual("a", "a")).toBe(true);
    expect(valuesAreEqual(1, 1)).toBe(true);
    expect(valuesAreEqual(true, true)).toBe(true);
  });

  it("should return false for different primitives", () => {
    expect(valuesAreEqual("a", "b")).toBe(false);
    expect(valuesAreEqual(1, 2)).toBe(false);
    expect(valuesAreEqual(true, false)).toBe(false);
  });

  it("should return true for equal arrays", () => {
    expect(valuesAreEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(valuesAreEqual(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("should return false for different arrays", () => {
    expect(valuesAreEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(valuesAreEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("should return true for equal objects", () => {
    expect(valuesAreEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(valuesAreEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("should return false for different objects", () => {
    expect(valuesAreEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(valuesAreEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("should handle null and undefined", () => {
    expect(valuesAreEqual(null, null)).toBe(true);
    expect(valuesAreEqual(undefined, undefined)).toBe(true);
    expect(valuesAreEqual(null, undefined)).toBe(false);
  });
});

