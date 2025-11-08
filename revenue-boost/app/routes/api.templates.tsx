/**
 * Template Management API Routes
 *
 * REST API endpoints for template operations
 */

import { TemplateService, TemplateCreateDataSchema } from "~/domains/templates";
import type { TemplateType } from "~/domains/templates";
import { validateData } from "~/lib/validation-helpers";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";

export async function loader({ request }: { request: Request }) {
  try {
    const storeId = await getStoreId(request);
    const url = new URL(request.url);
    const templateType = url.searchParams.get("type") as TemplateType | null;
    const defaultOnly = url.searchParams.get("default") === "true";

    let templates;
    if (defaultOnly && templateType) {
      const defaultTemplate = await TemplateService.getDefaultTemplate(templateType);
      templates = defaultTemplate ? [defaultTemplate] : [];
    } else if (templateType) {
      templates = await TemplateService.getTemplatesByType(templateType, storeId);
    } else {
      templates = await TemplateService.getAllTemplates(storeId);
    }

    return createSuccessResponse({ templates });
  } catch (error) {
    return handleApiError(error, "GET /api/templates");
  }
}

export async function action({ request }: { request: Request }) {
  try {
    if (request.method === "POST") {
      const rawData = await request.json();
      const validatedData = validateData(TemplateCreateDataSchema, rawData, "Template Create Data");
      const template = await TemplateService.createTemplate(validatedData);
      return createSuccessResponse({ template }, 201);
    }

    throw new Error(`Method ${request.method} not allowed`);
  } catch (error) {
    return handleApiError(error, `${request.method} /api/templates`);
  }
}


