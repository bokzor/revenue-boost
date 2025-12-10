/**
 * Unit Tests for API Client Module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  ApiClient,
  ApiClientError,
  getErrorMessage,
  apiClient,
} from "~/lib/api-client";

describe("API Client Module", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe("ApiClientError", () => {
    it("should create error with message and status", () => {
      const error = new ApiClientError("Not found", 404);

      expect(error.message).toBe("Not found");
      expect(error.status).toBe(404);
      expect(error.name).toBe("ApiClientError");
    });

    it("should include response data", () => {
      const responseData = { error: "Invalid request" };
      const error = new ApiClientError("Bad request", 400, responseData);

      expect(error.response).toEqual(responseData);
    });
  });

  describe("ApiClient", () => {
    describe("get", () => {
      it("should make GET request", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ data: "test" }),
        });

        const client = new ApiClient("https://api.example.com");
        const result = await client.get("/test");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/test",
          expect.objectContaining({ method: "GET" })
        );
        expect(result.success).toBe(true);
      });

      it("should include query params", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        });

        const client = new ApiClient("https://api.example.com");
        await client.get("/test", { params: { page: 1, limit: 10 } });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/test?page=1&limit=10",
          expect.any(Object)
        );
      });
    });

    describe("post", () => {
      it("should make POST request with body", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true, data: { id: 1 } }),
        });

        const client = new ApiClient("https://api.example.com");
        const result = await client.post("/items", { name: "Test" });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/items",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ name: "Test" }),
          })
        );
        expect(result.success).toBe(true);
      });
    });

    describe("put", () => {
      it("should make PUT request", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        });

        const client = new ApiClient("https://api.example.com");
        await client.put("/items/1", { name: "Updated" });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/items/1",
          expect.objectContaining({ method: "PUT" })
        );
      });
    });

    describe("delete", () => {
      it("should make DELETE request", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        });

        const client = new ApiClient("https://api.example.com");
        await client.delete("/items/1");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/items/1",
          expect.objectContaining({ method: "DELETE" })
        );
      });
    });

    describe("error handling", () => {
      it("should throw ApiClientError on non-OK response", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ error: "Resource not found" }),
        });

        const client = new ApiClient("https://api.example.com");

        await expect(client.get("/missing")).rejects.toThrow(ApiClientError);
      });

      it("should wrap network errors", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const client = new ApiClient("https://api.example.com");

        await expect(client.get("/test")).rejects.toThrow(ApiClientError);
      });
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from ApiClientError", () => {
      const error = new ApiClientError("API error", 500);
      expect(getErrorMessage(error)).toBe("API error");
    });

    it("should extract message from regular Error", () => {
      const error = new Error("Regular error");
      expect(getErrorMessage(error)).toBe("Regular error");
    });

    it("should return default message for unknown errors", () => {
      expect(getErrorMessage("string error")).toBe("An unexpected error occurred");
      expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    });
  });

  describe("apiClient singleton", () => {
    it("should be an instance of ApiClient", () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });
  });
});

