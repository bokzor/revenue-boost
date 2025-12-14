# Revenue Boost - Complete Value Proposition & Feature Summary

## 🎯 One-Liner Value Proposition

> "Revenue Boost helps Shopify merchants convert more visitors into customers and increase revenue through beautiful, high-converting popups with smart targeting, gamification, and automated discounts."

---

## 💼 What Problems Does Revenue Boost Solve?

### For Merchants

| Problem | How Revenue Boost Solves It |
|---------|----------------------------|
| Visitors leave without buying | Exit-intent popups capture leaving visitors with last-chance offers |
| Low email list growth | Newsletter popups with gamification (spin-to-win, scratch cards) boost signups 2-3x |
| Cart abandonment | Cart recovery popups with automatic discount codes bring shoppers back |
| Low average order value | Free shipping bars, upsells, AI product recommendations, and BOGO offers incentivize larger orders |
| No sense of urgency | Flash sales with countdown timers create FOMO and drive immediate action |
| Lack of trust for new visitors | Real-time social proof notifications show recent purchases & activity |
| One-size-fits-all marketing | Smart targeting shows the right popup to the right visitor at the right time |
| Guessing what works | A/B testing with statistical significance finds winning campaigns |

---

## 📦 Complete Feature Set

### 1. 15 Campaign Templates

Revenue Boost provides **15 professionally designed template types**, each optimized for specific conversion goals:

| Category | Template Type | Description |
|----------|---------------|-------------|
| **Lead Generation** | `NEWSLETTER` | Email collection popup with customizable form fields |
| | `EXIT_INTENT` | Capture leaving visitors with exit-intent detection |
| **Gamification** | `SPIN_TO_WIN` | Interactive prize wheel with configurable segments & probabilities |
| | `SCRATCH_CARD` | Interactive scratch-to-reveal experience |
| **Sales & Urgency** | `FLASH_SALE` | Time-limited offers with countdown timers |
| | `COUNTDOWN_TIMER` | Standalone countdown with urgency messaging |
| | `COUNTDOWN_URGENCY` | Time-limited upsell with live countdown |
| **Conversion Boosters** | `FREE_SHIPPING` | Progress bar showing distance to free shipping threshold |
| | `CART_ABANDONMENT` | Cart recovery with item preview and urgency |
| | `PRODUCT_UPSELL` | Multi-product upsell with 10 layout options |
| **Upsell Variants** | `CLASSIC_UPSELL` | Traditional centered modal (single product) |
| | `MINIMAL_SLIDE_UP` | Compact bottom sheet for mobile-first |
| | `PREMIUM_FULLSCREEN` | Immersive full-page product showcase |
| **Communication** | `ANNOUNCEMENT` | Sticky announcement bars for promotions |
| **Trust Building** | `SOCIAL_PROOF` | Real-time purchase & activity notifications |


---

### 2. Smart Targeting System

Revenue Boost's targeting engine combines **triggers**, **audience rules**, **page targeting**, and **frequency capping** for precision marketing.

#### When to Show (Triggers)

| Trigger Type | Configuration Options |
|--------------|----------------------|
| **Page Load** | Delay (ms), require DOM ready, require images loaded |
| **Exit Intent** | Sensitivity (low/medium/high), mobile support, exclude pages |
| **Scroll Depth** | Percentage (0-100%), direction (down/up/both), debounce time |
| **Idle Timer** | Duration, mouse movement threshold, keyboard activity detection |
| **Add to Cart** | Delay, immediate mode, filter by product/collection IDs |
| **Cart Drawer Open** | Delay, max triggers per session |
| **Cart Value** | Minimum threshold, check interval |
| **Product View** | Product IDs filter, time on page, require scroll |
| **Custom Events** | Event name(s), debounce time |

#### Who to Show To (Audience)

| Audience Type | Options |
|---------------|---------|
| **Device Types** | Desktop, tablet, mobile |
| **Operating Systems** | Filter by OS |
| **Browsers** | Filter by browser |
| **Connection Type** | Filter by connection speed |
| **Shopify Segments** | Target specific customer segments (VIPs, repeat buyers, etc.) |

#### Where to Show (Pages)

| Page Targeting | Options |
|----------------|---------|
| **Specific Pages** | Product pages, collection pages, custom URLs |
| **Custom Patterns** | Regex URL patterns |
| **Exclude Pages** | Exclude specific URLs from showing popups |
| **Product Tags** | Target products by tag |
| **Collections** | Target specific Shopify collections |

#### Geographic Targeting

| Option | Description |
|--------|-------------|
| **Include Mode** | Show only to listed countries |
| **Exclude Mode** | Show to all except listed countries |
| **Country Codes** | ISO 3166-1 alpha-2 codes (US, CA, GB, DE, etc.) |

#### Frequency Capping

| Control | Description |
|---------|-------------|
| **Max per Session** | Limit popup displays per visitor session |
| **Max per Day** | Daily display cap per visitor |
| **Cooldown** | Minimum time between displays (in seconds) |
| **Respect Global Cap** | Honor store-wide popup limits |

#### Trigger Logic

Triggers can be combined using **AND** or **OR** logic for complex scenarios (e.g., "Show on exit intent AND when cart value > $50").


---

### 3. Automatic Discount System

Revenue Boost provides a **comprehensive discount engine** with native Shopify integration.

#### Discount Strategies

| Strategy | Description |
|----------|-------------|
| **Simple** | Standard percentage or fixed amount discount |
| **Bundle** | Discount when multiple products purchased together |
| **Tiered** | Spend-based tiers (e.g., "$50 = 15% off, $100 = 25% off") |
| **BOGO** | Buy X Get Y free or discounted |
| **Free Gift** | Add free product when conditions met |

#### Discount Value Types

| Type | Example |
|------|---------|
| **Percentage** | 10% off, 25% off |
| **Fixed Amount** | $10 off, $25 off |
| **Free Shipping** | Free shipping on qualifying orders |

#### Discount Behaviors

| Behavior | Description |
|----------|-------------|
| **Show Code + Auto-Apply** | Display code and automatically add to cart |
| **Show Code Only** | Display code for manual entry |
| **Show Code + Assign to Email** | Restrict code to captured email address |

#### Advanced Discount Features

| Feature | Description |
|---------|-------------|
| **Applicability Scope** | Apply to all products, cart only, specific products, or collections |
| **Tiered Discounts** | Multiple threshold tiers with different discount levels |
| **BOGO Configuration** | Buy scope (any/products/collections), get scope, quantity requirements |
| **Free Gift** | Product ID, variant ID, minimum subtotal requirement |
| **Customer Eligibility** | Everyone, logged-in only, or specific customer segments |
| **Discount Stacking** | Control combining with order, product, and shipping discounts |

#### Discount Constraints

| Constraint | Description |
|------------|-------------|
| **Minimum Amount** | Minimum cart value required |
| **Usage Limit** | Maximum redemptions per code |
| **Expiry Days** | Automatic code expiration |
| **Custom Prefix** | Branded discount code prefixes (e.g., WELCOME10) |


---

### 4. Gamification Features

Revenue Boost's gamification features dramatically increase engagement and email capture rates.

#### Spin-to-Win Wheel

| Feature | Configuration |
|---------|---------------|
| **Segments** | 2+ customizable wheel segments |
| **Probability** | Per-segment win probability (0-100%) |
| **Prizes** | Full discount configuration per segment (percentage, fixed, free shipping) |
| **Wheel Size** | 200-800px diameter |
| **Spin Duration** | 1-10 seconds |
| **Min Spins** | 1-20 rotations before stopping |
| **Border Styling** | Width (0-20px), custom color |
| **Glow Effects** | Optional glow with custom color |
| **Center Style** | Simple, gradient, or metallic |
| **Badge** | Optional promotional badge above headline |
| **Result Icons** | Trophy, gift, star, or confetti on win |
| **Max Attempts** | Limit spins per user |
| **Email Capture** | Collect email before spinning |

**Default Segments:**
- 5% OFF (35% probability)
- 10% OFF (25% probability)
- 15% OFF (15% probability)
- 20% OFF (10% probability)
- FREE SHIPPING (10% probability)
- Try Again (5% probability)

#### Scratch Cards

| Feature | Configuration |
|---------|---------------|
| **Scratch Threshold** | % of area that must be scratched to reveal |
| **Scratch Radius** | Brush size (5-100px) |
| **Prize List** | Configurable prizes with probabilities |
| **Email Gate** | Optional email capture before scratching |
| **Overlay** | Custom scratch overlay color or image |

**Default Prizes:**
- 5% OFF (40% probability)
- 10% OFF (30% probability)
- 15% OFF (20% probability)
- 20% OFF (10% probability)


---

### 5. Social Proof Notifications

Build trust and urgency with **real-time social proof** powered by actual Shopify data.

#### Notification Types

| Type | Example | Default |
|------|---------|---------|
| **Recent Purchases** | "John D. from NYC just bought Classic T-Shirt" | ✅ Enabled |
| **Live Visitors** | "23 people viewing this product right now" | Optional |
| **Review Highlights** | "4.8 stars from 1,234 reviews" | Optional |
| **Sales Count** | "47 people bought this in last 24 hours" | Optional |
| **Low Stock Alerts** | "Only 3 left in stock!" | Optional |
| **Trending** | "🔥 Trending - 50+ views today" | Optional |
| **Cart Activity** | "3 people added to cart recently" | Optional |
| **Recently Viewed** | "15 people viewed this in last hour" | Optional |

#### Display Configuration

| Setting | Options |
|---------|---------|
| **Corner Position** | Bottom-left, bottom-right, top-left, top-right |
| **Display Duration** | 1-30 seconds per notification |
| **Rotation Interval** | 1-60 seconds between notifications |
| **Max Per Session** | 1-20 notifications per visitor session |
| **Show Product Image** | Toggle product thumbnail |
| **Show Timer** | Toggle countdown timer |

#### Data Thresholds

| Threshold | Description |
|-----------|-------------|
| **Min Visitor Count** | Minimum visitors to show visitor count |
| **Min Review Rating** | Minimum rating to show reviews |
| **Low Stock Threshold** | Show "low stock" when inventory ≤ X (default: 10) |
| **Purchase Lookback** | Hours to look back for purchases (1-168h, default: 48h) |

#### Privacy Features

- **Anonymized Names**: GDPR-compliant name anonymization
- **Real Data Only**: Notifications based on actual Shopify orders
- **Redis-Powered**: Real-time visitor tracking


---

### 6. A/B Testing & Analytics

Run **scientific A/B tests** with statistical significance to find winning campaigns.

#### Experiment Types

| Type | Description |
|------|-------------|
| **A/B** | 2 variants (50/50 split) |
| **A/B/C** | 3 variants |
| **A/B/C/D** | 4 variants |
| **Multivariate** | Multiple element combinations |

#### Statistical Configuration

| Setting | Range | Default |
|---------|-------|---------|
| **Confidence Level** | 80-99% | 95% |
| **Minimum Sample Size** | 100+ | 1,000 |
| **Minimum Detectable Effect** | 1-100% | 5% |
| **Max Duration** | 1-90 days | 30 days |

#### Traffic Allocation

- Configurable percentage per variant
- Control vs. treatment groups
- Automatic variant assignment per visitor
- Consistent experience across sessions

#### Success Metrics

| Primary Metrics | Secondary Metrics |
|-----------------|-------------------|
| Conversion rate | Bounce rate |
| Revenue per visitor | Time on page |
| Email signups | Engagement rate |
| Click-through rate | |

#### Analytics Dashboard

| Feature | Description |
|---------|-------------|
| **Variant Comparison** | Side-by-side performance metrics |
| **Statistical Significance** | Chi-squared test with p-value calculation |
| **Automatic Winner Detection** | Declares winner when significance threshold met |
| **Impressions & Submissions** | View and conversion counts per variant |
| **Revenue & AOV** | Revenue attribution and average order value |
| **Real-Time Updates** | Live experiment performance |

#### Statistical Significance

- **Chi-squared test** for conversion rate comparison
- **Minimum sample requirement**: 30 visitors per variant
- **P-value thresholds**: p < 0.05 = significant, p < 0.01 = highly significant
- **Winner declaration**: Automatically identifies winning variant


---

### 7. Email Marketing Integration

Revenue Boost uses **Shopify-native customer sync**, meaning zero email platform configuration required.

#### How It Works

1. **Lead Captured** → Customer created/updated in Shopify
2. **Tags Applied** → Segmentation tags added to customer
3. **ESP Syncs** → Your email platform picks up changes automatically

#### Supported Email Platforms

Any platform that integrates with Shopify Customers:

| Platform | Support |
|----------|---------|
| Klaviyo | ✅ Full sync |
| Mailchimp | ✅ Full sync |
| Omnisend | ✅ Full sync |
| ActiveCampaign | ✅ Full sync |
| Drip | ✅ Full sync |
| ConvertKit | ✅ Full sync |
| Postscript | ✅ Full sync |
| + 50 more | ✅ Full sync |

#### Smart Customer Tags

Tags automatically applied for segmentation:

| Tag Pattern | Example | Purpose |
|-------------|---------|---------|
| `revenue-boost` | `revenue-boost` | Master tag for all leads |
| `rb-template:{type}` | `rb-template:spin-to-win` | Template type identification |
| `rb-campaign:{name}` | `rb-campaign:summer-sale` | Campaign attribution |
| `rb-date:{yyyy-mm}` | `rb-date:2025-12` | Signup cohort |
| `rb-discount:{code}` | `rb-discount:WELCOME10` | Discount received |

#### Lead Capture Fields

| Field | Configuration |
|-------|---------------|
| **Email** | Required by default, custom placeholder & validation |
| **Name** | Optional, with custom label and placeholder |
| **Consent** | Optional checkbox with privacy policy link |


---

### 8. Design Customization

Revenue Boost provides a **comprehensive design system** with 25+ customizable design tokens.

#### Theme Options

| Mode | Description |
|------|-------------|
| **Recipe Themes** | Pre-designed themes (ocean, bold-energy, minimal-zen, etc.) |
| **Custom Theme** | Full control over all design tokens |
| **Custom Presets** | Save and reuse custom designs |

#### Position & Size

| Setting | Options |
|---------|---------|
| **Position** | Center, top, bottom, left, right |
| **Size** | Small, medium, large, fullscreen |
| **Popup Size** | Compact, standard, wide, full |

#### Layout Variants

| Layout | Description |
|--------|-------------|
| **Centered** | Default modal in center |
| **Split-Left** | Image on left, content on right |
| **Split-Right** | Content on left, image on right |
| **Fullscreen** | Full viewport takeover |
| **Banner-Top** | Top sticky bar |
| **Banner-Bottom** | Bottom sticky bar |
| **Sidebar-Left/Right** | Slide-in from sides |

#### Lead Capture Layouts

| Desktop Layouts | Mobile Layouts |
|-----------------|----------------|
| Split-left | Stacked |
| Split-right | Overlay |
| Stacked | Fullscreen |
| Overlay | Content-only |
| Content-only | |

#### Color Tokens (25+)

| Category | Tokens |
|----------|--------|
| **Main** | backgroundColor, textColor, descriptionColor, accentColor |
| **Button** | buttonColor, buttonTextColor, secondaryButtonColor |
| **Input** | inputBackgroundColor, inputTextColor, inputBorderColor, inputPlaceholderColor |
| **State** | successColor, overlayColor |
| **Image** | imageBgColor |
| **Badge** | badgeBackgroundColor, badgeTextColor |

#### Typography

| Setting | Options |
|---------|---------|
| **Font Family** | Custom font families for headline and body |
| **Font Size** | Title and description size |
| **Font Weight** | Title and description weight |
| **Text Shadow** | Title text shadow effects |
| **Text Align** | Left, center, right |

#### Styling Options

| Feature | Options |
|---------|---------|
| **Border Radius** | 0-50px for popup, buttons, inputs |
| **Animation** | Fade, slide, bounce, none |
| **Overlay Opacity** | 0-100% background overlay |
| **Box Shadow** | Custom shadow effects |
| **Input Style** | Outlined, filled, underline |
| **Button Style** | Filled, outline, ghost |
| **Custom CSS** | Advanced CSS overrides |


---

### 9. Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $9/month | Core features, limited campaigns |
| **Growth** | $29/month | Unlimited campaigns, A/B testing |
| **Pro** | $79/month | Full analytics, priority support |

✅ **All plans include a 14-day free trial**

---

### 10. Product Upsell Layouts

Revenue Boost offers **10 specialized upsell layouts** for different use cases:

| Layout | Best For |
|--------|----------|
| **Grid** | Multi-product displays with thumbnails |
| **Card** | Horizontal list with product details |
| **Carousel** | Mobile-first, swipeable product showcase |
| **Featured** | Hero product + supporting grid |
| **Stack** | Interactive overlapping cards |
| **Classic** | Traditional centered modal (single product) |
| **Minimal Slide-Up** | Mobile bottom sheet |
| **Premium Fullscreen** | Immersive product takeover |
| **Bundle Deal** | Multi-product bundle with combined savings |
| **Countdown Urgency** | Time-limited single product offer |

---

### 11. Flash Sale Features

Flash sales include **advanced timer and inventory features**:

#### Timer Modes

| Mode | Description |
|------|-------------|
| **Fixed End** | Countdown to specific date/time |
| **Duration** | Countdown from first view (e.g., 1 hour) |
| **Personal** | Per-visitor countdown window |
| **Stock Limited** | Ends when inventory depleted |

#### Inventory Tracking

| Mode | Description |
|------|-------------|
| **Real** | Live Shopify inventory data |
| **Pseudo** | Simulated scarcity (configurable max) |

#### Reserve Timer

- Optional "X minutes to claim this offer" reservation
- Configurable duration and messaging
- Creates urgency without holding inventory

---

## 🎯 Who Is This For?

### Ideal Merchants

- Shopify stores with **1,000+ monthly visitors**
- Merchants focused on **growing their email list**
- Stores with **cart abandonment issues**
- Brands wanting to **increase average order value**
- Stores running **sales & promotions** regularly
- Merchants who want **data-driven marketing decisions**

### Industry Fit

| Industry | Key Use Cases |
|----------|---------------|
| **Fashion & Apparel** | Newsletter, spin-to-win, flash sales |
| **Beauty & Cosmetics** | Free shipping bars, product upsells |
| **Home & Garden** | Bundle deals, countdown urgency |
| **Electronics & Tech** | Cart abandonment, social proof |
| **Food & Beverage** | Announcement bars, BOGO offers |
| **Health & Wellness** | Newsletter with wellness themes |
| **Any D2C Brand** | Full feature set |

---

## 🏆 Competitive Advantages

| Advantage | Description |
|-----------|-------------|
| **Gamification Built-In** | Spin-to-win and scratch cards increase engagement 2-3x vs. standard popups |
| **Shopify-Native** | Deep integration with Shopify discounts, customers, and segments |
| **Smart Targeting** | 10+ trigger types ensure popups appear at the perfect moment |
| **Real-Time Social Proof** | Live purchase notifications powered by actual Shopify orders |
| **Zero Email Config** | Works with any email platform through Shopify's native sync |
| **Scientific A/B Testing** | Chi-squared statistical significance calculations, not guesswork |
| **Beautiful by Default** | Professional templates that match store branding automatically |
| **AI Product Recommendations** | Smart AI-powered upsells based on browsing behavior and purchase history |
| **Design Recipe System** | Pre-built industry-specific design themes |
| **Full TypeScript + Zod** | Type-safe configuration with runtime validation |

---

## 📊 Expected Results

Based on industry benchmarks for well-optimized popup campaigns:

| Metric | Typical Improvement |
|--------|---------------------|
| Email signups | **+150-300%** vs. no popups |
| Cart abandonment recovery | **+10-15%** saved carts |
| Average order value | **+10-25%** with upsells |
| Conversion rate | **+5-15%** overall |
| Social proof impact | **+15-25%** conversion on product pages |
| Gamification engagement | **+2-3x** signup rates vs. standard forms |

---

## 🔧 Technical Architecture

### Type-Safe Configuration

Revenue Boost uses **Zod schemas as the single source of truth** for all configuration:

- **Content Config**: Template-specific fields (validated per template type)
- **Design Config**: Universal visual settings (25+ tokens)
- **Target Rules**: Triggers, audience, pages, frequency capping
- **Discount Config**: Full discount system with native Shopify integration

### Event Tracking

| Event Type | Description |
|------------|-------------|
| `VIEW` | Popup impression |
| `SUBMIT` | Form submission / conversion |
| `COUPON_ISSUED` | Discount code generated |
| `CLICK` | CTA button clicked |
| `CLOSE` | Popup dismissed |

### Rate Limiting & Security

- IP-based rate limiting for API abuse prevention
- Email-based rate limiting for discount code generation
- Session-based frequency capping for popup displays
