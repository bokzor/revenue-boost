/**
 * Shopify Discount Code Management
 *
 * Handles creation and retrieval of discount codes via Shopify Admin GraphQL API
 */

import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export interface DiscountCodeInput {
  title: string;
  code: string;
  value?: number; // Optional for FREE_SHIPPING
  valueType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  usageLimit?: number;
  minimumRequirement?: {
    greaterThanOrEqualToQuantity?: number;
    greaterThanOrEqualToSubtotal?: number;
  };
  customerSelection?: "ALL" | "CUSTOMER_SEGMENTS" | "SPECIFIC_CUSTOMERS";
  specificCustomerIds?: string[]; // Shopify customer GIDs
  startsAt?: string;
  endsAt?: string;
  appliesOncePerCustomer?: boolean;

  // Free shipping specific
  countries?: string[];
  excludeShippingRatesOver?: number;
}

export interface ShopifyDiscount {
  id: string;
  title: string;
  codes: {
    nodes: Array<{
      id: string;
      code: string;
    }>;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GraphQL mutation to create a basic discount (percentage or fixed amount)
 */
const DISCOUNT_CODE_BASIC_CREATE_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            codes(first: 10) {
              nodes {
                id
                code
              }
            }
            status
            createdAt
            updatedAt
            customerGets {
              value {
                ... on DiscountPercentage {
                  percentage
                }
                ... on DiscountAmount {
                  amount {
                    amount
                    currencyCode
                  }
                }
              }
            }
            minimumRequirement {
              ... on DiscountMinimumQuantity {
                greaterThanOrEqualToQuantity
              }
              ... on DiscountMinimumSubtotal {
                greaterThanOrEqualToSubtotal {
                  amount
                  currencyCode
                }
              }
            }
            customerSelection {
              ... on DiscountCustomerAll {
                allCustomers
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * GraphQL mutation to create a free shipping discount
 */
const DISCOUNT_CODE_FREE_SHIPPING_CREATE_MUTATION = `
  mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
    discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeFreeShipping {
            title
            codes(first: 10) {
              nodes {
                id
                code
              }
            }
            status
            createdAt
            updatedAt
            appliesOnOneTimePurchase
            appliesOnSubscription
            appliesOncePerCustomer
            destinationSelection {
              all
              countries {
                code
                name
              }
            }
            minimumRequirement {
              ... on DiscountMinimumSubtotal {
                greaterThanOrEqualToSubtotal {
                  amount
                  currencyCode
                }
              }
            }
            customerSelection {
              ... on DiscountCustomerAll {
                allCustomers
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * GraphQL query to get discount by ID
 */
const DISCOUNT_CODE_GET_QUERY = `
  query getDiscountCode($id: ID!) {
    codeDiscountNode(id: $id) {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
          codes(first: 10) {
            nodes {
              id
              code
            }
          }
          status
          createdAt
          updatedAt
        }
        ... on DiscountCodeFreeShipping {
          title
          codes(first: 10) {
            nodes {
              id
              code
            }
          }
          status
          createdAt
          updatedAt
        }
      }
    }
  }
`;

/**
 * Create a discount code in Shopify
 */
export async function createDiscountCode(
  admin: AdminApiContext,
  discountData: DiscountCodeInput
): Promise<{ discount?: ShopifyDiscount; errors?: string[] }> {
  try {
    // Handle free shipping discounts separately
    if (discountData.valueType === "FREE_SHIPPING") {
      return await createFreeShippingDiscount(admin, discountData);
    }

    // Build customer gets value
    const customerGets = {
      value:
        discountData.valueType === "PERCENTAGE"
          ? { percentage: discountData.value! / 100 }
          : {
              discountAmount: {
                amount: discountData.value!.toString(),
                appliesOnEachItem: false,
              },
            },
      items: {
        all: true,
      },
    };

    // Build minimum requirement
    const minimumRequirement = discountData.minimumRequirement
      ? discountData.minimumRequirement.greaterThanOrEqualToQuantity
        ? {
            greaterThanOrEqualToQuantity:
              discountData.minimumRequirement.greaterThanOrEqualToQuantity,
          }
        : {
            greaterThanOrEqualToSubtotal: {
              amount:
                discountData.minimumRequirement.greaterThanOrEqualToSubtotal?.toString() ||
                "0",
            },
          }
      : null;

    // Build customer selection
    let customerSelection;
    if (
      discountData.customerSelection === "SPECIFIC_CUSTOMERS" &&
      discountData.specificCustomerIds?.length
    ) {
      customerSelection = {
        customers: {
          add: discountData.specificCustomerIds,
        },
      };
    } else {
      customerSelection = {
        all: true,
      };
    }

    const input = {
      title: discountData.title,
      code: discountData.code,
      startsAt: discountData.startsAt || new Date().toISOString(),
      endsAt: discountData.endsAt,
      customerGets,
      customerSelection,
      usageLimit: discountData.usageLimit,
      appliesOncePerCustomer: discountData.appliesOncePerCustomer || false,
      minimumRequirement,
    };

    const response = await admin.graphql(DISCOUNT_CODE_BASIC_CREATE_MUTATION, {
      variables: {
        basicCodeDiscount: input,
      },
    });

    const data = await response.json();

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      return {
        errors: data.data.discountCodeBasicCreate.userErrors.map(
          (error: any) => error.message
        ),
      };
    }

    const discountNode = data.data?.discountCodeBasicCreate?.codeDiscountNode;
    if (discountNode) {
      return {
        discount: {
          id: discountNode.id,
          title: discountNode.codeDiscount.title,
          codes: discountNode.codeDiscount.codes,
          status: discountNode.codeDiscount.status,
          createdAt: discountNode.codeDiscount.createdAt,
          updatedAt: discountNode.codeDiscount.updatedAt,
        },
      };
    }

    return {
      errors: ["Failed to create discount code"],
    };
  } catch (error) {
    console.error("[Shopify Discount] Error creating discount code:", error);
    return {
      errors: [error instanceof Error ? error.message : "Failed to create discount code"],
    };
  }
}

/**
 * Create a free shipping discount code in Shopify
 */
async function createFreeShippingDiscount(
  admin: AdminApiContext,
  discountData: DiscountCodeInput
): Promise<{ discount?: ShopifyDiscount; errors?: string[] }> {
  try {
    const minimumRequirement = discountData.minimumRequirement
      ?.greaterThanOrEqualToSubtotal
      ? {
          greaterThanOrEqualToSubtotal: {
            amount:
              discountData.minimumRequirement.greaterThanOrEqualToSubtotal.toString(),
          },
        }
      : null;

    const input = {
      title: discountData.title,
      code: discountData.code,
      startsAt: discountData.startsAt || new Date().toISOString(),
      endsAt: discountData.endsAt,
      appliesOncePerCustomer: discountData.appliesOncePerCustomer || false,
      appliesOnOneTimePurchase: true,
      appliesOnSubscription: true,
      usageLimit: discountData.usageLimit,
      destinationSelection: {
        all: !discountData.countries || discountData.countries.length === 0,
        countries: discountData.countries || [],
      },
      minimumRequirement,
      customerSelection:
        discountData.customerSelection === "SPECIFIC_CUSTOMERS" &&
        discountData.specificCustomerIds?.length
          ? {
              customers: {
                add: discountData.specificCustomerIds,
              },
            }
          : {
              all: true,
            },
      excludeShippingRatesOverAmount: discountData.excludeShippingRatesOver
        ? {
            amount: discountData.excludeShippingRatesOver.toString(),
          }
        : null,
    };

    const response = await admin.graphql(
      DISCOUNT_CODE_FREE_SHIPPING_CREATE_MUTATION,
      {
        variables: {
          freeShippingCodeDiscount: input,
        },
      }
    );

    const data = await response.json();

    if (data.data?.discountCodeFreeShippingCreate?.userErrors?.length > 0) {
      return {
        errors: data.data.discountCodeFreeShippingCreate.userErrors.map(
          (error: any) => error.message
        ),
      };
    }

    const discountNode =
      data.data?.discountCodeFreeShippingCreate?.codeDiscountNode;
    if (discountNode) {
      return {
        discount: {
          id: discountNode.id,
          title: discountNode.codeDiscount.title,
          codes: discountNode.codeDiscount.codes,
          status: discountNode.codeDiscount.status,
          createdAt: discountNode.codeDiscount.createdAt,
          updatedAt: discountNode.codeDiscount.updatedAt,
        },
      };
    }

    return {
      errors: ["Failed to create free shipping discount code"],
    };
  } catch (error) {
    console.error(
      "[Shopify Discount] Error creating free shipping discount:",
      error
    );
    return {
      errors: [
        error instanceof Error
          ? error.message
          : "Failed to create free shipping discount code",
      ],
    };
  }
}

/**
 * Get discount code by ID
 */
export async function getDiscountCode(
  admin: AdminApiContext,
  discountId: string
): Promise<{ discount?: ShopifyDiscount; errors?: string[] }> {
  try {
    const response = await admin.graphql(DISCOUNT_CODE_GET_QUERY, {
      variables: {
        id: discountId,
      },
    });

    const data = await response.json();
    const discountNode = data.data?.codeDiscountNode;

    if (discountNode) {
      return {
        discount: {
          id: discountNode.id,
          title: discountNode.codeDiscount.title,
          codes: discountNode.codeDiscount.codes,
          status: discountNode.codeDiscount.status,
          createdAt: discountNode.codeDiscount.createdAt,
          updatedAt: discountNode.codeDiscount.updatedAt,
        },
      };
    }

    return {
      errors: ["Discount not found"],
    };
  } catch (error) {
    console.error("[Shopify Discount] Error getting discount code:", error);
    return {
      errors: [
        error instanceof Error ? error.message : "Failed to get discount code",
      ],
    };
  }
}

