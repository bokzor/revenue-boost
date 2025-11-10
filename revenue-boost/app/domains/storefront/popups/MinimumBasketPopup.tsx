import React, { useState } from "react";
import { BasePopup, type BasePopupProps, type PopupConfig } from "./BasePopup";

export interface MinimumBasketConfig extends PopupConfig {
  minimumAmount: number;
  currentAmount: number;
  currency: string;
  secondaryCtaLabel?: string;
  products: Array<{
    id: string;
    title: string;
    price: string;
    imageUrl: string;
    variantId: string;
    handle: string;
  }>;
  showProgress?: boolean;
  progressColor?: string;
  thresholdMessage?: string;
  progressMessage?: string;
}

export interface MinimumBasketPopupProps
  extends Omit<BasePopupProps, "config"> {
  config: MinimumBasketConfig;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
  onUpdateCart?: () => void;
}

export const MinimumBasketPopup: React.FC<MinimumBasketPopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
  onAddToCart,
  onUpdateCart,
}) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  const remainingAmount = Math.max(
    0,
    config.minimumAmount - config.currentAmount,
  );
  const progressPercentage = Math.min(
    100,
    (config.currentAmount / config.minimumAmount) * 100,
  );
  const isThresholdMet = config.currentAmount >= config.minimumAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.currency || "USD",
    }).format(amount);
  };

  const handleAddToCart = async (variantId: string) => {
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

  const getThresholdMessage = () => {
    if (isThresholdMet) {
      return "🎉 Congratulations! You qualify for free delivery!";
    }

    const message =
      config.thresholdMessage ||
      `Add ${formatCurrency(remainingAmount)} more for free delivery`;
    return message
      .replace(/\$\{remaining\}/g, formatCurrency(remainingAmount))
      .replace(/\$\{amount\}/g, formatCurrency(remainingAmount));
  };

  const getProgressMessage = () => {
    if (isThresholdMet) {
      return "You've reached the minimum order amount!";
    }

    const message =
      config.progressMessage ||
      `You're ${Math.round(progressPercentage)}% of the way to free delivery!`;
    return message.replace(
      /\$\{progress\}/g,
      Math.round(progressPercentage).toString(),
    );
  };

  const progressBarStyle: React.CSSProperties = {
    width: "100%",
    height: "8px",
    backgroundColor: "#e9ecef",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  };

  const progressFillStyle: React.CSSProperties = {
    height: "100%",
    backgroundColor: isThresholdMet
      ? "#28a745"
      : config.progressColor || "#007bff",
    width: `${progressPercentage}%`,
    transition: "width 0.3s ease",
    borderRadius: "4px",
  };

  const productCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    border: "1px solid #e1e5e9",
    borderRadius: "8px",
    marginBottom: "12px",
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
  };

  const productImageStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "4px",
    marginRight: "12px",
  };

  const addButtonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007bff",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "80px",
  };

  const addedButtonStyle: React.CSSProperties = {
    ...addButtonStyle,
    backgroundColor: "#28a745",
    cursor: "default",
  };

  const mainButtonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007bff",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    marginBottom: "12px",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    color: config.textColor,
    border: `1px solid ${config.textColor}`,
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "16px",
    cursor: "pointer",
    opacity: 0.7,
    width: "100%",
  };

  return (
    <BasePopup
      config={config}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}} // We handle this internally
      className="minimum-basket-popup"
    >
      <div style={{ padding: "24px" }}>
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
            {getThresholdMessage()}
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

        {/* Progress Bar */}
        {config.showProgress !== false && (
          <div style={{ marginBottom: "20px" }}>
            <div style={progressBarStyle}>
              <div style={progressFillStyle} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "14px",
                color: config.textColor,
                opacity: 0.8,
              }}
            >
              <span>{getProgressMessage()}</span>
              <span>
                {formatCurrency(config.currentAmount)} /{" "}
                {formatCurrency(config.minimumAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Product Suggestions */}
        {!isThresholdMet && config.products && config.products.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                color: config.textColor,
                fontSize: "18px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              Add one of these to qualify:
            </h3>

            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {config.products.slice(0, 4).map((product) => {
                const isAdded = addedProducts.has(product.variantId);
                const productPrice = parseFloat(product.price);
                const willQualify =
                  config.currentAmount + productPrice >= config.minimumAmount;

                return (
                  <div
                    key={product.variantId}
                    style={{
                      ...productCardStyle,
                      borderColor: willQualify ? "#28a745" : "#e1e5e9",
                      backgroundColor: willQualify ? "#f8fff9" : "#ffffff",
                    }}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={productImageStyle}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-product.png";
                      }}
                    />

                    <div style={{ flex: 1, marginRight: "12px" }}>
                      <h4
                        style={{
                          fontSize: "16px",
                          margin: "0 0 4px 0",
                          color: config.textColor,
                          lineHeight: "1.3",
                        }}
                      >
                        {product.title}
                      </h4>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: config.textColor,
                          margin: 0,
                        }}
                      >
                        {formatCurrency(productPrice)}
                      </p>
                      {willQualify && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#28a745",
                            margin: "4px 0 0 0",
                            fontWeight: "bold",
                          }}
                        >
                          ✓ This will qualify you for free delivery!
                        </p>
                      )}
                    </div>

                    {isAdded ? (
                      <button style={addedButtonStyle} disabled>
                        ✓ Added
                      </button>
                    ) : (
                      <button
                        style={addButtonStyle}
                        onClick={() => handleAddToCart(product.variantId)}
                        disabled={isAddingToCart}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
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

        {/* Action Buttons */}
        <div style={{ textAlign: "center" }}>
          {isThresholdMet ? (
            <button
              style={{
                ...mainButtonStyle,
                backgroundColor: "#28a745",
              }}
              onClick={onButtonClick}
            >
              🎉 Continue to Checkout
            </button>
          ) : (
            <>
              <button style={mainButtonStyle} onClick={onButtonClick}>
                {config.buttonText || "Continue Shopping"}
              </button>
              <button style={secondaryButtonStyle} onClick={onClose}>
                {config.secondaryCtaLabel || "Continue anyway"}
              </button>
            </>
          )}
        </div>
      </div>
    </BasePopup>
  );
};
