/**
 * PromotionDisplay Component
 *
 * A reusable component for displaying different promotion types in popups:
 * - Tiered discounts: Visual progress bar with tier circles
 * - Free gift: Product image with gift details
 * - BOGO: Buy X Get Y display
 * - Simple discount: Percentage or fixed amount badge
 *
 * This component can be used across FlashSale, CartAbandonment, and other popup types.
 */

import React from "react";

// ============================================
// TYPES
// ============================================

export interface DiscountTier {
  thresholdCents: number;
  discount: { kind: string; value: number };
}

export interface FreeGiftConfig {
  enabled?: boolean;
  productId?: string;
  variantId?: string;
  productTitle?: string;
  productImageUrl?: string;
  quantity?: number;
  minSubtotalCents?: number;
}

export interface BogoConfig {
  buy: { quantity: number };
  get: { quantity: number; discount: { kind: string; value: number } };
}

export interface PromotionDisplayProps {
  /** Tiered discount configuration */
  tiers?: DiscountTier[];
  /** BOGO configuration */
  bogo?: BogoConfig;
  /** Free gift configuration */
  freeGift?: FreeGiftConfig;
  /** Simple discount percentage (0-100) */
  discountPercentage?: number;
  /** Simple discount fixed amount in cents */
  discountAmountCents?: number;
  /** Current cart total in cents (for tiered progress) */
  currentCartTotalCents?: number;
  /** Currency code for formatting */
  currency?: string;
  /** Primary accent color */
  accentColor?: string;
  /** Text color */
  textColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (cents: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const formatDiscount = (discount: { kind: string; value: number }): string => {
  if (discount.kind === "free_shipping") return "FREE SHIPPING";
  if (discount.kind === "free_product") return "FREE";
  if (discount.kind === "percentage") return `${discount.value}% OFF`;
  return `$${discount.value} OFF`;
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface TierCircleProps {
  tier: DiscountTier;
  isUnlocked: boolean;
  isActive: boolean;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

const TierCircle: React.FC<TierCircleProps> = ({
  tier,
  isUnlocked,
  isActive,
  accentColor,
  textColor,
  backgroundColor,
}) => {
  const circleSize = "3.5rem";
  const checkmarkSize = "1.25rem";

  return (
    <div className="promotion-tier">
      <div
        className="promotion-tier-circle"
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          border: `2px solid ${isUnlocked ? accentColor : isActive ? accentColor : "#e5e7eb"}`,
          background: isUnlocked ? accentColor : isActive ? `${accentColor}15` : "#f3f4f6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
      >
        {isUnlocked ? (
          <svg
            width={checkmarkSize}
            height={checkmarkSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke={backgroundColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: isActive ? accentColor : "#9ca3af",
            }}
          >
            {tier.discount.kind === "percentage" ? `${tier.discount.value}%` : formatDiscount(tier.discount)}
          </span>
        )}
      </div>
      <span
        className="promotion-tier-label"
        style={{
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: isUnlocked || isActive ? textColor : "#9ca3af",
        }}
      >
        {formatCurrency(tier.thresholdCents)}+
      </span>
      {isUnlocked && (
        <span
          className="promotion-tier-badge"
          style={{
            marginTop: "0.25rem",
            padding: "0.125rem 0.5rem",
            borderRadius: "9999px",
            fontSize: "0.625rem",
            fontWeight: 700,
            background: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {formatDiscount(tier.discount)}
        </span>
      )}
    </div>
  );
};

// ============================================
// TIERED DISCOUNT DISPLAY
// ============================================

interface TieredDiscountDisplayProps {
  tiers: DiscountTier[];
  currentCartTotalCents: number;
  currency: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

const TieredDiscountDisplay: React.FC<TieredDiscountDisplayProps> = ({
  tiers,
  currentCartTotalCents,
  currency,
  accentColor,
  textColor,
  backgroundColor,
}) => {
  // Sort tiers by threshold
  const sortedTiers = [...tiers].sort((a, b) => a.thresholdCents - b.thresholdCents);
  const maxThreshold = sortedTiers[sortedTiers.length - 1]?.thresholdCents || 0;
  const progressPercent = Math.min(100, (currentCartTotalCents / maxThreshold) * 100);

  // Find current and next tier
  const currentTierIndex = sortedTiers.findIndex((tier) => currentCartTotalCents < tier.thresholdCents) - 1;
  const nextTier = sortedTiers[currentTierIndex + 1];

  return (
    <div className="promotion-tiered">
      {/* Tier circles */}
      <div
        className="promotion-tiers-row"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.25rem",
        }}
      >
        {sortedTiers.map((tier, index) => {
          const isUnlocked = currentCartTotalCents >= tier.thresholdCents;
          const isActive = index === currentTierIndex + 1;
          return (
            <TierCircle
              key={tier.thresholdCents}
              tier={tier}
              isUnlocked={isUnlocked}
              isActive={isActive}
              accentColor={accentColor}
              textColor={textColor}
              backgroundColor={backgroundColor}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        className="promotion-progress-bar"
        style={{
          marginTop: "1rem",
          height: "0.375rem",
          borderRadius: "9999px",
          background: "#e5e7eb",
          overflow: "hidden",
          width: "85%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div
          className="promotion-progress-fill"
          style={{
            height: "100%",
            borderRadius: "9999px",
            background: accentColor,
            width: `${progressPercent}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Next tier hint */}
      {nextTier && (
        <p
          className="promotion-next-tier"
          style={{
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          <span>
            Spend{" "}
            <strong style={{ color: textColor }}>
              {formatCurrency(nextTier.thresholdCents - currentCartTotalCents, currency)} more
            </strong>{" "}
            to unlock
          </span>
          <span style={{ fontWeight: 700, color: accentColor }}>{formatDiscount(nextTier.discount)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </p>
      )}
    </div>
  );
};

// ============================================
// FREE GIFT DISPLAY
// ============================================

interface FreeGiftDisplayProps {
  freeGift: FreeGiftConfig;
  currency: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

const FreeGiftDisplay: React.FC<FreeGiftDisplayProps> = ({
  freeGift,
  currency,
  accentColor,
  textColor,
}) => {
  const minSpend = freeGift.minSubtotalCents
    ? formatCurrency(freeGift.minSubtotalCents, currency)
    : null;

  return (
    <div
      className="promotion-free-gift"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      {/* Product Image */}
      {freeGift.productImageUrl && (
        <div
          className="promotion-gift-image-wrapper"
          style={{
            position: "relative",
            width: "120px",
            height: "120px",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: `2px solid ${accentColor}`,
          }}
        >
          <img
            src={freeGift.productImageUrl}
            alt={freeGift.productTitle || "Free gift"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* FREE badge */}
          <div
            className="promotion-gift-badge"
            style={{
              position: "absolute",
              top: "-0.25rem",
              right: "-0.25rem",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
              fontSize: "0.625rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: accentColor,
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            FREE
          </div>
        </div>
      )}

      {/* Product Title */}
      {freeGift.productTitle && (
        <p
          className="promotion-gift-title"
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: textColor,
            textAlign: "center",
          }}
        >
          🎁 {freeGift.productTitle}
        </p>
      )}

      {/* Minimum spend requirement */}
      {minSpend && (
        <p
          className="promotion-gift-requirement"
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          With orders over <strong style={{ color: accentColor }}>{minSpend}</strong>
        </p>
      )}
    </div>
  );
};

// ============================================
// BOGO DISPLAY
// ============================================

interface BogoDisplayProps {
  bogo: BogoConfig;
  accentColor: string;
  textColor: string;
}

const BogoDisplay: React.FC<BogoDisplayProps> = ({ bogo, accentColor, textColor }) => {
  const buyQty = bogo.buy.quantity;
  const getQty = bogo.get.quantity;
  const isFree = bogo.get.discount.kind === "free_product" || bogo.get.discount.value === 100;
  const discountText = isFree ? "FREE" : `${bogo.get.discount.value}% OFF`;

  return (
    <div
      className="promotion-bogo"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "1rem 1.5rem",
        borderRadius: "0.75rem",
        background: `${accentColor}10`,
        border: `2px solid ${accentColor}30`,
      }}
    >
      {/* Buy circle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            background: textColor,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 800,
          }}
        >
          {buyQty}
        </div>
        <span style={{ marginTop: "0.25rem", fontSize: "0.6875rem", fontWeight: 600, color: "#6b7280" }}>
          BUY
        </span>
      </div>

      {/* Plus sign */}
      <span style={{ fontSize: "1.5rem", fontWeight: 300, color: "#9ca3af" }}>+</span>

      {/* Get circle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            background: accentColor,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 800,
          }}
        >
          {getQty}
        </div>
        <span style={{ marginTop: "0.25rem", fontSize: "0.6875rem", fontWeight: 600, color: accentColor }}>
          {discountText}
        </span>
      </div>
    </div>
  );
};

// ============================================
// SIMPLE DISCOUNT DISPLAY
// ============================================

interface SimpleDiscountDisplayProps {
  percentage?: number;
  amountCents?: number;
  currency: string;
  accentColor: string;
  size: "sm" | "md" | "lg";
}

const SimpleDiscountDisplay: React.FC<SimpleDiscountDisplayProps> = ({
  percentage,
  amountCents,
  currency,
  accentColor,
  size,
}) => {
  const fontSizes = { sm: "1.5rem", md: "2rem", lg: "2.5rem" };
  const paddings = { sm: "0.5rem 1rem", md: "0.75rem 1.5rem", lg: "1rem 2rem" };

  let discountText = "";
  if (percentage !== undefined && percentage > 0) {
    discountText = `${percentage}% OFF`;
  } else if (amountCents !== undefined && amountCents > 0) {
    discountText = `${formatCurrency(amountCents, currency)} OFF`;
  }

  if (!discountText) return null;

  return (
    <div
      className="promotion-simple"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: paddings[size],
        borderRadius: "0.75rem",
        background: `${accentColor}15`,
        border: `2px solid ${accentColor}30`,
      }}
    >
      <span
        style={{
          fontSize: fontSizes[size],
          fontWeight: 800,
          color: accentColor,
          letterSpacing: "-0.02em",
        }}
      >
        {discountText}
      </span>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PromotionDisplay: React.FC<PromotionDisplayProps> = ({
  tiers,
  bogo,
  freeGift,
  discountPercentage,
  discountAmountCents,
  currentCartTotalCents = 0,
  currency = "USD",
  accentColor = "#ef4444",
  textColor = "#111827",
  backgroundColor = "#ffffff",
  size = "md",
  className,
}) => {
  // Determine which promotion type to display (priority order)
  const hasTiers = tiers && tiers.length > 0;
  const hasFreeGift = freeGift && freeGift.enabled !== false && (freeGift.productImageUrl || freeGift.productTitle);
  const hasBogo = bogo && bogo.buy && bogo.get;
  const hasSimpleDiscount = (discountPercentage && discountPercentage > 0) || (discountAmountCents && discountAmountCents > 0);

  // No promotion to display
  if (!hasTiers && !hasFreeGift && !hasBogo && !hasSimpleDiscount) {
    return null;
  }

  return (
    <div
      className={`promotion-display ${className || ""}`}
      style={{
        width: "100%",
        textAlign: "center",
      }}
    >
      {hasTiers ? (
        <TieredDiscountDisplay
          tiers={tiers}
          currentCartTotalCents={currentCartTotalCents}
          currency={currency}
          accentColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
      ) : hasFreeGift ? (
        <FreeGiftDisplay
          freeGift={freeGift}
          currency={currency}
          accentColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
      ) : hasBogo ? (
        <BogoDisplay bogo={bogo} accentColor={accentColor} textColor={textColor} />
      ) : hasSimpleDiscount ? (
        <SimpleDiscountDisplay
          percentage={discountPercentage}
          amountCents={discountAmountCents}
          currency={currency}
          accentColor={accentColor}
          size={size}
        />
      ) : null}
    </div>
  );
};

export default PromotionDisplay;

