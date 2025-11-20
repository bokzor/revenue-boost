/**
 * Campaign Service (Facade)
 *
 * REFACTORED: This is now a facade that delegates to focused services
 * - CampaignQueryService: All read operations
 * - CampaignMutationService: All write operations
 *
 * Maintains backward compatibility while following Single Responsibility Principle
 */

import type {
  CampaignCreateData,
  CampaignUpdateData,
  CampaignWithConfigs,
  TemplateType,
} from "../types/campaign.js";
import { CampaignQueryService } from "./campaign-query.server.js";
import { CampaignMutationService } from "./campaign-mutation.server.js";

/**
 * Campaign Service (Facade)
 *
 * Delegates to focused services while maintaining backward compatibility
 * This allows existing code to continue working without changes
 */
export class CampaignService {
  // ============================================================================
  // QUERY OPERATIONS - Delegate to CampaignQueryService
  // ============================================================================

  /**
   * Get all campaigns for a store
   */
  static async getAllCampaigns(storeId: string): Promise<CampaignWithConfigs[]> {
    return CampaignQueryService.getAll(storeId);
  }

  /**
   * Get campaign by ID
   */
  static async getCampaignById(
    id: string,
    storeId: string
  ): Promise<CampaignWithConfigs | null> {
    return CampaignQueryService.getById(id, storeId);
  }

  /**
   * Get campaigns by template type
   */
  static async getCampaignsByTemplateType(
    storeId: string,
    templateType: TemplateType
  ): Promise<CampaignWithConfigs[]> {
    return CampaignQueryService.getByTemplateType(storeId, templateType);
  }

  /**
   * Get active campaigns for a store
   */
  static async getActiveCampaigns(storeId: string): Promise<CampaignWithConfigs[]> {
    return CampaignQueryService.getActive(storeId);
  }

  // ============================================================================
  // MUTATION OPERATIONS - Delegate to CampaignMutationService
  // ============================================================================

  /**
   * Create a new campaign with validation
   */
  static async createCampaign(
    storeId: string,
    data: CampaignCreateData,
    admin?: any,
    appUrl?: string
  ): Promise<CampaignWithConfigs> {
    return CampaignMutationService.create(storeId, data, admin, appUrl);
  }

  /**
   * Update an existing campaign
   */
  static async updateCampaign(
    id: string,
    storeId: string,
    data: CampaignUpdateData,
    admin?: any
  ): Promise<CampaignWithConfigs | null> {
    return CampaignMutationService.update(id, storeId, data, admin);
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(
    id: string,
    storeId: string,
    admin?: any
  ): Promise<boolean> {
    return CampaignMutationService.delete(id, storeId, admin);
  }
}
