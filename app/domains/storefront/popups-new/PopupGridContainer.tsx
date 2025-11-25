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
          padding: 0; /* Reset padding, let grid handle it or inner cells */
          border-radius: ${config.borderRadius ?? 16}px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 100%;
          max-height: 100vh;
          margin: 0 auto;
          overflow: hidden;
          background-color: #ffffff; /* Fallback */
          
          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
        }

        .popup-grid-content {
          display: grid;
          width: 100%;
          height: 100%;
          /* Mobile First: Stacked */
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
        }

        /* Close Button */
        .popup-close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
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
          transition: background-color 0.2s;
        }
        .popup-close-button:hover {
          background-color: rgba(15, 23, 42, 0.15);
        }

        /* Desktop Layout */
        @container popup (min-width: 600px) {
          .popup-grid-content {
            grid-template-columns: ${singleColumn ? "1fr" : "1fr 1fr"};
            grid-template-rows: 1fr;
            min-height: ${singleColumn ? "auto" : "450px"};
          }

          ${
            !singleColumn
              ? `
          /* Image/Visual Cell (First Child) */
          .popup-grid-content > *:first-child {
            order: ${imagePosition === "right" ? 2 : 1};
          }

          /* Form/Content Cell (Second Child) */
          .popup-grid-content > *:last-child {
            order: ${imagePosition === "right" ? 1 : 2};
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
