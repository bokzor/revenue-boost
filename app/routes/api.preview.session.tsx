/**
 * Preview Session API Route
 *
 * Stores temporary campaign preview data in Redis
 * Allows previewing campaigns before they are saved to the database
 *
 * POST /api/preview/session - Create preview session
 * GET /api/preview/session/:token - Retrieve preview data
 */

import {
  data,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "~/shopify.server";
import { storefrontCors } from "~/lib/cors.server";
import { getRedis, REDIS_PREFIXES } from "~/lib/redis.server";
import crypto from "crypto";

// Redis key prefix for preview sessions
const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;

// Preview session TTL (30 minutes in seconds)
const PREVIEW_TTL = 30 * 60;

/**
 * POST /api/preview/session
 * Create a new preview session with campaign data
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Authenticate admin user
    const { session } = await authenticate.admin(request);
    const storeId = session.shop;

    // Parse campaign data from request
    const campaignData = await request.json();

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Get Redis client
    const redis = getRedis();
    if (!redis) {
      console.error("[Preview Session] Redis not available");
      return data(
        {
          success: false,
          error: "Preview service temporarily unavailable",
        },
        { status: 503 }
      );
    }

    // Store preview data in Redis with TTL
    const redisKey = `${PREVIEW_PREFIX}:${token}`;
    const sessionData = {
      data: campaignData,
      storeId,
      createdAt: Date.now(),
    };

    await redis.setex(redisKey, PREVIEW_TTL, JSON.stringify(sessionData));

    const expiresAt = Date.now() + PREVIEW_TTL * 1000;
    console.log(`[Preview Session] Created preview token: ${token} for store: ${storeId}`);

    return data({
      success: true,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("[Preview Session] Error creating preview session:", error);
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create preview session",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preview/session/:token
 * Retrieve preview campaign data by token
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    return data(
      { success: false, error: "Token is required" },
      { status: 400, headers: storefrontCors() }
    );
  }

  try {
    // Get Redis client
    const redis = getRedis();
    if (!redis) {
      console.error("[Preview Session] Redis not available");
      return data(
        { success: false, error: "Preview service temporarily unavailable" },
        { status: 503, headers: storefrontCors() }
      );
    }

    // Retrieve preview data from Redis
    const redisKey = `${PREVIEW_PREFIX}:${token}`;
    const sessionDataStr = await redis.get(redisKey);

    if (!sessionDataStr) {
      console.warn(`[Preview Session] Token not found or expired: ${token}`);
      return data(
        { success: false, error: "Preview session not found or expired" },
        { status: 404, headers: storefrontCors() }
      );
    }

    // Parse session data
    const sessionData = JSON.parse(sessionDataStr);

    console.log(`[Preview Session] Retrieved preview data for token: ${token}`);

    return data(
      {
        success: true,
        data: sessionData.data,
        storeId: sessionData.storeId,
      },
      { headers: storefrontCors() }
    );
  } catch (error) {
    console.error("[Preview Session] Error retrieving preview session:", error);
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve preview session",
      },
      { status: 500, headers: storefrontCors() }
    );
  }
}

