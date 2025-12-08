/**
 * Shared API Response Types
 *
 * Common interfaces used across all API routes for consistent response structure
 */

import type { TemplateType } from "~/domains/campaigns/types/campaign";

// ============================================================================
// DOMAIN-SPECIFIC API TYPES
// ============================================================================

/**
 * Campaign data structure for API responses
 * Uses flexible types for JSON configurations
 */
export interface ApiCampaignData {
  id: string;
  name: string;
  templateType: TemplateType;
  priority: number;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  /**
   * Pre-resolved CSS custom properties for design tokens.
   * Format: "--rb-background: #fff; --rb-primary: #000; ..."
   * This enables the storefront to apply theme-aware styles without
   * needing to resolve tokens client-side.
   */
  designTokensCSS?: string;
  targetRules: Record<string, unknown>;
  discountConfig: Record<string, unknown>;
  experimentId?: string | null;
  variantKey?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// GENERIC API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure
 * Generic type T represents the data payload type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  /**
   * Optional machine-readable error code for client logic.
   * Used in particular for plan/feature limits (e.g. PLAN_LIMIT_EXCEEDED).
   */
  errorCode?: string;
  /**
   * Optional structured error details for richer client handling.
   * For plan limits this contains limitType/feature/current/max/planTier.
   */
  errorDetails?: unknown;
  timestamp: string;
}

/**
 * API response for list/collection endpoints
 */
export interface ApiListResponse<T = unknown> extends ApiResponse<T[]> {
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  errors?: string[]
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    errors,
    timestamp: new Date().toISOString(),
  };
}
