/**
 * GET /api/scopes/check
 *
 * Returns the status of optional scopes for the current shop.
 * Used by UI components to determine if features requiring specific
 * scopes are available.
 */

import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";

// Define optional scopes and their feature associations
const OPTIONAL_SCOPES = {
  read_customers: {
    feature: "Customer Segment Targeting",
    description: "Target specific customer segments like VIP or first-time buyers",
  },
  write_customers: {
    feature: "Customer Segment Targeting",
    description: "Update customer data when interacting with campaigns",
  },
  read_orders: {
    feature: "Social Proof Notifications",
    description: "Show real purchase notifications to build trust",
  },
  write_files: {
    feature: "Custom Image Uploads",
    description: "Upload custom background images for popups",
  },
  write_marketing_events: {
    feature: "Marketing Attribution",
    description: "Track campaigns in Shopify's Marketing section",
  },
  read_marketing_events: {
    feature: "Marketing Attribution",
    description: "View marketing performance data",
  },
} as const;

type OptionalScope = keyof typeof OPTIONAL_SCOPES;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { scopes } = await authenticate.admin(request);

    // Get granted scopes
    const scopeDetails = await scopes.query();
    const grantedScopes = new Set(scopeDetails.granted);

    // Build scope status response
    const scopeStatus: Record<
      OptionalScope,
      { granted: boolean; feature: string; description: string }
    > = {} as typeof scopeStatus;

    for (const [scope, details] of Object.entries(OPTIONAL_SCOPES)) {
      scopeStatus[scope as OptionalScope] = {
        granted: grantedScopes.has(scope),
        ...details,
      };
    }

    // Helper: group by feature availability
    const featureStatus = {
      customerSegmentTargeting:
        grantedScopes.has("read_customers") && grantedScopes.has("write_customers"),
      socialProofPurchases: grantedScopes.has("read_orders"),
      customImageUploads: grantedScopes.has("write_files"),
      marketingAttribution:
        grantedScopes.has("write_marketing_events") &&
        grantedScopes.has("read_marketing_events"),
    };

    return createSuccessResponse({
      scopes: scopeStatus,
      features: featureStatus,
      granted: Array.from(grantedScopes),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/scopes/check");
  }
}

