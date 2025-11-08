import React, { useState } from "react";
import { BasePopup, type BasePopupProps, type PopupConfig } from "./BasePopup";

export interface ProductUpsellConfig extends PopupConfig {
  products: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    imageUrl: string;
    variantId: string;
    handle: string;
  }>;
  maxProducts?: number;
  showPrices?: boolean;
  showCompareAtPrice?: boolean;
  showImages?: boolean;
  layout?: "grid" | "carousel" | "minimal-card";
  columns?: number;
  secondaryCtaLabel?: string;
}

export interface ProductUpsellPopupProps
  extends Omit<BasePopupProps, "config"> {
  config: ProductUpsellConfig;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
  onUpdateCart?: () => void;
  onProductClick?: (productId: string) => void;
}

export const ProductUpsellPopup: React.FC<ProductUpsellPopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
  onAddToCart,
  onUpdateCart,
  onProductClick,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  const maxProducts = config.maxProducts || 4;
  const displayProducts = config.products.slice(0, maxProducts);

  const handleProductSelect = (variantId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedProducts(newSelected);
  };

  const handleAddSelectedToCart = async () => {
    if (selectedProducts.size === 0) return;

    setIsAddingToCart(true);
    try {
      // Add all selected products to cart
      for (const variantId of selectedProducts) {
        await onAddToCart(variantId, 1);
      }

      setAddedProducts(new Set(selectedProducts));
      setSelectedProducts(new Set());

      // Update cart state
      onUpdateCart?.();

      // Call the original button click handler
      onButtonClick();
    } catch (error) {
      console.error("Error adding products to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuickAdd = async (variantId: string) => {
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

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numPrice);
  };

  const productGridStyle: React.CSSProperties = {
    display: config.layout === "carousel" ? "flex" : "grid",
    gridTemplateColumns:
      config.layout === "grid"
        ? `repeat(${config.columns || 2}, 1fr)`
        : undefined,
    flexDirection: config.layout === "carousel" ? "row" : undefined,
    gap: config.layout === "minimal-card" ? "12px" : "16px",
    marginBottom: "24px",
    maxHeight: config.layout === "minimal-card" ? "none" : "400px",
    overflowX: config.layout === "carousel" ? "auto" : "visible",
    overflowY: config.layout === "grid" ? "auto" : "visible",
    padding: config.layout === "carousel" ? "0 4px 0 0" : "0",
    // Smooth scrolling for carousel
    scrollBehavior: config.layout === "carousel" ? "smooth" : undefined,
    // Hide scrollbar but keep functionality
    scrollbarWidth: config.layout === "carousel" ? "none" : undefined,
    msOverflowStyle: config.layout === "carousel" ? "none" : undefined,
    WebkitOverflowScrolling: config.layout === "carousel" ? "touch" : undefined,
  };

  const getProductCardStyle = (layout: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      cursor: "pointer",
      transition: "all 0.3s ease",
      backgroundColor: "#ffffff",
      position: "relative",
    };

    switch (layout) {
      case "carousel":
        return {
          ...baseStyle,
          border: "1px solid #e1e5e9",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          minWidth: "220px",
          maxWidth: "220px",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        } as React.CSSProperties;
      case "minimal-card":
        return {
          ...baseStyle,
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "#f8f9fa",
        };
      default: // grid
        return {
          ...baseStyle,
          border: "1px solid #e1e5e9",
          borderRadius: "8px",
          padding: "12px",
          textAlign: "center",
        };
    }
  };

  const getSelectedCardStyle = (layout: string): React.CSSProperties => {
    const baseCardStyle = getProductCardStyle(layout);
    return {
      ...baseCardStyle,
      borderColor: config.buttonColor || "#007bff",
      backgroundColor: layout === "minimal-card" ? "#e3f2fd" : "#f8f9fa",
      transform: "translateY(-2px)",
      boxShadow:
        layout === "carousel"
          ? "0 8px 24px rgba(0, 123, 255, 0.15)"
          : "0 4px 12px rgba(0, 123, 255, 0.15)",
    };
  };

  const getProductImageStyle = (layout: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      objectFit: "cover",
      borderRadius: layout === "carousel" ? "8px" : "4px",
    };

    switch (layout) {
      case "carousel":
        return {
          ...baseStyle,
          width: "100%",
          height: "140px",
          marginBottom: config.showImages !== false ? "12px" : "0px",
        };
      case "minimal-card":
        return {
          ...baseStyle,
          width: "60px",
          height: "60px",
          borderRadius: "6px",
          marginBottom: "0px",
          flexShrink: 0,
        };
      default: // grid
        return {
          ...baseStyle,
          width: "100%",
          height: "120px",
          marginBottom: config.showImages !== false ? "8px" : "0px",
        };
    }
  };

  const _priceStyle: React.CSSProperties = {
    fontWeight: "bold",
    color: config.textColor,
    marginBottom: "8px",
  };

  const _compareAtPriceStyle: React.CSSProperties = {
    textDecoration: "line-through",
    color: "#6c757d",
    fontSize: "0.9em",
    marginRight: "8px",
  };

  const _quickAddButtonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007bff",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
  };

  const mainButtonStyle: React.CSSProperties = {
    backgroundColor:
      selectedProducts.size > 0 ? config.buttonColor || "#007bff" : "#6c757d",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: selectedProducts.size > 0 ? "pointer" : "not-allowed",
    transition: "all 0.2s ease",
    opacity: isAddingToCart ? 0.7 : 1,
  };

  return (
    <BasePopup
      config={config}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}} // We handle this internally
      className="product-upsell-popup"
    >
      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2
            style={{
              color: config.textColor,
              marginBottom: "8px",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {config.title}
          </h2>
          <p
            style={{
              color: config.textColor,
              opacity: 0.8,
              fontSize: "16px",
              margin: 0,
            }}
          >
            {config.description}
          </p>
        </div>

        {/* Products Grid */}
        <div
          style={productGridStyle}
          className={config.layout === "carousel" ? "carousel-container" : ""}
        >
          {/* Hide scrollbar for carousel */}
          {config.layout === "carousel" && (
            <style
              dangerouslySetInnerHTML={{
                __html: `
                .carousel-container::-webkit-scrollbar {
                  display: none;
                }
                .carousel-container {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `,
              }}
            />
          )}

          {displayProducts.map((product) => {
            const isSelected = selectedProducts.has(product.variantId);
            const isAdded = addedProducts.has(product.variantId);

            const cardStyle = isSelected
              ? getSelectedCardStyle(config.layout || "grid")
              : getProductCardStyle(config.layout || "grid");
            const imageStyle = getProductImageStyle(config.layout || "grid");

            // Render minimal card layout differently
            if (config.layout === "minimal-card") {
              return (
                <div
                  key={product.variantId}
                  style={cardStyle}
                  onClick={() =>
                    !isAdded && handleProductSelect(product.variantId)
                  }
                >
                  {config.showImages !== false && (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={imageStyle}
                      onError={(e) => {
                        // Create inline SVG placeholder on error
                        const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                          <rect width="150" height="150" fill="#f8f9fa"/>
                          <rect x="30" y="25" width="90" height="75" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
                          <rect x="37" y="32" width="76" height="61" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
                          <circle cx="75" cy="62" r="12" fill="#6c757d"/>
                          <path d="M68 67 L72 71 L82 58" stroke="#ffffff" stroke-width="2" fill="none"/>
                          <text x="75" y="115" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="11">
                            Product
                          </text>
                          <text x="75" y="130" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="9">
                            Image
                          </text>
                        </svg>`;
                        e.currentTarget.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                      }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        margin: "0 0 4px 0",
                        color: config.textColor,
                        lineHeight: "1.3",
                        fontWeight: "600",
                      }}
                    >
                      {product.title}
                    </h4>

                    {config.showPrices !== false && (
                      <div
                        style={{
                          fontSize: "13px",
                          marginBottom: "8px",
                          fontWeight: "bold",
                          color: config.textColor,
                        }}
                      >
                        {config.showCompareAtPrice &&
                          product.compareAtPrice && (
                            <span
                              style={{
                                textDecoration: "line-through",
                                color: "#6c757d",
                                fontSize: "12px",
                                marginRight: "6px",
                              }}
                            >
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          )}
                        <span>{formatPrice(product.price)}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: "auto" }}>
                    {isAdded ? (
                      <div
                        style={{
                          backgroundColor: "#28a745",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Added
                      </div>
                    ) : (
                      <button
                        style={{
                          backgroundColor: config.buttonColor || "#007bff",
                          color: config.buttonTextColor || "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(product.variantId);
                        }}
                        disabled={isAddingToCart}
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        backgroundColor: config.buttonColor || "#007bff",
                        color: "#ffffff",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              );
            }

            // Standard grid/carousel layout
            return (
              <div
                key={product.variantId}
                style={cardStyle}
                onClick={() =>
                  !isAdded && handleProductSelect(product.variantId)
                }
              >
                {config.showImages !== false && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    style={imageStyle}
                    onError={(e) => {
                      // Create inline SVG placeholder on error
                      const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                        <rect width="150" height="150" fill="#f8f9fa"/>
                        <rect x="30" y="25" width="90" height="75" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
                        <rect x="37" y="32" width="76" height="61" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
                        <circle cx="75" cy="62" r="12" fill="#6c757d"/>
                        <path d="M68 67 L72 71 L82 58" stroke="#ffffff" stroke-width="2" fill="none"/>
                        <text x="75" y="115" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="11">
                          Product
                        </text>
                        <text x="75" y="130" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="9">
                          Image
                        </text>
                      </svg>`;
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                    }}
                  />
                )}

                <h4
                  style={{
                    fontSize: config.layout === "carousel" ? "15px" : "14px",
                    margin:
                      config.showImages !== false ? "0 0 8px 0" : "0 0 12px 0",
                    color: config.textColor,
                    lineHeight: "1.3",
                    fontWeight: config.layout === "carousel" ? "600" : "500",
                  }}
                >
                  {product.title}
                </h4>

                {config.showPrices !== false && (
                  <div
                    style={{
                      fontWeight: "bold",
                      color: config.textColor,
                      marginBottom: "8px",
                      fontSize: config.layout === "carousel" ? "14px" : "13px",
                    }}
                  >
                    {config.showCompareAtPrice && product.compareAtPrice && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#6c757d",
                          fontSize:
                            config.layout === "carousel" ? "13px" : "12px",
                          marginRight: "8px",
                        }}
                      >
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                    <span>{formatPrice(product.price)}</span>
                  </div>
                )}

                {isAdded ? (
                  <div
                    style={{
                      backgroundColor: "#28a745",
                      color: "#ffffff",
                      border: "none",
                      borderRadius:
                        config.layout === "carousel" ? "6px" : "4px",
                      padding:
                        config.layout === "carousel" ? "8px 16px" : "6px 12px",
                      fontSize: config.layout === "carousel" ? "13px" : "12px",
                      cursor: "default",
                      width: "100%",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Added
                  </div>
                ) : (
                  <button
                    style={{
                      backgroundColor: config.buttonColor || "#007bff",
                      color: config.buttonTextColor || "#ffffff",
                      border: "none",
                      borderRadius:
                        config.layout === "carousel" ? "6px" : "4px",
                      padding:
                        config.layout === "carousel" ? "8px 16px" : "6px 12px",
                      fontSize: config.layout === "carousel" ? "13px" : "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      width: "100%",
                      fontWeight: "600",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAdd(product.variantId);
                    }}
                    disabled={isAddingToCart}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0px)";
                    }}
                  >
                    Quick Add
                  </button>
                )}

                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: config.layout === "carousel" ? "12px" : "8px",
                      right: config.layout === "carousel" ? "12px" : "8px",
                      backgroundColor: config.buttonColor || "#007bff",
                      color: "#ffffff",
                      borderRadius: "50%",
                      width: config.layout === "carousel" ? "28px" : "24px",
                      height: config.layout === "carousel" ? "28px" : "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: config.layout === "carousel" ? "16px" : "14px",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            style={mainButtonStyle}
            onClick={handleAddSelectedToCart}
            disabled={selectedProducts.size === 0 || isAddingToCart}
          >
            {isAddingToCart
              ? "Adding..."
              : selectedProducts.size > 0
                ? `Add ${selectedProducts.size} Selected (${config.buttonText})`
                : "Select Products Above"}
          </button>

          <button
            style={{
              backgroundColor: "transparent",
              color: config.textColor,
              border: `1px solid ${config.textColor}`,
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "16px",
              cursor: "pointer",
              opacity: 0.7,
            }}
            onClick={onClose}
          >
            {config.secondaryCtaLabel || "No thanks"}
          </button>
        </div>
      </div>
    </BasePopup>
  );
};
