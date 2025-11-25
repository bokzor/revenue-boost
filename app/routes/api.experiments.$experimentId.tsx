/**
 * Individual Experiment API Routes
 *
 * REST API endpoints for single experiment operations
 * GET /api/experiments/:experimentId - Get specific experiment
 */

import { ExperimentService } from "~/domains/campaigns/index.server";
import { getResourceById } from "~/lib/api-helpers.server";

// ============================================================================
// LOADER (GET /api/experiments/:experimentId)
// ============================================================================

export const loader = getResourceById(
  (id, storeId) => ExperimentService.getExperimentById(id, storeId),
  "Experiment",
  "GET /api/experiments/:experimentId"
);
