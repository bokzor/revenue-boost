/**
 * Shopify Customer Management
 * 
 * Handles customer creation, lookup, and updates via Shopify Admin GraphQL API
 */

import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

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
          acceptsMarketing
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
        acceptsMarketing
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
        acceptsMarketing
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

    const data = await response.json();
    const edges = data.data?.customers?.edges || [];

    if (edges.length > 0) {
      return {
        customer: edges[0].node,
      };
    }

    return {
      customer: undefined,
    };
  } catch (error) {
    console.error("[Shopify Customer] Error finding customer:", error);
    return {
      errors: [
        error instanceof Error ? error.message : "Failed to find customer",
      ],
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

    const responseData = await response.json();

    if (responseData.data?.customerCreate?.userErrors?.length > 0) {
      return {
        errors: responseData.data.customerCreate.userErrors.map(
          (error: any) => error.message
        ),
      };
    }

    const customer = responseData.data?.customerCreate?.customer;
    if (customer) {
      return {
        customer,
      };
    }

    return {
      errors: ["Failed to create customer"],
    };
  } catch (error) {
    console.error("[Shopify Customer] Error creating customer:", error);
    return {
      errors: [
        error instanceof Error ? error.message : "Failed to create customer",
      ],
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

    const responseData = await response.json();

    if (responseData.data?.customerUpdate?.userErrors?.length > 0) {
      return {
        errors: responseData.data.customerUpdate.userErrors.map(
          (error: any) => error.message
        ),
      };
    }

    const customer = responseData.data?.customerUpdate?.customer;
    if (customer) {
      return {
        customer,
      };
    }

    return {
      errors: ["Failed to update customer"],
    };
  } catch (error) {
    console.error("[Shopify Customer] Error updating customer:", error);
    return {
      errors: [
        error instanceof Error ? error.message : "Failed to update customer",
      ],
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

    // Build tags
    const tags = data.tags || [];
    if (data.source) {
      tags.push(`source:${data.source}`);
    }
    if (data.campaignId) {
      tags.push(`campaign:${data.campaignId}`);
    }

    if (findResult.customer) {
      // Customer exists - update if needed
      const existingCustomer = findResult.customer;
      const needsUpdate =
        data.firstName ||
        data.lastName ||
        data.phone ||
        data.marketingConsent ||
        tags.length > 0;

      if (needsUpdate) {
        // Merge tags (don't duplicate)
        const mergedTags = Array.from(
          new Set([...existingCustomer.tags, ...tags])
        );

        const updateResult = await updateCustomer(
          admin,
          existingCustomer.id,
          {
            firstName: data.firstName || existingCustomer.firstName,
            lastName: data.lastName || existingCustomer.lastName,
            phone: data.phone || existingCustomer.phone,
            acceptsMarketing:
              data.marketingConsent ?? existingCustomer.acceptsMarketing,
            tags: mergedTags,
          }
        );

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
      // Customer doesn't exist - create new
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
      errors: [
        error instanceof Error ? error.message : "Failed to upsert customer",
      ],
    };
  }
}

/**
 * Sanitize customer data before sending to Shopify
 */
export function sanitizeCustomerData(
  data: CustomerUpsertData
): CustomerUpsertData {
  return {
    email: data.email.toLowerCase().trim(),
    firstName: data.firstName?.trim() || undefined,
    lastName: data.lastName?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    marketingConsent: data.marketingConsent || false,
    tags: data.tags || [],
    source: data.source,
    campaignId: data.campaignId,
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

