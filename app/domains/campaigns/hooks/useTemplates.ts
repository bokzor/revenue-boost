/**
 * useTemplates Hook - Fetches templates from API
 *
 * SOLID Compliance:
 * - Single Responsibility: Only handles template fetching
 * - Extracted from TemplateSelector for better reusability
 * - Hook is <50 lines
 */

import { useState, useEffect } from "react";
import type { CampaignGoal } from "@prisma/client";
import type { UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";
import { apiClient, getErrorMessage } from "~/lib/api-client";

export interface UseTemplatesResult {
  templates: UnifiedTemplate[];
  loading: boolean;
  error: string | null;
}

export function useTemplates(goal: CampaignGoal, storeId: string): UseTemplatesResult {
  const [templates, setTemplates] = useState<UnifiedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ templates: UnifiedTemplate[] }>("/api/templates", {
          params: { storeId, goal },
        });

        const safeTemplates: UnifiedTemplate[] = Array.isArray(response.data?.templates)
          ? response.data.templates
          : [];

        console.log("📦 Template API response:", {
          success: response.success,
          templatesCount: safeTemplates.length,
          timestamp: response.timestamp,
        });

        if (response.success) {
          const filtered = goal
            ? safeTemplates.filter((t) => t.goals.includes(goal))
            : safeTemplates;
          console.log(`✅ Templates loaded: ${safeTemplates.length} templates (after goal filter: ${filtered.length})`);
          setTemplates(filtered);
        } else {
          console.error("Template API error:", response.error);
          setError(response.error || "Failed to load templates");
          setTemplates([]);
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [goal, storeId]);

  return { templates, loading, error };
}

