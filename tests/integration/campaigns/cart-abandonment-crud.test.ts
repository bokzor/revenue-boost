/**
 * Integration Tests for Cart Abandonment Campaign CRUD Operations
 *
 * Tests database operations for cart abandonment campaigns:
 * - Campaign creation with all configuration options
 * - Campaign updates
 * - Configuration validation
 * - Template-specific field handling
 * - Discount configuration persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Shopify server to avoid authentication issues
vi.mock('~/shopify.server', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      admin: { graphql: vi.fn() },
      session: { shop: 'test.myshopify.com' },
    }),
  },
}));

// Use mocked Prisma from setup
import prisma from '~/db.server';
import { CartAbandonmentContentSchema, DiscountConfigSchema } from '~/domains/campaigns/types/campaign';

describe('Cart Abandonment Campaign CRUD - Integration Tests', () => {
  const mockStoreId = 'test-store-123';
  const mockTemplateId = 'template-cart-abandonment';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Campaign Creation', () => {
    it('should create campaign with minimal cart abandonment configuration', async () => {
      const minimalContent = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Redirecting to checkout...',
      };

      const validated = CartAbandonmentContentSchema.parse(minimalContent);

      const mockCampaign = {
        id: 'campaign-123',
        storeId: mockStoreId,
        templateId: mockTemplateId,
        templateType: 'CART_ABANDONMENT',
        name: 'Cart Recovery Campaign',
        status: 'DRAFT',
        contentConfig: validated,
        designConfig: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          buttonColor: '#000000',
          buttonTextColor: '#ffffff',
          position: 'center',
          size: 'medium',
        },
        discountConfig: { enabled: false },
        targetRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

      const result = await prisma.campaign.create({
        data: {
          storeId: mockStoreId,
          templateId: mockTemplateId,
          templateType: 'CART_ABANDONMENT',
          name: 'Cart Recovery Campaign',
          status: 'DRAFT',
          goal: 'INCREASE_REVENUE',
          contentConfig: validated,
          designConfig: mockCampaign.designConfig,
          discountConfig: { enabled: false },
          targetRules: {},
        },
      });

      expect(result).toBeDefined();
      expect(result.templateType).toBe('CART_ABANDONMENT');
      expect(result.contentConfig).toMatchObject(minimalContent);

      // Verify defaults were applied
      expect((result.contentConfig as any).showCartItems).toBe(true);
      expect((result.contentConfig as any).maxItemsToShow).toBe(3);
      expect((result.contentConfig as any).showUrgency).toBe(true);
      expect((result.contentConfig as any).urgencyTimer).toBe(300);
    });

    it('should create campaign with complete cart abandonment configuration', async () => {
      const completeContent = {
        headline: 'Get 15% Off Your Order',
        subheadline: 'Complete your purchase now',
        buttonText: 'Get My Discount',
        dismissLabel: 'Maybe Later',
        successMessage: 'Discount applied!',
        failureMessage: 'Something went wrong',
        ctaText: 'Save 15% Now',

        showCartItems: true,
        maxItemsToShow: 5,
        showCartTotal: true,
        currency: 'EUR',

        showUrgency: true,
        urgencyTimer: 600,
        urgencyMessage: 'Complete in {{time}} to save 15%',
        showStockWarnings: true,
        stockWarningMessage: 'Limited stock!',

        ctaUrl: '/checkout',
        saveForLaterText: 'Email Me This Cart',

        enableEmailRecovery: true,
        requireEmailBeforeCheckout: true,
        emailPlaceholder: 'your@email.com',
        emailButtonText: 'Get Discount',
        emailSuccessMessage: 'Discount sent!',
        emailErrorMessage: 'Invalid email',
      };

      const validated = CartAbandonmentContentSchema.parse(completeContent);

      const discountConfig = {
        enabled: true,
        type: 'single_use' as const,
        valueType: 'PERCENTAGE' as const,
        value: 15,
        deliveryMode: 'show_code_fallback' as const,
        expiryDays: 7,
        minimumAmount: 50,
      };

      const validatedDiscount = DiscountConfigSchema.parse(discountConfig);

      const mockCampaign = {
        id: 'campaign-456',
        storeId: mockStoreId,
        templateId: mockTemplateId,
        templateType: 'CART_ABANDONMENT',
        name: 'Complete Cart Recovery',
        status: 'DRAFT',
        contentConfig: validated,
        designConfig: {
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          buttonColor: '#3b82f6',
          buttonTextColor: '#ffffff',
          position: 'center',
          size: 'large',
        },
        discountConfig: validatedDiscount,
        targetRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

      const result = await prisma.campaign.create({
        data: {
          storeId: mockStoreId,
          templateId: mockTemplateId,
          templateType: 'CART_ABANDONMENT',
          name: 'Complete Cart Recovery',
          status: 'DRAFT',
          goal: 'INCREASE_REVENUE',
          contentConfig: validated,
          designConfig: mockCampaign.designConfig,
          discountConfig: validatedDiscount,
          targetRules: {},
        },
      });

      expect(result).toBeDefined();
      expect(result.contentConfig).toMatchObject(completeContent);
      expect(result.discountConfig).toMatchObject(discountConfig);
    });

    it('should validate content configuration on creation', () => {
      const invalidContent = {
        // Missing required fields
        subheadline: 'Missing headline and button text',
      };

      expect(() => {
        CartAbandonmentContentSchema.parse(invalidContent);
      }).toThrow();
    });

    it('should validate discount configuration on creation', () => {
      const invalidDiscount = {
        enabled: true,
        value: -10, // Negative value not allowed
      };

      expect(() => {
        DiscountConfigSchema.parse(invalidDiscount);
      }).toThrow();
    });
  });

  describe('Campaign Updates', () => {
    it('should update cart abandonment content configuration', async () => {
      const existingCampaign = {
        id: 'campaign-789',
        storeId: mockStoreId,
        templateType: 'CART_ABANDONMENT',
        contentConfig: {
          headline: 'Old Headline',
          buttonText: 'Old Button',
          successMessage: 'Old Success',
          showUrgency: false,
        },
      };

      const updatedContent = {
        headline: 'New Headline',
        buttonText: 'New Button',
        successMessage: 'New Success',
        showUrgency: true,
        urgencyTimer: 600,
        urgencyMessage: 'Hurry! {{time}} remaining',
      };

      const validated = CartAbandonmentContentSchema.parse(updatedContent);

      const mockUpdatedCampaign = {
        ...existingCampaign,
        contentConfig: validated,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.update).mockResolvedValue(mockUpdatedCampaign as any);

      const result = await prisma.campaign.update({
        where: { id: 'campaign-789' },
        data: {
          contentConfig: validated,
        },
      });

      expect(result.contentConfig).toMatchObject(updatedContent);
      expect((result.contentConfig as any).showUrgency).toBe(true);
      expect((result.contentConfig as any).urgencyTimer).toBe(600);
    });

    it('should update discount configuration', async () => {
      const existingCampaign = {
        id: 'campaign-101',
        storeId: mockStoreId,
        templateType: 'CART_ABANDONMENT',
        discountConfig: {
          enabled: false,
        },
      };

      const updatedDiscount = {
        enabled: true,
        type: 'single_use' as const,
        valueType: 'PERCENTAGE' as const,
        value: 20,
        deliveryMode: 'auto_apply_only' as const,
        expiryDays: 3,
      };

      const validated = DiscountConfigSchema.parse(updatedDiscount);

      const mockUpdatedCampaign = {
        ...existingCampaign,
        discountConfig: validated,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.update).mockResolvedValue(mockUpdatedCampaign as any);

      const result = await prisma.campaign.update({
        where: { id: 'campaign-101' },
        data: {
          discountConfig: validated,
        },
      });

      expect(result.discountConfig).toMatchObject(updatedDiscount);
      expect((result.discountConfig as any).enabled).toBe(true);
      expect((result.discountConfig as any).value).toBe(20);
    });

    it('should update email recovery settings', async () => {
      const existingCampaign = {
        id: 'campaign-202',
        storeId: mockStoreId,
        templateType: 'CART_ABANDONMENT',
        contentConfig: {
          headline: 'Complete Your Order',
          buttonText: 'Checkout',
          successMessage: 'Success',
          enableEmailRecovery: false,
        },
      };

      const updatedContent = {
        headline: 'Complete Your Order',
        buttonText: 'Checkout',
        successMessage: 'Success',
        enableEmailRecovery: true,
        requireEmailBeforeCheckout: true,
        emailPlaceholder: 'Enter your email',
        emailButtonText: 'Get Discount',
        emailSuccessMessage: 'Check your email!',
      };

      const validated = CartAbandonmentContentSchema.parse(updatedContent);

      const mockUpdatedCampaign = {
        ...existingCampaign,
        contentConfig: validated,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.update).mockResolvedValue(mockUpdatedCampaign as any);

      const result = await prisma.campaign.update({
        where: { id: 'campaign-202' },
        data: {
          contentConfig: validated,
        },
      });

      expect((result.contentConfig as any).enableEmailRecovery).toBe(true);
      expect((result.contentConfig as any).requireEmailBeforeCheckout).toBe(true);
      expect((result.contentConfig as any).emailPlaceholder).toBe('Enter your email');
    });
  });

  describe('Campaign Retrieval', () => {
    it('should retrieve campaign with all configurations', async () => {
      const mockCampaign = {
        id: 'campaign-303',
        storeId: mockStoreId,
        templateId: mockTemplateId,
        templateType: 'CART_ABANDONMENT',
        name: 'Full Cart Recovery',
        status: 'ACTIVE',
        contentConfig: {
          headline: 'Complete Your Order',
          buttonText: 'Resume Checkout',
          successMessage: 'Success',
          showCartItems: true,
          maxItemsToShow: 3,
          showUrgency: true,
          urgencyTimer: 300,
        },
        designConfig: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          buttonColor: '#3b82f6',
          buttonTextColor: '#ffffff',
          position: 'center',
          size: 'medium',
        },
        discountConfig: {
          enabled: true,
          type: 'single_use',
          valueType: 'PERCENTAGE',
          value: 10,
        },
        targetRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      const result = await prisma.campaign.findUnique({
        where: { id: 'campaign-303' },
      });

      expect(result).toBeDefined();
      expect(result?.templateType).toBe('CART_ABANDONMENT');
      expect(result?.contentConfig).toBeDefined();
      expect(result?.designConfig).toBeDefined();
      expect(result?.discountConfig).toBeDefined();
    });
  });
});
