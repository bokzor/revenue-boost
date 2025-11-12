/**
 * API Client
 * 
 * Centralized HTTP client for making API requests
 * Provides consistent error handling, JSON parsing, and type safety
 * 
 * Eliminates 200+ lines of duplicated fetch code across the app
 */

/**
 * API Response type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  timestamp?: string;
}

/**
 * Request options
 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * API Client Error
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * API Client
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "POST", body });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "PUT", body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "PATCH", body });
  }

  /**
   * Core request method
   */
  private async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, params } = options;

    // Build URL with query params
    const fullUrl = this.buildUrl(url, params);

    // Build headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);

      // Parse JSON response
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle non-OK responses
      if (!response.ok) {
        throw new ApiClientError(
          data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      // Return standardized response
      return this.normalizeResponse<T>(data);
    } catch (error) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Wrap other errors
      throw new ApiClientError(
        error instanceof Error ? error.message : "Network request failed",
        0,
        null
      );
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = this.baseUrl + url;

    if (!params) {
      return fullUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  /**
   * Normalize API response to standard format
   */
  private normalizeResponse<T>(data: any): ApiResponse<T> {
    // If already in standard format
    if (typeof data === "object" && "success" in data) {
      return data as ApiResponse<T>;
    }

    // Wrap in standard format
    return {
      success: true,
      data: data as T,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Helper to handle API errors in UI
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

