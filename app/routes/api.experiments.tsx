/**
 * Experiment Management API Routes
 *
 * REST API endpoints for A/B testing experiment operations
 */

import { ExperimentService, ExperimentCreateDataSchema } from "~/domains/campaigns";
import { validateData } from "~/lib/validation-helpers";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";

export async function loader({ request }: { request: Request }) {
  try {
    const storeId = await getStoreId(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let experiments;
    if (status === "running") {
      experiments = await ExperimentService.getRunningExperiments(storeId);
    } else {
      experiments = await ExperimentService.getAllExperiments(storeId);
    }

    return createSuccessResponse({ experiments });
  } catch (error) {
    return handleApiError(error, "GET /api/experiments");
  }
}

export async function action({ request }: { request: Request }) {
  try {
    if (request.method === "POST") {
      const storeId = await getStoreId(request);
      const rawData = await request.json();
      const validatedData = validateData(
        ExperimentCreateDataSchema,
        rawData,
        "Experiment Create Data"
      );
      const experiment = await ExperimentService.createExperiment(storeId, validatedData);
      return createSuccessResponse({ experiment }, 201);
    }

    throw new Error(`Method ${request.method} not allowed`);
  } catch (error) {
    return handleApiError(error, `${request.method} /api/experiments`);
  }
}
