import React from "react";

export interface PopupTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: "p" | "span" | "div";
  align?: "start" | "center" | "end";
  tone?: "default" | "subdued" | "accent" | "error" | "success";
  variant?: "body" | "caption";
}

export const PopupText: React.FC<PopupTextProps> = ({
  as: Component = "p",
  align = "start",
  tone = "default",
  variant = "body",
  className,
  style,
  children,
  ...rest
}) => {
  const alignMap = {
    start: "left",
    center: "center",
    end: "right",
  };

  const toneColors: Record<string, string> = {
    default: "var(--rb-popup-fg)",
    subdued: "var(--rb-popup-description-fg)",
    accent: "var(--rb-popup-accent)",
    error: "var(--rb-popup-error)",
    success: "var(--rb-popup-success)",
  };

  const textStyles: React.CSSProperties = {
    margin: 0,
    fontFamily: "inherit",
    fontSize: variant === "caption" ? "0.875rem" : tone === "subdued" ? "0.9375rem" : "1rem",
    lineHeight: 1.5,
    color: toneColors[tone],
    textAlign: alignMap[align] as any,
    wordBreak: "break-word",
    ...style,
  };

  return (
    <Component className={className} style={textStyles} {...rest}>
      {children}
    </Component>
  );
};
