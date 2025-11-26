/**
 * API Helper Functions
 *
 * Simple utilities for API route handlers
 */

import { data } from "react-router";
import { adminCors } from "~/lib/cors.server";
import { createApiResponse } from "~/lib/api-types";

/**
 * Create a successful API response with CORS headers
 */
export function createSuccessResponse<T>(payload: T, status: number = 200) {
  return data(createApiResponse(true, payload), {
    status,
    headers: adminCors(),
  });
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(message: string, status: number = 400, errors?: string[]) {
  return data(createApiResponse(false, undefined, message, errors), {
    status,
    headers: adminCors(),
  });
}

/**
 * HTTP Error with status code
 */
interface HttpError extends Error {
  status: number;
}

/**
 * Validate that a resource exists - throws 404 error if not found
 */
export function validateResourceExists<T>(
  resource: T | null | undefined,
  resourceName: string
): asserts resource is T {
  if (!resource) {
    const error = new Error(`${resourceName} not found`) as HttpError;
    error.status = 404;
    throw error;
  }
}

/**
 * Validate that a required ID parameter is present
 */
export function validateRequiredId(
  id: string | undefined,
  resourceName: string
): asserts id is string {
  if (!id) {
    const error = new Error(`${resourceName} ID is required`) as HttpError;
    error.status = 400;
    throw error;
  }
}

/**
 * Route params with dynamic keys
 */
interface RouteParams {
  [key: string]: string | undefined;
}

/**
 * Route context for loaders and actions
 */
interface RouteContext {
  request: Request;
  params: RouteParams;
}

/**
 * Create a loader that fetches a resource by ID
 */
export function getResourceById<T>(
  fetchFn: (id: string, storeId: string) => Promise<T | null>,
  resourceName: string,
  context: string
) {
  return async ({ request, params }: RouteContext) => {
    try {
      const id = params[`${resourceName.toLowerCase()}Id`];
      validateRequiredId(id, resourceName);

      const { getStoreId } = await import("~/lib/auth-helpers.server");
      const storeId = await getStoreId(request);

      const resource = await fetchFn(id, storeId);
      validateResourceExists(resource, resourceName);

      return createSuccessResponse({ [resourceName.toLowerCase()]: resource });
    } catch (error) {
      const { handleApiError } = await import("~/lib/api-error-handler.server");
      return handleApiError(error, context);
    }
  };
}

/**
 * Route handler function type
 */
type RouteHandler<T = unknown> = (context: RouteContext) => Promise<T>;

/**
 * Method route configuration
 */
interface MethodRoute<T = unknown> {
  handler: RouteHandler<T>;
  context: string;
}

/**
 * Create a method router for handling different HTTP methods
 */
export function createMethodRouter(routes: Record<string, MethodRoute>) {
  return async ({ request, params }: RouteContext) => {
    const method = request.method;
    const route = routes[method];

    if (!route) {
      const error = new Error(`Method ${method} not allowed`) as HttpError;
      error.status = 405;
      const { handleApiError } = await import("~/lib/api-error-handler.server");
      return handleApiError(error, `${method} ${request.url}`);
    }

    try {
      const result = await route.handler({ request, params });
      return createSuccessResponse(result);
    } catch (error) {
      const { handleApiError } = await import("~/lib/api-error-handler.server");
      return handleApiError(error, route.context);
    }
  };
}

/**
 * Create an API loader with error handling
 */
export function createApiLoader<T = unknown>(handler: RouteHandler<T>) {
  return async ({ request, params }: RouteContext) => {
    try {
      const result = await handler({ request, params });
      return createSuccessResponse(result);
    } catch (error) {
      const { handleApiError } = await import("~/lib/api-error-handler.server");
      return handleApiError(error, `${request.method} ${request.url}`);
    }
  };
}
