import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export interface CartItem {
    variant_id?: number;
    id?: number;
    quantity: number;
    properties?: Record<string, string>;
    title?: string;
    price?: number;
}

export interface CreateDraftOrderInput {
    email: string;
    customerId?: string;
    lineItems: CartItem[];
    discountCode?: string;
    note?: string;
    tags?: string[];
}

export interface DraftOrderResult {
    success: boolean;
    draftOrder?: {
        id: string;
        invoiceUrl: string;
        name: string;
    };
    errors?: string[];
}

/**
 * Create a draft order in Shopify
 */
export async function createDraftOrder(
    admin: AdminApiContext,
    input: CreateDraftOrderInput
): Promise<DraftOrderResult> {
    try {
        // Map cart items to GraphQL input
        const lineItems = input.lineItems.map((item) => {
            // Ensure we have a variant ID (storefront API returns 'id' or 'variant_id')
            const variantId = item.variant_id || item.id;

            if (!variantId) {
                // If no variant ID (e.g. custom item), we'd need title and price
                // For now, skip invalid items
                return null;
            }

            return {
                variantId: `gid://shopify/ProductVariant/${variantId}`,
                quantity: item.quantity,
                customAttributes: item.properties
                    ? Object.entries(item.properties).map(([key, value]) => ({
                        key,
                        value: String(value),
                    }))
                    : [],
            };
        }).filter(Boolean);

        if (lineItems.length === 0) {
            return {
                success: false,
                errors: ["No valid line items provided"],
            };
        }

        const mutation = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

        const variables = {
            input: {
                email: input.email,
                customerId: input.customerId,
                lineItems,
                note: input.note,
                tags: input.tags,
                useCustomerDefaultAddress: !!input.customerId,
                // If we have a discount code, we can try to apply it, but draft orders 
                // handle discounts differently (applied to line items or total).
                // For simplicity in this first pass, we won't apply the discount code directly 
                // to the draft order unless we want to calculate the reduction manually.
                // Alternatively, we can add the code as a tag or note.
            },
        };

        const response = await admin.graphql(mutation, { variables });
        const json = await response.json();

        const result = json.data?.draftOrderCreate;

        if (result?.userErrors?.length > 0) {
            console.error("[Order Service] Draft order creation errors:", result.userErrors);
            return {
                success: false,
                errors: result.userErrors.map((e: any) => e.message),
            };
        }

        return {
            success: true,
            draftOrder: result?.draftOrder,
        };
    } catch (error) {
        console.error("[Order Service] Failed to create draft order:", error);
        return {
            success: false,
            errors: [error instanceof Error ? error.message : "Unknown error"],
        };
    }
}
