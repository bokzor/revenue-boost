/**
 * Discount Service
 *
 * Handles discount code generation and management for campaigns
 * Integrates with Shopify Admin API to create real discount codes
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import {
  createDiscountCode,
  createBxGyDiscountCode,
  getDiscountCode,
  type DiscountCodeInput,
} from "~/lib/shopify/discount.server";
import {
  findCustomerByEmail,
  createCustomer,
  type ShopifyCustomer,
} from "~/lib/shopify/customer.server";
import prisma from "~/db.server";
import {
  DiscountConfigSchema,
  type DiscountConfig,
  type DiscountDeliveryMode,
} from "~/domains/campaigns/types/campaign";
import { z } from "zod";

// Re-export types from campaign domain for consistency
export type {
  DiscountConfig,
  DiscountType,
  DiscountValueType,
  DiscountDeliveryMode,
} from "~/domains/campaigns/types/campaign";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Campaign shape for discount operations (from Prisma)
 */
interface Campaign {
  id: string;
  name: string;
  discountConfig: unknown; // Prisma JSON field
  storeId: string;
}

/**
 * Discount metadata stored in campaign.discountConfig JSON
 */
interface DiscountMetadata {
  _meta?: {
    tierCodes?: TierCodeMetadata[];
    bogoDiscountId?: string;
    bogoDiscountCode?: string;
    freeGiftDiscountId?: string;
    freeGiftDiscountCode?: string;
    lastUpdated?: string;
  };
  sharedDiscountId?: string;
  sharedDiscountCode?: string;
  type?: string;
  createdAt?: string;
  [key: string]: unknown; // Allow other fields
}

/**
 * Result returned by discount code operations
 */
export interface CampaignDiscountResult {
  success: boolean;
  discountCode?: string;
  discountId?: string;
  isNewDiscount: boolean;
  tierUsed?: number; // Index of tier used for tiered discounts
  errors?: string[];
}

/**
 * Metadata for a single tier discount code
 */
export interface TierCodeMetadata {
  tierIndex: number;
  thresholdCents: number;
  discountId: string;
  code: string;
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Configuration for discount code generation
 */
const DISCOUNT_CODE_CONFIG = {
  /** Maximum length of campaign name in code */
  MAX_CAMPAIGN_NAME_LENGTH: 6,
  /** Maximum length of campaign name for tier codes */
  TIER_CAMPAIGN_NAME_LENGTH: 6,
  /** Maximum length of campaign name for BOGO codes */
  BOGO_CAMPAIGN_NAME_LENGTH: 8,
  /** Maximum length of campaign name for gift codes */
  GIFT_CAMPAIGN_NAME_LENGTH: 8,
  /** Length of timestamp suffix */
  TIMESTAMP_LENGTH: 4,
  /** Length of email hash in single-use codes */
  EMAIL_HASH_LENGTH: 4,
  /** Length of random suffix */
  RANDOM_SUFFIX_LENGTH: 6,
} as const;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation schema for getCampaignDiscountCode parameters
 */
const GetCampaignDiscountCodeParamsSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  campaignId: z.string().min(1, "Campaign ID is required"),
  config: DiscountConfigSchema,
  leadEmail: z.string().email("Invalid email format").optional(),
  cartSubtotalCents: z.number().int().nonnegative("Cart subtotal must be non-negative").optional(),
});

type GetCampaignDiscountCodeParams = z.infer<typeof GetCampaignDiscountCodeParamsSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if discount code should be shown to customer based on delivery mode
 */
export function shouldShowDiscountCode(
  deliveryMode: DiscountDeliveryMode
): boolean {
  switch (deliveryMode) {
    case "auto_apply_only":
      return false; // Never show code, only auto-apply
    case "show_code_fallback":
    case "show_code_always":
    case "show_in_popup_authorized_only":
      return true; // Show code in popup
    default:
      // Be permissive: if an unknown mode is provided, prefer to show the code for better UX
      return true;
  }
}

/**
 * Get success message based on delivery mode
 */
export function getSuccessMessage(deliveryMode: DiscountDeliveryMode): string {
  switch (deliveryMode) {
    case "auto_apply_only":
      return "Thanks for subscribing! Your discount will be automatically applied when you checkout.";
    case "show_code_always":
      return "Thanks for subscribing! Your discount code is ready to use.";
    case "show_in_popup_authorized_only":
      return "Thanks for subscribing! Your discount code is authorized for your email address only.";
    case "show_code_fallback":
      return "Thanks for subscribing! Your discount code is ready to use.";
    default:
      return "Thanks for subscribing!";
  }
}

/**
 * Parse discount config from JSON string or JsonValue
 */
export function parseDiscountConfig(configString: any): DiscountConfig {
  try {
    // Handle different input types
    let config: any;
    if (typeof configString === 'string') {
      config = JSON.parse(configString || "{}");
    } else if (configString && typeof configString === 'object') {
      config = configString;
    } else {
      config = {};
    }

    const valueType = config.valueType || "PERCENTAGE";
    const usageType: "shared" | "single_use" =
      config.type === "single_use" ? "single_use" : "shared";

    const result: DiscountConfig = {
      enabled: config.enabled !== false,
      showInPreview: config.showInPreview !== false,
      type: usageType,
      valueType: valueType,
      // Only set value for non-FREE_SHIPPING discounts
      value: valueType !== "FREE_SHIPPING" ? (config.value || 10) : undefined,
      minimumAmount: config.minimumAmount,
      usageLimit: config.usageLimit,
      expiryDays: config.expiryDays || 30,
      prefix: config.prefix || "WELCOME",
      deliveryMode: config.deliveryMode || "show_code_fallback",
      requireLogin: config.requireLogin,
      storeInMetafield: config.storeInMetafield,
      authorizedEmail: config.authorizedEmail,
      requireEmailMatch: config.requireEmailMatch,
      autoApplyMode: config.autoApplyMode || "ajax",
      codePresentation: config.codePresentation || "show_code",
      applicability: config.applicability,
      tiers: config.tiers,
      bogo: config.bogo,
      freeGift: config.freeGift,
      combineWith: config.combineWith,
    };

    return result;
  } catch (error) {
    console.error("[Discount Service] Error parsing discount config:", error);
    return {
      enabled: true,
      showInPreview: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 10,
      deliveryMode: "show_code_fallback",
      autoApplyMode: "ajax",
      codePresentation: "show_code",
    };
  }
}

/**
 * Get or create discount code for a campaign
 * Enhanced to support tiered discounts, BOGO, and free gift
 */
export async function getCampaignDiscountCode(
  admin: AdminApiContext,
  storeId: string,
  campaignId: string,
  config: DiscountConfig,
  leadEmail?: string,
  cartSubtotalCents?: number
): Promise<CampaignDiscountResult> {
  try {
    // Validate parameters
    const validationResult = GetCampaignDiscountCodeParamsSchema.safeParse({
      storeId,
      campaignId,
      config,
      leadEmail,
      cartSubtotalCents,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      console.error("[Discount Service] Parameter validation failed:", errors);
      return {
        success: false,
        isNewDiscount: false,
        errors,
      };
    }

    // Check if discount is enabled
    if (config.enabled === false) {
      return {
        success: false,
        isNewDiscount: false,
        errors: ["Discount is not enabled for this campaign"],
      };
    }

    // Get campaign to check existing discount configuration
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        discountConfig: true,
        storeId: true,
      },
    });

    if (!campaign || campaign.storeId !== storeId) {
      return {
        success: false,
        isNewDiscount: false,
        errors: ["Campaign not found"],
      };
    }

    const discountConfig = typeof campaign.discountConfig === 'string'
      ? JSON.parse(campaign.discountConfig || "{}")
      : (campaign.discountConfig || {});

    // Check for email-specific authorization mode
    if (config.deliveryMode === "show_in_popup_authorized_only" && leadEmail) {
      return await createEmailSpecificDiscount(
        admin,
        leadEmail,
        campaign,
        config
      );
    }

    // Handle BOGO discounts
    if (config.bogo) {
      return await getOrCreateBogoDiscount(admin, campaign, config, discountConfig);
    }

    // Handle free gift discounts
    if (config.freeGift) {
      return await getOrCreateFreeGiftDiscount(admin, campaign, config, discountConfig);
    }

    // Handle tiered discounts
    if (config.tiers && config.tiers.length > 0) {
      return await getOrCreateTieredDiscount(
        admin,
        campaign,
        config,
        discountConfig,
        cartSubtotalCents
      );
    }

    // Determine code generation mode for basic discounts
    const isSingleUse = config.type === "single_use" || config.usageLimit === 1;

    if (!isSingleUse) {
      return await getOrCreateSharedDiscount(
        admin,
        campaign,
        config,
        discountConfig
      );
    } else {
      return await createSingleUseDiscount(admin, campaign, config, leadEmail);
    }
  } catch (error) {
    console.error("[Discount Service] Error getting campaign discount code:", error);
    return {
      success: false,
      isNewDiscount: false,
      errors: ["Failed to get discount code"],
    };
  }
}

/**
 * Get or create a shared discount code for the campaign
 */
async function getOrCreateSharedDiscount(
  admin: AdminApiContext,
  campaign: Campaign,
  config: DiscountConfig,
  existingConfig: DiscountMetadata
): Promise<CampaignDiscountResult> {
  // Check if we already have a shared discount code
  if (existingConfig.sharedDiscountId && existingConfig.sharedDiscountCode) {
    // Verify the discount still exists in Shopify
    const existingDiscount = await getDiscountCode(
      admin,
      existingConfig.sharedDiscountId
    );

    if (existingDiscount.discount && !existingDiscount.errors) {
      console.log(
        `[Discount Service] Reusing existing shared discount: ${existingConfig.sharedDiscountCode}`
      );
      return {
        success: true,
        discountCode: existingConfig.sharedDiscountCode,
        discountId: existingConfig.sharedDiscountId,
        isNewDiscount: false,
      };
    }
  }

  // Create new shared discount code
  const discountCode = generateDiscountCode(
    config.prefix || "WELCOME",
    campaign.name
  );

  console.log(
    `[Discount Service] Creating new shared discount: ${discountCode}`
  );

  const valueType = config.valueType || "PERCENTAGE";
  const discountInput: DiscountCodeInput = {
    title: `${campaign.name} - Shared Discount`,
    code: discountCode,
    value: valueType === "FREE_SHIPPING" ? undefined : config.value,
    valueType: valueType,
    usageLimit: config.usageLimit,
    minimumRequirement: config.minimumAmount
      ? {
          greaterThanOrEqualToSubtotal: config.minimumAmount,
        }
      : undefined,
    endsAt: config.expiryDays
      ? new Date(
          Date.now() + config.expiryDays * 24 * 60 * 60 * 1000
        ).toISOString()
      : undefined,
    appliesOncePerCustomer: true,
    customerSelection: "ALL",
    countries: config.valueType === "FREE_SHIPPING" ? [] : undefined,
    applicability: config.applicability,
    combinesWith: config.combineWith,
  };

  const result = await createDiscountCode(admin, discountInput);

  if (result.errors) {
    console.error(
      "[Discount Service] Failed to create shared discount:",
      result.errors
    );
    return {
      success: false,
      isNewDiscount: false,
      errors: result.errors,
    };
  }

  // Update campaign with new discount info
  await updateDiscountMetadata(campaign.id, existingConfig, {
    sharedDiscountId: result.discount?.id,
    sharedDiscountCode: discountCode,
    type: "shared",
  });

  console.log(
    `[Discount Service] ✅ Created shared discount: ${discountCode} (${result.discount?.id})`
  );

  return {
    success: true,
    discountCode,
    discountId: result.discount?.id,
    isNewDiscount: true,
  };
}

/**
 * Create an email-specific discount code with customer eligibility
 */
export async function createEmailSpecificDiscount(
  admin: AdminApiContext,
  email: string,
  campaign: Campaign,
  config: DiscountConfig
): Promise<CampaignDiscountResult> {
  try {
    let customerId: string | undefined;
    let customer: ShopifyCustomer | undefined;

    // Check if customer exists or create if needed for customer-specific eligibility
    if (config.deliveryMode === "show_in_popup_authorized_only") {
      const customerResult = await findCustomerByEmail(admin, email);

      if (customerResult.customer) {
        customer = customerResult.customer;
        customerId = customer.id;
      } else if (!customerResult.errors) {
        // Create customer for discount assignment
        const createResult = await createCustomer(admin, {
          email,
          acceptsMarketing: true,
          tags: [`revenue-boost:discount:${campaign.id}`],
        });

        if (createResult.customer) {
          customer = createResult.customer;
          customerId = customer.id;
        } else if (createResult.errors?.some(err => err.includes("already been taken"))) {
          // Race condition: customer was created between search and create
          // Search again to get the customer ID
          console.log(`[Discount Service] Customer already exists, searching again: ${email}`);
          const retryResult = await findCustomerByEmail(admin, email);
          if (retryResult.customer) {
            customer = retryResult.customer;
            customerId = customer.id;
          }
        }
      }
    }

    // Generate unique discount code
    const discountCode = generateUniqueDiscountCode(
      config.prefix || "EMAIL",
      email
    );

    console.log(
      `[Discount Service] Creating email-specific discount: ${discountCode} for ${email}`
    );

    const valueType = config.valueType || "PERCENTAGE";
    const discountInput: DiscountCodeInput = {
      title: `${campaign.name} - Email Authorized (${email})`,
      code: discountCode,
      value: valueType === "FREE_SHIPPING" ? undefined : config.value,
      valueType: valueType,
      usageLimit: 1,
      minimumRequirement: config.minimumAmount
        ? {
            greaterThanOrEqualToSubtotal: config.minimumAmount,
          }
        : undefined,
      endsAt: config.expiryDays
        ? new Date(
            Date.now() + config.expiryDays * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined,
      appliesOncePerCustomer: true,
      customerSelection: customerId ? "SPECIFIC_CUSTOMERS" : "ALL",
      specificCustomerIds: customerId ? [customerId] : undefined,
      countries: config.valueType === "FREE_SHIPPING" ? [] : undefined,
      applicability: config.applicability,
      combinesWith: config.combineWith,
    };

    const result = await createDiscountCode(admin, discountInput);

    if (result.errors) {
      console.error(
        "[Discount Service] Failed to create email-specific discount:",
        result.errors
      );
      return {
        success: false,
        isNewDiscount: false,
        errors: result.errors,
      };
    }

    console.log(
      `[Discount Service] ✅ Created email-specific discount: ${discountCode} (${result.discount?.id})`
    );

    return {
      success: true,
      discountCode,
      discountId: result.discount?.id,
      isNewDiscount: true,
    };
  } catch (error) {
    console.error(
      "[Discount Service] Error creating email-specific discount:",
      error
    );
    return {
      success: false,
      isNewDiscount: false,
      errors: ["Failed to create email-specific discount"],
    };
  }
}

/**
 * Create a single-use discount code
 */
async function createSingleUseDiscount(
  admin: AdminApiContext,
  campaign: Campaign,
  config: DiscountConfig,
  leadEmail?: string
): Promise<CampaignDiscountResult> {
  const discountCode = generateUniqueDiscountCode(
    config.prefix || "SINGLE",
    leadEmail
  );

  console.log(
    `[Discount Service] Creating single-use discount: ${discountCode}`
  );

  const valueType = config.valueType || "PERCENTAGE";
  const discountInput: DiscountCodeInput = {
    title: `${campaign.name} - Single Use (${leadEmail || "Anonymous"})`,
    code: discountCode,
    value: valueType === "FREE_SHIPPING" ? undefined : config.value,
    valueType: valueType,
    usageLimit: 1,
    minimumRequirement: config.minimumAmount
      ? {
          greaterThanOrEqualToSubtotal: config.minimumAmount,
        }
      : undefined,
    endsAt: config.expiryDays
      ? new Date(
          Date.now() + config.expiryDays * 24 * 60 * 60 * 1000
        ).toISOString()
      : undefined,
    appliesOncePerCustomer: true,
    customerSelection: "ALL",
    countries: config.valueType === "FREE_SHIPPING" ? [] : undefined,
    applicability: config.applicability,
    combinesWith: config.combineWith,
  };

  const result = await createDiscountCode(admin, discountInput);

  if (result.errors) {
    console.error(
      "[Discount Service] Failed to create single-use discount:",
      result.errors
    );
    return {
      success: false,
      isNewDiscount: false,
      errors: result.errors,
    };
  }

  console.log(
    `[Discount Service] ✅ Created single-use discount: ${discountCode} (${result.discount?.id})`
  );

  return {
    success: true,
    discountCode,
    discountId: result.discount?.id,
    isNewDiscount: true,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update campaign discount metadata in database
 */
async function updateDiscountMetadata(
  campaignId: string,
  existingConfig: DiscountMetadata,
  updates: Record<string, unknown>
): Promise<void> {
  const updatedConfig = {
    ...existingConfig,
    _meta: {
      ...(existingConfig._meta || {}),
      ...updates,
      lastUpdated: new Date().toISOString(),
    },
  };

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { discountConfig: JSON.stringify(updatedConfig) },
  });
}

/**
 * Check if a cached discount code exists and is still valid in Shopify
 */
async function getCachedDiscount(
  admin: AdminApiContext,
  meta: DiscountMetadata['_meta'],
  idKey: string,
  codeKey: string
): Promise<{ code: string; id: string } | null> {
  if (!meta) return null;

  const discountId = (meta as any)[idKey];
  const discountCode = (meta as any)[codeKey];

  if (!discountId || !discountCode) return null;

  const existing = await getDiscountCode(admin, discountId);

  if (existing.discount && !existing.errors) {
    return { code: discountCode, id: discountId };
  }

  return null;
}

/**
 * Generate a discount code based on campaign name
 */
function generateDiscountCode(
  prefix: string,
  campaignName: string,
  maxLength: number = DISCOUNT_CODE_CONFIG.MAX_CAMPAIGN_NAME_LENGTH
): string {
  const cleanName = campaignName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .substring(0, maxLength);

  const timestamp = Date.now()
    .toString()
    .slice(-DISCOUNT_CODE_CONFIG.TIMESTAMP_LENGTH);

  return `${prefix}${cleanName}${timestamp}`;
}

/**
 * Generate a unique discount code for single use
 */
function generateUniqueDiscountCode(prefix: string, email?: string): string {
  const emailHash = email
    ? email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .substring(0, DISCOUNT_CODE_CONFIG.EMAIL_HASH_LENGTH)
    : "ANON";

  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 2 + DISCOUNT_CODE_CONFIG.RANDOM_SUFFIX_LENGTH)
    .toUpperCase();

  return `${prefix}${emailHash}${randomSuffix}`;
}

/**
 * Get or create tiered discount codes
 */
async function getOrCreateTieredDiscount(
  admin: AdminApiContext,
  campaign: Campaign,
  config: DiscountConfig,
  existingConfig: DiscountMetadata,
  cartSubtotalCents?: number
): Promise<CampaignDiscountResult> {
  /*
   * NOTE [Tiered discounts]
   * - We pre-create one discount code per tier with minimumRequirement=threshold. Shopify enforces
   *   the threshold at checkout, so removing items after issuance invalidates higher-tier codes.
   * - UX caveat: code may appear applied in cart even if checkout will later reject it below threshold.
   * TODO: Provide a helper to re-evaluate/downgrade tier on cart updates and recommend using
   *       /api/discounts.issue with cartSubtotalCents when issuing tiered discounts near checkout.
   */

  const tiers = config.tiers!;

  // Check for existing tier codes in metadata
  const meta = (existingConfig._meta || {}) as any;
  const tierCodes: TierCodeMetadata[] = meta.tierCodes || [];

  // Validate existing tier codes
  let needsRecreation = tierCodes.length !== tiers.length;

  if (!needsRecreation) {
    // Verify all tier codes still exist in Shopify
    for (const tierCode of tierCodes) {
      const existing = await getDiscountCode(admin, tierCode.discountId);
      if (existing.errors) {
        needsRecreation = true;
        break;
      }
    }
  }

  // Create tier codes if needed
  if (needsRecreation) {
    console.log(`[Discount Service] Creating ${tiers.length} tier codes for campaign ${campaign.id}`);

    const newTierCodes: TierCodeMetadata[] = [];

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresholdDollars = (tier.thresholdCents / 100).toFixed(0);
      const code = `${config.prefix || "TIER"}-${campaign.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase()}-${thresholdDollars}`;

      const discountInput: DiscountCodeInput = {
        title: `${campaign.name} - Tier ${i + 1} ($${thresholdDollars}+)`,
        code,
        value: tier.discount.kind === "free_shipping" ? undefined : tier.discount.value,
        valueType: tier.discount.kind === "percentage" ? "PERCENTAGE" : tier.discount.kind === "fixed" ? "FIXED_AMOUNT" : "FREE_SHIPPING",
        minimumRequirement: {
          greaterThanOrEqualToSubtotal: tier.thresholdCents / 100,
        },
        usageLimit: config.usageLimit,
        endsAt: config.expiryDays
          ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        appliesOncePerCustomer: true,
        customerSelection: "ALL",
        applicability: config.applicability,
        combinesWith: config.combineWith,
      };

      const result = await createDiscountCode(admin, discountInput);

      if (result.errors || !result.discount) {
        console.error(`[Discount Service] Failed to create tier ${i} code:`, result.errors);
        return {
          success: false,
          isNewDiscount: false,
          errors: result.errors || ["Failed to create tier discount"],
        };
      }

      newTierCodes.push({
        tierIndex: i,
        thresholdCents: tier.thresholdCents,
        discountId: result.discount.id,
        code,
      });

      console.log(`[Discount Service] ✅ Created tier ${i} code: ${code} (${result.discount.id})`);
    }

    // Update campaign metadata
    await updateDiscountMetadata(campaign.id, existingConfig, {
      tierCodes: newTierCodes,
    });
  }

  // Select best tier based on cart subtotal
  const freshMeta = (existingConfig._meta || {}) as any;
  const freshTierCodes: TierCodeMetadata[] = freshMeta.tierCodes || [];
  let selectedTierIndex = 0;

  if (cartSubtotalCents !== undefined) {
    // Find highest threshold <= cart subtotal
    const eligibleTiers = freshTierCodes
      .filter(tc => tc.thresholdCents <= cartSubtotalCents)
      .sort((a, b) => b.thresholdCents - a.thresholdCents);

    if (eligibleTiers.length > 0) {
      selectedTierIndex = eligibleTiers[0].tierIndex;
    }
  }

  const selectedTier = freshTierCodes[selectedTierIndex];

  if (!selectedTier) {
    return {
      success: false,
      isNewDiscount: false,
      errors: ["No tier code available"],
    };
  }

  console.log(
    `[Discount Service] Selected tier ${selectedTierIndex} code: ${selectedTier.code} (threshold: $${(selectedTier.thresholdCents / 100).toFixed(2)}, cart: $${cartSubtotalCents ? (cartSubtotalCents / 100).toFixed(2) : "N/A"})`
  );

  return {
    success: true,
    discountCode: selectedTier.code,
    discountId: selectedTier.discountId,
    isNewDiscount: needsRecreation,
    tierUsed: selectedTierIndex,
  };
}

/**
 * Get or create BOGO discount code
 */
async function getOrCreateBogoDiscount(
  admin: AdminApiContext,
  campaign: Campaign,
  config: DiscountConfig,
  existingConfig: DiscountMetadata
): Promise<CampaignDiscountResult> {
  const bogo = config.bogo!;

  // Check for existing BOGO code
  const cached = await getCachedDiscount(
    admin,
    existingConfig._meta,
    'bogoDiscountId',
    'bogoDiscountCode'
  );

  if (cached) {
    console.log(`[Discount Service] Reusing existing BOGO discount: ${cached.code}`);
    return {
      success: true,
      discountCode: cached.code,
      discountId: cached.id,
      isNewDiscount: false,
    };
  }

  // Create new BOGO code
  const code = generateDiscountCode(
    config.prefix || "BOGO",
    campaign.name,
    DISCOUNT_CODE_CONFIG.BOGO_CAMPAIGN_NAME_LENGTH
  );

  console.log(`[Discount Service] Creating BOGO discount: ${code}`);

  // Validate that BOGO get has specific products/collections defined
  if (!bogo.get.ids || bogo.get.ids.length === 0) {
    console.error(`[Discount Service] BOGO discount requires specific product/collection IDs for 'get'`);
    return {
      success: false,
      isNewDiscount: false,
      errors: ["BOGO discount requires specific product or collection IDs for the 'get' reward"],
    };
  }

  const discountInput: DiscountCodeInput & { bxgy: any } = {
    title: `${campaign.name} - BOGO`,
    code,
    valueType: "PERCENTAGE",
    usageLimit: config.usageLimit,
    endsAt: config.expiryDays
      ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    appliesOncePerCustomer: bogo.get.appliesOncePerOrder !== false,
    customerSelection: "ALL",
    bxgy: {
      buy: {
        quantity: bogo.buy.quantity,
        value: bogo.buy.minSubtotalCents,
        // Customer buys: can be "any" or specific products/collections
        applicability: {
          scope: bogo.buy.scope === "any" ? "all" : bogo.buy.scope,
          productIds: bogo.buy.scope === "products" ? bogo.buy.ids : undefined,
          collectionIds: bogo.buy.scope === "collections" ? bogo.buy.ids : undefined,
        },
      },
      get: {
        quantity: bogo.get.quantity,
        discountPercentage: bogo.get.discount.kind === "percentage" ? bogo.get.discount.value : undefined,
        discountAmount: bogo.get.discount.kind === "fixed" ? bogo.get.discount.value : undefined,
        // Customer gets: must be specific products/collections
        applicability: {
          scope: bogo.get.scope,
          productIds: bogo.get.scope === "products" ? bogo.get.ids : undefined,
          collectionIds: bogo.get.scope === "collections" ? bogo.get.ids : undefined,
        },
      },
    },
  };

  const result = await createBxGyDiscountCode(admin, discountInput);

  if (result.errors || !result.discount) {
    console.error(`[Discount Service] Failed to create BOGO discount:`, result.errors);
    return {
      success: false,
      isNewDiscount: false,
      errors: result.errors || ["Failed to create BOGO discount"],
    };
  }

  // Update campaign metadata
  await updateDiscountMetadata(campaign.id, existingConfig, {
    bogoDiscountId: result.discount.id,
    bogoDiscountCode: code,
  });

  console.log(`[Discount Service] ✅ Created BOGO discount: ${code} (${result.discount.id})`);

  return {
    success: true,
    discountCode: code,
    discountId: result.discount.id,
    isNewDiscount: true,
  };
}

/**
 * Get or create free gift discount code (via BxGy with 100% off)
 */
async function getOrCreateFreeGiftDiscount(
  admin: AdminApiContext,
  campaign: Campaign,
  config: DiscountConfig,
  existingConfig: DiscountMetadata
): Promise<CampaignDiscountResult> {
  const freeGift = config.freeGift!;

  // Check for existing free gift code
  const cached = await getCachedDiscount(
    admin,
    existingConfig._meta,
    'freeGiftDiscountId',
    'freeGiftDiscountCode'
  );

  if (cached) {
    console.log(`[Discount Service] Reusing existing free gift discount: ${cached.code}`);
    return {
      success: true,
      discountCode: cached.code,
      discountId: cached.id,
      isNewDiscount: false,
    };
  }

  // Create new free gift code
  const code = generateDiscountCode(
    config.prefix || "GIFT",
    campaign.name,
    DISCOUNT_CODE_CONFIG.GIFT_CAMPAIGN_NAME_LENGTH
  );

  console.log(`[Discount Service] Creating free gift discount: ${code}`);

  // Validate that free gift has either a product ID or variant ID defined
  if (!freeGift.productId && !freeGift.variantId) {
    console.error(`[Discount Service] Free gift discount requires either a product ID or variant ID`);
    return {
      success: false,
      isNewDiscount: false,
      errors: ["Free gift discount requires either a product ID or variant ID to be configured"],
    };
  }

  // Use productId if available, otherwise extract product ID from variantId
  // Shopify variant GIDs are in format: gid://shopify/ProductVariant/123
  // We need product GID in format: gid://shopify/Product/456
  // For BxGy discounts, we can use the productId directly if provided
  const productIdToUse = freeGift.productId || freeGift.variantId;

  // For free gift discounts, use a basic percentage discount (100% off) on the specific product
  // with a minimum purchase requirement. This is simpler than BxGy and works for "any purchase".
  // Note: BxGy doesn't support "buy anything" - it requires specific products/collections

  const discountInput: DiscountCodeInput = {
    title: `${campaign.name} - Free Gift`,
    code,
    valueType: "PERCENTAGE",
    value: 100, // 100% off = free
    usageLimit: config.usageLimit,
    minimumRequirement: freeGift.minSubtotalCents
      ? { greaterThanOrEqualToSubtotal: freeGift.minSubtotalCents / 100 }
      : undefined,
    endsAt: config.expiryDays
      ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    appliesOncePerCustomer: true,
    customerSelection: "ALL",
    // Apply discount only to the free gift product/variant
    applicability: {
      scope: "products",
      productIds: [productIdToUse],
    },
  };

  const result = await createDiscountCode(admin, discountInput);

  if (result.errors || !result.discount) {
    console.error(`[Discount Service] Failed to create free gift discount:`, result.errors);
    return {
      success: false,
      isNewDiscount: false,
      errors: result.errors || ["Failed to create free gift discount"],
    };
  }

  // Update campaign metadata
  await updateDiscountMetadata(campaign.id, existingConfig, {
    freeGiftDiscountId: result.discount.id,
    freeGiftDiscountCode: code,
  });

  console.log(`[Discount Service] ✅ Created free gift discount: ${code} (${result.discount.id})`);

  return {
    success: true,
    discountCode: code,
    discountId: result.discount.id,
    isNewDiscount: true,
  };
}

/**
 * Validate discount configuration
 */
export function validateDiscountConfig(config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.type || !["shared", "single_use"].includes(config.type)) {
    errors.push("Invalid discount type. Must be 'shared' or 'single_use'");
  }

  if (
    !config.valueType ||
    !["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].includes(config.valueType)
  ) {
    errors.push(
      "Invalid value type. Must be 'PERCENTAGE', 'FIXED_AMOUNT', or 'FREE_SHIPPING'"
    );
  }

  if (
    config.valueType !== "FREE_SHIPPING" &&
    (!config.value || config.value <= 0)
  ) {
    errors.push(
      "Discount value must be greater than 0 (except for FREE_SHIPPING)"
    );
  }

  if (config.valueType === "PERCENTAGE" && config.value > 100) {
    errors.push("Percentage discount cannot exceed 100%");
  }

  if (config.minimumAmount && config.minimumAmount < 0) {
    errors.push("Minimum amount cannot be negative");
  }

  if (config.usageLimit && config.usageLimit < 1) {
    errors.push("Usage limit must be at least 1");
  }

  if (config.expiryDays && config.expiryDays < 1) {
    errors.push("Expiry days must be at least 1");
  }

  // Validate tiers
  if (config.tiers && config.tiers.length > 0) {
    const thresholds = config.tiers.map((t: any) => t.thresholdCents);
    const sorted = [...thresholds].sort((a, b) => a - b);
    if (JSON.stringify(thresholds) !== JSON.stringify(sorted)) {
      errors.push("Tier thresholds must be in ascending order");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

