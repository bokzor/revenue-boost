/**
 * POST /api/shopify-files/create-from-staged
 *
 * Creates a Shopify File image from a staged upload resource URL.
 *
 * Requires: write_files scope (optional, requested at use-time)
 */

import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { createImageFileFromStaged } from "~/lib/shopify/files.server";

const REQUIRED_SCOPE = "write_files";

interface CreateFromStagedRequestBody {
  resourceUrl?: string;
  alt?: string;
}

export async function action({ request }: { request: Request }) {
  try {
    if (request.method !== "POST") {
      throw new Error(`Method ${request.method} not allowed`);
    }

    const { admin, session, scopes } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      throw new Error("Authentication failed");
    }

    // Check if write_files scope is granted
    const scopeDetails = await scopes.query();
    const hasFilesScope = scopeDetails.granted.includes(REQUIRED_SCOPE);

    if (!hasFilesScope) {
      // Return response indicating scope is required
      return createSuccessResponse({
        file: null,
        scopeRequired: REQUIRED_SCOPE,
        scopeMessage:
          "To upload custom images for your popup designs, we need permission to create files in your store.",
      });
    }

    const body = (await request.json()) as CreateFromStagedRequestBody;

    if (!body?.resourceUrl) {
      throw new Error("resourceUrl is required");
    }

    const file = await createImageFileFromStaged(admin, {
      resourceUrl: body.resourceUrl,
      alt: body.alt,
    });

    return createSuccessResponse({ file });
  } catch (error) {
    return handleApiError(error, "POST /api/shopify-files/create-from-staged");
  }
}
