import { z } from "zod";

export const CUSTOM_CSS_MAX_LENGTH = 30_000;

const scriptTagRegex = /<\s*\/?script\b/i;
const javascriptImportRegex = /@import\s+url\(\s*['"]?\s*javascript:/i;

/**
 * Shared schema for validating custom CSS blobs.
 * - Caps length to prevent overly large payloads
 * - Blocks obvious script injection attempts
 * - Trims whitespace for consistent storage
 */
export const CustomCssSchema = z
  .string()
  .max(
    CUSTOM_CSS_MAX_LENGTH,
    `Custom CSS is too long (max ${CUSTOM_CSS_MAX_LENGTH.toLocaleString()} characters)`
  )
  .refine((css) => !scriptTagRegex.test(css), "Custom CSS cannot include <script> tags")
  .refine(
    (css) => !javascriptImportRegex.test(css),
    "Custom CSS cannot include javascript: @import URLs"
  )
  .transform((css) => css.trim());

/**
 * Validate and sanitize a CSS string outside of Zod contexts.
 * Returns undefined when input is empty/whitespace.
 */
export function validateCustomCss(css: unknown, fieldName = "customCSS"): string | undefined {
  if (css === undefined || css === null) return undefined;
  if (typeof css !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const parsed = CustomCssSchema.parse(css);
  return parsed.length > 0 ? parsed : undefined;
}
