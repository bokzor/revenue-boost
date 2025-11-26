/**
 * Setup Status API
 *
 * Checks if the app is properly set up:
 * - Theme extension enabled
 * - Metafield set
 * - Welcome campaign created
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getSetupStatus } from "~/lib/setup-status.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!session?.shop) {
      return data({ error: "No shop session" }, { status: 401 });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: session.shop },
    });

    // Get setup status using shared utility
    const { status: setupStatus, setupComplete } = await getSetupStatus(
      session.shop,
      session.accessToken || "",
      admin
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
    console.error("[Setup Status] Error:", error);
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
