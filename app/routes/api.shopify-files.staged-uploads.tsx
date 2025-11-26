/**
 * POST /api/shopify-files/staged-uploads
 *
 * Creates a staged upload target for an image file using the Admin GraphQL API.
 *
 * Requires: write_files scope (optional, requested at use-time)
 */

import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { createImageStagedUpload } from "~/lib/shopify/files.server";

const REQUIRED_SCOPE = "write_files";

interface StagedUploadRequestBody {
  filename?: string;
  mimeType?: string;
  fileSize?: number;
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
        stagedTarget: null,
        scopeRequired: REQUIRED_SCOPE,
        scopeMessage:
          "To upload custom images for your popup designs, we need permission to create files in your store.",
      });
    }

    const body = (await request.json()) as StagedUploadRequestBody;

    if (!body?.filename || !body?.mimeType) {
      throw new Error("filename and mimeType are required");
    }

    const stagedTarget = await createImageStagedUpload(admin, {
      filename: body.filename,
      mimeType: body.mimeType,
      fileSize: typeof body.fileSize === "number" && body.fileSize > 0 ? body.fileSize : undefined,
    });

    return createSuccessResponse({ stagedTarget });
  } catch (error) {
    return handleApiError(error, "POST /api/shopify-files/staged-uploads");
  }
}
