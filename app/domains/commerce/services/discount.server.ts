/**
 * Discount Service
 *
 * Handles discount code generation and management for campaigns
 * Integrates with Shopify Admin API to create real discount codes
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import {
  createDiscountCode,
  getDiscountCode,
  type DiscountCodeInput,
} from "~/lib/shopify/discount.server";
import {
  findCustomerByEmail,
  createCustomer,
  type ShopifyCustomer,
} from "~/lib/shopify/customer.server";
import prisma from "~/db.server";

/**
 * Discount delivery mode - controls how customers receive their discount
 */
export type DiscountDeliveryMode =
  | "auto_apply_only" // Most restrictive - must log in, no code shown
  | "show_code_always" // Always show code immediately
  | "show_in_popup_authorized_only" // Email authorization required - code only works with subscriber's email
  | "show_code_fallback"; // Balanced - auto-apply if logged in, show code otherwise

export interface DiscountConfig {
  enabled?: boolean; // Whether discount is enabled for this campaign
  type: "shared" | "single_use";
  valueType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value?: number; // Optional for FREE_SHIPPING
  minimumAmount?: number;
  usageLimit?: number;
  expiryDays?: number;
  prefix?: string;

  // Delivery configuration
  deliveryMode?: DiscountDeliveryMode;
  requireLogin?: boolean; // Derived from deliveryMode
  storeInMetafield?: boolean; // Whether to store in customer metafield

  // Email authorization (for show_in_popup_authorized_only mode)
  authorizedEmail?: string; // Email that discount is authorized for
  requireEmailMatch?: boolean; // Whether to enforce email matching at checkout
}

export interface CampaignDiscountResult {
  success: boolean;
  discountCode?: string;
  discountId?: string;
  isNewDiscount: boolean;
  errors?: string[];
}

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

    return {
      enabled: config.enabled !== false,
      type: config.type || "shared",
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
    };
  } catch (error) {
    console.error("[Discount Service] Error parsing discount config:", error);
    return {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 10,
      deliveryMode: "show_code_fallback",
    };
  }
}

/**
 * Get or create discount code for a campaign
 */
export async function getCampaignDiscountCode(
  admin: AdminApiContext,
  storeId: string,
  campaignId: string,
  config: DiscountConfig,
  leadEmail?: string
): Promise<CampaignDiscountResult> {
  try {
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

    if (config.type === "shared") {
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
  campaign: any,
  config: DiscountConfig,
  existingConfig: any
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

  const discountInput: DiscountCodeInput = {
    title: `${campaign.name} - Shared Discount`,
    code: discountCode,
    value: config.valueType === "FREE_SHIPPING" ? undefined : config.value,
    valueType: config.valueType,
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
  const updatedConfig = {
    ...existingConfig,
    sharedDiscountId: result.discount?.id,
    sharedDiscountCode: discountCode,
    type: "shared",
    createdAt: new Date().toISOString(),
  };

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      discountConfig: JSON.stringify(updatedConfig),
    },
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
  campaign: any,
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

    const discountInput: DiscountCodeInput = {
      title: `${campaign.name} - Email Authorized (${email})`,
      code: discountCode,
      value: config.valueType === "FREE_SHIPPING" ? undefined : config.value,
      valueType: config.valueType,
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
  campaign: any,
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

  const discountInput: DiscountCodeInput = {
    title: `${campaign.name} - Single Use (${leadEmail || "Anonymous"})`,
    code: discountCode,
    value: config.valueType === "FREE_SHIPPING" ? undefined : config.value,
    valueType: config.valueType,
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

/**
 * Generate a discount code based on campaign name
 */
function generateDiscountCode(prefix: string, campaignName: string): string {
  const cleanName = campaignName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .substring(0, 8);

  const timestamp = Date.now().toString().slice(-4);
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
        .substring(0, 4)
    : "ANON";

  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${emailHash}${randomSuffix}`;
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

  return {
    isValid: errors.length === 0,
    errors,
  };
}

