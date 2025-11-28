import React from "react";
import type { PopupDesignConfig } from "./types";

interface PopupGridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  config: PopupDesignConfig;
  onClose: () => void;
  imagePosition?: "left" | "right";
  className?: string;
  singleColumn?: boolean;
}

export const PopupGridContainer: React.FC<PopupGridContainerProps> = ({
  children,
  config,
  onClose,
  imagePosition = "left",
  className = "",
  singleColumn = false,
  ...rest
}) => {
  const baseBackground = config.backgroundColor || "#FFFFFF";
  const backgroundStyles: React.CSSProperties = baseBackground.startsWith("linear-gradient(")
    ? { backgroundImage: baseBackground, backgroundColor: "transparent" }
    : { backgroundColor: baseBackground };

  return (
    <div className={`popup-grid-container ${className}`} style={backgroundStyles} {...rest}>
      <style>{`
        .popup-grid-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 0;
          border-radius: ${config.borderRadius ?? 16}px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 100%;
          max-height: 100vh;
          margin: 0 auto;
          overflow: hidden;
          background-color: #ffffff;
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};

          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
        }

        .popup-grid-content {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        /* Close Button - Scales with container */
        .popup-close-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: none;
          background-color: rgba(15, 23, 42, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${config.textColor || "#4B5563"};
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
          z-index: 50;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .popup-close-button:hover {
          background-color: rgba(15, 23, 42, 0.15);
          transform: scale(1.05);
        }

        /* Small container: Compact close button */
        @container popup (max-width: 399px) {
          .popup-close-button {
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            font-size: 12px;
          }
        }

        /* Medium container: Default close button */
        @container popup (min-width: 400px) {
          .popup-close-button {
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            font-size: 16px;
          }
        }

        /* Two-column layout when container is wide enough */
        @container popup (min-width: 520px) {
          .popup-grid-content {
            flex-direction: ${singleColumn ? "column" : "row"};
            min-height: ${singleColumn ? "auto" : "380px"};
          }

          ${
            !singleColumn
              ? `
          /* Image/Visual Cell */
          .popup-grid-content > *:first-child {
            flex: 1 1 45%;
            min-width: 0;
            order: ${imagePosition === "right" ? 2 : 1};
          }

          /* Form/Content Cell */
          .popup-grid-content > *:last-child {
            flex: 1 1 55%;
            min-width: 0;
            order: ${imagePosition === "right" ? 1 : 2};
          }
          `
              : ""
          }
        }

        /* Larger containers: More spacious layout */
        @container popup (min-width: 700px) {
          .popup-grid-content {
            min-height: ${singleColumn ? "auto" : "450px"};
          }

          ${
            !singleColumn
              ? `
          .popup-grid-content > *:first-child {
            flex: 1 1 50%;
          }
          .popup-grid-content > *:last-child {
            flex: 1 1 50%;
          }
          `
              : ""
          }
        }
      `}</style>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="popup-close-button"
        aria-label="Close popup"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>X</span>
      </button>

      <div className="popup-grid-content">{children}</div>
    </div>
  );
};
