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
        const params = new URLSearchParams({ storeId, goal });
        const response = await fetch(`/api/templates?${params}`);
        const data = await response.json();

        console.log("📦 Template API response:", {
          success: data.success,
          templatesCount: data.templates?.length || 0,
          cached: data.meta?.cached,
          responseTime: data.meta?.responseTime + "ms",
          cacheStats: data.meta?.cacheStats,
        });

        if (data.success) {
          console.log(
            `✅ Templates loaded: ${data.templates.length} templates ${data.meta?.cached ? "(from cache)" : "(from database)"}`
          );
          setTemplates(data.templates);
        } else {
          console.error("Template API error:", data.error);
          setError(data.error || "Failed to load templates");
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [goal, storeId]);

  return { templates, loading, error };
}

