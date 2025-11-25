/**
 * Template Field Definitions
 *
 * Defines the customizable fields for each template type
 */

import type { ContentFieldDefinition } from "./content-config";

/**
 * Common content fields used across multiple templates
 * Note: Design/color fields are handled separately in DesignConfigSection
 */
const commonNewsletterFields: ContentFieldDefinition[] = [
  {
    id: "headline",
    type: "text",
    label: "Headline",
    description: "Main headline text",
    defaultValue: "Subscribe to our newsletter",
    section: "content",
    validation: { required: true, maxLength: 100 },
  },
  {
    id: "subheadline",
    type: "textarea",
    label: "Subheadline",
    description: "Supporting text below the headline",
    defaultValue: "Get exclusive offers and updates",
    section: "content",
    validation: { maxLength: 200 },
  },
  {
    id: "buttonText",
    type: "text",
    label: "Button Text",
    description: "Call-to-action button text",
    defaultValue: "Subscribe",
    section: "content",
    validation: { required: true, maxLength: 30 },
  },
  {
    id: "successMessage",
    type: "text",
    label: "Success Message",
    description: "Message shown after successful subscription",
    defaultValue: "Thank you for subscribing!",
    section: "content",
    validation: { maxLength: 100 },
  },
  {
    id: "emailPlaceholder",
    type: "text",
    label: "Email Placeholder",
    description: "Placeholder text for email input",
    defaultValue: "Enter your email",
    section: "content",
    validation: { maxLength: 50 },
  },
];

/**
 * Field registry for template types
 * Maps template types to their specific field definitions
 */
const TEMPLATE_FIELD_REGISTRY: Record<string, ContentFieldDefinition[]> = {
  NEWSLETTER: commonNewsletterFields,
  EXIT_INTENT: commonNewsletterFields,
  SPIN_TO_WIN: [
    ...commonNewsletterFields,
    {
      id: "wheelColors",
      type: "color-list",
      label: "Wheel Colors",
      description: "Colors for the wheel segments",
      defaultValue: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"],
      section: "theme",
    },
    {
      id: "prizes",
      type: "prize-list",
      label: "Prizes",
      description: "List of prizes on the wheel",
      defaultValue: [],
      section: "content",
    },
  ],
  SCRATCH_CARD: [], // Will be populated below
  FLASH_SALE: [], // Will be populated below
  COUNTDOWN_TIMER: [], // Will be populated below
  CART_ABANDONMENT: [], // Will be populated below
  PRODUCT_UPSELL: commonNewsletterFields,
  SOCIAL_PROOF: commonNewsletterFields,
  FREE_SHIPPING: commonNewsletterFields,
  ANNOUNCEMENT: commonNewsletterFields,
};

// Populate SCRATCH_CARD (same as SPIN_TO_WIN)
TEMPLATE_FIELD_REGISTRY.SCRATCH_CARD = TEMPLATE_FIELD_REGISTRY.SPIN_TO_WIN;

// Populate FLASH_SALE and COUNTDOWN_TIMER
const flashSaleFields: ContentFieldDefinition[] = [
  ...commonNewsletterFields,
  {
    id: "countdownDuration",
    type: "number",
    label: "Countdown Duration (minutes)",
    description: "How long the countdown should run",
    defaultValue: 30,
    section: "behavior",
    validation: { min: 1, max: 1440 },
  } as ContentFieldDefinition,
  {
    id: "urgencyText",
    type: "text",
    label: "Urgency Text",
    description: "Text to create urgency",
    defaultValue: "Limited time offer!",
    section: "content",
  } as ContentFieldDefinition,
];
TEMPLATE_FIELD_REGISTRY.FLASH_SALE = flashSaleFields;
TEMPLATE_FIELD_REGISTRY.COUNTDOWN_TIMER = flashSaleFields;

// Populate CART_ABANDONMENT
TEMPLATE_FIELD_REGISTRY.CART_ABANDONMENT = [
  ...commonNewsletterFields,
  {
    id: "cartReminderText",
    type: "text",
    label: "Cart Reminder",
    description: "Remind customers about their cart",
    defaultValue: "You left items in your cart!",
    section: "content",
  } as ContentFieldDefinition,
];

/**
 * Get field definitions for a specific template type
 */
export function getFieldsForTemplate(templateType: string): ContentFieldDefinition[] {
  const normalizedType = templateType?.toUpperCase();
  return TEMPLATE_FIELD_REGISTRY[normalizedType] || commonNewsletterFields;
}
