/**
 * Challenge Token Service
 *
 * Generates and validates one-time challenge tokens for secure discount code generation.
 * Prevents API abuse by requiring proof of legitimate popup interaction.
 */

import crypto from "crypto";
import prisma from "~/db.server";

export interface ChallengeTokenData {
  token: string;
  expiresAt: Date;
}

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generate a new challenge token for a campaign
 *
 * @param campaignId - Campaign ID the token is for
 * @param sessionId - User's session ID
 * @param ip - User's IP address
 * @param ttlMinutes - Time to live in minutes (default: 10)
 * @returns Token data with expiration
 */
export async function generateChallengeToken(
  campaignId: string,
  sessionId: string,
  ip: string,
  ttlMinutes: number = 10
): Promise<ChallengeTokenData> {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.challengeToken.create({
    data: {
      token,
      campaignId,
      sessionId,
      ip,
      expiresAt,
      used: false,
    },
  });

  return { token, expiresAt };
}

/**
 * Validate and consume a challenge token
 * Token can only be used once and must not be expired
 *
 * @param token - Token to validate
 * @param campaignId - Expected campaign ID
 * @param sessionId - Expected session ID
 * @param ip - Current IP address (optional strict check)
 * @param strictIpCheck - Whether to enforce IP matching (default: false for mobile compatibility)
 * @returns Validation result
 */
export async function validateAndConsumeToken(
  token: string,
  campaignId: string,
  sessionId: string,
  ip: string,
  strictIpCheck: boolean = false
): Promise<TokenValidationResult> {
  const challengeToken = await prisma.challengeToken.findUnique({
    where: { token },
  });

  // Token doesn't exist
  if (!challengeToken) {
    return { valid: false, error: "Invalid token" };
  }

  // Token already used
  if (challengeToken.used) {
    return { valid: false, error: "Token already used" };
  }

  // Token expired
  if (challengeToken.expiresAt < new Date()) {
    return { valid: false, error: "Token expired" };
  }

  // Campaign ID mismatch
  if (challengeToken.campaignId !== campaignId) {
    return { valid: false, error: "Token campaign mismatch" };
  }

  // Session ID mismatch
  if (challengeToken.sessionId !== sessionId) {
    return { valid: false, error: "Token session mismatch" };
  }

  // Optional strict IP check (disabled by default for mobile users)
  if (strictIpCheck && challengeToken.ip !== ip) {
    return { valid: false, error: "Token IP mismatch" };
  }

  // Mark token as used
  await prisma.challengeToken.update({
    where: { token },
    data: { used: true },
  });

  return { valid: true };
}

/**
 * Clean up expired tokens (cron job or background task)
 * Should be run periodically to prevent database bloat
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.challengeToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          used: true,
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }, // Delete used tokens older than 24h
      ],
    },
  });

  return result.count;
}
