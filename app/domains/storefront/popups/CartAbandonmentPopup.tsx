import React, { useState, useEffect } from "react";
import { BasePopup, type BasePopupProps, type PopupConfig } from "./BasePopup";

export interface CartAbandonmentConfig extends PopupConfig {
  discountCode?: string;
  discountPercentage?: number;
  discountValue?: number;
  discountType?: string;
  valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  urgencyMessage?: string;
  successTitle?: string;
  successSubhead?: string;
  secondaryCtaLabel?: string;
  cartItems: Array<{
    id: string;
    title: string;
    price: string;
    quantity: number;
    imageUrl: string;
    variantId: string;
  }>;
  cartTotal: string;
  showCartItems?: boolean;
  showUrgency?: boolean;
  urgencyTimer?: number; // seconds
}

export interface CartAbandonmentPopupProps
  extends Omit<BasePopupProps, "config"> {
  config: CartAbandonmentConfig;
  onApplyDiscount?: (discountCode: string) => Promise<void>;
  onSaveForLater?: () => void;
}

export const CartAbandonmentPopup: React.FC<CartAbandonmentPopupProps> = ({
  config,
  isVisible,
  onClose,
  onButtonClick,
  onApplyDiscount,
  onSaveForLater,
}) => {
  const [timeLeft, setTimeLeft] = useState(config.urgencyTimer || 300); // 5 minutes default
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);

  useEffect(() => {
    if (!config.showUrgency || !isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.showUrgency, isVisible]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numPrice);
  };

  const handleApplyDiscount = async () => {
    if (!config.discountCode || !onApplyDiscount) return;

    setIsApplyingDiscount(true);
    try {
      await onApplyDiscount(config.discountCode);
      setDiscountApplied(true);
      onButtonClick();
    } catch (error) {
      console.error("Error applying discount:", error);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const cartItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderBottom: "1px solid #e9ecef",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    marginBottom: "8px",
  };

  const itemImageStyle: React.CSSProperties = {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "4px",
    marginRight: "12px",
  };

  const urgencyBadgeStyle: React.CSSProperties = {
    backgroundColor: "#dc3545",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "16px",
    animation: timeLeft <= 60 ? "pulse 1s infinite" : "none",
  };

  const discountBadgeStyle: React.CSSProperties = {
    backgroundColor: "#28a745",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "20px",
    border: "2px dashed #ffffff",
  };

  const mainButtonStyle: React.CSSProperties = {
    backgroundColor: config.buttonColor || "#007bff",
    color: config.buttonTextColor || "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "14px 28px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    marginBottom: "12px",
    opacity: isApplyingDiscount ? 0.7 : 1,
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

  const totalCartValue = config.cartItems.reduce((sum: number, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  return (
    <BasePopup
      config={config}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}} // We handle this internally
      className="cart-abandonment-popup"
    >
      <div style={{ padding: "24px", textAlign: "center" }}>
        {/* Urgency Timer */}
        {config.showUrgency && timeLeft > 0 && (
          <div style={urgencyBadgeStyle}>
            ⏰ Offer expires in {formatTime(timeLeft)}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              color: config.textColor,
              marginBottom: "8px",
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            {config.title}
          </h2>
          <p
            style={{
              color: config.textColor,
              opacity: 0.8,
              fontSize: "18px",
              margin: 0,
            }}
          >
            {config.description}
          </p>
        </div>

        {/* Discount Offer */}
        {config.discountPercentage && (
          <div style={discountBadgeStyle}>
            🎉 Save {config.discountPercentage}% on your order!
            {config.discountCode && (
              <div style={{ fontSize: "14px", marginTop: "4px", opacity: 0.9 }}>
                Code: {config.discountCode}
              </div>
            )}
          </div>
        )}

        {/* Cart Items Preview */}
        {config.showCartItems && config.cartItems.length > 0 && (
          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <h3
              style={{
                color: config.textColor,
                fontSize: "18px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              Your Cart ({config.cartItems.length} item
              {config.cartItems.length !== 1 ? "s" : ""})
            </h3>

            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "#ffffff",
              }}
            >
              {config.cartItems.slice(0, 3).map((item) => (
                <div key={item.variantId} style={cartItemStyle}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={itemImageStyle}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-product.png";
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        margin: "0 0 4px 0",
                        color: config.textColor,
                        lineHeight: "1.3",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        color: config.textColor,
                        margin: 0,
                        opacity: 0.7,
                      }}
                    >
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: config.textColor,
                    }}
                  >
                    {formatCurrency(
                      (parseFloat(item.price) * item.quantity).toString(),
                    )}
                  </div>
                </div>
              ))}

              {config.cartItems.length > 3 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    color: config.textColor,
                    opacity: 0.7,
                    fontSize: "14px",
                  }}
                >
                  +{config.cartItems.length - 3} more item
                  {config.cartItems.length - 3 !== 1 ? "s" : ""}
                </div>
              )}

              {/* Cart Total */}
              <div
                style={{
                  borderTop: "2px solid #e9ecef",
                  paddingTop: "12px",
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: config.textColor,
                }}
              >
                <span>Total:</span>
                <span>{formatCurrency(totalCartValue.toString())}</span>
              </div>
            </div>
          </div>
        )}

        {/* Urgency Message */}
        {config.urgencyMessage && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "20px",
              color: "#856404",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            ⚠️ {config.urgencyMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div>
          {discountApplied ? (
            <div
              style={{
                backgroundColor: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "6px",
                padding: "16px",
                marginBottom: "16px",
                color: "#155724",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ✅ {config.successTitle || "Discount applied successfully!"}
              <div style={{ fontSize: "14px", marginTop: "4px", opacity: 0.8 }}>
                {config.successSubhead ||
                  "Your discount has been added to your cart."}
              </div>
            </div>
          ) : (
            <button
              style={mainButtonStyle}
              onClick={handleApplyDiscount}
              disabled={isApplyingDiscount || !config.discountCode}
              onMouseEnter={(e) => {
                if (!isApplyingDiscount) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isApplyingDiscount
                ? "Applying Discount..."
                : config.buttonText || "Complete Purchase & Save"}
            </button>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button style={secondaryButtonStyle} onClick={onSaveForLater}>
              Save for Later
            </button>
            <button style={secondaryButtonStyle} onClick={onClose}>
              {config.secondaryCtaLabel || "Continue Browsing"}
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </BasePopup>
  );
};
