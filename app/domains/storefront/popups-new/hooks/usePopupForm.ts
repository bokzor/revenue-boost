/**
 * usePopupForm Hook
 * 
 * Consolidates form state management, validation, and submission logic
 * used across multiple popup components.
 * 
 * Features:
 * - Email, name, and GDPR consent state management
 * - Validation with customizable error messages
 * - Secure submission with challenge token
 * - Loading and success states
 * - Automatic form reset
 */

import { useState, useCallback } from 'react';
import { validateEmail } from '../utils';
import { submitWithChallengeToken } from '../utils/secure-submission';

export interface PopupFormConfig {
  emailRequired?: boolean;
  emailErrorMessage?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  
  nameFieldEnabled?: boolean;
  nameFieldRequired?: boolean;
  nameFieldLabel?: string;
  nameFieldPlaceholder?: string;
  
  consentFieldEnabled?: boolean;
  consentFieldRequired?: boolean;
  consentFieldText?: string;
  
  campaignId?: string;
  previewMode?: boolean;
}

export interface PopupFormData {
  email: string;
  name?: string;
  gdprConsent: boolean;
}

export interface PopupFormErrors {
  email?: string;
  name?: string;
  gdpr?: string;
}

interface UsePopupFormOptions {
  config: PopupFormConfig;
  onSubmit?: (data: PopupFormData) => Promise<string | undefined>;
  endpoint?: string; // Default endpoint for secure submission
}

export function usePopupForm(options: UsePopupFormOptions) {
  const { config, onSubmit, endpoint = '/apps/revenue-boost/api/leads/submit' } = options;
  
  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  
  // UI state
  const [errors, setErrors] = useState<PopupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedDiscountCode, setGeneratedDiscountCode] = useState<string | null>(null);
  
  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: PopupFormErrors = {};

    // Email validation
    if (config.emailRequired !== false) {
      // Email is required
      if (!email.trim()) {
        newErrors.email = config.emailErrorMessage || 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email';
      }
    } else {
      // Email is optional, but if provided, it must be valid
      if (email.trim() && !validateEmail(email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    // Name validation
    if (config.nameFieldEnabled && config.nameFieldRequired && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    // GDPR consent validation
    if (config.consentFieldEnabled && config.consentFieldRequired && !gdprConsent) {
      newErrors.gdpr = 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, name, gdprConsent, config]);
  
  // Form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return { success: false };
    }

    // If email is required but not provided, don't submit
    // This handles the case where emailRequired is false but the endpoint still requires email
    if (!email.trim() && endpoint.includes('/api/leads/submit')) {
      console.warn('[usePopupForm] Cannot submit to leads endpoint without email');
      setErrors({ email: 'Email is required' });
      return { success: false, error: 'Email is required' };
    }

    setIsSubmitting(true);

    try {
      const formData: PopupFormData = {
        email,
        name: config.nameFieldEnabled ? name : undefined,
        gdprConsent,
      };

      if (onSubmit) {
        // Custom submission handler
        const code = await onSubmit(formData);
        if (code) {
          setGeneratedDiscountCode(code);
        }
        setIsSubmitted(true);
        return { success: true, discountCode: code };
      } else {
        // Default secure submission
        if (!config.campaignId) {
          throw new Error('Missing campaignId for secure submission');
        }

        const result = await submitWithChallengeToken({
          campaignId: config.campaignId,
          endpoint,
          data: formData,
        });

        if (result.success) {
          if (result.discountCode) {
            setGeneratedDiscountCode(result.discountCode);
          }
          setIsSubmitted(true);
          return { success: true, discountCode: result.discountCode };
        } else {
          throw new Error(result.error || 'Submission failed');
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setErrors({ email: error.message || 'Something went wrong. Please try again.' });
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [email, name, gdprConsent, config, onSubmit, endpoint, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setEmail('');
    setName('');
    setGdprConsent(false);
    setErrors({});
    setIsSubmitted(false);
    setGeneratedDiscountCode(null);
  }, []);

  // Clear specific error
  const clearError = useCallback((field: keyof PopupFormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  return {
    // Form state
    formState: {
      email,
      name,
      gdprConsent,
    },

    // Setters
    setEmail,
    setName,
    setGdprConsent,

    // Validation & errors
    errors,
    validateForm,
    clearError,

    // Submission
    handleSubmit,
    isSubmitting,
    isSubmitted,
    generatedDiscountCode,

    // Utilities
    resetForm,
  };
}

