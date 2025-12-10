/**
 * Hooks Index
 *
 * Centralized exports for all custom hooks used in popup components.
 */

export { usePopupForm } from "./usePopupForm";
export type { PopupFormConfig, PopupFormData, PopupFormErrors } from "./usePopupForm";

export { useDiscountCode } from "./useDiscountCode";

export { useCountdownTimer } from "./useCountdownTimer";
export type { TimerMode, TimeRemaining, UseCountdownTimerOptions } from "./useCountdownTimer";

export { usePopupAnimation } from "./usePopupAnimation";
export type { UsePopupAnimationOptions } from "./usePopupAnimation";

export { useColorScheme, getColorSchemeGradient } from "./useColorScheme";
export type { ColorSchemeType, ColorSchemeColors, CustomColors } from "./useColorScheme";

export { useDesignVariables } from "./useDesignVariables";
export type { CSSVariables } from "./useDesignVariables";

// New design tokens system (replaces useDesignVariables for simplified theming)
export { useDesignTokens } from "./useDesignTokens";
export type { TokenStyles, UseDesignTokensResult } from "./useDesignTokens";

export { useCTAHandler } from "./useCTAHandler";
export type {
  CTAAction,
  CTAConfig,
  SecondaryCTAConfig,
  SuccessBehavior,
  UseCTAHandlerOptions,
  UseCTAHandlerReturn,
} from "./useCTAHandler";
