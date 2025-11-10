/**
 * Individual Template API Routes
 *
 * REST API endpoints for single template operations
 * GET /api/templates/:templateId - Get specific template
 */

import { TemplateService } from "~/domains/templates";
import { getResourceById } from "~/lib/api-helpers.server";

// ============================================================================
// LOADER (GET /api/templates/:templateId)
// ============================================================================

export const loader = getResourceById(
  (id, storeId) => TemplateService.getTemplateById(id, storeId),
  "Template",
  "GET /api/templates/:templateId"
);

