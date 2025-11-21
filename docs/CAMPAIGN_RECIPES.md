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

### 2.8 Gamified Reveal (Scratch Card)

- **Intent**: High engagement through interactive "reveal" mechanic.
- **Typical goals**: `NEWSLETTER_SIGNUP`, `ENGAGEMENT`.
- **Recommended template**: `SCRATCH_CARD`.
- **Core defaults**:
  - Template type: `SCRATCH_CARD`.
  - Triggers: `page_load` (delayed) or `exit_intent`.
  - Page targeting: All pages or specific landing pages.
  - Discount config: Multi-tier prizes (e.g., 5%, 10%, 20% off).
- **Pre-fill opportunities**:
  - Default prize probabilities (e.g., higher chance for lower discounts).
  - "Try again" outcome to encourage engagement without guaranteed cost.

### 2.9 Seasonal / Holiday Promotion

- **Intent**: Capitalize on seasonal traffic with themed offers.
- **Typical goals**: `INCREASE_REVENUE`.
- **Recommended templates**: `ANNOUNCEMENT`, `FLASH_SALE`, `SPIN_TO_WIN`.
- **Core defaults**:
  - Template type: `ANNOUNCEMENT` (banner) or `FLASH_SALE` (popup).
  - Triggers: `page_load` (immediate).
  - Page targeting: Store-wide.
  - Design config: Pre-selected holiday themes (e.g., "Black Friday", "Christmas", "Valentine's").
- **Pre-fill opportunities**:
  - Auto-apply seasonal color palettes and imagery.
  - Default copy ("Black Friday Sale Starts Now!").

### 2.10 Post-Add Upsell (Immediate)

- **Intent**: Capitalize on immediate purchase intent right after a user adds an item to cart.
- **Typical goals**: `INCREASE_REVENUE`.
- **Recommended template**: `PRODUCT_UPSELL`.
- **Core defaults**:
  - Template type: `PRODUCT_UPSELL`.
  - Triggers: `add_to_cart` event (if available) or `page_load` on Cart page (immediate).
  - Page targeting: Cart page or global (if triggered by event).
  - Discount config: "Buy X, Get Y" or small bundle discount.
- **Pre-fill opportunities**:
  - "Frequently bought together" logic to auto-select upsell products based on the cart's content.

### 2.11 Cart Cross-Sell (Passive)

- **Intent**: Increase AOV by suggesting complementary items on the cart page without blocking flow.
- **Typical goals**: `INCREASE_REVENUE`.
- **Recommended template**: `PRODUCT_UPSELL` (embedded/inline if possible, or non-modal).
- **Core defaults**:
  - Template type: `PRODUCT_UPSELL`.
  - Triggers: `page_load` on Cart page.
  - Design config: Inline/embedded style or bottom banner.
  - Discount config: Optional.
- **Pre-fill opportunities**:
  - Auto-select low-cost "impulse buy" items.

### 2.12 Product Page Cross-Sell

- **Intent**: Suggest alternatives or add-ons while the user is viewing a specific product.
- **Typical goals**: `INCREASE_REVENUE`, `ENGAGEMENT`.
- **Recommended template**: `PRODUCT_UPSELL` or `FLASH_SALE` (as "Bundle Deal").
- **Core defaults**:
  - Template type: `PRODUCT_UPSELL`.
  - Triggers: `page_load` (delayed) or `scroll_depth` on Product pages.
  - Page targeting: Specific product pages.
  - Discount config: Bundle discount (e.g., "Add this matching accessory for 15% off").
- **Pre-fill opportunities**:
  - Use Shopify's "Complementary Products" metadata if available.

### 2.13 Product Spotlight

- **Intent**: Drive traffic and sales to a specific new or high-margin product.
- **Typical goals**: `INCREASE_REVENUE`.
- **Recommended template**: `FLASH_SALE` or `ANNOUNCEMENT`.
- **Core defaults**:
  - Template type: `FLASH_SALE` (popup) or `ANNOUNCEMENT` (bar).
  - Triggers: `page_load` on Home or Collection pages.
  - Content config: Hero image of the product, "Shop Now" CTA linking directly to product.
  - Discount config: Optional specific discount for that product.
- **Pre-fill opportunities**:
  - Auto-fill image, title, and price from the selected product.
  - Set CTA URL to the product page.

### 2.14 Countdown Timer Banner

- **Intent**: Create store-wide urgency for a sale event without blocking navigation.
- **Typical goals**: `INCREASE_REVENUE`.
- **Recommended template**: `COUNTDOWN_TIMER` (sticky bar).
- **Core defaults**:
  - Template type: `COUNTDOWN_TIMER`.
  - Design config: Top or bottom sticky bar (`position: top/bottom`, `displayMode: banner`).
  - Triggers: `page_load` (immediate).
  - Page targeting: All pages.
- **Pre-fill opportunities**:
  - "Ends Midnight" logic to auto-set timer duration.

---

## 3. Simplified Workflow: The "Recipe Wizard"

To make these recipes actionable and reduce friction, we propose a **"Recipe Wizard"** that sits *before* the main Campaign Editor.

### The Problem
The current Campaign Editor is powerful but requires many decisions upfront:
1.  Choose Goal
2.  Choose Template
3.  Configure Content (Headlines, Images)
4.  Configure Design
5.  Configure Targeting
6.  Configure Discount

For a merchant who just wants to "Put a Flash Sale on my Hero Sneaker", this is too much friction.

### The Solution: Context-First Configuration

The Recipe Wizard reverses the flow: **Ask for Intent & Context first, then generate the Campaign.**

#### Step 1: Choose a Recipe (Intent)
The user is presented with a grid of Recipes (as defined above), not raw Templates.
*   "Boost Newsletter Signups"
*   "Flash Sale on a Product"
*   "Recover Abandoned Carts"
*   "Cross-sell on Product Page"

#### Step 2: Provide Context (The "One Question")
Based on the chosen recipe, the Wizard asks **one or two critical questions** to pre-fill the complex bits.

*   **If "Flash Sale on a Product" is chosen:**
    *   *Wizard asks:* "Which product is on sale?" (Product Picker)
    *   *Wizard asks:* "What is the discount?" (e.g., 20% off)
    *   *System Action:*
        *   Fetches Product Image -> Pre-fills `contentConfig.imageUrl`
        *   Fetches Product Title -> Pre-fills `contentConfig.headline` ("20% off [Product Name]!")
        *   Sets `targetRules.pageTargeting` -> `[Product URL]`
        *   Sets `discountConfig` -> Single use, 20%, scoped to that Product ID.

*   **If "Post-Add Upsell" is chosen:**
    *   *Wizard asks:* "Which collection triggers this?" (Collection Picker)
    *   *Wizard asks:* "What product do you want to upsell?" (Product Picker)
    *   *System Action:*
        *   Sets `targetRules` -> Triggers on Cart/Add-to-cart for items in Collection X.
        *   Sets `contentConfig.selectedProducts` -> [Upsell Product ID].

#### Step 3: Review & Refine (The Editor)
The Wizard closes, and the user lands in the **standard Campaign Editor**, but it is **90% filled out**.
*   The preview already shows their product image.
*   The targeting is already set.
*   The discount is already configured.

The user only needs to tweak the copy or colors and hit "Publish".

### Summary of Wizard Logic

| Recipe | Context Question(s) | Pre-filled Fields |
| :--- | :--- | :--- |
| **Product Spotlight** | Select Product | Image, Headline, CTA URL, Discount Scope |
| **Flash Sale** | Select Product, Discount % | Image, Headline, Discount Value & Scope, Timer |
| **Cross-Sell** | Select Trigger Product, Select Offer Product | Targeting (Trigger Product URL), Offer Content (Offer Product Image/Price) |
| **Collection Promo** | Select Collection, Discount % | Headline ("Sale on [Collection]"), Targeting (Collection Pages), Discount Scope |
| **Newsletter** | Discount % (Optional) | Discount Config (Welcome Code) |

This approach bridges the gap between "Flexible Platform" and "One-Click Solution".

---

---

## 4. Integration Strategy: "Smart Template Selection"

We will integrate recipes directly into the existing Template Selector, rather than creating a separate "Recipe Picker" step. This keeps the UI clean while offering powerful shortcuts.

### The Flow

1.  **User clicks a Template** (e.g., "Flash Sale") in the existing grid.
2.  **A "Setup Options" Modal appears** instead of immediately going to the editor.
3.  **The Modal offers "Recipes" for that template**:
    *   **Option A: Product Spotlight** (Recipe)
        *   *Description*: "Promote a single hero product with a dedicated image and discount."
        *   *Action*: Shows a **Product Picker** right in the modal.
    *   **Option B: Collection Sale** (Recipe)
        *   *Description*: "Run a sale on a specific collection."
        *   *Action*: Shows a **Collection Picker**.
    *   **Option C: Start from Scratch** (Default)
        *   *Description*: "Configure everything manually."
        *   *Action*: Goes to the editor with default settings.
4.  **Completion**:
    *   User picks a product/collection and clicks "Create".
    *   We generate the `CampaignFormData` with pre-filled images, headlines, and targeting.
    *   User lands in the main **Campaign Editor** with 90% of the work done.

### UI Changes Required

1.  **`TemplateSelector`**: Update `handleTemplateClick` to open the modal instead of calling `onSelect` immediately.
2.  **`RecipeConfigurationModal`**: A new component that:
    *   Accepts a `templateType`.
    *   Displays available recipes for that type.
    *   Handles the "Context Questions" (Product/Collection picking).
    *   Returns the fully configured `initialData`.

This feels natural: "I want a Flash Sale" -> "What kind?" -> "This Product" -> Done.

