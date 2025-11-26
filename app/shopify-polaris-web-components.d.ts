/**
 * Type declarations for Shopify Polaris Web Components
 *
 * These type declarations override the default Polaris web component types
 * to add support for properties we use in our application:
 * - children prop on text-field, checkbox, and button elements
 * - multiline and rows props on text-field
 * - url prop on button
 *
 * This file must be included in tsconfig.json to take effect.
 */

import type { ReactNode, ChangeEvent } from "react";

// Override the global JSX namespace to add our custom props
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Override s-text-field to support children, multiline, and rows
      "s-text-field": {
        label?: string;
        name?: string;
        value?: string;
        error?: string;
        details?: string;
        required?: boolean;
        placeholder?: string;
        multiline?: boolean;
        rows?: number;
        onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        children?: ReactNode;
      };

      // Override s-checkbox to support children
      "s-checkbox": {
        name?: string;
        checked?: boolean;
        error?: string;
        details?: string;
        onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
        children?: ReactNode;
        label?: string;
      };

      // Override s-button to support url and children
      "s-button": {
        children?: ReactNode;
        url?: string;
        onClick?: () => void;
        variant?: "primary" | "secondary" | "plain" | "tertiary";
        disabled?: boolean;
        loading?: boolean;
      };

      // Add other custom elements that may not be in Polaris types
      "s-select": {
        label?: string;
        name?: string;
        value?: string;
        error?: string;
        details?: string;
        required?: boolean;
        placeholder?: string;
        onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
        children?: ReactNode;
      };

      "s-section": {
        heading?: string;
        children?: ReactNode;
      };

      "s-collapsible": {
        open?: boolean;
        children?: ReactNode;
      };

      "s-page-actions": {
        children?: ReactNode;
      };

      "s-app-nav": {
        children?: ReactNode;
      };

      "s-link": {
        href?: string;
        children?: ReactNode;
      };
    }
  }
}

export {};
