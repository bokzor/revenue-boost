/**
 * Service-Level Integration Tests for Discount Service
 * 
 * Tests the business logic for discount code issuance (80% of integration tests)
 * - getCampaignDiscountCode
 * - Tiered discount selection
 * - Bundle discount creation
 * - Single-use vs shared discounts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('~/db.server', () => ({
  default: {
    campaign: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getCampaignDiscountCode } from '~/domains/commerce/services/discount.server';
import prisma from '~/db.server';

describe.skip('Discount Service - getCampaignDiscountCode', () => {
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = {
      graphql: vi.fn(),
    };
  });

  describe('Bundle Discounts', () => {
    it('should return existing bundle discount code', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        name: 'Product Upsell Campaign',
        storeId: 'test-store',
        discountConfig: {
          enabled: true,
          type: 'shared' as const,
          valueType: 'PERCENTAGE' as const,
          value: 15,
          code: 'BUNDLE15',
          showInPreview: true,
          behavior: 'SHOW_CODE_ONLY' as const,
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        'test-store',
        'campaign-123',
        mockCampaign.discountConfig,
        undefined,
        5000 // $50 cart
      );

      expect(result.discountCode).toBe('BUNDLE15');
      expect(result.isNewDiscount).toBe(false);
    });

    it('should create new bundle discount if code does not exist', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        name: 'New Campaign',
        storeId: 'test-store',
        discountConfig: {
          enabled: true,
          type: 'shared' as const,
          valueType: 'PERCENTAGE' as const,
          value: 20,
          showInPreview: true,
          behavior: 'SHOW_CODE_ONLY' as const,
          // No code yet
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(prisma.campaign.update).mockResolvedValue({
        ...mockCampaign,
        discountConfig: {
          ...mockCampaign.discountConfig,
          code: 'BUNDLE20',
        },
      } as any);

      // Mock Shopify discount creation
      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: {
                codeDiscount: {
                  codes: {
                    edges: [{ node: { code: 'BUNDLE20' } }],
                  },
                },
              },
              userErrors: [],
            },
          },
        }),
      });

      const result = await getCampaignDiscountCode(
        mockAdmin,
        'test-store',
        'campaign-123',
        mockCampaign.discountConfig,
        undefined,
        5000
      );

      expect(result.discountCode).toBe('BUNDLE20');
      expect(result.isNewDiscount).toBe(true);

      // Verify discount was created in Shopify
      expect(mockAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('discountCodeBasicCreate'),
        expect.anything()
      );
    });
  });

  describe('Tiered Discounts', () => {
    it('should select correct tier based on cart subtotal', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        name: 'Tiered Campaign',
        storeId: 'test-store',
        discountConfig: {
          enabled: true,
          type: 'shared' as const,
          valueType: 'PERCENTAGE' as const, // Use PERCENTAGE for tiered discounts
          showInPreview: true,
          autoApplyMode: 'none' as const,
          codePresentation: 'show_code' as const,
          tiers: [
            { minSubtotalCents: 0, value: 10, code: 'SAVE10' },
            { minSubtotalCents: 5000, value: 15, code: 'SAVE15' },
            { minSubtotalCents: 10000, value: 20, code: 'SAVE20' },
          ],
          _meta: {
            tierCodes: [
              { tierIndex: 0, thresholdCents: 0, code: 'SAVE10' },
              { tierIndex: 1, thresholdCents: 5000, code: 'SAVE15' },
              { tierIndex: 2, thresholdCents: 10000, code: 'SAVE20' },
            ],
          },
        } as any,
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      // Test tier 0 (cart < $50)
      const result1 = await getCampaignDiscountCode(
        mockAdmin,
        'test-store',
        'campaign-123',
        mockCampaign.discountConfig,
        undefined,
        3000 // $30 cart
      );

      expect(result1.discountCode).toBe('SAVE10');
      expect(result1.tierUsed).toBe(0);

      // Test tier 1 ($50 <= cart < $100)
      const result2 = await getCampaignDiscountCode(
        mockAdmin,
        'test-store',
        'campaign-123',
        mockCampaign.discountConfig,
        undefined,
        7500 // $75 cart
      );

      expect(result2.discountCode).toBe('SAVE15');
      expect(result2.tierUsed).toBe(1);

      // Test tier 2 (cart >= $100)
      const result3 = await getCampaignDiscountCode(
        mockAdmin,
        'test-store',
        'campaign-123',
        mockCampaign.discountConfig,
        undefined,
        15000 // $150 cart
      );

      expect(result3.discountCode).toBe('SAVE20');
      expect(result3.tierUsed).toBe(2);
    });
  });
});

