/**
 * Color Customization Types
 * 
 * Extended color configuration types for popup customization
 */

/**
 * Base color configuration (legacy)
 */
export interface ColorConfig {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor?: string;
}

/**
 * Extended color configuration with additional properties
 */
export interface ExtendedColorConfig extends ColorConfig {
  overlayColor?: string;
  overlayOpacity?: number;
  borderColor?: string;
  successColor?: string;
  errorColor?: string;
  warningColor?: string;
  infoColor?: string;
  linkColor?: string;
  headingColor?: string;
  subheadingColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  inputFocusColor?: string;
  iconColor?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBackgroundColor?: string;

  // Template-specific colors
  urgencyTextColor?: string;
  highlightTextColor?: string;
  lastChanceTextColor?: string;
  secondaryColor?: string;

  // Button colors
  addToCartButtonColor?: string;

  // Discount and pricing colors
  discountCodeBackgroundColor?: string;
  priceTextColor?: string;

  // Product card colors
  productCardBackgroundColor?: string;
  productTitleColor?: string;
  productPriceColor?: string;

  // Social proof colors
  notificationBackgroundColor?: string;
  customerNameColor?: string;
  timestampColor?: string;

  // Progress and timer colors
  progressBarColor?: string;
  timerColor?: string;

  // Indicator colors
  urgencyIndicatorColor?: string;
  announcementBannerColor?: string;

  // Free shipping colors
  thresholdTextColor?: string;
}

/**
 * Brand color configuration
 */
export interface BrandColorConfig {
  primary: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
}

/**
 * Color theme presets
 */
export type ColorTheme = 
  | "light"
  | "dark"
  | "vibrant"
  | "minimal"
  | "elegant"
  | "playful"
  | "professional"
  | "custom";

/**
 * Color harmony types
 */
export type ColorHarmony = 
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

/**
 * Color validation result
 */
export interface ColorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contrastRatios?: {
    textOnBackground: number;
    buttonTextOnButton: number;
    [key: string]: number;
  };
}

/**
 * Color customization props
 */
export interface ColorCustomizationProps {
  colors: ExtendedColorConfig;
  onChange: (colors: ExtendedColorConfig) => void;
  brandColors?: BrandColorConfig;
  templateType?: string;
  showAdvanced?: boolean;
  enablePreview?: boolean;
  onPreviewChange?: (colors: ExtendedColorConfig) => void;
}

/**
 * Color change event
 */
export interface ColorChangeEvent {
  property: keyof ExtendedColorConfig;
  value: string;
  previousValue: string;
  source?: string;
}

/**
 * Color preset applied event
 */
export interface ColorPresetAppliedEvent {
  presetName: string;
  colors: ExtendedColorConfig;
}

/**
 * Color preset definition
 */
export interface ColorPreset {
  id: string;
  name: string;
  description?: string;
  colors: ExtendedColorConfig;
  theme: ColorTheme;
  tags?: string[];
  isPopular?: boolean;
  templateTypes?: string[];
}

/**
 * Color picker mode
 */
export type ColorPickerMode = "simple" | "advanced" | "palette";

/**
 * Color accessibility level
 */
export type AccessibilityLevel = "AA" | "AAA";

/**
 * Contrast check result
 */
export interface ContrastCheckResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  level: AccessibilityLevel | "fail";
}

