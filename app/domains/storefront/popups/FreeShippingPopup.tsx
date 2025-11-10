import React, { useState } from "react";
import { BasePopup, type BasePopupProps, type PopupConfig } from "./BasePopup";

export interface FreeShippingConfig extends PopupConfig {
  freeShippingThreshold: number;
  currentCartTotal: number;
  currency: string;
  headline?: string;
  subheadline?: string;
  successTitle?: string;
  successSubhead?: string;
  products?: Array<{
    id: string;
    title: string;
    price: string;
    imageUrl: string;
    variantId: string;
    handle: string;
  }>;
  showProgress?: boolean;
  showProducts?: boolean;
  progressColor?: string;
  displayStyle?: "banner" | "modal" | "sticky";
  autoHide?: boolean;
  hideDelay?: number; // seconds
}

export interface FreeShippingPopupProps extends Omit<BasePopupProps, "config"> {
  config: FreeShippingConfig;
  onAddToCart?: (variantId: string, quantity: number) => Promise<void>;
  onUpdateCart?: () => void;
  onShopMore?: () => void;
}

export const FreeShippingPopup: React.FC<FreeShippingPopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
  onAddToCart,
  onUpdateCart,
  onShopMore,
}) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedProducts, setAddedProducts] = useState(new Set());

  const remainingAmount = Math.max(
    0,
    config.freeShippingThreshold - config.currentCartTotal,
  );
  const progressPercentage = Math.min(
    100,
    (config.currentCartTotal / config.freeShippingThreshold) * 100,
  );
  const isQualified = config.currentCartTotal >= config.freeShippingThreshold;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.currency || "USD",
    }).format(amount);
  };

  const handleAddToCart = async (variantId: string) => {
    if (!onAddToCart) return;
    setIsAddingToCart(true);
    try {
      await onAddToCart(variantId, 1);
      setAddedProducts((prev) => new Set([...prev, variantId]));
      onUpdateCart?.();
    } catch (error) {
      console.error("Error adding product to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getMainMessage = () => {
    if (isQualified) {
      return config.successTitle || "You qualify for free shipping!";
    }
    const message =
      config.headline ||
      config.title ||
      `Free shipping on orders over ${formatCurrency(config.freeShippingThreshold)}`;
    return message
      .replace(/\$\{threshold\}/g, formatCurrency(config.freeShippingThreshold))
      .replace(/\$\{remaining\}/g, formatCurrency(remainingAmount));
  };

  const getSubMessage = () => {
    if (isQualified) {
      return config.successSubhead || "Your order ships free!";
    }
    const message =
      config.subheadline ||
      config.description ||
      `Add ${formatCurrency(remainingAmount)} more to qualify!`;
    return message
      .replace(/\$\{remaining\}/g, formatCurrency(remainingAmount))
      .replace(/\$\{progress\}/g, Math.round(progressPercentage).toString());
  };

  // Banner style
  if (config.displayStyle === "banner") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: isQualified
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : `linear-gradient(135deg, ${config.backgroundColor || "#3b82f6"} 0%, ${config.backgroundColor ? `${config.backgroundColor}dd` : "#2563eb"} 100%)`,
          color: config.textColor || "#ffffff",
          padding: "16px 24px",
          zIndex: 10000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "slideDown 0.4s ease-out",
          backdropFilter: "blur(10px)",
        }}
      >
        <style>{`
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                lineHeight: 1,
                animation: isQualified ? "bounce 0.6s ease" : "none",
              }}
            >
              {isQualified ? "🎉" : "🚚"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                }}
              >
                {getMainMessage()}
              </div>
              {!isQualified && (
                <>
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.95,
                      marginTop: "4px",
                      fontWeight: "500",
                    }}
                  >
                    {getSubMessage()}
                  </div>
                  {config.showProgress && (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "6px",
                        backgroundColor: "rgba(255,255,255,0.25)",
                        borderRadius: "10px",
                        overflow: "hidden",
                        marginTop: "10px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            "linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 100%)",
                          width: `${progressPercentage}%`,
                          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                          borderRadius: "10px",
                          boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!isQualified && (
              <button
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(10px)",
                  whiteSpace: "nowrap",
                }}
                onClick={onShopMore || onButtonClick}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {config.buttonText || "Shop More"}
              </button>
            )}
            <button
              style={{
                background: "transparent",
                color: "#ffffff",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                lineHeight: 1,
              }}
              onClick={onClose}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sticky style
  if (config.displayStyle === "sticky") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: isQualified
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : `linear-gradient(135deg, ${config.backgroundColor || "#3b82f6"} 0%, ${config.backgroundColor ? `${config.backgroundColor}dd` : "#2563eb"} 100%)`,
          color: config.textColor || "#ffffff",
          padding: "20px 24px",
          zIndex: 10000,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          animation: "slideUp 0.4s ease-out",
          backdropFilter: "blur(10px)",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "8px",
              letterSpacing: "-0.01em",
            }}
          >
            {isQualified ? "🎉 " : "🚚 "}
            {getMainMessage()}
          </div>
          {!isQualified && (
            <>
              <div
                style={{
                  fontSize: "14px",
                  opacity: 0.95,
                  marginBottom: "12px",
                  fontWeight: "500",
                }}
              >
                {getSubMessage()}
              </div>
              {config.showProgress && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    height: "8px",
                    backgroundColor: "rgba(255,255,255,0.25)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    margin: "0 auto",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 100%)",
                      width: `${progressPercentage}%`,
                      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: "10px",
                      boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Modal style (default)
  return (
    <BasePopup
      config={config}
      onButtonClick={() => {}} // We handle this internally
      isVisible={isVisible}
      onClose={onClose}
    >
      <div style={{ padding: "32px 28px 28px" }}>
        {/* Header with icon */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "56px",
              lineHeight: 1,
              marginBottom: "16px",
              animation: isQualified
                ? "bounce 0.6s ease"
                : "pulse 2s ease infinite",
            }}
          >
            {isQualified ? "🎉" : "🚚"}
          </div>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>
          <h2
            style={{
              color: isQualified ? "#10b981" : config.textColor || "#1f2937",
              marginBottom: "8px",
              fontSize: "28px",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
            }}
          >
            {getMainMessage()}
          </h2>
          <p
            style={{
              color: config.textColor || "#6b7280",
              fontSize: "16px",
              margin: 0,
              fontWeight: "500",
            }}
          >
            {getSubMessage()}
          </p>
        </div>

        {/* Progress Bar */}
        {config.showProgress !== false && !isQualified && (
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "14px",
                backgroundColor: "#f3f4f6",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${config.progressColor || config.buttonColor || "#3b82f6"} 0%, ${config.progressColor || config.buttonColor ? `${config.progressColor || config.buttonColor}cc` : "#2563eb"} 100%)`,
                  width: `${progressPercentage}%`,
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderRadius: "12px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                color: config.textColor || "#6b7280",
                marginTop: "10px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  color:
                    config.progressColor || config.buttonColor || "#3b82f6",
                }}
              >
                {Math.round(progressPercentage)}% complete
              </span>
              <span>
                {formatCurrency(config.currentCartTotal)} /{" "}
                <span
                  style={{
                    color: "#059669",
                    fontWeight: "600",
                  }}
                >
                  {formatCurrency(config.freeShippingThreshold)}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Product Suggestions */}
        {config.showProducts &&
          !isQualified &&
          config.products &&
          config.products.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  color: config.textColor || "#1f2937",
                  fontSize: "18px",
                  marginBottom: "16px",
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                }}
              >
                Add one of these to qualify:
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {config.products.slice(0, 3).map((product) => {
                  const isAdded = addedProducts.has(product.variantId);
                  const productPrice = parseFloat(product.price);
                  const willQualify =
                    config.currentCartTotal + productPrice >=
                    config.freeShippingThreshold;

                  return (
                    <div
                      key={product.variantId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "14px",
                        border: willQualify
                          ? "2px solid #10b981"
                          : "2px solid #e5e7eb",
                        borderRadius: "12px",
                        backgroundColor: willQualify ? "#f0fdf4" : "#ffffff",
                        transition: "all 0.3s ease",
                        boxShadow: willQualify
                          ? "0 4px 12px rgba(16, 185, 129, 0.15)"
                          : "0 2px 6px rgba(0,0,0,0.04)",
                        cursor: "default",
                      }}
                    >
                      <img
                        src={
                          product.imageUrl ||
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23e5e7eb' width='60' height='60'/%3E%3C/svg%3E"
                        }
                        alt={product.title}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginRight: "14px",
                          flexShrink: 0,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      />

                      <div
                        style={{
                          flex: 1,
                          textAlign: "left",
                          marginRight: "12px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "15px",
                            margin: "0 0 6px 0",
                            color: config.textColor || "#1f2937",
                            lineHeight: "1.3",
                            fontWeight: "600",
                          }}
                        >
                          {product.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: config.textColor || "#1f2937",
                            margin: 0,
                          }}
                        >
                          {formatCurrency(productPrice)}
                        </p>
                        {willQualify && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#10b981",
                              margin: "6px 0 0 0",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>✓</span> Unlocks free shipping!
                          </p>
                        )}
                      </div>

                      {isAdded ? (
                        <button
                          style={{
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 16px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "default",
                            minWidth: "90px",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                          }}
                          disabled
                        >
                          ✓ Added
                        </button>
                      ) : (
                        <button
                          style={{
                            background: `linear-gradient(135deg, ${config.buttonColor || "#3b82f6"} 0%, ${config.buttonColor ? `${config.buttonColor}dd` : "#2563eb"} 100%)`,
                            color: config.buttonTextColor || "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 16px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            minWidth: "90px",
                            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                          }}
                          onClick={() => handleAddToCart(product.variantId)}
                          disabled={isAddingToCart}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(59, 130, 246, 0.4)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(59, 130, 246, 0.3)";
                          }}
                        >
                          {isAddingToCart ? "Adding..." : "Add"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Action Button */}
        <button
          style={{
            background: isQualified
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : `linear-gradient(135deg, ${config.buttonColor || "#3b82f6"} 0%, ${config.buttonColor ? `${config.buttonColor}dd` : "#2563eb"} 100%)`,
            color: config.buttonTextColor || "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "16px 32px",
            fontSize: "17px",
            fontWeight: "700",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.3s ease",
            boxShadow: isQualified
              ? "0 4px 16px rgba(16, 185, 129, 0.4)"
              : "0 4px 16px rgba(59, 130, 246, 0.4)",
            letterSpacing: "-0.01em",
          }}
          onClick={onShopMore || onButtonClick}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = isQualified
              ? "0 6px 20px rgba(16, 185, 129, 0.5)"
              : "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = isQualified
              ? "0 4px 16px rgba(16, 185, 129, 0.4)"
              : "0 4px 16px rgba(59, 130, 246, 0.4)";
          }}
        >
          {isQualified
            ? "🎉 Continue to Checkout"
            : config.buttonText || "Shop More"}
        </button>
      </div>
    </BasePopup>
  );
};
