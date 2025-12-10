/**
 * Discount Service
 *
 * Handles discount code generation and management for campaigns
 * Integrates with Shopify Admin API to create real discount codes
 */

import { logger } from "~/lib/logger.server";
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
  type DiscountBehavior,
} from "~/domains/campaigns/types/campaign";
import { z } from "zod";

// Re-export types and helper functions from campaign domain for consistency
export type {
  DiscountConfig,
  DiscountType,
  DiscountValueType,
  DiscountBehavior,
} from "~/domains/campaigns/types/campaign";

export { shouldAutoApply, requiresEmailRestriction } from "~/domains/campaigns/types/campaign";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Campaign shape for discount operations (from Prisma)
 */
interface Campaign {
  id: string;
  name: string;
  templateType?: string; // Optional for logging/debugging
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

// ============================================================================
// DISCOUNT STRATEGIES
// ============================================================================

interface DiscountStrategyContext {
  admin: AdminApiContext;
  campaign: Campaign;
  config: DiscountConfig;
  metadata: DiscountMetadata;
  leadEmail?: string;
  cartSubtotalCents?: number;
}

interface DiscountStrategy {
  name: string;
  canHandle: (ctx: DiscountStrategyContext) => boolean;
  apply: (ctx: DiscountStrategyContext) => Promise<CampaignDiscountResult>;
}

const DISCOUNT_STRATEGIES: DiscountStrategy[] = [
  {
    name: "emailAuthorized",
    canHandle: (ctx) =>
      ctx.config.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL" && !!ctx.leadEmail,
    apply: (ctx) =>
      createEmailSpecificDiscount(ctx.admin, ctx.leadEmail as string, ctx.campaign, ctx.config),
  },
  {
    name: "bogo",
    canHandle: (ctx) => !!ctx.config.bogo,
    apply: (ctx) => getOrCreateBogoDiscount(ctx.admin, ctx.campaign, ctx.config, ctx.metadata),
  },
  {
    name: "freeGift",
    canHandle: (ctx) => !!ctx.config.freeGift,
    apply: (ctx) => getOrCreateFreeGiftDiscount(ctx.admin, ctx.campaign, ctx.config, ctx.metadata),
  },
  {
    name: "tiered",
    canHandle: (ctx) => !!ctx.config.tiers && ctx.config.tiers.length > 0,
    apply: (ctx) =>
      getOrCreateTieredDiscount(
        ctx.admin,
        ctx.campaign,
        ctx.config,
        ctx.metadata,
        ctx.cartSubtotalCents
      ),
  },
  {
    name: "singleUse",
    canHandle: (ctx) => ctx.config.type === "single_use" || ctx.config.usageLimit === 1,
    apply: (ctx) => createSingleUseDiscount(ctx.admin, ctx.campaign, ctx.config, ctx.leadEmail),
  },
  {
    name: "shared",
    canHandle: (ctx) => !(ctx.config.type === "single_use" || ctx.config.usageLimit === 1),
    apply: (ctx) => getOrCreateSharedDiscount(ctx.admin, ctx.campaign, ctx.config, ctx.metadata),
  },
];

type DiscountServiceStrategyName = (typeof DISCOUNT_STRATEGIES)[number]["name"];

function orderStrategies(config: DiscountConfig): DiscountStrategy[] {
  const strategyByName: Record<DiscountServiceStrategyName, DiscountStrategy> =
    DISCOUNT_STRATEGIES.reduce(
      (acc, strategy) => ({ ...acc, [strategy.name]: strategy }),
      {} as Record<DiscountServiceStrategyName, DiscountStrategy>
    );

  const requested = config.strategy;
  const preferred: DiscountServiceStrategyName[] = [];

  // Always consider email-restricted strategy first when applicable
  const baseOrder: DiscountServiceStrategyName[] = [
    "emailAuthorized",
    "bogo",
    "freeGift",
    "tiered",
    "singleUse",
    "shared",
  ];

  if (requested === "bogo") {
    preferred.push("bogo");
  } else if (requested === "free_gift") {
    preferred.push("freeGift");
  } else if (requested === "tiered") {
    preferred.push("tiered");
  } else if (requested === "bundle" || requested === "simple") {
    preferred.push("singleUse", "shared");
  }

  const orderedNames = [...baseOrder];

  // Insert preferred priorities right after emailAuthorized while keeping uniqueness
  if (preferred.length > 0) {
    orderedNames.splice(1, 0, ...preferred);
  }

  const uniqueNames = orderedNames.filter(
    (name, index) => orderedNames.indexOf(name) === index
  );

  return uniqueNames
    .map((name) => strategyByName[name])
    .filter(Boolean);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if discount code should be shown to customer based on behavior
 * All three behavior options show the code to the customer
 */
export function shouldShowDiscountCode(_behavior: DiscountBehavior): boolean {
  // All behaviors show the code
  return true;
}

/**
 * Get success message based on behavior
 */
export function getSuccessMessage(behavior: DiscountBehavior): string {
  switch (behavior) {
    case "SHOW_CODE_AND_AUTO_APPLY":
      return "Thanks for subscribing! Your discount code will be automatically applied to your cart.";
    case "SHOW_CODE_ONLY":
      return "Thanks for subscribing! Your discount code is ready to use at checkout.";
    case "SHOW_CODE_AND_ASSIGN_TO_EMAIL":
      return "Thanks for subscribing! Your discount code is authorized for your email address only.";
    default:
      return "Thanks for subscribing!";
  }
}

/**
 * Parse discount config from JSON string or JsonValue
 */
export function parseDiscountConfig(configString: unknown): DiscountConfig {
  try {
    const parsedConfig = DiscountConfigSchema.partial().parse(
      typeof configString === "string" && configString.length > 0
        ? JSON.parse(configString)
        : configString ?? {}
    );

    const valueType = parsedConfig.valueType ?? "PERCENTAGE";
    const usageType: "shared" | "single_use" =
      parsedConfig.type === "single_use" ? "single_use" : "shared";

    // Infer strategy from config if not explicitly set or if set to default "simple"
    // This allows strategy to be auto-detected from bogo, freeGift, tiers, etc.
    const inferredStrategy =
      parsedConfig.tiers && parsedConfig.tiers.length > 0
        ? "tiered"
        : parsedConfig.bogo
          ? "bogo"
          : parsedConfig.freeGift
            ? "free_gift"
            : parsedConfig.applicability?.scope === "products"
              ? "bundle"
              : "simple";

    // Use explicit strategy if set and not "simple", otherwise use inferred
    const strategy =
      parsedConfig.strategy && parsedConfig.strategy !== "simple"
        ? parsedConfig.strategy
        : inferredStrategy;

    const result: DiscountConfig = {
      enabled: parsedConfig.enabled ?? true,
      showInPreview: parsedConfig.showInPreview ?? true,
      strategy,
      type: usageType,
      valueType,
      // Only set value for non-FREE_SHIPPING discounts
      value: valueType !== "FREE_SHIPPING" ? parsedConfig.value ?? 10 : undefined,
      minimumAmount: parsedConfig.minimumAmount,
      usageLimit: parsedConfig.usageLimit,
      expiryDays: parsedConfig.expiryDays ?? 30,
      prefix: parsedConfig.prefix ?? "WELCOME",
      behavior: parsedConfig.behavior ?? "SHOW_CODE_AND_AUTO_APPLY",
      applicability: parsedConfig.applicability,
      tiers: parsedConfig.tiers,
      bogo: parsedConfig.bogo,
      freeGift: parsedConfig.freeGift,
      combineWith: parsedConfig.combineWith,
    };

    return result;
  } catch (error) {
    logger.error({ error }, "[Discount Service] Error parsing discount config:");
    return {
      enabled: true,
      showInPreview: true,
      strategy: "simple",
      type: "shared",
      valueType: "PERCENTAGE",
      value: 10,
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
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
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      logger.error({ errors }, "[Discount] Parameter validation failed");
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
        templateType: true,
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

    // Parse discount metadata from campaign.discountConfig
    // For templates with prize-level configs (Scratch Card, Spin-to-Win),
    // campaign.discountConfig may be null/empty - this is expected and valid
    let discountMetadata: DiscountMetadata = {};

    if (campaign.discountConfig) {
      try {
        discountMetadata =
          typeof campaign.discountConfig === "string"
            ? JSON.parse(campaign.discountConfig)
            : campaign.discountConfig;
      } catch (error) {
        logger.warn({ campaignId, error }, "[Discount] Failed to parse discountConfig, using empty metadata");
        discountMetadata = {};
      }
    }

    const context: DiscountStrategyContext = {
      admin,
      campaign,
      config,
      metadata: discountMetadata,
      leadEmail,
      cartSubtotalCents,
    };

    const strategiesToTry = orderStrategies(config);

    // Try each strategy in order until one matches
    for (const strategy of strategiesToTry) {
      if (strategy.canHandle(context)) {
        logger.debug({ strategy: strategy.name, campaignId, templateType: campaign.templateType, behavior: config.behavior }, "[Discount] Using strategy");

        try {
          return await strategy.apply(context);
        } catch (error) {
          logger.error({ strategy: strategy.name, campaignId, error }, "[Discount] Strategy failed");
          continue;
        }
      }
    }

    // Fallback: this should not happen, but return a safe error if no strategy matched
    logger.error({ storeId, campaignId, templateType: campaign.templateType, configType: config.type }, "[Discount] No strategy matched");
    return {
      success: false,
      isNewDiscount: false,
      errors: ["No applicable discount strategy found"],
    };
  } catch (error) {
    logger.error({ error }, "[Discount Service] Error getting campaign discount code:");
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
    const existingDiscount = await getDiscountCode(admin, existingConfig.sharedDiscountId);

    if (existingDiscount.discount && !existingDiscount.errors) {
      logger.debug({ code: existingConfig.sharedDiscountCode }, "[Discount] Reusing existing shared discount");
      return {
        success: true,
        discountCode: existingConfig.sharedDiscountCode,
        discountId: existingConfig.sharedDiscountId,
        isNewDiscount: false,
      };
    }
  }

  // Create new shared discount code
  const discountCode = generateDiscountCode(config.prefix || "WELCOME", campaign.name);

  logger.debug({ discountCode }, "[Discount] Creating new shared discount");

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
      ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    appliesOncePerCustomer: true,
    customerSelection: "ALL",
    countries: config.valueType === "FREE_SHIPPING" ? [] : undefined,
    applicability: config.applicability,
    combinesWith: config.combineWith,
  };

  const result = await createDiscountCode(admin, discountInput);

  if (result.errors) {
    logger.error({ errors: result.errors }, "[Discount] Failed to create shared discount");
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

  logger.info({ discountCode, discountId: result.discount?.id }, "[Discount] Created shared discount");

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
    if (config.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
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
        } else if (createResult.errors?.some((err) => err.includes("already been taken"))) {
          // Race condition: customer was created between search and create
          // Search again to get the customer ID
          logger.debug("[Discount Service] Customer already exists, searching again: ${email}");
          const retryResult = await findCustomerByEmail(admin, email);
          if (retryResult.customer) {
            customer = retryResult.customer;
            customerId = customer.id;
          }
        }
      }
    }

    // Generate unique discount code
    const discountCode = generateUniqueDiscountCode(config.prefix || "EMAIL", email);

    logger.debug({ discountCode, email }, "[Discount] Creating email-specific discount");

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
        ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
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
      logger.error({ errors: result.errors }, "[Discount] Failed to create email-specific discount");
      return {
        success: false,
        isNewDiscount: false,
        errors: result.errors,
      };
    }

    logger.info({ discountCode, discountId: result.discount?.id }, "[Discount] Created email-specific discount");

    return {
      success: true,
      discountCode,
      discountId: result.discount?.id,
      isNewDiscount: true,
    };
  } catch (error) {
    logger.error({ error }, "[Discount Service] Error creating email-specific discount:");
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
  const discountCode = generateUniqueDiscountCode(config.prefix || "SINGLE", leadEmail);

  logger.debug("[Discount Service] Creating single-use discount: ${discountCode}");

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
      ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    appliesOncePerCustomer: true,
    customerSelection: "ALL",
    countries: config.valueType === "FREE_SHIPPING" ? [] : undefined,
    applicability: config.applicability,
    combinesWith: config.combineWith,
  };

  const result = await createDiscountCode(admin, discountInput);

  if (result.errors) {
    console.error("[Discount Service] Failed to create single-use discount:", result.errors);
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
  meta: DiscountMetadata["_meta"],
  idKey: string,
  codeKey: string
): Promise<{ code: string; id: string } | null> {
  if (!meta) return null;

  const discountId = (meta as Record<string, unknown>)[idKey] as string | undefined;
  const discountCode = (meta as Record<string, unknown>)[codeKey] as string | undefined;

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

  const timestamp = Date.now().toString().slice(-DISCOUNT_CODE_CONFIG.TIMESTAMP_LENGTH);

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
  const meta = (existingConfig._meta || {}) as {
    tierCodes?: TierCodeMetadata[];
  };
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

  // Array to hold newly created tier codes (used when needsRecreation is true)
  const newTierCodes: TierCodeMetadata[] = [];

  // Create tier codes if needed
  if (needsRecreation) {
    console.log(
      `[Discount Service] Creating ${tiers.length} tier codes for campaign ${campaign.id}`
    );

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresholdDollars = (tier.thresholdCents / 100).toFixed(0);
      const code = `${config.prefix || "TIER"}-${campaign.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 6)
        .toUpperCase()}-${thresholdDollars}`;

      const discountInput: DiscountCodeInput = {
        title: `${campaign.name} - Tier ${i + 1} ($${thresholdDollars}+)`,
        code,
        value: tier.discount.kind === "free_shipping" ? undefined : tier.discount.value,
        valueType:
          tier.discount.kind === "percentage"
            ? "PERCENTAGE"
            : tier.discount.kind === "fixed"
              ? "FIXED_AMOUNT"
              : "FREE_SHIPPING",
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

      logger.debug("[Discount Service] ✅ Created tier ${i} code: ${code} (${result.discount.id})");
    }

    // Update campaign metadata
    await updateDiscountMetadata(campaign.id, existingConfig, {
      tierCodes: newTierCodes,
    });
  }

  // Select best tier based on cart subtotal
  // Use newTierCodes if we just created them, otherwise read from existingConfig._meta
  const tierCodesToUse: TierCodeMetadata[] = needsRecreation
    ? newTierCodes
    : ((existingConfig._meta as { tierCodes?: TierCodeMetadata[] })?.tierCodes || []);

  let selectedTierIndex = 0;

  if (cartSubtotalCents !== undefined) {
    // Find highest threshold <= cart subtotal
    const eligibleTiers = tierCodesToUse
      .filter((tc) => tc.thresholdCents <= cartSubtotalCents)
      .sort((a, b) => b.thresholdCents - a.thresholdCents);

    if (eligibleTiers.length > 0) {
      selectedTierIndex = eligibleTiers[0].tierIndex;
    }
  }

  const selectedTier = tierCodesToUse[selectedTierIndex];

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
    "bogoDiscountId",
    "bogoDiscountCode"
  );

  if (cached) {
    logger.debug("[Discount Service] Reusing existing BOGO discount: ${cached.code}");
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

  logger.debug("[Discount Service] Creating BOGO discount: ${code}");

  // Validate that BOGO get has specific products/collections defined
  if (!bogo.get.ids || bogo.get.ids.length === 0) {
    console.error(
      `[Discount Service] BOGO discount requires specific product/collection IDs for 'get'`
    );
    return {
      success: false,
      isNewDiscount: false,
      errors: ["BOGO discount requires specific product or collection IDs for the 'get' reward"],
    };
  }

  type BxgyDiscountInput = Parameters<typeof createBxGyDiscountCode>[1];

  const discountInput: BxgyDiscountInput = {
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
        discountPercentage:
          bogo.get.discount.kind === "percentage" ? bogo.get.discount.value : undefined,
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

  logger.debug("[Discount Service] ✅ Created BOGO discount: ${code} (${result.discount.id})");

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
    "freeGiftDiscountId",
    "freeGiftDiscountCode"
  );

  if (cached) {
    logger.debug("[Discount Service] Reusing existing free gift discount: ${cached.code}");
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

  logger.debug("[Discount Service] Creating free gift discount: ${code}");

  // Validate that free gift has either a product ID or variant ID defined
  if (!freeGift.productId && !freeGift.variantId) {
    console.error(
      `[Discount Service] Free gift discount requires either a product ID or variant ID`
    );
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
  // with a minimum purchase requirement.
  // Note: Shopify's discountOnQuantity (to limit to 1 item) is ONLY available for BXGY discounts.
  // BXGY cannot use "all products" for customer buys, so we use a basic discount.
  // The popup only adds 1 item to cart. If customer manually adds more, they'd all be free.

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

  logger.debug("[Discount Service] ✅ Created free gift discount: ${code} (${result.discount.id})");

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
export function validateDiscountConfig(config: Partial<DiscountConfig>): {
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
    errors.push("Invalid value type. Must be 'PERCENTAGE', 'FIXED_AMOUNT', or 'FREE_SHIPPING'");
  }

  const value = typeof config.value === "number" ? config.value : undefined;
  if (config.valueType !== "FREE_SHIPPING" && (value === undefined || value <= 0)) {
    errors.push("Discount value must be greater than 0 (except for FREE_SHIPPING)");
  }

  if (config.valueType === "PERCENTAGE" && value !== undefined && value > 100) {
    errors.push("Percentage discount cannot exceed 100%");
  }

  if (typeof config.minimumAmount === "number" && config.minimumAmount < 0) {
    errors.push("Minimum amount cannot be negative");
  }

  if (typeof config.usageLimit === "number" && config.usageLimit < 1) {
    errors.push("Usage limit must be at least 1");
  }

  if (typeof config.expiryDays === "number" && config.expiryDays < 1) {
    errors.push("Expiry days must be at least 1");
  }

  // Validate tiers
  if (Array.isArray(config.tiers) && config.tiers.length > 0) {
    const thresholds = config.tiers.map((t) => t.thresholdCents);
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
