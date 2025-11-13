/**
 * Mock-Bridge Authentication Support
 *
 * This module provides authentication support for both real Shopify sessions
 * and mock sessions from @getverdict/mock-bridge during E2E testing.
 */

import { validateSessionToken } from "@getverdict/mock-bridge";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface MockAuthResult {
  admin: null;
  session: {
    shop: string;
    accessToken: string;
    id: string;
    state: string;
    isOnline: boolean;
  };
  isMock: true;
}

interface RealAuthResult {
  admin: AdminApiContext;
  session: {
    shop: string;
    accessToken: string;
    id: string;
    state: string;
    isOnline: boolean;
  };
  isMock: false;
}

type AuthResult = MockAuthResult | RealAuthResult;

/**
 * Authenticate request with support for both real Shopify and mock-bridge sessions
 *
 * @param request - The incoming request
 * @param realAuthenticator - The real Shopify authenticate function
 * @returns Authentication result with isMock flag
 */
export async function authenticateWithMockBridge(
  request: Request,
  realAuthenticator: (request: Request) => Promise<{ admin: AdminApiContext; session: any }>
): Promise<AuthResult> {
  // Only support mock authentication in non-production environments
  if (process.env.NODE_ENV === 'production') {
    const result = await realAuthenticator(request);
    return { ...result, isMock: false };
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("id_token");

  // Try mock-bridge authentication first (in test/dev mode)
  if (token) {
    try {
      const authData = await validateSessionToken(token, {
        shopifySecret: process.env.SHOPIFY_API_SECRET!,
        mockSecret: 'mock-secret-12345', // Must match global.setup.ts
        developmentOnly: true,
      });

      if (authData?.isMock) {
        console.log("[Mock-Bridge] Mock authentication detected for shop:", authData.shopName);

        // Return mock session that matches Shopify's session structure
        return {
          admin: null as any, // Mock admin API (not used in tests)
          session: {
            shop: authData.shopName,
            accessToken: 'mock-access-token',
            id: `offline_${authData.shopName}`,
            state: 'mock-state',
            isOnline: false,
          },
          isMock: true,
        };
      }
    } catch (error) {
      console.log("[Mock-Bridge] Not a mock token, trying real auth:", error);
    }
  }

  // Fall back to real Shopify authentication
  const result = await realAuthenticator(request);
  return { ...result, isMock: false };
}

/**
 * Simple bypass for testing - skips all authentication in test mode
 *
 * ⚠️ WARNING: Only use this for E2E testing! This bypasses all security.
 *
 * @param request - The incoming request
 * @param realAuthenticator - The real Shopify authenticate function
 * @returns Authentication result
 */
export async function authenticateWithTestBypass(
  request: Request,
  realAuthenticator: (request: Request) => Promise<{ admin: AdminApiContext; session: any }>
): Promise<AuthResult> {
  // In test mode, bypass authentication entirely
  if (process.env.NODE_ENV === 'test') {
    console.log("[Mock-Bridge] Test mode - bypassing authentication");

    return {
      admin: null as any,
      session: {
        shop: 'test.myshopify.com',
        accessToken: 'test-access-token',
        id: 'offline_test.myshopify.com',
        state: 'test-state',
        isOnline: false,
      },
      isMock: true,
    };
  }

  // Normal authentication
  const result = await realAuthenticator(request);
  return { ...result, isMock: false };
}

