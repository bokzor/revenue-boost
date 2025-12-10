/**
 * Individual Experiment API Routes
 *
 * REST API endpoints for single experiment operations
 * GET /api/experiments/:experimentId - Get specific experiment
 * PUT /api/experiments/:experimentId - Update specific experiment
 */

import { ExperimentService, ExperimentUpdateDataSchema } from "~/domains/campaigns/index.server";
import { validateData, ValidationError } from "~/lib/validation-helpers";
import {
  getResourceById,
  createMethodRouter,
  validateRequiredId,
  validateResourceExists,
} from "~/lib/api-helpers.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { authenticate } from "~/shopify.server";

// ============================================================================
// LOADER (GET /api/experiments/:experimentId)
// ============================================================================

export const loader = getResourceById(
  (id, storeId) => ExperimentService.getExperimentById(id, storeId),
  "Experiment",
  "GET /api/experiments/:experimentId"
);

// ============================================================================
// ACTION (PUT /api/experiments/:experimentId)
// ============================================================================

export const action = createMethodRouter({
  PUT: {
    handler: async ({ request, params }) => {
      const { experimentId } = params;
      validateRequiredId(experimentId, "Experiment");

      await authenticate.admin(request);
      const storeId = await getStoreId(request);
      const rawData = await request.json();
      const validatedData = validateData(ExperimentUpdateDataSchema, rawData, "Experiment Update Data");
      if (validatedData.id && validatedData.id !== experimentId) {
        throw new ValidationError(
          "Experiment ID mismatch",
          ["id: must match experimentId in the route"],
          "Experiment Update Data"
        );
      }
      const experiment = await ExperimentService.updateExperiment(
        experimentId,
        storeId,
        validatedData
      );
      validateResourceExists(experiment, "Experiment");

      return { experiment };
    },
    context: "PUT /api/experiments/:experimentId",
  },
});
