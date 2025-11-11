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

        // Handle non-OK HTTP status early
        if (!response.ok) {
          const text = await response.text();
          console.error("Template API HTTP error:", response.status, text);
          setError(`Failed to load templates (HTTP ${response.status})`);
          setTemplates([]);
          return;
        }

        const json = await response.json();
        const payload = json?.data as { templates?: UnifiedTemplate[] } | undefined;
        const safeTemplates: UnifiedTemplate[] = Array.isArray(payload?.templates)
          ? (payload!.templates as UnifiedTemplate[])
          : [];

        console.log("📦 Template API response:", {
          success: json?.success,
          templatesCount: safeTemplates.length,
          timestamp: json?.timestamp,
        });

        if (json?.success) {
          const filtered = goal
            ? safeTemplates.filter((t) => t.goals.includes(goal))
            : safeTemplates;
          console.log(`✅ Templates loaded: ${safeTemplates.length} templates (after goal filter: ${filtered.length})`);
          setTemplates(filtered);
        } else {
          console.error("Template API error:", json?.error);
          setError(json?.error || "Failed to load templates");
          setTemplates([]);
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

