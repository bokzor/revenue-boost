/**
 * POST /api/shopify-files/staged-uploads
 *
 * Creates a staged upload target for an image file using the Admin GraphQL API.
 */

import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { createImageStagedUpload } from "~/lib/shopify/files.server";

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

    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      throw new Error("Authentication failed");
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
