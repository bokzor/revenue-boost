# AI Product Recommendations in Popups

> Priority: P2 | Impact: 🔥🔥🔥 | Effort: High

## Summary

Add AI-powered product recommendations to upsell and exit-intent popups. Instead of manually selecting products, automatically suggest items based on browsing behavior, cart contents, and purchase history. Justuno and Wisepops use AI recommendations as a key differentiator.

## Why

- Personalized recommendations convert 3-5x better than generic offers
- Reduces merchant setup time (no manual product selection)
- Positions Revenue Boost as enterprise-grade solution
- Competitive parity with Justuno/Wisepops
- Can leverage Shopify's existing recommendation APIs

## User Stories

- As a merchant, I want popups to automatically show relevant products
- As a merchant, I want upsells based on what's in the customer's cart
- As a visitor, I want to see products that match my interests
- As a merchant, I want to see which AI recommendations drive sales

## Implementation Tasks

### Phase 1: Rule-Based Recommendations (MVP)
- [ ] "Frequently bought together" from Shopify data
- [ ] "Customers also viewed" based on session data
- [ ] Cart-based recommendations (complementary products)
- [ ] Collection-based recommendations (same collection)

### Phase 2: Behavioral Recommendations
- [ ] Browsing history tracking (products viewed this session)
- [ ] Time-on-page weighting (more time = higher interest)
- [ ] Category affinity scoring
- [ ] Recency weighting

### Phase 3: AI/ML Recommendations
- [ ] Integrate with Shopify Search & Discovery API
- [ ] Collaborative filtering (users like you bought...)
- [ ] Product similarity scoring
- [ ] Personalized ranking

### Admin Configuration
- [ ] Recommendation strategy selector
- [ ] Fallback product selection (if no data)
- [ ] Exclude out-of-stock products
- [ ] Filter by collection/tags

## Technical Design

### Recommendation Config Schema

```typescript
export const RecommendationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  
  strategy: z.enum([
    "manual",                  // Merchant selects products
    "frequently_bought",       // Shopify FBT data
    "recently_viewed",         // Session browsing history
    "cart_complementary",      // Based on cart contents
    "same_collection",         // Same collection as viewed product
    "bestsellers",             // Store bestsellers
    "ai_personalized",         // Full AI recommendations
  ]).default("frequently_bought"),
  
  // Display options
  maxProducts: z.number().min(1).max(6).default(3),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showAddToCart: z.boolean().default(true),
  
  // Filtering
  excludeOutOfStock: z.boolean().default(true),
  excludeCurrentProduct: z.boolean().default(true),
  filterByCollection: z.string().optional(),
  filterByTags: z.array(z.string()).optional(),
  
  // Fallback
  fallbackProducts: z.array(z.string()).optional(), // Product IDs
});
```

### Recommendation Response

```typescript
interface ProductRecommendation {
  id: string;
  title: string;
  handle: string;
  featuredImage: string;
  price: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  score: number; // Relevance score 0-1
  reason: string; // "Frequently bought together", "Based on your browsing"
}

interface RecommendationResult {
  products: ProductRecommendation[];
  strategy: string;
  context: {
    cartProductIds?: string[];
    viewedProductIds?: string[];
    currentProductId?: string;
  };
}
```

### Recommendation Service

```typescript
// app/domains/recommendations/services/recommendation.server.ts

export async function getRecommendations(
  storeId: string,
  config: RecommendationConfig,
  context: RecommendationContext
): Promise<RecommendationResult> {
  const { strategy } = config;
  
  switch (strategy) {
    case "frequently_bought":
      return getFrequentlyBoughtTogether(context.currentProductId);
    
    case "recently_viewed":
      return getRecentlyViewed(context.sessionId);
    
    case "cart_complementary":
      return getCartComplementary(context.cartProductIds);
    
    case "ai_personalized":
      return getAIRecommendations(context);
    
    default:
      return getFallbackProducts(config.fallbackProducts);
  }
}
```

### Shopify Integration

```typescript
// Using Shopify's productRecommendations query
const PRODUCT_RECOMMENDATIONS_QUERY = `
  query productRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      featuredImage {
        url
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;
```

## UI Design

### AI Upsell Popup

```
┌─────────────────────────────────────┐
│  Complete Your Look ✨               │
│                                     │
│  Based on your cart:                │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 👕  │ │ 👖  │ │ 🧣  │           │
│  │Shirt│ │Pants│ │Scarf│           │
│  │ $45 │ │ $65 │ │ $25 │           │
│  │[Add]│ │[Add]│ │[Add]│           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  💡 Frequently bought together      │
│                                     │
│  [Add All to Cart - Save 10%]       │
└─────────────────────────────────────┘
```

### Exit-Intent with Recommendations

```
┌─────────────────────────────────────┐
│  Wait! You might like these 👀      │
│                                     │
│  Based on what you viewed:          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [img] Product Name    $49   │    │
│  │       ★★★★☆ (24 reviews)   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [img] Product Name    $35   │    │
│  │       ★★★★★ (18 reviews)   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Get 10% off your first order:      │
│  Email: [________________]          │
│  [Get My Discount]                  │
└─────────────────────────────────────┘
```

## Data Flow

```
Visitor browses store
    ↓
Track: page views, time on page, cart contents
    ↓
Trigger: Exit intent or cart threshold
    ↓
Fetch recommendations
    ├── Strategy: frequently_bought → Shopify API
    ├── Strategy: recently_viewed → Session data
    └── Strategy: ai_personalized → ML model
    ↓
Render popup with personalized products
    ↓
Track: impressions, clicks, add-to-cart, conversions
```

## Related Files

- `app/domains/recommendations/` (new domain)
- `app/domains/campaigns/types/campaign.ts` (add config)
- `app/domains/storefront/popups-new/` (update upsell popups)
- `app/routes/api.recommendations.tsx` (new API)

## Success Metrics

- Recommendation click-through rate
- Add-to-cart rate from recommendations
- Revenue attributed to recommendations
- A/B test: AI vs manual product selection

