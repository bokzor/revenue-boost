/**
 * Template Field Definitions
 * 
 * Defines the customizable fields for each template type
 */

import type { ContentFieldDefinition } from "./content-config";

/**
 * Common fields used across multiple templates
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
 * Get field definitions for a specific template type
 */
export function getFieldsForTemplate(templateType: string): ContentFieldDefinition[] {
  switch (templateType?.toUpperCase()) {
    case "NEWSLETTER":
    case "EXIT_INTENT":
      return commonNewsletterFields;

    case "SPIN_TO_WIN":
    case "SCRATCH_CARD":
      return [
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
      ];

    case "FLASH_SALE":
    case "COUNTDOWN_TIMER":
      return [
        ...commonNewsletterFields,
        {
          id: "countdownDuration",
          type: "number",
          label: "Countdown Duration (minutes)",
          description: "How long the countdown should run",
          defaultValue: 30,
          section: "behavior",
          validation: { min: 1, max: 1440 },
        },
        {
          id: "urgencyText",
          type: "text",
          label: "Urgency Text",
          description: "Text to create urgency",
          defaultValue: "Limited time offer!",
          section: "content",
        },
      ];

    case "CART_ABANDONMENT":
      return [
        ...commonNewsletterFields,
        {
          id: "cartReminderText",
          type: "text",
          label: "Cart Reminder Text",
          description: "Text reminding about abandoned cart",
          defaultValue: "You left items in your cart!",
          section: "content",
        },
      ];

    case "PRODUCT_UPSELL":
      return [
        ...commonNewsletterFields,
        {
          id: "productIds",
          type: "product-picker",
          label: "Upsell Products",
          description: "Products to recommend",
          defaultValue: [],
          section: "products",
        },
      ];

    case "SOCIAL_PROOF":
      return [
        {
          id: "notificationInterval",
          type: "number",
          label: "Notification Interval (ms)",
          description: "Time between notifications",
          defaultValue: 5000,
          section: "behavior",
          validation: { min: 1000 },
        },
        {
          id: "maxNotifications",
          type: "number",
          label: "Max Notifications",
          description: "Maximum number of notifications to show",
          defaultValue: 5,
          section: "behavior",
          validation: { min: 1 },
        },
      ];

    default:
      // Return basic fields for unknown templates
      return commonNewsletterFields;
  }
}

