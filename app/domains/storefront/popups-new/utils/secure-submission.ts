/**
 * Secure Submission Utility
 * 
 * Centralizes secure form submission logic with challenge token validation.
 * Used across all popup components that submit data to the backend.
 */

import { challengeTokenStore } from '~/domains/storefront/services/challenge-token.client';

export interface SecureSubmissionOptions {
  campaignId: string;
  endpoint: string;
  data: Record<string, any>;
  method?: 'POST' | 'PUT' | 'PATCH';
}

export interface SecureSubmissionResult {
  success: boolean;
  discountCode?: string;
  error?: string;
  data?: any;
}

/**
 * Submit data with challenge token for security
 */
export async function submitWithChallengeToken(
  options: SecureSubmissionOptions
): Promise<SecureSubmissionResult> {
  const { campaignId, endpoint, data, method = 'POST' } = options;
  
  try {
    // Get challenge token
    const challengeToken = challengeTokenStore.get(campaignId);
    
    if (!challengeToken) {
      throw new Error('Security check failed. Please refresh the page.');
    }
    
    // Get session ID from global session object (set by storefront extension)
    const sessionId = typeof window !== 'undefined'
      ? ((window as any).__RB_SESSION_ID ||
         window.sessionStorage?.getItem('revenue_boost_session') ||
         window.sessionStorage?.getItem('rb_session_id') ||
         '')
      : '';
    
    // Prepare request body
    const requestBody = {
      campaignId,
      ...data,
      sessionId,
      challengeToken,
    };
    
    // Make request
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || 'Submission failed',
      };
    }
    
    if (responseData.success) {
      return {
        success: true,
        discountCode: responseData.discountCode,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || 'Submission failed',
      };
    }
  } catch (error: any) {
    console.error('Secure submission error:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred',
    };
  }
}

/**
 * Check if challenge token exists for a campaign
 */
export function hasChallengeToken(campaignId: string): boolean {
  return !!challengeTokenStore.get(campaignId);
}

/**
 * Get session ID from storage
 * Prioritizes global session object set by storefront extension
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  return (window as any).__RB_SESSION_ID ||
         window.sessionStorage?.getItem('revenue_boost_session') ||
         window.sessionStorage?.getItem('rb_session_id') ||
         '';
}

