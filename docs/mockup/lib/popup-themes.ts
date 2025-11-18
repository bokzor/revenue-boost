export type PopupTheme =
  | "modern"
  | "minimal"
  | "elegant"
  | "bold"
  | "glass"
  | "dark"
  | "gradient"
  | "luxury"
  | "neon"
  | "ocean"

export interface ThemeColors {
  background: string
  text: string
  primary: string
  secondary: string
  accent: string
  border: string
  success: string
  warning: string
  imageBg?: string
  descColor?: string
  inputBorder?: string
  timerBg?: string
  timerText?: string
  ctaBg?: string
  ctaText?: string
  blur?: boolean
}

export const popupThemes: Record<PopupTheme, ThemeColors> = {
  modern: {
    background: "#ffffff",
    text: "#111827",
    primary: "#3b82f6",
    secondary: "#f3f4f6",
    accent: "#dbeafe",
    border: "#e5e7eb",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#f4f4f5",
    descColor: "#52525b",
    inputBorder: "#d4d4d8",
    timerBg: "rgba(59, 130, 246, 0.1)",
    timerText: "#3b82f6",
    ctaBg: "#3b82f6",
    ctaText: "#ffffff",
  },
  minimal: {
    background: "#fafafa",
    text: "#18181b",
    primary: "#18181b",
    secondary: "#f4f4f5",
    accent: "#e4e4e7",
    border: "#e4e4e7",
    success: "#22c55e",
    warning: "#ef4444",
    imageBg: "#f4f4f5",
    descColor: "#71717a",
    inputBorder: "#d4d4d8",
    timerBg: "#f4f4f5",
    timerText: "#18181b",
    ctaBg: "#18181b",
    ctaText: "#ffffff",
  },
  elegant: {
    background: "#fefce8",
    text: "#44403c",
    primary: "#a855f7",
    secondary: "#fef3c7",
    accent: "#f3e8ff",
    border: "#e7e5e4",
    success: "#a855f7",
    warning: "#dc2626",
    imageBg: "#fef3c7",
    descColor: "#78716c",
    inputBorder: "#e7e5e4",
    timerBg: "rgba(168, 85, 247, 0.1)",
    timerText: "#a855f7",
    ctaBg: "#a855f7",
    ctaText: "#ffffff",
  },
  bold: {
    background: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
    text: "#ffffff",
    primary: "#fde68a",
    secondary: "rgba(255, 255, 255, 0.2)",
    accent: "#fde68a",
    border: "rgba(255, 255, 255, 0.3)",
    success: "#10b981",
    warning: "#fca5a5",
    imageBg: "rgba(255, 255, 255, 0.15)",
    descColor: "#fef3c7",
    inputBorder: "rgba(255, 255, 255, 0.3)",
    timerBg: "rgba(255, 255, 255, 0.25)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#ec4899",
  },
  glass: {
    background: "rgba(255, 255, 255, 0.7)",
    text: "#18181b",
    primary: "#6366f1",
    secondary: "rgba(255, 255, 255, 0.5)",
    accent: "rgba(99, 102, 241, 0.1)",
    border: "rgba(255, 255, 255, 0.3)",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "rgba(244, 244, 245, 0.8)",
    descColor: "#52525b",
    inputBorder: "rgba(212, 212, 216, 0.5)",
    timerBg: "rgba(99, 102, 241, 0.15)",
    timerText: "#6366f1",
    ctaBg: "#6366f1",
    ctaText: "#ffffff",
    blur: true,
  },
  dark: {
    background: "#111827",
    text: "#f9fafb",
    primary: "#3b82f6",
    secondary: "#1f2937",
    accent: "#374151",
    border: "#374151",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#1f2937",
    descColor: "#d1d5db",
    inputBorder: "#4b5563",
    timerBg: "#1f2937",
    timerText: "#f9fafb",
    ctaBg: "#3b82f6",
    ctaText: "#ffffff",
  },
  gradient: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    text: "#ffffff",
    primary: "#e0e7ff",
    secondary: "rgba(255, 255, 255, 0.15)",
    accent: "#e0e7ff",
    border: "rgba(255, 255, 255, 0.2)",
    success: "#10b981",
    warning: "#fca5a5",
    imageBg: "rgba(255, 255, 255, 0.1)",
    descColor: "#e0e7ff",
    inputBorder: "rgba(255, 255, 255, 0.3)",
    timerBg: "rgba(255, 255, 255, 0.2)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#667eea",
  },
  luxury: {
    background: "#1a1a0a",
    text: "#d4af37",
    primary: "#d4af37",
    secondary: "#2d2d1a",
    accent: "#3d3d2a",
    border: "#d4af37",
    success: "#d4af37",
    warning: "#dc2626",
    imageBg: "#2d2d1a",
    descColor: "#f5f5dc",
    inputBorder: "#d4af37",
    timerBg: "rgba(212, 175, 55, 0.1)",
    timerText: "#d4af37",
    ctaBg: "#d4af37",
    ctaText: "#1a1a0a",
  },
  neon: {
    background: "#0a0a1f",
    text: "#00ffff",
    primary: "#00ffff",
    secondary: "#1a1a3a",
    accent: "#ff00ff",
    border: "rgba(0, 255, 255, 0.3)",
    success: "#00ffff",
    warning: "#ff00ff",
    imageBg: "#1a1a3a",
    descColor: "#00ffff",
    inputBorder: "rgba(0, 255, 255, 0.5)",
    timerBg: "rgba(0, 255, 255, 0.1)",
    timerText: "#00ffff",
    ctaBg: "#00ffff",
    ctaText: "#0a0a1f",
  },
  ocean: {
    background: "#f0f9ff",
    text: "#0c4a6e",
    primary: "#0ea5e9",
    secondary: "#e0f2fe",
    accent: "#bae6fd",
    border: "#7dd3fc",
    success: "#14b8a6",
    warning: "#ef4444",
    imageBg: "#e0f2fe",
    descColor: "#0369a1",
    inputBorder: "#7dd3fc",
    timerBg: "rgba(14, 165, 233, 0.1)",
    timerText: "#0ea5e9",
    ctaBg: "#0ea5e9",
    ctaText: "#ffffff",
  },
}

export function getThemeColors(theme: PopupTheme, customColors?: Partial<ThemeColors>): ThemeColors {
  const baseTheme = popupThemes[theme]

  if (!customColors) {
    return baseTheme
  }

  return {
    ...baseTheme,
    ...customColors,
  }
}

export interface WheelBorderConfig {
  enabled: boolean
  color: string
  width: number
  style: "solid" | "dashed" | "dotted"
}

export const wheelBorderDefaults: Record<PopupTheme, WheelBorderConfig> = {
  modern: {
    enabled: true,
    color: "#3b82f6",
    width: 6,
    style: "solid",
  },
  minimal: {
    enabled: true,
    color: "#d4d4d8",
    width: 3,
    style: "solid",
  },
  elegant: {
    enabled: true,
    color: "#a855f7",
    width: 5,
    style: "solid",
  },
  bold: {
    enabled: true,
    color: "#ffffff",
    width: 8,
    style: "solid",
  },
  glass: {
    enabled: true,
    color: "rgba(99, 102, 241, 0.4)",
    width: 4,
    style: "solid",
  },
  dark: {
    enabled: true,
    color: "#3b82f6",
    width: 6,
    style: "solid",
  },
  gradient: {
    enabled: true,
    color: "#ffffff",
    width: 7,
    style: "solid",
  },
  luxury: {
    enabled: true,
    color: "#d4af37",
    width: 6,
    style: "solid",
  },
  neon: {
    enabled: true,
    color: "#00ffff",
    width: 5,
    style: "solid",
  },
  ocean: {
    enabled: true,
    color: "#0ea5e9",
    width: 6,
    style: "solid",
  },
}

export function getWheelBorderConfig(theme: PopupTheme, customBorder?: Partial<WheelBorderConfig>): WheelBorderConfig {
  const defaultBorder = wheelBorderDefaults[theme]

  if (!customBorder) {
    return defaultBorder
  }

  return {
    ...defaultBorder,
    ...customBorder,
  }
}
