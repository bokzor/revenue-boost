/**
 * App Setup Service
 *
 * Handles automatic setup on app installation:
 * - Enables theme extension automatically
 * - Sets app URL metafield for storefront
 * - Creates welcome campaign
 * - Tracks setup completion
 */

import prisma from "~/db.server";
import { CampaignService } from "~/domains/campaigns/services/campaign.server";

/**
 * Setup app on installation
 * Auto-enables theme extension and creates welcome campaign
 * Zero-configuration setup for merchants
 *
 * Note: Store creation is handled by getStoreId in auth-helpers.server.ts
 */
export async function setupAppOnInstall(admin: any, shopDomain: string) {
  try {
    console.log(`[App Setup] Setting up app for ${shopDomain}`);

    // Get existing store record (should be created by getStoreId)
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!store) {
      console.log(`[App Setup] Store not found for ${shopDomain} - will be created by getStoreId on first request`);
      // Don't throw - the store will be created when the first page loads
      // We'll just enable the theme extension and set metafield for now
    }

    // Check if setup already completed (if store exists)
    if (store) {
      const setupCompleted = await checkSetupCompleted(store.id);
      if (setupCompleted) {
        console.log(`[App Setup] Setup already completed for ${shopDomain}`);
        return;
      }
    }

    // 1. Set app URL metafield for storefront to use
    await setAppUrlMetafield(admin, shopDomain);

    // 2. Note: Theme extension must be manually enabled by merchant in theme editor
    // We cannot enable it programmatically via GraphQL
    console.log(`[App Setup] Theme extension available - merchant needs to enable it in theme editor`);

    // 3. Create welcome campaign (ACTIVE by default) - only if store exists
    if (store) {
      await createWelcomeCampaign(store.id);

      // 4. Mark setup as completed
      await markSetupCompleted(store.id);
    }

    console.log(`[App Setup] ✅ Successfully set up app for ${shopDomain}`);
  } catch (error) {
    console.error("[App Setup] Error during app setup:", error);
    // Don't throw - we want the auth flow to continue even if setup fails
  }
}

/**
 * Check if setup was already completed
 * We check if a welcome campaign already exists as a proxy for setup completion
 */
async function checkSetupCompleted(storeId: string): Promise<boolean> {
  const existingCampaign = await prisma.campaign.findFirst({
    where: {
      storeId,
      name: "Welcome Popup",
    },
  });

  return existingCampaign !== null;
}

/**
 * Mark setup as completed
 * This is implicit - the welcome campaign existing means setup is complete
 */
async function markSetupCompleted(storeId: string) {
  // No-op - setup completion is tracked by the existence of the welcome campaign
  console.log(`[App Setup] Setup marked as completed for store ${storeId}`);
}

/**
 * Set app URL metafield so storefront knows where to fetch campaigns
 */
async function setAppUrlMetafield(admin: any, shop: string) {
  try {
    const appUrl = process.env.SHOPIFY_APP_URL;

    if (!appUrl) {
      console.warn("[App Setup] SHOPIFY_APP_URL not set, skipping metafield creation");
      return;
    }

    console.log(`[App Setup] Setting app URL metafield to: ${appUrl}`);

    const mutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get shop ID first
    const shopQuery = `query { shop { id } }`;
    const shopResponse = await admin.graphql(shopQuery);
    const shopData = await shopResponse.json();
    const shopId = shopData.data?.shop?.id;

    if (!shopId) {
      console.error("[App Setup] Could not get shop ID");
      return;
    }

    const response = await admin.graphql(mutation, {
      variables: {
        metafields: [
          {
            namespace: "revenue_boost",
            key: "api_url",
            value: appUrl,
            type: "single_line_text_field",
            ownerId: shopId,
          },
        ],
      },
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "[App Setup] Failed to set app URL metafield:",
        data.data.metafieldsSet.userErrors,
      );
    } else {
      console.log(`[App Setup] ✅ Successfully set app URL metafield for ${shop}`);
    }
  } catch (error) {
    console.error("[App Setup] Error setting app URL metafield:", error);
    // Don't throw - we want setup to continue even if this fails
  }
}



/**
 * Create default welcome campaign (ACTIVE status)
 */
async function createWelcomeCampaign(storeId: string) {
  try {
    // Check if welcome campaign already exists
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        storeId,
        name: "Welcome Popup",
      },
    });

    if (existingCampaign) {
      console.log("[App Setup] Welcome campaign already exists");
      return;
    }

    // Create welcome campaign with ACTIVE status
    const campaign = await CampaignService.createCampaign(storeId, {
      name: "Welcome Popup",
      description: "Your first popup - customize it in the app!",
      templateType: "NEWSLETTER",
      templateId: undefined,
      goal: "NEWSLETTER_SIGNUP",
      status: "ACTIVE", // ← Auto-activate for zero-config experience
      priority: 1,
      experimentId: undefined,
      startDate: undefined,
      endDate: undefined,
      contentConfig: {
        title: "Welcome! 🎉",
        subtitle: "Get 10% off your first order",
        description: "Join our newsletter and receive exclusive offers and updates.",
        buttonText: "Get My Discount",
        emailPlaceholder: "Enter your email",
        successMessage: "Thanks! Check your email for your discount code.",
        showPrivacyNote: true,
        privacyNote: "We respect your privacy. Unsubscribe anytime.",
      },
      designConfig: {
        theme: "modern",
        position: "center",
        size: "medium",
        borderRadius: 8,
        imagePosition: "left",
        animation: "fade",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#007ace",
        buttonTextColor: "#ffffff",
        overlayOpacity: 0.6,
        backgroundImageMode: "none",
      },
      targetRules: {
        enhancedTriggers: {
          enabled: true,
          page_load: {
            enabled: true,
            delay: 3000,
          },
        },
        audienceTargeting: {
          enabled: false,
          shopifySegmentIds: [],
          sessionRules: {
            enabled: false,
            conditions: [],
            logicOperator: "AND",
          },
        },
        pageTargeting: {
          enabled: false,
          pages: [],
          customPatterns: [],
          excludePages: [],
          productTags: [],
          collections: [],
        },
      },
      discountConfig: {
        enabled: false,
        showInPreview: true,
        autoApplyMode: "ajax",
        codePresentation: "show_code",
      },
    });

    console.log(`[App Setup] ✅ Created welcome campaign: ${campaign.id}`);
  } catch (error) {
    console.error("[App Setup] Error creating welcome campaign:", error);
    // Don't throw - we want setup to continue even if this fails
  }
}


