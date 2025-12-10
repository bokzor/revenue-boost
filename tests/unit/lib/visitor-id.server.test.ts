/**
 * Unit Tests for Visitor ID Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock React Router's createCookie
vi.mock("react-router", () => ({
  createCookie: vi.fn(() => ({
    parse: vi.fn(),
    serialize: vi.fn(),
  })),
}));

import {
  generateVisitorId,
  getOrCreateVisitorId,
  getVisitorId,
  resolveVisitorId,
  visitorIdCookie,
} from "~/lib/visitor-id.server";

describe("generateVisitorId", () => {
  it("should generate a visitor ID with correct format", () => {
    const id = generateVisitorId();

    expect(id).toMatch(/^visitor_\d+_[a-f0-9]+$/);
  });

  it("should generate unique IDs", () => {
    const id1 = generateVisitorId();
    const id2 = generateVisitorId();

    expect(id1).not.toBe(id2);
  });
});

describe("getOrCreateVisitorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return existing visitor ID from cookie", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue("visitor_123_abc");

    const request = new Request("https://example.com", {
      headers: { Cookie: "rb_visitor_id=visitor_123_abc" },
    });

    const result = await getOrCreateVisitorId(request);
    expect(result).toBe("visitor_123_abc");
  });

  it("should generate new ID when no cookie exists", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue(null);

    const request = new Request("https://example.com");

    const result = await getOrCreateVisitorId(request);
    expect(result).toMatch(/^visitor_\d+_[a-f0-9]+$/);
  });

  it("should generate new ID when cookie is not a string", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue({ invalid: "object" });

    const request = new Request("https://example.com");

    const result = await getOrCreateVisitorId(request);
    expect(result).toMatch(/^visitor_\d+_[a-f0-9]+$/);
  });
});

describe("getVisitorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return visitor ID from cookie", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue("visitor_123_abc");

    const request = new Request("https://example.com");

    const result = await getVisitorId(request);
    expect(result).toBe("visitor_123_abc");
  });

  it("should return null when no cookie exists", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue(null);

    const request = new Request("https://example.com");

    const result = await getVisitorId(request);
    expect(result).toBeNull();
  });
});

describe("resolveVisitorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prefer context visitor ID", async () => {
    const request = new Request("https://example.com");

    const result = await resolveVisitorId(request, "context_visitor_id");
    expect(result).toBe("context_visitor_id");
  });

  it("should fall back to cookie visitor ID", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue("cookie_visitor_id");

    const request = new Request("https://example.com");

    const result = await resolveVisitorId(request);
    expect(result).toBe("cookie_visitor_id");
  });

  it("should generate new ID when neither exists", async () => {
    vi.mocked(visitorIdCookie.parse).mockResolvedValue(null);

    const request = new Request("https://example.com");

    const result = await resolveVisitorId(request);
    expect(result).toMatch(/^visitor_\d+_[a-f0-9]+$/);
  });
});

