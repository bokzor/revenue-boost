/**
 * Serve static assets (images) via App Proxy
 *
 * Path: /apps/revenue-boost/assets/*
 * Example: /apps/revenue-boost/assets/newsletter-backgrounds/bold.png
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { logger } from "~/lib/logger.server";

// Directory where public assets live
const PUBLIC_DIR = resolve(process.cwd(), "public");

// Allowed asset paths (whitelist for security)
// Pattern allows: letters (case-insensitive), numbers, hyphens, underscores in filenames
const ALLOWED_ASSET_PATHS = [
  /^newsletter-backgrounds\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i,
  /^recipes\/newsletter\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i,
  /^recipes\/scratch-card\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i,
  /^recipes\/flash-sale\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i,
];

/**
 * Build response headers for static assets
 */
function buildHeaders(lastModified: string, size: number, contentType: string): Headers {
  return new Headers({
    "Content-Type": contentType,
    "Content-Length": size.toString(),
    "Last-Modified": lastModified,
    "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
    "Access-Control-Allow-Origin": "*",
  });
}

/**
 * Get content type from file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const assetPath = params["*"] || "";

  logger.debug({ assetPath }, "[Assets] Request for");

  // Validate asset path against whitelist
  const isAllowed = ALLOWED_ASSET_PATHS.some((pattern) => pattern.test(assetPath));
  if (!isAllowed) {
    logger.error({ assetPath }, "[Assets] Rejected (not in whitelist)");
    return data({ error: "Asset not allowed" }, { status: 403 });
  }

  // Resolve absolute path
  const absPath = resolve(join(PUBLIC_DIR, assetPath));

  // Ensure resolved path is within the public directory (prevent path traversal)
  if (!absPath.startsWith(PUBLIC_DIR)) {
    logger.error({ absPath }, "[Assets] Path traversal attempt");
    return data({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(absPath)) {
    logger.error({ absPath }, "[Assets] Asset not found");
    return data({ error: "Asset not found" }, { status: 404 });
  }

  try {
    const stats = await stat(absPath);
    const contentType = getContentType(assetPath);
    logger.debug({ assetPath, size: stats.size, contentType }, "[Assets] Serving");

    // HEAD support
    if (request.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: buildHeaders(stats.mtime.toUTCString(), stats.size, contentType),
      });
    }

    // Stream the file
    const stream = createReadStream(absPath);
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: buildHeaders(stats.mtime.toUTCString(), stats.size, contentType),
    });
  } catch (err) {
    logger.error({ assetPath, err }, "[Assets] Failed to serve");
    return data({ error: "Failed to serve asset" }, { status: 500 });
  }
}
