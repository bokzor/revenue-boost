import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildScopedCss } from "../shared/css";
import type { PopupConfig } from "../popups-new/types";

export interface BannerPopupProps {
  config: PopupConfig & {
    position?: "top" | "bottom";
    height?: string;
    sticky?: boolean;
    title?: string;
    description?: string;
  };
  isVisible: boolean;
  onClose: () => void;
  onButtonClick: () => void;
}

export const BannerPopup: React.FC<BannerPopupProps> = ({
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

  useEffect(() => {
    if (isVisible && config.sticky) {
      // Add padding to body to prevent content from being hidden behind banner
      const position = config.position || "top";
      const height = config.height || "80px";

      if (position === "top") {
        document.body.style.paddingTop = height;
      } else {
        document.body.style.paddingBottom = height;
      }

      return () => {
        document.body.style.paddingTop = "";
        document.body.style.paddingBottom = "";
      };
    }
  }, [isVisible, config.sticky, config.position, config.height]);

  const position = config.position || "top";
  const scopedCss = useMemo(
    () =>
      buildScopedCss(
        (config as { globalCustomCSS?: string }).globalCustomCSS,
        (config as { customCSS?: string }).customCSS,
        "data-rb-banner",
        "banner"
      ),
    [config]
  );

  if (!mounted || !isVisible) {
    return null;
  }

  const bannerStyle: React.CSSProperties = {
    position: config.sticky ? "fixed" : "relative",
    [position]: 0,
    left: 0,
    right: 0,
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    zIndex: 999999,
    boxShadow:
      position === "top" ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "0 -2px 10px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease-out",
    minHeight: config.height || "auto",
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    gap: "16px",
  };

  const contentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
  };

  const textContentStyle: React.CSSProperties = {
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "bold",
    color: config.textColor,
  };

  const descriptionStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "14px",
    color: config.textColor,
    opacity: 0.9,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007cba",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: config.textColor,
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    padding: "4px",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const content = (
    <div style={bannerStyle} data-rb-banner>
      {scopedCss ? <style>{scopedCss}</style> : null}
      <div style={containerStyle}>
        <div style={contentStyle}>
          {config.imageUrl && (
            <img
              src={config.imageUrl}
              alt={config.title}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "4px",
                objectFit: "cover",
              }}
            />
          )}

          <div style={textContentStyle}>
            <h4 style={titleStyle}>{config.title}</h4>
            <p style={descriptionStyle}>{config.description}</p>
          </div>
        </div>

        <div style={actionsStyle}>
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

          <button
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="Close banner"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body as Element);
};
