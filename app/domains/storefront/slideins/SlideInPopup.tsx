import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PopupConfig } from "../popups-new/types";

export interface SlideInPopupProps {
  config: PopupConfig & {
    slideDirection?: "left" | "right" | "bottom";
    width?: string;
    height?: string;
    title?: string;
    description?: string;
  };
  isVisible: boolean;
  onClose: () => void;
  onButtonClick: () => void;
}

export const SlideInPopup: React.FC<SlideInPopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isVisible) {
    return null;
  }

  const slideDirection = config.slideDirection || "right";
  const backgroundImageMode: "none" | "preset" | "file" =
    (config.backgroundImageMode as "none" | "preset" | "file" | undefined) ?? (config.imageUrl ? "file" : "none");
  const imageUrl = backgroundImageMode === "none" ? undefined : config.imageUrl;

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 999999,
      backgroundColor: config.backgroundColor,
      color: config.textColor,
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      transition: "transform 0.3s ease-out",
    };

    switch (slideDirection) {
      case "left":
        return {
          ...baseStyles,
          top: "50%",
          left: "20px",
          transform: "translateY(-50%)",
          width: config.width || "320px",
          maxHeight: "80vh",
          borderRadius: "8px",
        };
      case "right":
        return {
          ...baseStyles,
          top: "50%",
          right: "20px",
          transform: "translateY(-50%)",
          width: config.width || "320px",
          maxHeight: "80vh",
          borderRadius: "8px",
        };
      case "bottom":
        return {
          ...baseStyles,
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: config.width || "400px",
          maxWidth: "90vw",
          borderRadius: "8px",
        };
      default:
        return baseStyles;
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    overflow: "auto",
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: config.textColor,
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007cba",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    transition: "all 0.2s ease",
    width: "100%",
  };

  const content = (
    <div style={getPositionStyles()}>
      <div style={containerStyle}>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          aria-label="Close popup"
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          ×
        </button>

        {imageUrl && (
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <img
              src={imageUrl}
              alt={config.title}
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "4px",
                maxHeight: "120px",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: "bold",
            color: config.textColor,
            paddingRight: "30px",
          }}
        >
          {config.title}
        </h3>

        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "14px",
            lineHeight: "1.4",
            color: config.textColor,
          }}
        >
          {config.description}
        </p>

        <button
          style={buttonStyle}
          onClick={onButtonClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {config.buttonText}
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body as Element);
};
