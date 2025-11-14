import prisma from "~/db.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";

interface LoaderArgs {
  request: Request;
}

/**
 * GET /api/segments
 *
 * Returns global (system) segments and store-specific custom segments
 * for use in the admin SegmentSelector component.
 */
export async function loader({ request }: LoaderArgs) {
  try {
    let storeId: string | null = null;

    // getStoreId will throw if the request is not authenticated; in that case
    // we still want to return global default segments.
    try {
      storeId = await getStoreId(request);
    } catch {
      storeId = null;
    }

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const activeFilter = includeInactive ? {} : { isActive: true };

    const where = storeId
      ? {
          OR: [
            { storeId, ...activeFilter },
            { storeId: null, isDefault: true, ...activeFilter },
          ],
        }
      : {
          storeId: null,
          isDefault: true,
          ...activeFilter,
        };

    const segments = await prisma.customerSegment.findMany({
      where,
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    });

    const payload = {
      segments: segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        description: segment.description,
        icon: segment.icon ?? undefined,
        priority: segment.priority,
        // estimatedSize can be populated later once analytics are available
      })),
    };

    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, "GET /api/segments");
  }
}

