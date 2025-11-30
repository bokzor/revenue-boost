/**
 * Shopify Customer Management
 *
 * Handles customer creation, lookup, and updates via Shopify Admin GraphQL API
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerUpsertData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketingConsent?: boolean;
  tags?: string[];
  source?: string;
  campaignId?: string;
  // Enhanced fields for email marketing integration
  campaignName?: string;
  templateType?: string;
  discountCode?: string;
}

export interface CustomerUpsertResult {
  success: boolean;
  shopifyCustomerId?: string;
  isNewCustomer?: boolean;
  errors?: string[];
}

/**
 * GraphQL query to find customer by email
 */
const CUSTOMER_SEARCH_QUERY = `
  query searchCustomers($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          firstName
          lastName
          phone
          emailMarketingConsent { marketingState }
          tags
          createdAt
          updatedAt
        }
      }
    }
  }
`;

/**
 * GraphQL mutation to create a customer
 */
const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        emailMarketingConsent { marketingState }
        tags
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * GraphQL mutation to update a customer
 */
const CUSTOMER_UPDATE_MUTATION = `
  mutation customerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        emailMarketingConsent { marketingState }
        tags
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Find customer by email
 */
export async function findCustomerByEmail(
  admin: AdminApiContext,
  email: string
): Promise<{ customer?: ShopifyCustomer; errors?: string[] }> {
  try {
    const response = await admin.graphql(CUSTOMER_SEARCH_QUERY, {
      variables: {
        query: `email:${email}`,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GraphQL response is dynamically typed
    const data: any = await response.json();
    const edges = data.data?.customers?.edges || [];

    if (edges.length > 0) {
      const node = edges[0].node;
      const customer: ShopifyCustomer = {
        id: node.id,
        email: node.email,
        firstName: node.firstName || undefined,
        lastName: node.lastName || undefined,
        phone: node.phone || undefined,
        acceptsMarketing: node.emailMarketingConsent?.marketingState === "SUBSCRIBED",
        tags: node.tags || [],
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
      return { customer };
    }

    return {
      customer: undefined,
    };
  } catch (error) {
    console.error("[Shopify Customer] Error finding customer:", error);
    return {
      errors: [error instanceof Error ? error.message : "Failed to find customer"],
    };
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(
  admin: AdminApiContext,
  data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
    tags?: string[];
  }
): Promise<{ customer?: ShopifyCustomer; errors?: string[] }> {
  try {
    const input = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      emailMarketingConsent: data.acceptsMarketing
        ? {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          }
        : undefined,
      tags: data.tags || [],
    };

    const response = await admin.graphql(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GraphQL response is dynamically typed
    const responseData: any = await response.json();

    // Log full response for debugging
    console.log("[Shopify Customer] GraphQL Response:", JSON.stringify(responseData, null, 2));

    if (responseData.data?.customerCreate?.userErrors?.length > 0) {
      console.error("[Shopify Customer] User errors:", responseData.data.customerCreate.userErrors);
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- userErrors from GraphQL
        errors: responseData.data.customerCreate.userErrors.map((error: any) => error.message),
      };
    }

    // Check for GraphQL errors
    if (responseData.errors) {
      console.error("[Shopify Customer] GraphQL errors:", responseData.errors);
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- errors from GraphQL
        errors: responseData.errors.map((error: any) => error.message),
      };
    }

    const node = responseData.data?.customerCreate?.customer;
    if (node) {
      const mapped: ShopifyCustomer = {
        id: node.id,
        email: node.email,
        firstName: node.firstName || undefined,
        lastName: node.lastName || undefined,
        phone: node.phone || undefined,
        acceptsMarketing: node.emailMarketingConsent?.marketingState === "SUBSCRIBED",
        tags: node.tags || [],
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
      return { customer: mapped };
    }

    console.error("[Shopify Customer] No customer in response");
    return {
      errors: ["Failed to create customer"],
    };
  } catch (error) {
    console.error("[Shopify Customer] Error creating customer:", error);
    return {
      errors: [error instanceof Error ? error.message : "Failed to create customer"],
    };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  admin: AdminApiContext,
  customerId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
    tags?: string[];
  }
): Promise<{ customer?: ShopifyCustomer; errors?: string[] }> {
  try {
    const input = {
      id: customerId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      emailMarketingConsent: data.acceptsMarketing
        ? {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          }
        : undefined,
      tags: data.tags,
    };

    const response = await admin.graphql(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        input,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GraphQL response is dynamically typed
    const responseData: any = await response.json();

    if (responseData.data?.customerUpdate?.userErrors?.length > 0) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- userErrors from GraphQL
        errors: responseData.data.customerUpdate.userErrors.map((error: any) => error.message),
      };
    }

    const node = responseData.data?.customerUpdate?.customer;
    if (node) {
      const mapped: ShopifyCustomer = {
        id: node.id,
        email: node.email,
        firstName: node.firstName || undefined,
        lastName: node.lastName || undefined,
        phone: node.phone || undefined,
        acceptsMarketing: node.emailMarketingConsent?.marketingState === "SUBSCRIBED",
        tags: node.tags || [],
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
      return { customer: mapped };
    }

    return {
      errors: ["Failed to update customer"],
    };
  } catch (error) {
    console.error("[Shopify Customer] Error updating customer:", error);
    return {
      errors: [error instanceof Error ? error.message : "Failed to update customer"],
    };
  }
}

/**
 * Upsert customer (create if not exists, update if exists)
 */
export async function upsertCustomer(
  admin: AdminApiContext,
  data: CustomerUpsertData
): Promise<CustomerUpsertResult> {
  try {
    // Check if customer exists
    const findResult = await findCustomerByEmail(admin, data.email);

    if (findResult.errors) {
      return {
        success: false,
        errors: findResult.errors,
      };
    }

    if (findResult.customer) {
      // Customer exists - update with merged tags
      const existingCustomer = findResult.customer;

      // Build enhanced tags, merging with existing customer tags
      const tags = buildCustomerTags({
        source: data.source,
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        templateType: data.templateType,
        discountCode: data.discountCode,
        existingTags: existingCustomer.tags,
      });

      const needsUpdate =
        data.firstName || data.lastName || data.phone || data.marketingConsent || tags.length > 0;

      if (needsUpdate) {
        const updateResult = await updateCustomer(admin, existingCustomer.id, {
          firstName: data.firstName || existingCustomer.firstName,
          lastName: data.lastName || existingCustomer.lastName,
          phone: data.phone || existingCustomer.phone,
          acceptsMarketing: data.marketingConsent ?? existingCustomer.acceptsMarketing,
          tags,
        });

        if (updateResult.errors) {
          return {
            success: false,
            errors: updateResult.errors,
          };
        }
      }

      return {
        success: true,
        shopifyCustomerId: existingCustomer.id,
        isNewCustomer: false,
      };
    } else {
      // Customer doesn't exist - create new with enhanced tags
      const tags = buildCustomerTags({
        source: data.source,
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        templateType: data.templateType,
        discountCode: data.discountCode,
        existingTags: data.tags,
      });

      const createResult = await createCustomer(admin, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        acceptsMarketing: data.marketingConsent || false,
        tags,
      });

      if (createResult.errors) {
        return {
          success: false,
          errors: createResult.errors,
        };
      }

      return {
        success: true,
        shopifyCustomerId: createResult.customer?.id,
        isNewCustomer: true,
      };
    }
  } catch (error) {
    console.error("[Shopify Customer] Error upserting customer:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Failed to upsert customer"],
    };
  }
}

/**
 * Sanitize customer data before sending to Shopify
 */
export function sanitizeCustomerData(data: CustomerUpsertData): CustomerUpsertData {
  return {
    email: data.email.toLowerCase().trim(),
    firstName: data.firstName?.trim() || undefined,
    lastName: data.lastName?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    marketingConsent: data.marketingConsent || false,
    tags: data.tags || [],
    source: data.source,
    campaignId: data.campaignId,
    // Enhanced fields for email marketing integration
    campaignName: data.campaignName?.trim() || undefined,
    templateType: data.templateType?.trim() || undefined,
    discountCode: data.discountCode?.trim() || undefined,
  };
}

/**
 * Extract numeric customer ID from Shopify GID
 * Example: "gid://shopify/Customer/123456789" -> "123456789"
 */
export function extractCustomerId(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

/**
 * Slugify a string for use in tags
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 * - Limits to 40 characters (Shopify tag limit is 255, but we keep it short)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Build enhanced customer tags for email marketing platform integration
 *
 * These tags are synced to Klaviyo, Mailchimp, and other platforms that
 * integrate with Shopify customers. Merchants can use these tags to:
 * - Segment leads by source (Revenue Boost popups)
 * - Filter by template type (newsletter, spin-to-win, etc.)
 * - Create cohorts by signup month
 * - Track which campaigns drove signups
 *
 * Tag structure:
 * - `revenue-boost` - Master tag for all RB leads
 * - `rb-popup` - Source type indicator
 * - `rb-template:{type}` - Template type (lowercase)
 * - `rb-campaign:{slug}` - Campaign name (slugified)
 * - `rb-date:{YYYY-MM}` - Signup month for cohort analysis
 * - `rb-discount:{code}` - Discount code received (if any)
 */
export function buildCustomerTags(data: {
  source?: string;
  campaignId?: string;
  campaignName?: string;
  templateType?: string;
  discountCode?: string;
  existingTags?: string[];
}): string[] {
  const tags: string[] = [];

  // Master tag - identifies all Revenue Boost leads
  tags.push("revenue-boost");

  // Source type
  if (data.source === "revenue-boost-popup") {
    tags.push("rb-popup");
  }

  // Template type (e.g., rb-template:newsletter, rb-template:spin-to-win)
  if (data.templateType) {
    const templateSlug = slugify(data.templateType);
    tags.push(`rb-template:${templateSlug}`);
  }

  // Campaign name (slugified for readability)
  if (data.campaignName) {
    const campaignSlug = slugify(data.campaignName);
    tags.push(`rb-campaign:${campaignSlug}`);
  }

  // Legacy: Also include campaign ID for backwards compatibility
  if (data.campaignId) {
    tags.push(`rb-campaign-id:${data.campaignId}`);
  }

  // Signup month for cohort analysis (e.g., rb-date:2025-01)
  const month = new Date().toISOString().slice(0, 7); // "2025-01"
  tags.push(`rb-date:${month}`);

  // Discount code received (if any)
  if (data.discountCode) {
    const discountSlug = slugify(data.discountCode);
    tags.push(`rb-discount:${discountSlug}`);
  }

  // Merge with any existing tags, removing duplicates
  if (data.existingTags && data.existingTags.length > 0) {
    return Array.from(new Set([...data.existingTags, ...tags]));
  }

  return tags;
}
