/**
 * Discount Service (Compatibility Layer)
 *
 * Legacy popups imports pointed here; the real logic lives in
 * `app/domains/commerce/services/discount.server.ts`. Re-export to
 * avoid duplicate implementations now that backward compatibility is
 * not required.
 */

export {
  getCampaignDiscountCode,
  parseDiscountConfig,
  requiresEmailRestriction,
  shouldAutoApply,
} from "~/domains/commerce/services/discount.server";

export type {
  DiscountConfig,
  DiscountBehavior,
  DiscountType,
  DiscountValueType,
} from "~/domains/commerce/services/discount.server";

