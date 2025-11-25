import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface StagedUploadParameter {
  name: string;
  value: string;
}

export interface ShopifyStagedUploadTarget {
  url: string;
  resourceUrl: string;
  parameters: StagedUploadParameter[];
}

export interface ShopifyCreatedImageFile {
  id: string;
  url: string;
  alt?: string | null;
  fileStatus?: string | null;
}

const STAGED_UPLOADS_CREATE_MUTATION = `#graphql
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE_MUTATION = `#graphql
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        alt
        preview {
          image {
            url
          }
        }
        ... on MediaImage {
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface StagedUploadsCreateResponse {
  data?: {
    stagedUploadsCreate?: {
      stagedTargets?: ShopifyStagedUploadTarget[];
      userErrors?: { field?: string[] | null; message: string }[];
    };
  };
  errors?: { message: string }[];
}

interface FileCreateResponse {
  data?: {
    fileCreate?: {
      files?: Array<{
        id: string;
        fileStatus?: string | null;
        alt?: string | null;
        image?: { url: string } | null;
        preview?: { image?: { url: string } | null } | null;
      }>;
      userErrors?: { field?: string[] | null; message: string }[];
    };
  };
  errors?: { message: string }[];
}

export async function createImageStagedUpload(
  admin: AdminApiContext,
  options: { filename: string; mimeType: string; fileSize?: number }
): Promise<ShopifyStagedUploadTarget> {
  const variables = {
    input: [
      {
        filename: options.filename,
        mimeType: options.mimeType,
        resource: "IMAGE",
        fileSize: options.fileSize != null ? String(options.fileSize) : undefined,
        httpMethod: "POST",
      },
    ],
  };

  const response = await admin.graphql(STAGED_UPLOADS_CREATE_MUTATION, {
    variables,
  });

  const json = (await response.json()) as StagedUploadsCreateResponse;

  if (json.errors && json.errors.length > 0) {
    console.error("[Shopify Files] stagedUploadsCreate GraphQL errors", json.errors);
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const payload = json.data?.stagedUploadsCreate;
  if (!payload) {
    throw new Error("stagedUploadsCreate response missing payload");
  }

  if (payload.userErrors && payload.userErrors.length > 0) {
    console.error("[Shopify Files] stagedUploadsCreate userErrors", payload.userErrors);
    throw new Error(payload.userErrors.map((e) => e.message).join("; "));
  }

  const target = payload.stagedTargets?.[0];
  if (!target) {
    throw new Error("stagedUploadsCreate did not return a staged upload target");
  }

  return target;
}

export async function createImageFileFromStaged(
  admin: AdminApiContext,
  options: { resourceUrl: string; alt?: string }
): Promise<ShopifyCreatedImageFile> {
  const variables = {
    files: [
      {
        alt: options.alt ?? undefined,
        contentType: "IMAGE",
        originalSource: options.resourceUrl,
      },
    ],
  };

  const response = await admin.graphql(FILE_CREATE_MUTATION, {
    variables,
  });

  const json = (await response.json()) as FileCreateResponse;

  if (json.errors && json.errors.length > 0) {
    console.error("[Shopify Files] fileCreate GraphQL errors", json.errors);
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const payload = json.data?.fileCreate;
  if (!payload) {
    throw new Error("fileCreate response missing payload");
  }

  if (payload.userErrors && payload.userErrors.length > 0) {
    console.error("[Shopify Files] fileCreate userErrors", payload.userErrors);
    throw new Error(payload.userErrors.map((e) => e.message).join("; "));
  }

  const file = payload.files?.[0];
  if (!file) {
    throw new Error("fileCreate did not return a file");
  }

  if (file.fileStatus === "FAILED") {
    throw new Error("fileCreate returned FAILED status for image");
  }

  const urlFromImage = file.image?.url;
  const urlFromPreview = file.preview?.image?.url;
  const url = urlFromImage ?? urlFromPreview ?? options.resourceUrl;

  if (!urlFromImage && !urlFromPreview) {
    console.warn(
      "[Shopify Files] fileCreate returned a file without a processed image URL; falling back to staged resourceUrl",
      { fileId: file.id, fileStatus: file.fileStatus }
    );
  }

  return {
    id: file.id,
    url,
    alt: file.alt,
    fileStatus: file.fileStatus ?? undefined,
  };
}
