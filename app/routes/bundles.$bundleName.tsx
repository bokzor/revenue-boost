/**
 * Serve storefront popup component bundles
 * This route is accessed via app proxy: /apps/revenue-boost/bundles/:bundleName
 * But Shopify strips the prefix, so we receive: /bundles/:bundleName
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// Directory where the built bundles live (theme extension assets)
const ASSETS_DIR = resolve(process.cwd(), "extensions", "storefront-popup", "assets");

// Very conservative allowlist to prevent path traversal
const ALLOWED_BUNDLE_RE = /^[a-z-]+\.bundle\.js$/;

export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log(`[Bundles] Request: ${request.method} ${request.url}`);
  
  if (request.method !== "GET" && request.method !== "HEAD") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const bundleName = params.bundleName || "";
  console.log(`[Bundles] Bundle name: ${bundleName}`);
  
  if (!ALLOWED_BUNDLE_RE.test(bundleName)) {
    console.error(`[Bundles] Invalid bundle name: ${bundleName}`);
    return data({ error: "Invalid bundle name" }, { status: 400 });
  }

  const absPath = resolve(join(ASSETS_DIR, bundleName));

  // Ensure resolved path is within the assets directory
  if (!absPath.startsWith(ASSETS_DIR)) {
    console.error(`[Bundles] Path traversal attempt: ${absPath}`);
    return data({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(absPath)) {
    console.error(`[Bundles] Bundle not found: ${absPath}`);
    console.error(`[Bundles] ASSETS_DIR: ${ASSETS_DIR}`);
    return data({ error: "Bundle not found" }, { status: 404 });
  }

  try {
    const stats = await stat(absPath);
    console.log(`[Bundles] ✅ Serving: ${bundleName} (${stats.size} bytes)`);

    // HEAD support
    if (request.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: buildHeaders(stats.mtime.toUTCString(), stats.size),
      });
    }

    // Stream the file
    const stream = createReadStream(absPath);
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: buildHeaders(stats.mtime.toUTCString(), stats.size),
    });
  } catch (err) {
    console.error("[Bundles] Failed to serve:", bundleName, err);
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

