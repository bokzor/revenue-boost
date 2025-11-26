/**
 * POST /api/shopify-files/create-from-staged
 *
 * Creates a Shopify File image from a staged upload resource URL.
 */

import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { createImageFileFromStaged } from "~/lib/shopify/files.server";

interface CreateFromStagedRequestBody {
  resourceUrl?: string;
  alt?: string;
}

export async function action({ request }: { request: Request }) {
  try {
    if (request.method !== "POST") {
      throw new Error(`Method ${request.method} not allowed`);
    }

    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      throw new Error("Authentication failed");
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
