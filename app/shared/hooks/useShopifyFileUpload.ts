/**
 * useShopifyFileUpload - Hook for uploading files to Shopify
 *
 * Handles the staged upload flow for uploading files to Shopify's CDN.
 */

import { useCallback, useState } from "react";

export interface UploadedFile {
  id: string;
  url: string;
  alt?: string | null;
}

export interface FileUploadResult {
  /** Upload a file to Shopify */
  uploadFile: (file: File, alt?: string) => Promise<UploadedFile | null>;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for uploading files to Shopify
 */
export function useShopifyFileUpload(): FileUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File, alt?: string): Promise<UploadedFile | null> => {
      setIsUploading(true);
      setError(null);

      try {
        // Step 1: Create staged upload target
        const stagedResponse = await fetch("/api/shopify-files/staged-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "image/jpeg",
            fileSize: file.size,
          }),
        });

        const stagedJson = await stagedResponse.json();

        if (!stagedResponse.ok || !stagedJson?.success) {
          throw new Error("Failed to create staged upload target");
        }

        const stagedTarget = stagedJson.data?.stagedTarget as {
          url?: string;
          resourceUrl?: string;
          parameters?: { name: string; value: string }[];
        };

        if (!stagedTarget?.url || !stagedTarget.resourceUrl) {
          throw new Error("Invalid staged upload target response");
        }

        // Step 2: Upload file to Shopify's CDN
        const formData = new FormData();
        (stagedTarget.parameters || []).forEach((param) => {
          formData.append(param.name, param.value);
        });
        formData.append("file", file);

        const uploadResponse = await fetch(stagedTarget.url, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to Shopify");
        }

        // Step 3: Create the file record in Shopify
        const createResponse = await fetch("/api/shopify-files/create-from-staged", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceUrl: stagedTarget.resourceUrl,
            alt: alt || `Uploaded file: ${file.name}`,
          }),
        });

        const createJson = await createResponse.json();

        if (!createResponse.ok || !createJson?.success) {
          throw new Error("Failed to create Shopify file");
        }

        const createdFile = createJson.data?.file as UploadedFile | undefined;

        if (!createdFile?.id || !createdFile.url) {
          throw new Error("Invalid file creation response");
        }

        return createdFile;
      } catch (err) {
        console.error("[useShopifyFileUpload] Upload failed:", err);
        setError(err instanceof Error ? err.message : "Failed to upload file");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    uploadFile,
    isUploading,
    error,
    clearError,
  };
}

