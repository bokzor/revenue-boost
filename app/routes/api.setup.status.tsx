/**
 * Setup Status API
 *
 * GET /api/setup/status?refresh=true
 *
 * Checks if the app is properly set up:
 * - Theme extension enabled
 * - App proxy reachable
 *
 * Results are cached for 5 minutes. Use ?refresh=true to bypass cache.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getSetupStatus } from "~/lib/setup-status.server";
import { logger } from "~/lib/logger.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!session?.shop) {
      return data({ error: "No shop session" }, { status: 401 });
    }

    // Check if force refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Check if store exists (fast DB lookup)
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: session.shop },
    });

    // Get setup status using shared utility (cached unless forceRefresh)
    const { status: setupStatus, setupComplete } = await getSetupStatus(
      session.shop,
      session.accessToken || "",
      admin,
      { forceRefresh }
    );

    return data({
      success: true,
      status: {
        shop: session.shop,
        storeCreated: !!store,
        ...setupStatus,
      },
      setupComplete,
    });
  } catch (error) {
    logger.error({ error }, "[Setup Status] Error");
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
