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

export function useTemplates(
  goal: CampaignGoal,
  storeId: string,
  initialTemplates?: UnifiedTemplate[]
): UseTemplatesResult {
  const [templates, setTemplates] = useState<UnifiedTemplate[]>(() => {
    if (initialTemplates && initialTemplates.length > 0) {
      return goal ? initialTemplates.filter((t) => t.goals.includes(goal)) : initialTemplates;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(
    !(initialTemplates && initialTemplates.length > 0)
  );
  const [error, setError] = useState<string | null>(null);

  if (typeof window !== "undefined") {
    console.log("[useTemplates] init", {
      goal,
      storeId,
      hasInitialTemplates: Boolean(initialTemplates && initialTemplates.length > 0),
    });
  }

  useEffect(() => {
    // If initial templates were provided, use them and skip fetching.
    if (initialTemplates && initialTemplates.length > 0) {
      console.log("[useTemplates] using initial templates, skipping fetch", {
        goal,
        storeId,
        count: initialTemplates.length,
      });

      const filtered = goal
        ? initialTemplates.filter((t) => t.goals.includes(goal))
        : initialTemplates;

      setTemplates(filtered);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchTemplates = async () => {
      console.log("[useTemplates] effect run", { goal, storeId });
      setLoading(true);
      setError(null);

      try {
        console.log("[useTemplates] fetching /api/templates", {
          goal,
          storeId,
        });
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
          console.log(
            `✅ Templates loaded: ${safeTemplates.length} templates (after goal filter: ${filtered.length})`
          );
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
        console.log("[useTemplates] done", { goal, storeId });
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [goal, storeId, initialTemplates]);

  return { templates, loading, error };
}

export type { UnifiedTemplate };
