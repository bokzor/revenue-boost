import React from "react";

export interface PopupHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  align?: "start" | "center" | "end";
}

export const PopupHeading: React.FC<PopupHeadingProps> = ({
  as: Component = "h2",
  align = "start",
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

  const headingStyles: React.CSSProperties = {
    margin: 0,
    fontFamily: "inherit",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "inherit",
    fontSize: "1.5rem",
    textAlign: alignMap[align] as React.CSSProperties["textAlign"],
    wordBreak: "break-word",
    ...style,
  };

  return (
    <>
      {/* Container query responsive sizing */}
      <style>{`
        @container popup-card (min-width: 480px) {
          [data-popup-heading] {
            font-size: 1.75rem;
          }
        }
        @container popup-card (min-width: 600px) {
          [data-popup-heading] {
            font-size: 2rem;
          }
        }
      `}</style>

      <Component data-popup-heading className={className} style={headingStyles} {...rest}>
        {children}
      </Component>
    </>
  );
};
