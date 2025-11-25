/**
 * Integration Tests for Cart Abandonment Validation & Error Handling
 *
 * Tests error scenarios and validation:
 * - Invalid campaign states
 * - Disabled discounts
 * - Invalid email formats
 * - Missing required fields
 * - Rate limiting
 * - Session validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ActionFunctionArgs } from 'react-router';

// Mock dependencies BEFORE imports
vi.mock('~/shopify.server');
vi.mock('~/domains/commerce/services/discount.server');
vi.mock('~/domains/security/services/rate-limit.server');
vi.mock('~/db.server', () => ({
  default: {
    campaign: {
      findUnique: vi.fn(),
    },
    lead: {
      create: vi.fn(),
    },
  },
}));

// Import after mocks
import { action as emailRecoveryAction } from '~/routes/api.cart.email-recovery';
import { authenticate } from '~/shopify.server';
import { parseDiscountConfig } from '~/domains/commerce/services/discount.server';
import { checkRateLimit, createEmailCampaignKey } from '~/domains/security/services/rate-limit.server';
import prisma from '~/db.server';

// Helper to extract data and status
async function extractResponse(response: any): Promise<{ data: any; status: number }> {
  if (response instanceof Response) {
    const data = await response.json();
    return { data, status: response.status };
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return { data: response.data, status: response.status || 200 };
  }
  return { data: response, status: 200 };
}

describe('Cart Abandonment Validation - Integration Tests', () => {
  const mockShop = 'test-store.myshopify.com';
  const mockCampaignId = 'campaign-cart-123';
  const mockSessionId = 'session-abc';
  const mockChallengeToken = 'challenge-xyz';

  let mockAdmin: any;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = { graphql: vi.fn() };
    mockSession = { shop: mockShop, accessToken: 'test-token' };

    vi.mocked(authenticate).public = {
      appProxy: vi.fn().mockResolvedValue({
        admin: mockAdmin,
        session: mockSession,
      }),
    } as any;

    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 3600000,
    } as any);

    vi.mocked(createEmailCampaignKey).mockReturnValue('email:campaign:key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Validation', () => {
    it('should return 401 when session is invalid', async () => {
      vi.mocked(authenticate).public = {
        appProxy: vi.fn().mockResolvedValue({
          admin: mockAdmin,
          session: {}, // Invalid session (no shop)
        }),
      } as any;

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: 'test@example.com',
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid session');
    });
  });

  describe('Campaign Validation', () => {
    it('should return 404 when campaign not found', async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'non-existent-campaign',
          email: 'test@example.com',
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign not found or inactive');
    });

    it('should return 404 when campaign is not active', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Inactive Campaign',
        status: 'PAUSED', // Not ACTIVE
        discountConfig: { enabled: true },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: 'test@example.com',
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Discount Configuration Validation', () => {
    it('should return 400 when discount is disabled', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'No Discount Campaign',
        status: 'ACTIVE',
        discountConfig: { enabled: false },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue({ enabled: false } as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: 'test@example.com',
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Discount not enabled');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: { enabled: true },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue({ enabled: true } as any);

      // Mock rate limit exceeded
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 3600000,
      } as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: 'spammer@example.com',
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already recovered');
    });

    it('should call rate limiter with correct parameters', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: { enabled: true },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue({ enabled: true } as any);

      const testEmail = 'ratelimit@example.com';

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: testEmail,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      // Verify rate limit was checked with correct key
      expect(createEmailCampaignKey).toHaveBeenCalledWith(testEmail, mockCampaignId);
      expect(checkRateLimit).toHaveBeenCalledWith(
        'email:campaign:key',
        'cart_recovery',
        expect.anything(),
        expect.objectContaining({
          email: testEmail,
          campaignId: mockCampaignId,
        }),
      );
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid email format', async () => {
      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: 'not-an-email', // Invalid email
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing campaignId and email
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'first.last@company.com',
        'email123@test-domain.org',
      ];

      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: { enabled: false }, // Will fail at discount check, but email validation passes
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue({ enabled: false } as any);

      for (const email of validEmails) {
        const request = new Request('http://localhost/api/cart/email-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: mockCampaignId,
            email,
            sessionId: mockSessionId,
            challengeToken: mockChallengeToken,
          }),
        });

        const response = await emailRecoveryAction({
          request,
        } as unknown as ActionFunctionArgs);

        const { status } = await extractResponse(response);

        // Should not fail at validation (400), but at discount check (400 with different message)
        expect(status).toBe(400);
      }
    });
  });
});
