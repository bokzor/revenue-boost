/**
 * Cart Drawer Popup Component
 *
 * Unified component that supports both display modes:
 * 1. Full-screen modal (aggressive, high conversion)
 * 2. Drawer overlay (less intrusive, better UX)
 *
 * Merchants can choose which mode to use based on their strategy.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import type { PopupContentConfig } from "~/domains/campaigns/types/campaign-types";
import type {
  PopupDisplayConfig,
  CartDrawerDisplayConfig,
} from "~/domains/popups/popup-display-types";
import {
  getDisplayPreset,
  getMobileDisplayConfig,
} from "~/domains/popups/popup-display-types";

interface CartDrawerPopupProps {
  content: PopupContentConfig;
  onClose: () => void;
  onConversion?: () => void;
  products?: any[];
  discountCode?: string;
  displayConfig?: PopupDisplayConfig | CartDrawerDisplayConfig | string; // Preset name or config object
}

/**
 * Main unified component - automatically chooses renderer based on display mode
 */
export function CartDrawerPopup({
  content,
  onClose,
  onConversion,
  products = [],
  discountCode,
  displayConfig = "drawer-overlay-top", // Default to drawer overlay
}: CartDrawerPopupProps) {
  // Resolve display config
  const config =
    typeof displayConfig === "string"
      ? getDisplayPreset(displayConfig)
      : displayConfig;

  if (!config) {
    console.error("Invalid display config:", displayConfig);
    return null;
  }

  // Detect mobile and apply mobile overrides
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const finalConfig = isMobile ? getMobileDisplayConfig(config) : config;

  // Render appropriate component based on mode
  if (finalConfig.mode === "modal") {
    return (
      <FullScreenModal
        content={content}
        onClose={onClose}
        onConversion={onConversion}
        products={products}
        discountCode={discountCode}
        config={finalConfig}
      />
    );
  }

  if (finalConfig.mode === "drawer-overlay") {
    return (
      <DrawerOverlay
        content={content}
        onClose={onClose}
        onConversion={onConversion}
        products={products}
        discountCode={discountCode}
        config={finalConfig as CartDrawerDisplayConfig}
      />
    );
  }

  // Fallback to modal
  return (
    <FullScreenModal
      content={content}
      onClose={onClose}
      onConversion={onConversion}
      products={products}
      discountCode={discountCode}
      config={finalConfig}
    />
  );
}

/**
 * Drawer Overlay Component (Less Intrusive)
 */
interface DrawerOverlayProps
  extends Omit<CartDrawerPopupProps, "displayConfig"> {
  config: CartDrawerDisplayConfig;
}

function DrawerOverlay({
  content,
  onClose,
  onConversion,
  products = [],
  discountCode,
  config,
}: DrawerOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState({
    top: 0,
    right: 0,
    width: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find cart drawer element
    const drawerSelectors = [
      "[data-cart-drawer]",
      ".cart-drawer",
      "#CartDrawer",
      ".mini-cart",
      "#mini-cart",
      ".drawer--cart",
    ];

    let drawerElement: Element | null = null;
    for (const selector of drawerSelectors) {
      drawerElement = document.querySelector(selector);
      if (drawerElement) break;
    }

    if (drawerElement) {
      const rect = drawerElement.getBoundingClientRect();
      setDrawerPosition({
        top: rect.top,
        right: window.innerWidth - rect.right,
        width: rect.width,
      });
    }

    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, config.animationDuration || 300);
  };

  const handleAddProduct = (productId: string) => {
    // Add product to cart
    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, quantity: 1 }),
    })
      .then(() => {
        onConversion?.();
        handleClose();
      })
      .catch(console.error);
  };

  // Animation styles based on config
  const getAnimationStyle = () => {
    const baseTransform = isVisible ? "translateY(0)" : "translateY(-20px)";

    switch (config.animation) {
      case "slide-down":
        return isVisible ? "translateY(0)" : "translateY(-20px)";
      case "slide-up":
        return isVisible ? "translateY(0)" : "translateY(20px)";
      case "fade":
        return "translateY(0)";
      default:
        return baseTransform;
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`cart-drawer-overlay ${isVisible ? "visible" : ""}`}
      style={{
        position: "fixed",
        top:
          config.position === "bottom-of-drawer"
            ? "auto"
            : `${drawerPosition.top}px`,
        bottom: config.position === "bottom-of-drawer" ? "0" : "auto",
        right: `${drawerPosition.right}px`,
        width: config.width || `${drawerPosition.width}px`,
        maxWidth: config.maxWidth || "400px",
        height: config.height || "auto",
        maxHeight: config.maxHeight || "none",
        zIndex: config.zIndex || 9999,
        transition: `all ${config.animationDuration || 300}ms ease`,
        opacity: isVisible ? 1 : 0,
        transform: getAnimationStyle(),
        padding: config.padding || "16px",
      }}
    >
      {/* Compact Banner Style */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            color: "white",
            fontSize: "16px",
            lineHeight: "1",
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            {content.headline || "🎁 Complete Your Order"}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {content.subheadline || "Add these items for a special discount"}
          </div>
        </div>

        {/* Products (compact list) */}
        {products.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {products.slice(0, 2).map((product) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <div style={{ flex: 1, fontSize: "13px" }}>
                  <div style={{ fontWeight: "500" }}>{product.title}</div>
                  <div style={{ opacity: 0.8 }}>${product.price}</div>
                </div>
                <button
                  onClick={() => handleAddProduct(product.variantId)}
                  style={{
                    background: "white",
                    color: "#667eea",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Discount code */}
        {discountCode && (
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Use code: <strong>{discountCode}</strong>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleClose}
          style={{
            width: "100%",
            background: "white",
            color: "#667eea",
            border: "none",
            borderRadius: "6px",
            padding: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "12px",
          }}
        >
          {content.ctaText || "Continue Shopping"}
        </button>
      </div>
    </div>
  );
}

/**
 * Full-Screen Modal Component (Aggressive)
 */
interface FullScreenModalProps
  extends Omit<CartDrawerPopupProps, "displayConfig"> {
  config: PopupDisplayConfig;
}

function FullScreenModal({
  content,
  onClose,
  onConversion,
  products = [],
  discountCode,
  config,
}: FullScreenModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, config.animationDuration || 300);
  }, [onClose, config.animationDuration]);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && config.closeOnEscape) {
        handleClose();
      }
    };

    if (config.closeOnEscape) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [config.closeOnEscape, handleClose]);

  const handleAddProduct = (productId: string) => {
    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, quantity: 1 }),
    })
      .then(() => {
        onConversion?.();
        handleClose();
      })
      .catch(console.error);
  };

  // Animation styles based on config
  const getModalTransform = () => {
    const baseTransform = "translate(-50%, -50%)";

    if (!isVisible) {
      switch (config.animation) {
        case "scale":
          return `${baseTransform} scale(0.9)`;
        case "slide-up":
          return `translate(-50%, -40%)`;
        case "slide-down":
          return `translate(-50%, -60%)`;
        default:
          return `${baseTransform} scale(0.95)`;
      }
    }

    return baseTransform;
  };

  return (
    <>
      {/* Full-screen overlay */}
      {config.overlay && (
        <div
          onClick={config.closeOnOverlayClick ? handleClose : undefined}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: config.overlayColor || "rgba(0,0,0,0.5)",
            opacity: isVisible ? config.overlayOpacity || 0.5 : 0,
            zIndex: (config.zIndex || 9999) - 1,
            transition: `opacity ${config.animationDuration || 300}ms ease`,
            cursor: config.closeOnOverlayClick ? "pointer" : "default",
          }}
        />
      )}

      {/* Centered modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: getModalTransform(),
          background: "white",
          borderRadius: "12px",
          padding: config.padding || "24px",
          maxWidth: config.maxWidth || "500px",
          width: config.width || "90%",
          maxHeight: config.maxHeight || "80vh",
          overflow: "auto",
          zIndex: config.zIndex || 9999,
          opacity: isVisible ? 1 : 0,
          transition: `all ${config.animationDuration || 300}ms ease`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Close button */}
        {config.showCloseButton && (
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
              zIndex: 1,
            }}
            aria-label="Close popup"
          >
            ×
          </button>
        )}

        {/* Content */}
        <h2 style={{ marginBottom: "8px", fontSize: "24px" }}>
          {content.headline || "🎁 Complete Your Order"}
        </h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          {content.subheadline || "Add these items for a special discount"}
        </p>

        {/* Products grid */}
        {products.length > 0 && (
          <div style={{ display: "grid", gap: "16px", marginBottom: "24px" }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  gap: "16px",
                  padding: "16px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>
                    {product.title}
                  </h3>
                  <p
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    ${product.price}
                  </p>
                  <button
                    onClick={() => handleAddProduct(product.variantId)}
                    style={{
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Discount code */}
        {discountCode && (
          <div
            style={{
              background: "#f0f0f0",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            Use code:{" "}
            <strong style={{ fontSize: "18px" }}>{discountCode}</strong>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleClose}
          style={{
            width: "100%",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {content.ctaText || "Continue Shopping"}
        </button>
      </div>
    </>
  );
}
