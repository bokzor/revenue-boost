/**
 * Integration Tests: Campaign Creation from Recipe Flow
 *
 * Tests the complete flow from recipe selection to campaign creation.
 * Uses mocked Prisma to test the service layer without a real database.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import prisma from "~/db.server";
import { CampaignMutationService } from "~/domains/campaigns/services/campaign-mutation.server";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { CampaignCreateData } from "~/domains/campaigns/types/campaign";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";

// Mock dependencies
vi.mock("~/domains/billing/services/plan-guard.server", () => ({
  PlanGuardService: {
    assertCanCreateCampaign: vi.fn().mockResolvedValue(undefined),
    assertCanAddVariant: vi.fn().mockResolvedValue(undefined),
    assertCanUseAdvancedTargeting: vi.fn().mockResolvedValue(true),
    assertCanUseAdvancedTargetingFeature: vi.fn().mockResolvedValue(true),
    checkFeatureAccess: vi.fn().mockResolvedValue(true),
    getPlanContext: vi.fn().mockResolvedValue({
      definition: {
        features: {
          advancedTargeting: true,
        },
      },
    }),
  },
}));

/**
 * Transform recipe into CampaignCreateData format
 */
function recipeToCreateData(recipe: StyledRecipe): CampaignCreateData {
  return {
    name: recipe.name,
    goal: recipe.goal,
    templateType: recipe.templateType,
    contentConfig: recipe.defaults.contentConfig as Record<string, unknown>,
    designConfig: recipe.defaults.designConfig as Record<string, unknown>,
    targetRules: recipe.defaults.targetRules as Record<string, unknown>,
    discountConfig: recipe.defaults.discountConfig as Record<string, unknown>,
    status: "DRAFT",
  };
}

describe("Campaign Creation from Recipe - Integration", () => {
  const mockStoreId = "cltest_store_12345";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Prisma mock for campaign creation
    (prisma.campaign.create as Mock).mockResolvedValue({
      id: "cltest_campaign_123",
      storeId: mockStoreId,
      name: "Test Campaign",
      goal: "NEWSLETTER_SIGNUP",
      status: "DRAFT",
      templateType: "NEWSLETTER",
      contentConfig: {},
      designConfig: {},
      targetRules: {},
      discountConfig: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("Recipe to Campaign Service Integration", () => {
    it("creates a campaign from newsletter recipe", async () => {
      const newsletterRecipe = STYLED_RECIPES.find(
        (r) => r.templateType === "NEWSLETTER"
      );

      if (!newsletterRecipe) {
        throw new Error("Newsletter recipe not found");
      }

      const createData = recipeToCreateData(newsletterRecipe);

      // Mock the Prisma response with recipe data
      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_newsletter",
        storeId: mockStoreId,
        name: newsletterRecipe.name,
        goal: newsletterRecipe.goal,
        status: "DRAFT",
        templateType: newsletterRecipe.templateType,
        contentConfig: JSON.stringify(newsletterRecipe.defaults.contentConfig),
        designConfig: JSON.stringify(newsletterRecipe.defaults.designConfig),
        targetRules: JSON.stringify(newsletterRecipe.defaults.targetRules || {}),
        discountConfig: JSON.stringify(newsletterRecipe.defaults.discountConfig || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      // Verify Prisma was called with correct data
      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
            name: newsletterRecipe.name,
            goal: newsletterRecipe.goal,
            templateType: newsletterRecipe.templateType,
          }),
        })
      );
    });

    it("creates a campaign from flash sale recipe", async () => {
      const flashSaleRecipe = STYLED_RECIPES.find(
        (r) => r.templateType === "FLASH_SALE"
      );

      if (!flashSaleRecipe) {
        throw new Error("Flash sale recipe not found");
      }

      const createData = recipeToCreateData(flashSaleRecipe);

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_flashsale",
        storeId: mockStoreId,
        name: flashSaleRecipe.name,
        goal: flashSaleRecipe.goal,
        status: "DRAFT",
        templateType: flashSaleRecipe.templateType,
        contentConfig: JSON.stringify(flashSaleRecipe.defaults.contentConfig),
        designConfig: JSON.stringify(flashSaleRecipe.defaults.designConfig),
        targetRules: JSON.stringify(flashSaleRecipe.defaults.targetRules || {}),
        discountConfig: JSON.stringify(flashSaleRecipe.defaults.discountConfig || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: flashSaleRecipe.name,
            goal: "INCREASE_REVENUE",
            templateType: "FLASH_SALE",
          }),
        })
      );
    });

    it("creates a campaign from spin-to-win recipe", async () => {
      const spinRecipe = STYLED_RECIPES.find((r) => r.templateType === "SPIN_TO_WIN");

      if (!spinRecipe) {
        throw new Error("Spin-to-win recipe not found");
      }

      const createData = recipeToCreateData(spinRecipe);

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_spin",
        storeId: mockStoreId,
        name: spinRecipe.name,
        goal: spinRecipe.goal,
        status: "DRAFT",
        templateType: spinRecipe.templateType,
        contentConfig: JSON.stringify(spinRecipe.defaults.contentConfig),
        designConfig: JSON.stringify(spinRecipe.defaults.designConfig),
        targetRules: JSON.stringify(spinRecipe.defaults.targetRules || {}),
        discountConfig: JSON.stringify(spinRecipe.defaults.discountConfig || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            templateType: "SPIN_TO_WIN",
          }),
        })
      );
    });

    it("creates a campaign from scratch card recipe", async () => {
      const scratchRecipe = STYLED_RECIPES.find((r) => r.templateType === "SCRATCH_CARD");

      if (!scratchRecipe) {
        throw new Error("Scratch card recipe not found");
      }

      const createData = recipeToCreateData(scratchRecipe);

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_scratch",
        storeId: mockStoreId,
        name: scratchRecipe.name,
        goal: scratchRecipe.goal,
        status: "DRAFT",
        templateType: scratchRecipe.templateType,
        contentConfig: JSON.stringify(scratchRecipe.defaults.contentConfig),
        designConfig: JSON.stringify(scratchRecipe.defaults.designConfig),
        targetRules: JSON.stringify(scratchRecipe.defaults.targetRules || {}),
        discountConfig: JSON.stringify(scratchRecipe.defaults.discountConfig || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalled();
    });
  });

  describe("Recipe validation during campaign creation", () => {
    it("rejects campaign with invalid template type", async () => {
      const invalidData = {
        name: "Invalid Campaign",
        goal: "NEWSLETTER_SIGNUP",
        templateType: "INVALID_TYPE" as unknown as string,
      } as CampaignCreateData;

      await expect(
        CampaignMutationService.create(mockStoreId, invalidData)
      ).rejects.toThrow();
    });

    it("rejects campaign with invalid goal", async () => {
      const invalidData = {
        name: "Invalid Campaign",
        goal: "INVALID_GOAL" as unknown as string,
        templateType: "NEWSLETTER",
      } as CampaignCreateData;

      await expect(
        CampaignMutationService.create(mockStoreId, invalidData)
      ).rejects.toThrow();
    });

    it("accepts campaign with modified recipe content", async () => {
      const newsletterRecipe = STYLED_RECIPES.find(
        (r) => r.templateType === "NEWSLETTER"
      );

      if (!newsletterRecipe) {
        throw new Error("Newsletter recipe not found");
      }

      // Modify content from recipe defaults
      const createData = {
        ...recipeToCreateData(newsletterRecipe),
        name: "Custom Newsletter Campaign",
        contentConfig: {
          ...newsletterRecipe.defaults.contentConfig,
          headline: "Customized Headline",
          subheadline: "Customized Description",
        },
      };

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_custom",
        storeId: mockStoreId,
        name: createData.name,
        goal: newsletterRecipe.goal,
        status: "DRAFT",
        templateType: newsletterRecipe.templateType,
        contentConfig: JSON.stringify(createData.contentConfig),
        designConfig: JSON.stringify(createData.designConfig),
        targetRules: JSON.stringify(createData.targetRules || {}),
        discountConfig: JSON.stringify(createData.discountConfig || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Custom Newsletter Campaign",
          }),
        })
      );
    });
  });

  describe("Recipe category to campaign mapping", () => {
    it("email_leads recipes create campaigns with NEWSLETTER_SIGNUP goal", async () => {
      const emailLeadsRecipes = STYLED_RECIPES.filter(
        (r) => r.category === "email_leads" && r.goal === "NEWSLETTER_SIGNUP"
      );

      if (emailLeadsRecipes.length === 0) {
        throw new Error("No email leads recipes found");
      }

      const recipe = emailLeadsRecipes[0];
      const createData = recipeToCreateData(recipe);

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_email",
        storeId: mockStoreId,
        name: recipe.name,
        goal: recipe.goal,
        status: "DRAFT",
        templateType: recipe.templateType,
        contentConfig: "{}",
        designConfig: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            goal: "NEWSLETTER_SIGNUP",
          }),
        })
      );
    });

    it("sales_promos recipes create campaigns with INCREASE_REVENUE goal", async () => {
      const salesRecipes = STYLED_RECIPES.filter(
        (r) => r.category === "sales_promos" && r.goal === "INCREASE_REVENUE"
      );

      if (salesRecipes.length === 0) {
        throw new Error("No sales promo recipes found");
      }

      const recipe = salesRecipes[0];
      const createData = recipeToCreateData(recipe);

      (prisma.campaign.create as Mock).mockResolvedValue({
        id: "cltest_campaign_sales",
        storeId: mockStoreId,
        name: recipe.name,
        goal: recipe.goal,
        status: "DRAFT",
        templateType: recipe.templateType,
        contentConfig: "{}",
        designConfig: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await CampaignMutationService.create(mockStoreId, createData);

      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            goal: "INCREASE_REVENUE",
          }),
        })
      );
    });
  });
});

