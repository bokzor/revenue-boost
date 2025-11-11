/**
 * Tests for Campaign Update API
 * 
 * Tests the PUT /api/campaigns/:campaignId endpoint
 */

import { describe, it, expect } from 'vitest';
import { CampaignUpdateDataSchema } from '~/domains/campaigns/types/campaign';

describe('Campaign Update API', () => {
  describe('CampaignUpdateDataSchema', () => {
    it('should validate status update without requiring id', () => {
      const updateData = {
        status: 'ACTIVE',
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('should validate partial campaign update', () => {
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
        priority: 10,
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Campaign Name');
        expect(result.data.description).toBe('Updated description');
        expect(result.data.priority).toBe(10);
      }
    });

    it('should validate status change from DRAFT to ACTIVE', () => {
      const updateData = {
        status: 'ACTIVE',
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(true);
    });

    it('should validate status change to PAUSED', () => {
      const updateData = {
        status: 'PAUSED',
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const updateData = {
        status: 'INVALID_STATUS',
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(false);
    });

    it('should validate empty update (all fields optional)', () => {
      const updateData = {};

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(true);
    });

    it('should reject negative priority', () => {
      const updateData = {
        priority: -1,
      };

      const result = CampaignUpdateDataSchema.safeParse(updateData);
      
      expect(result.success).toBe(false);
    });
  });
});

