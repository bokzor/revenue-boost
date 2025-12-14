/**
 * Serve storefront popup component bundles via App Proxy
 *
 * Path: /apps/revenue-boost/bundles/:bundleName
 * Example: /apps/revenue-boost/bundles/newsletter.bundle.js
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { logger } from "~/lib/logger.server";

// Directory where the built bundles live (theme extension assets)
// Use process.cwd() to ensure we're resolving from project root
const ASSETS_DIR = resolve(process.cwd(), "extensions", "storefront-popup", "assets");

// Very conservative allowlist to prevent path traversal and unknown files
const ALLOWED_BUNDLE_RE = /^[a-z-]+\.bundle\.js$/;

export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug({ method: request.method, url: request.url }, "[Bundles] Request received");
  logger.debug({ params }, "[Bundles] Params");

  if (request.method !== "GET" && request.method !== "HEAD") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const bundleName = params.bundleName || "";
  logger.debug({ bundleName }, "[Bundles] Bundle name");

  if (!ALLOWED_BUNDLE_RE.test(bundleName)) {
    logger.error({ bundleName }, "[Bundles] Invalid bundle name");
    return data({ error: "Invalid bundle name" }, { status: 400 });
  }

  const absPath = resolve(join(ASSETS_DIR, bundleName));

  // Ensure resolved path is within the assets directory
  if (!absPath.startsWith(ASSETS_DIR)) {
    logger.error({ absPath }, "[Bundles] Path traversal attempt");
    return data({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(absPath)) {
    logger.error({ absPath, ASSETS_DIR, cwd: process.cwd() }, "[Bundles] Bundle not found");
    return data({ error: "Bundle not found" }, { status: 404 });
  }

  try {
    const stats = await stat(absPath);
    logger.debug({ absPath, size: stats.size }, "[Bundles] File found");

    // HEAD support
    if (request.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: buildHeaders(stats.mtime.toUTCString(), stats.size),
      });
    }

    // Stream the file
    const stream = createReadStream(absPath);
    logger.debug({ bundleName }, "[Bundles] Serving bundle");
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: buildHeaders(stats.mtime.toUTCString(), stats.size),
    });
  } catch (err) {
    logger.error({ bundleName, err }, "[Bundles] Failed to serve");
    return data({ error: "Failed to serve bundle" }, { status: 500 });
  }
}

function buildHeaders(lastModified: string, contentLength?: number) {
  const headers = new Headers();
  headers.set("Content-Type", "application/javascript; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Last-Modified", lastModified);
  if (typeof contentLength === "number") {
    headers.set("Content-Length", String(contentLength));
  }
  return headers;
}
