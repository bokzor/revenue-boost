import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PopupConfig {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl?: string;
  backgroundColor: string;
  textColor: string;
  buttonColor?: string;
  buttonTextColor?: string;
  imageUrl?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
  size?: "small" | "medium" | "large";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean; // When false, clicking overlay won't close popup (default: true)
  overlayOpacity?: number;
  previewMode?: boolean; // When true, renders inline instead of fixed positioning
}

export interface BasePopupProps {
  config: PopupConfig;
  isVisible: boolean;
  onClose: () => void;
  onButtonClick: () => void;
  className?: string;
  children?: React.ReactNode;
  renderInline?: boolean; // If true, render inline instead of using portal (for Shadow DOM)
}

export const BasePopup: React.FC<BasePopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
  className = "",
  children,
  renderInline = false,
}) => {
  console.log("[BasePopup] 🎨 Component rendering", {
    isVisible,
    hasConfig: !!config,
    hasChildren: !!children,
    className,
    configId: config?.id,
    renderInline: renderInline,
    renderInlineType: typeof renderInline,
    previewMode: config?.previewMode,
    previewModeType: typeof config?.previewMode,
  });

  const [portalReady, setPortalReady] = useState(false);
  // In preview mode, start with present=true since isVisible is always true
  const [present, setPresent] = useState(config.previewMode && isVisible);
  const [exiting, setExiting] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setPortalReady(true);
    return () => setPortalReady(false);
  }, []);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Derive animation settings from config
  const anim = useMemo(() => {
    const extendedConfig = config as PopupConfig & {
      designConfig?: { popupDesign?: { animations?: {
        entrance?: { animation?: string; duration?: number; easing?: string };
        exit?: { animation?: string; duration?: number; easing?: string };
      }; animation?: string } };
      animations?: {
        entrance?: { animation?: string; duration?: number; easing?: string };
        exit?: { animation?: string; duration?: number; easing?: string };
      };
      animation?: string;
    };
    const wizardAnims =
      extendedConfig?.designConfig?.popupDesign?.animations || extendedConfig?.animations;
    const legacyVariant: string | undefined =
      extendedConfig?.designConfig?.popupDesign?.animation || extendedConfig?.animation;

    const entrance =
      wizardAnims?.entrance?.animation ||
      (legacyVariant === "fade"
        ? "popupFadeIn"
        : legacyVariant === "slideDown"
          ? "slideInDown"
          : "scaleIn");
    const exit =
      wizardAnims?.exit?.animation ||
      (legacyVariant === "fade"
        ? "popupFadeOut"
        : legacyVariant === "slideDown"
          ? "slideOutDown"
          : "scaleOut");

    const mapEasing = (e?: string) => {
      switch (e) {
        case "smooth":
          return "cubic-bezier(0.4, 0, 0.2, 1)";
        case "snappy":
          return "cubic-bezier(0.4, 0, 0.6, 1)";
        case "gentle":
          return "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        case "bounce":
          return "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        case "elastic":
          return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        case "back":
          return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        case "ease-in":
        case "ease-out":
        case "ease-in-out":
        case "ease":
          return e;
        default:
          return "ease-out";
      }
    };

    return {
      entranceName: prefersReducedMotion ? "popupFadeIn" : entrance,
      exitName: prefersReducedMotion ? "popupFadeOut" : exit,
      entranceDuration: prefersReducedMotion
        ? 150
        : Number(wizardAnims?.entrance?.duration) || 300,
      exitDuration: prefersReducedMotion
        ? 120
        : Number(wizardAnims?.exit?.duration) || 220,
      entranceEasing: prefersReducedMotion
        ? "linear"
        : mapEasing(wizardAnims?.entrance?.easing),
      exitEasing: prefersReducedMotion
        ? "linear"
        : mapEasing(wizardAnims?.exit?.easing || "ease-in"),
    };
  }, [config, prefersReducedMotion]);

  // Presence management
  useEffect(() => {
    if (isVisible) {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setExiting(false);
      setPresent(true);
    } else if (present) {
      setExiting(true);
      const t = window.setTimeout(
        () => {
          setPresent(false);
          setExiting(false);
        },
        Math.max(50, anim.exitDuration),
      );
      exitTimerRef.current = t as unknown as number;
    }
  }, [isVisible, present, anim.exitDuration]);

  useEffect(() => {
    if (present && !config.previewMode) {
      // Prevent body scroll when popup is open (but not in preview mode)
      document.body.style.overflow = "hidden";

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [present, onClose, config.previewMode]);

  if (!portalReady || !present) {
    return null;
  }

  // In preview mode, use relative positioning instead of fixed
  const overlayStyle: React.CSSProperties = config.previewMode
    ? {
        position: "relative",
        width: "100%",
        minHeight: "400px",
        backgroundColor: "transparent", // Overlay handled by PreviewContainer
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity || 0.5})`,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animationName: exiting ? "overlayFadeOut" : "overlayFadeIn",
        animationDuration: `${exiting ? Math.min(anim.exitDuration, 250) : Math.min(anim.entranceDuration, 250)}ms`,
        animationTimingFunction: "ease-out",
        animationFillMode: "both",
      };

  const popupStyle: React.CSSProperties = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    position: "relative",
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    willChange: "transform, opacity",
    animationName: exiting ? anim.exitName : anim.entranceName,
    animationDuration: `${exiting ? anim.exitDuration : anim.entranceDuration}ms`,
    animationTimingFunction: exiting ? anim.exitEasing : anim.entranceEasing,
    animationFillMode: "both",
  };

  const getSizeStyles = () => {
    switch (config.size) {
      case "small":
        return { width: "360px", padding: "24px" };
      case "large":
        return { width: "520px", padding: "40px" };
      default:
        return { width: "420px", padding: "32px" };
    }
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007cba",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    transition: "all 0.2s ease",
    minWidth: "140px",
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: config.textColor,
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    zIndex: 10, // Ensure close button is always on top
  };

  const handleOverlayClick = () => {
    // Only close on overlay click if not in preview mode and closeOnOverlayClick is not explicitly false
    if (!config.previewMode && config.closeOnOverlayClick !== false) {
      onClose();
    }
  };

  const content = (
    <>
      <style>{`
        @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.92); } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(40px); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayFadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
      <div style={overlayStyle} onClick={handleOverlayClick}>
        <div
          style={{ ...popupStyle, ...getSizeStyles() }}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          {config.showCloseButton !== false && (
            <button
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="Close popup"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              ×
            </button>
          )}

          {children || (
            <>
              {/* Content area with flex-grow */}
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                {config.imageUrl && (
                  <div style={{ marginBottom: "20px", textAlign: "center" }}>
                    <img
                      src={config.imageUrl}
                      alt={config.title}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "6px",
                        maxHeight: "120px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <h2
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "22px",
                    fontWeight: "700",
                    color: config.textColor,
                    lineHeight: "1.3",
                    textAlign: "left",
                    paddingRight: config.showCloseButton ? "30px" : "0",
                  }}
                >
                  {config.title}
                </h2>

                <p
                  style={{
                    margin: "0 0 24px 0",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: config.textColor,
                    opacity: 0.85,
                    textAlign: "left",
                    flex: 1,
                  }}
                >
                  {config.description}
                </p>
              </div>

              {/* Button area */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginTop: "8px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <button
                  style={buttonStyle}
                  onClick={onButtonClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {config.buttonText}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  // In preview mode OR renderInline mode (Shadow DOM), render inline
  // Otherwise use portal to render outside of component tree
  console.log("[BasePopup] Portal decision:", {
    previewMode: config.previewMode,
    renderInline: renderInline,
    willRenderInline: config.previewMode || renderInline,
  });

  if (config.previewMode || renderInline) {
    console.log("[BasePopup] Rendering INLINE (no portal)");
    return content;
  }

  console.log("[BasePopup] Rendering with PORTAL to document.body");
  return createPortal(content, document.body as Element);
};
