import React from "react";

export interface PopupButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "variant"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  href?: string; // If present, renders as anchor
  "data-testid"?: string;
}

export const PopupButton: React.FC<PopupButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  href,
  type = "button",
  style,
  "data-testid": testId,
  ...rest
}) => {
  // Base styles
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.15s ease-out",
    borderRadius: "8px",
    minHeight: "44px",
    opacity: disabled || loading ? 0.7 : 1,
    ...(fullWidth && { width: "100%" }),
  };

  // Size styles
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: "0.8125rem", padding: "0.5rem 1rem", minHeight: "36px" },
    md: { fontSize: "0.9375rem", padding: "0.625rem 1.25rem" },
    lg: { fontSize: "1rem", padding: "0.875rem 1.5rem" },
  };

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--rb-popup-primary-bg)",
      color: "var(--rb-popup-primary-fg)",
    },
    secondary: {
      backgroundColor: "transparent",
      color: "var(--rb-popup-fg)",
      border: "1px solid currentColor",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--rb-popup-description-fg)",
    },
    danger: {
      backgroundColor: "var(--rb-popup-error)",
      color: "#ffffff",
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || loading) return;
    if (variant === "primary") {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    } else {
      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || loading) return;
    if (variant === "primary") {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "";
    } else {
      e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string;
    }
  };

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={className}
        style={combinedStyles}
        role="button"
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={className}
      style={combinedStyles}
      disabled={disabled || loading}
      aria-busy={loading}
      data-testid={testId}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </button>
  );
};
