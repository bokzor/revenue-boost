import React from "react";
import type { TimeRemaining } from "../../hooks/useCountdownTimer";

/**
 * TimerDisplay Component
 *
 * A reusable component for displaying countdown timers in multiple formats.
 * Works seamlessly with the useCountdownTimer hook to display time remaining
 * in full (boxes with labels), compact (HH:MM:SS), or minimal (2h 30m 15s) formats.
 *
 * @example
 * ```tsx
 * // Basic usage with useCountdownTimer hook
 * const { timeRemaining } = useCountdownTimer({
 *   endDate: new Date("2024-12-31T23:59:59"),
 * });
 *
 * <TimerDisplay timeRemaining={timeRemaining} />
 *
 * // Compact format (HH:MM:SS)
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   format="compact"
 * />
 *
 * // Minimal format (2h 30m 15s)
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   format="minimal"
 * />
 *
 * // Full format with custom colors
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   format="full"
 *   accentColor="#ff0000"
 *   textColor="#ffffff"
 *   fontSize="2rem"
 * />
 *
 * // Hide days
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   showDays={false}
 * />
 *
 * // Hide labels (full format only)
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   format="full"
 *   showLabels={false}
 * />
 * ```
 *
 * @component
 * @category Shared Components
 * @subcategory Phase 2 - Core Components
 */
export interface TimerDisplayProps {
  /**
   * Time remaining object from useCountdownTimer hook
   */
  timeRemaining: TimeRemaining;
  /**
   * Display format
   * - compact: HH:MM:SS (no labels)
   * - full: Separate boxes with labels (Days, Hours, Mins, Secs)
   * - minimal: Inline text format (e.g., "2h 30m 15s")
   * @default "full"
   */
  format?: "compact" | "full" | "minimal";
  /**
   * Whether to show days when available
   * @default true
   */
  showDays?: boolean;
  /**
   * Whether to show labels (only applies to "full" format)
   * @default true
   */
  showLabels?: boolean;
  /**
   * Accent color for timer units (full format)
   * @default "#ef4444"
   */
  accentColor?: string;
  /**
   * Text color for timer values
   * @default "#ffffff"
   */
  textColor?: string;
  /**
   * Background color for timer units (full format)
   * Auto-generated from accentColor if not provided
   */
  backgroundColor?: string;
  /**
   * Font size for timer values
   * @default "1.5rem"
   */
  fontSize?: string;
  /**
   * Font weight for timer values
   * @default "700"
   */
  fontWeight?: string | number;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * TimerDisplay Component
 * 
 * Displays a countdown timer in various formats.
 * Works seamlessly with the useCountdownTimer hook.
 * Supports compact, full, and minimal display formats.
 * 
 * @example
 * ```tsx
 * const { timeRemaining } = useCountdownTimer({
 *   enabled: true,
 *   mode: "duration",
 *   duration: 3600,
 * });
 * 
 * <TimerDisplay
 *   timeRemaining={timeRemaining}
 *   format="full"
 *   showDays={true}
 *   accentColor="#ef4444"
 * />
 * ```
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  format = "full",
  showDays = true,
  showLabels = true,
  accentColor = "#ef4444",
  textColor = "#ffffff",
  backgroundColor,
  fontSize = "1.5rem",
  fontWeight = "700",
  className,
  style,
}) => {
  const { days, hours, minutes, seconds, total } = timeRemaining;

  // If timer expired, show zeros
  if (total <= 0) {
    if (format === "minimal") {
      return <span className={className} style={style}>00:00:00</span>;
    }
    if (format === "compact") {
      return <span className={className} style={{ fontSize, fontWeight, ...style }}>00:00:00</span>;
    }
  }

  // Minimal format: "2d 5h 30m" or "5h 30m 15s"
  if (format === "minimal") {
    const parts: string[] = [];
    if (showDays && days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    if (days === 0) parts.push(`${seconds}s`);
    
    return (
      <span className={className} style={{ fontSize, fontWeight, color: textColor, ...style }}>
        {parts.join(" ")}
      </span>
    );
  }

  // Compact format: "02:05:30:15" or "05:30:15"
  if (format === "compact") {
    const parts: string[] = [];
    if (showDays && days > 0) parts.push(String(days).padStart(2, "0"));
    parts.push(String(hours).padStart(2, "0"));
    parts.push(String(minutes).padStart(2, "0"));
    parts.push(String(seconds).padStart(2, "0"));
    
    return (
      <span className={className} style={{ fontSize, fontWeight, color: textColor, ...style }}>
        {parts.join(":")}
      </span>
    );
  }

  // Full format: Separate boxes with labels
  const unitBg = backgroundColor || `${accentColor}20`;

  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    ...style,
  };

  const unitStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    background: unitBg,
    minWidth: "3rem",
  };

  const valueStyles: React.CSSProperties = {
    fontSize,
    fontWeight,
    color: textColor,
    lineHeight: 1,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: "0.75rem",
    color: textColor,
    opacity: 0.8,
    marginTop: "0.25rem",
    textTransform: "capitalize",
  };

  const separatorStyles: React.CSSProperties = {
    fontSize,
    fontWeight,
    color: textColor,
    opacity: 0.6,
  };

  return (
    <div className={className} style={containerStyles}>
      {showDays && days > 0 && (
        <>
          <div style={unitStyles}>
            <div style={valueStyles}>{String(days).padStart(2, "0")}</div>
            {showLabels && <div style={labelStyles}>Days</div>}
          </div>
          <span style={separatorStyles}>:</span>
        </>
      )}
      
      <div style={unitStyles}>
        <div style={valueStyles}>{String(hours).padStart(2, "0")}</div>
        {showLabels && <div style={labelStyles}>Hours</div>}
      </div>
      
      <span style={separatorStyles}>:</span>
      
      <div style={unitStyles}>
        <div style={valueStyles}>{String(minutes).padStart(2, "0")}</div>
        {showLabels && <div style={labelStyles}>Mins</div>}
      </div>
      
      <span style={separatorStyles}>:</span>
      
      <div style={unitStyles}>
        <div style={valueStyles}>{String(seconds).padStart(2, "0")}</div>
        {showLabels && <div style={labelStyles}>Secs</div>}
      </div>
    </div>
  );
};

