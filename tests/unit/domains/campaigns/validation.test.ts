/**
 * Campaign Validation Tests
 * 
 * Tests for campaign and experiment validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateCampaignCreateData,
  validateCampaignUpdateData,
  validateExperimentCreateData,
  validateContentConfig,
} from '~/domains/campaigns/validation/campaign-validation';

describe('Campaign Validation', () => {
  describe('validateCampaignCreateData', () => {
    it('should validate valid campaign data', () => {
      const validData = {
        name: 'Test Campaign',
        goal: 'NEWSLETTER_SIGNUP',
        templateType: 'NEWSLETTER',
      };

      const result = validateCampaignCreateData(validData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.name).toBe('Test Campaign');
      }
    });

    it('should reject campaign without required fields', () => {
      const invalidData = {
        name: 'Test Campaign',
        // Missing required fields
      };

      const result = validateCampaignCreateData(invalidData);
      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject campaign with invalid goal', () => {
      const invalidData = {
        name: 'Test Campaign',
        goal: 'INVALID_GOAL',
        templateType: 'NEWSLETTER',
      };

      const result = validateCampaignCreateData(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate campaign with content config', () => {
      const validData = {
        name: 'Newsletter Campaign',
        goal: 'NEWSLETTER_SIGNUP',
        templateType: 'NEWSLETTER',
        contentConfig: {
          headline: 'Subscribe Now',
          subheadline: 'Get updates',
          buttonText: 'Subscribe',
          submitButtonText: 'Subscribe Now', // Required field in NewsletterContentSchema
          successMessage: 'Thank you for subscribing!',
          emailPlaceholder: 'Enter email',
        },
      };

      const result = validateCampaignCreateData(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateCampaignUpdateData', () => {
    it('should validate partial update data', () => {
      const updateData = {
        id: 'cltest123456789',
        name: 'Updated Campaign Name',
        status: 'ACTIVE',
      };

      const result = validateCampaignUpdateData(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal update data', () => {
      const updateData = {
        id: 'cltest123456789',
      };

      const result = validateCampaignUpdateData(updateData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const updateData = {
        status: 'INVALID_STATUS',
      };

      const result = validateCampaignUpdateData(updateData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateExperimentCreateData', () => {
    it('should validate valid experiment data', () => {
      const validData = {
        name: 'Test Experiment',
        description: 'Testing variants',
        hypothesis: 'Variant B will perform better',
        trafficAllocation: {
          A: 50,
          B: 50,
        },
        successMetrics: {
          primaryMetric: 'conversion_rate',
        },
      };

      const result = validateExperimentCreateData(validData);
      expect(result.success).toBe(true);
    });

    it('should reject experiment without required fields', () => {
      const invalidData = {
        name: 'Test Experiment',
        // Missing required fields
      };

      const result = validateExperimentCreateData(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate experiment with 3 variants', () => {
      const validData = {
        name: 'A/B/C Test',
        description: 'Testing three variants',
        hypothesis: 'B or C will win',
        trafficAllocation: {
          A: 34,
          B: 33,
          C: 33,
        },
        successMetrics: {
          primaryMetric: 'conversion_rate',
          secondaryMetrics: ['revenue_per_visitor', 'email_signups'],
        },
      };

      const result = validateExperimentCreateData(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateContentConfig', () => {
    it('should validate newsletter content config', () => {
      const contentConfig = {
        headline: 'Subscribe',
        subheadline: 'Get updates',
        buttonText: 'Subscribe Now',
        submitButtonText: 'Subscribe Now', // Required field in NewsletterContentSchema
        successMessage: 'Thanks for subscribing!',
        emailPlaceholder: 'Your email',
      };

      const result = validateContentConfig('NEWSLETTER', contentConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid newsletter content', () => {
      const contentConfig = {
        headline: 'Subscribe',
        // Missing required fields like submitButtonText
      };

      const result = validateContentConfig('NEWSLETTER', contentConfig);
      expect(result.success).toBe(false);
    });
  });
});

