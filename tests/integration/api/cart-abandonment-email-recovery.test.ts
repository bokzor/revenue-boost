/**
 * Integration Tests for Cart Abandonment Email Recovery API
 *
 * Tests the complete flow of cart email recovery:
 * - Email capture and validation
 * - Discount code issuance
 * - Email-locked discounts
 * - Rate limiting
 * - Security (challenge token validation)
 * - Lead creation
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
      findFirst: vi.fn(),
    },
  },
}));

// Import after mocks
import { action as emailRecoveryAction } from '~/routes/api.cart.email-recovery';
import { authenticate } from '~/shopify.server';
import {
  getCampaignDiscountCode,
  parseDiscountConfig,
  getSuccessMessage,
  shouldShowDiscountCode,
} from '~/domains/commerce/services/discount.server';
import { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } from '~/domains/security/services/rate-limit.server';
import prisma from '~/db.server';

// Helper to extract data and status from React Router's TypedResponse
async function extractResponse(response: any): Promise<{ data: any; status: number }> {
  if (response instanceof Response) {
    const data = await response.json();
    return { data, status: response.status };
  }
  // Handle React Router data() responses
  if (response && typeof response === 'object' && 'data' in response) {
    return { data: response.data, status: response.status || 200 };
  }
  return { data: response, status: 200 };
}

describe('Cart Abandonment Email Recovery - Integration Tests', () => {
  const mockShop = 'test-store.myshopify.com';
  const mockCampaignId = 'campaign-cart-123';
  const mockSessionId = 'session-abc';
  const mockChallengeToken = 'challenge-xyz';
  const mockEmail = 'customer@example.com';

  let mockAdmin: any;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = {
      graphql: vi.fn(),
    };

    mockSession = {
      shop: mockShop,
      accessToken: 'test-token',
    };

    // Mock authenticate
    vi.mocked(authenticate).public = {
      appProxy: vi.fn().mockResolvedValue({
        admin: mockAdmin,
        session: mockSession,
      }),
    } as any;

    // Mock rate limiting - allow by default
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

  describe('Basic Email Recovery Flow', () => {
    it('should successfully capture email and issue discount code', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: {
          enabled: true,
          type: 'single_use',
          valueType: 'PERCENTAGE',
          value: 10,
          deliveryMode: 'show_code_fallback',
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue(mockCampaign.discountConfig as any);
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: 'CART10',
        discountId: 'gid://shopify/DiscountCodeNode/123',
      } as any);
      vi.mocked(getSuccessMessage).mockReturnValue('Discount code sent!');
      vi.mocked(shouldShowDiscountCode).mockReturnValue(true);
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-123',
        email: mockEmail,
      } as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: mockEmail,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discountCode).toBe('CART10');
      expect(data.message).toBe('Discount code sent!');

      // Verify lead was created
      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockEmail,
          campaignId: mockCampaignId,
          source: 'cart_recovery',
        }),
      });
    });

    it('should capture email with cart subtotal for tiered discounts', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: {
          enabled: true,
          type: 'single_use',
          valueType: 'PERCENTAGE',
          value: 15,
          deliveryMode: 'show_code_fallback',
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue(mockCampaign.discountConfig as any);
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: 'CART15',
        discountId: 'gid://shopify/DiscountCodeNode/456',
      } as any);
      vi.mocked(getSuccessMessage).mockReturnValue('15% discount applied!');
      vi.mocked(shouldShowDiscountCode).mockReturnValue(true);
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-456',
        email: mockEmail,
      } as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: mockEmail,
          cartSubtotalCents: 15000, // $150.00
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discountCode).toBe('CART15');

      // Verify discount code was requested with cart subtotal
      expect(getCampaignDiscountCode).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockCampaignId,
        expect.objectContaining({
          enabled: true,
          valueType: 'PERCENTAGE',
          value: 15,
        }),
        expect.objectContaining({
          cartSubtotalCents: 15000,
        }),
      );
    });
  });

  describe('Email-Locked Discounts', () => {
    it('should issue email-locked discount with authorized email', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: 'test-store',
        name: 'Cart Abandonment Campaign',
        status: 'ACTIVE',
        discountConfig: {
          enabled: true,
          type: 'single_use',
          valueType: 'PERCENTAGE',
          value: 20,
          deliveryMode: 'show_in_popup_authorized_only',
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(parseDiscountConfig).mockReturnValue(mockCampaign.discountConfig as any);
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: 'LOCKED20',
        discountId: 'gid://shopify/DiscountCodeNode/789',
      } as any);
      vi.mocked(getSuccessMessage).mockReturnValue('Exclusive discount for you!');
      vi.mocked(shouldShowDiscountCode).mockReturnValue(true);
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-789',
        email: mockEmail,
      } as any);

      const request = new Request('http://localhost/api/cart/email-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          email: mockEmail,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await emailRecoveryAction({
        request,
      } as unknown as ActionFunctionArgs);

      const { data, status } = await extractResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discountCode).toBe('LOCKED20');

      // Verify discount config was enriched with email authorization
      expect(getCampaignDiscountCode).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockCampaignId,
        expect.objectContaining({
          authorizedEmail: mockEmail,
          requireEmailMatch: true,
        }),
        expect.anything(),
      );
    });
  });
});

