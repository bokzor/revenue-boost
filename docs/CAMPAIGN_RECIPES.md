## Campaign Recipes (Proposal)

This document proposes a set of opinionated "campaign recipes" built on top of the
existing template and configuration system:

- Templates: `TemplateTypeSchema` (NEWSLETTER, SPIN_TO_WIN, FLASH_SALE, etc.)
- Campaign configs: `contentConfig`, `designConfig`, `targetRules`, `discountConfig`

Each recipe describes:
- The merchant intent ("what am I trying to achieve?")
- Recommended template type(s)
- Suggested defaults for targeting, discount, and design
- Where we can safely pre-fill values so the merchant chooses once and we reuse everywhere

The goal is not to remove flexibility, but to offer a **guided path** that sets
sensible defaults while keeping advanced overrides.

---

## 1. Core knobs every recipe uses

Every campaign recipe is expressed in terms of the existing knobs:

- **Goal**: `CampaignGoalSchema` (NEWSLETTER_SIGNUP, INCREASE_REVENUE, ENGAGEMENT)
- **Template type**: `TemplateTypeSchema` (NEWSLETTER, SPIN_TO_WIN, FLASH_SALE, ...)
- **Content config**: template-specific copy and fields
- **Design config**: universal visual settings (theme, position, size, colors)
- **Target rules** (`TargetRulesConfigSchema`):
  - `enhancedTriggers` (page load, exit intent, scroll, etc.)
  - `audienceTargeting` (segments, custom rules)
  - `pageTargeting` (URLs, patterns, exclusions)
- **Discount config** (`DiscountConfigSchema`): type, value, scope, delivery mode, tiers, BOGO, etc.
- **Timing / lifecycle**: campaign status + start/end dates (from base campaign)

A "recipe" is **just a pre-configured combination** of these for a specific
merchant scenario.

---

## 2. Recipe catalog (first pass)

### 2.1 Newsletter signup on key pages

- **Intent**: Grow email list without feeling too aggressive.
- **Typical goal**: `NEWSLETTER_SIGNUP`.
- **Recommended templates**: `NEWSLETTER`, `EXIT_INTENT`, `ANNOUNCEMENT`.
- **Core defaults**:
  - Template type: `NEWSLETTER`.
  - Triggers: `exit_intent` on desktop, light `page_load` delay on mobile.
  - Page targeting: home page + blog pages; optionally all pages.
  - Discount config: optional; often no discount or small percentage.
- **Pre-fill opportunities**:
  - If merchant opts into a welcome discount, auto-create a shared percentage
    discount and reuse it across newsletter recipes.

### 2.2 Gamified signup + discount (spin to win)

- **Intent**: Capture emails with a strong incentive using gamification.
- **Typical goals**: `NEWSLETTER_SIGNUP` and `INCREASE_REVENUE`.
- **Recommended template**: `SPIN_TO_WIN`.
- **Core defaults**:
  - Template type: `SPIN_TO_WIN`.
  - Triggers: `exit_intent` on all product and collection pages; optional
    `page_load` delay on home.
  - Page targeting: all product + collection pages by default.
  - Discount config: multi-tier prize structure (e.g. 10/15/20%); codes are
    auto-applied when possible.
- **Pre-fill opportunities**:
  - One shared discount per tier, reused across all spins.
  - Default wheel segments mapped to these tiers.

### 2.3 Flash sale on a single product (product-first)

- **Intent**: Run a time-limited sale on one hero product.
- **Typical goal**: `INCREASE_REVENUE`.
- **Recommended templates**: `FLASH_SALE`, `COUNTDOWN_TIMER`.
- **Core defaults**:
  - First step: select product(s) for the sale.
  - Template type: `FLASH_SALE`.
  - Triggers: `page_load` on the product page with short delay; optional
    `exit_intent`.
  - Page targeting: product detail page(s) for the selected product(s).
  - Discount config: percentage or fixed discount scoped to that product
    only; end date aligned with campaign.
- **Pre-fill opportunities**:
  - When the merchant picks the product, auto-fill:
    - Discount scope (only that product).
    - Targeting scope (only that product page + maybe related collection).
    - Inventory behaviour (stop or hide when inventory hits 0).

### 2.4 Store-wide free shipping promotion

- **Intent**: Promote a free shipping threshold during a promo period.
- **Typical goals**: `INCREASE_REVENUE`, `ENGAGEMENT`.
- **Recommended templates**: `FREE_SHIPPING`, `ANNOUNCEMENT`, `COUNTDOWN_TIMER`.
- **Core defaults**:
  - Template type: `FREE_SHIPPING` or `ANNOUNCEMENT` for a thin banner.
  - Triggers: `page_load` with minimal delay on all pages.
  - Page targeting: entire site (or all non-checkout pages).
  - Discount config: `FREE_SHIPPING` value type; threshold configured once.
- **Pre-fill opportunities**:
  - Single shared free-shipping discount, reused by all campaigns that
    mention free shipping.

### 2.5 Cart abandonment rescue (onsite)

- **Intent**: Prevent abandonment by offering a last-minute incentive.
- **Typical goal**: `INCREASE_REVENUE`.
- **Recommended template**: `CART_ABANDONMENT`.
- **Core defaults**:
  - Template type: `CART_ABANDONMENT`.
  - Triggers: `exit_intent` on cart and checkout-related URLs.
  - Page targeting: URL patterns for cart and checkout.
  - Discount config: percentage discount scoped to cart subtotal, with
    optional tiers (e.g. 10% over $50).
- **Pre-fill opportunities**:
  - Cart URLs pre-detected; merchant only confirms or adds patterns.
  - Suggest discount tiers aligned with AOV.

### 2.6 Product upsell after add-to-cart

- **Intent**: Increase order value by suggesting complements or bundles.
- **Typical goal**: `INCREASE_REVENUE`.
- **Recommended template**: `PRODUCT_UPSELL`.
- **Core defaults**:
  - Template type: `PRODUCT_UPSELL`.
  - Product selection: default to `ai` with a small max product count;
    merchant can switch to `manual` or `collection`.
  - Triggers: `page_load` on cart or post add-to-cart; optional timer.
  - Page targeting: cart page and high-intent product pages.
  - Discount config: optional small bundle discount (e.g. 10% when adding
    at least one recommended product).
- **Pre-fill opportunities**:
  - When the merchant selects a source collection, reuse that selection for
    both the upsell list and any bundle discount scoping.

### 2.7 Social proof / urgency nudges

- **Intent**: Build trust and FOMO without heavy discounts.
- **Typical goals**: `ENGAGEMENT`, `INCREASE_REVENUE`.
- **Recommended templates**: `SOCIAL_PROOF`, `COUNTDOWN_TIMER`, `ANNOUNCEMENT`.
- **Core defaults**:
  - Template type: `SOCIAL_PROOF` or `COUNTDOWN_TIMER` depending on focus.
  - Triggers: light `page_load` delay or scroll depth trigger.
  - Page targeting: product pages, collection pages, or home.
  - Discount config: usually disabled or minimal; focus is messaging.
- **Pre-fill opportunities**:
  - Reasonable default frequency capping (e.g. max views per day) to avoid
    fatigue.

---

## 3. How this could surface in the UI

This catalog is intentionally expressed in terms of existing types, so it can
be implemented as a **"recipe picker"** before the current campaign wizard:

1. Merchant chooses a recipe (e.g. "Flash sale on a product").
2. We pick the template type and pre-fill goal, triggers, targeting, discount
   scope, and design defaults.
3. The existing multi-step campaign form opens with these defaults applied; the
   merchant can tweak any step.

Over time, telemetry (which recipes are used, where users drop off) can guide
which recipes we promote and how aggressive the defaults should be.

