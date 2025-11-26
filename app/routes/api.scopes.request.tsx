/**
 * POST /api/scopes/request
 *
 * Initiates a request for additional OAuth scopes using Shopify's
 * just-in-time permission flow.
 *
 * Request body:
 * - scopes: string[] - Array of scopes to request (e.g., ["read_customers"])
 *
 * Returns:
 * - redirectUrl: URL to redirect the user to for scope authorization
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { scopes } = await authenticate.admin(request);

    const body = await request.json();
    const requestedScopes = body.scopes as string[] | undefined;

    if (!requestedScopes || !Array.isArray(requestedScopes) || requestedScopes.length === 0) {
      return data(
        { error: "scopes array is required in request body" },
        { status: 400 }
      );
    }

    // Validate that only allowed optional scopes are being requested
    const allowedOptionalScopes = ["read_customers", "write_customers"];
    const invalidScopes = requestedScopes.filter(
      (scope) => !allowedOptionalScopes.includes(scope)
    );

    if (invalidScopes.length > 0) {
      return data(
        { error: `Invalid scopes requested: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    // Use Shopify's scopes.request() to initiate the permission flow
    // This performs a server-side redirect to the OAuth flow
    // If the scopes are already granted, it returns immediately (no redirect)
    await scopes.request(requestedScopes);

    // If we reach here, the scopes were already granted (no redirect occurred)
    // Query the current scopes to return the granted list
    const scopeDetails = await scopes.query();

    return createSuccessResponse({
      success: true,
      message: "Scopes already granted or request initiated",
      granted: scopeDetails.granted,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/scopes/request");
  }
}

