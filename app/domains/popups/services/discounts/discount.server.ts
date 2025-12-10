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
  requiresEmailRestriction,
  shouldAutoApply,
} from "~/domains/commerce/services/discount.server";

export { parseDiscountConfig } from "~/domains/campaigns/utils/json-helpers";

export type {
  DiscountConfig,
  DiscountBehavior,
  DiscountType,
  DiscountValueType,
} from "~/domains/commerce/services/discount.server";

