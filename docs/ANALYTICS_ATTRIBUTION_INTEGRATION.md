# Complete Analytics & Attribution Integration Analysis

## Executive Summary

This document provides a comprehensive analysis of how revenue-boost can integrate with Shopify's attribution and analytics systems to track campaign performance, discount usage, and revenue attribution.

**Key Findings:**
- ✅ **Marketing Events API**: Full attribution support via UTM parameters
- ✅ **Discount Code Tracking**: Automatic tracking via Shopify's order system
- ✅ **Web Pixels**: Advanced client-side event tracking
- ✅ **Customer Journey**: Full visibility into conversion paths
- ✅ **Revenue Attribution**: Appears in Shopify's Marketing dashboard

---

## 1. Discount Code Attribution

### How It Works

**YES! Discount codes are automatically linked to purchases in Shopify.**

When a customer uses a discount code created by your app:

1. **Order Creation**: Shopify automatically records the discount code(s) used
2. **Order Data**: Available via `order.discountCodes` and `order.discountApplications`
3. **Attribution**: Shopify tracks which discount codes drive revenue
4. **Reporting**: Merchants see discount performance in Analytics > Reports

### Available Data Points

```graphql
query GetOrderWithDiscounts($orderId: ID!) {
  order(id: $orderId) {
    id
    name
    totalPrice
    
    # Simple discount code field
    discountCode
    
    # All discount codes applied (can be multiple)
    discountCodes
    
    # Detailed discount information
    discountApplications(first: 10) {
      edges {
        node {
          ... on DiscountCodeApplication {
            code
            value {
              ... on MoneyV2 {
                amount
                currencyCode
              }
              ... on PricingPercentageValue {
                percentage
              }
            }
            allocationMethod
          }
        }
      }
    }
    
    # Customer journey (includes UTM parameters)
    customerJourneySummary {
      firstVisit {
        utmParameters {
          campaign
          source
          medium
        }
      }
      lastVisit {
        utmParameters {
          campaign
          source
          medium
        }
      }
      momentsCount
      daysToConversion
    }
  }
}
```

### Integration Strategy

**Option 1: Webhook-Based Tracking (Recommended)**

Subscribe to `orders/create` webhook to track discount usage:

```typescript
// app/webhooks/orders.create.ts
export async function handleOrderCreate(
  topic: string,
  shop: string,
  body: string
) {
  const order = JSON.parse(body);
  
  // Check if order used our discount codes
  const ourDiscountCodes = order.discount_codes?.filter(
    (dc: any) => dc.code.startsWith('REVENUE-BOOST-')
  );
  
  if (ourDiscountCodes.length > 0) {
    // Find the campaign that created this discount
    const campaign = await findCampaignByDiscountCode(
      shop,
      ourDiscountCodes[0].code
    );
    
    if (campaign) {
      // Track conversion
      await trackCampaignConversion(campaign.id, {
        orderId: order.id,
        orderNumber: order.order_number,
        totalPrice: order.total_price,
        discountAmount: order.total_discounts,
        discountCodes: ourDiscountCodes.map((dc: any) => dc.code),
        customerId: order.customer?.id,
        createdAt: order.created_at,
      });
    }
  }
}
```

**Option 2: Polling-Based Tracking**

Query orders periodically to find discount usage:

```typescript
// Less efficient, but works without webhooks
async function syncDiscountUsage(shop: string) {
  const campaigns = await getActiveCampaigns(shop);
  
  for (const campaign of campaigns) {
    if (campaign.discountConfig?.code) {
      const orders = await admin.graphql(`
        query FindOrdersByDiscount($query: String!) {
          orders(first: 50, query: $query) {
            edges {
              node {
                id
                name
                totalPrice
                discountCodes
                createdAt
              }
            }
          }
        }
      `, {
        variables: {
          query: `discount_code:${campaign.discountConfig.code}`
        }
      });
      
      // Process orders...
    }
  }
}
```

---

## 2. Marketing Events API Integration

### Overview

The Marketing Events API allows your app to:
- Create marketing events for each campaign
- Track attribution via UTM parameters
- Report engagement metrics (views, clicks, conversions)
- **Appear in Shopify's Marketing > Attribution dashboard**

### Implementation

#### Step 1: Create Marketing Event When Campaign Activates

```typescript
// app/domains/analytics/services/marketing-events.server.ts
import { AdminApiContext } from '@shopify/shopify-app-remix/server';
import { Campaign } from '@prisma/client';

export async function createMarketingEvent(
  admin: AdminApiContext,
  campaign: Campaign
) {
  const utmParams = generateUTMParams(campaign);
  
  const response = await admin.rest.post({
    path: '/marketing_events',
    data: {
      marketing_event: {
        remote_id: campaign.id,
        event_type: mapTemplateToEventType(campaign.templateType),
        marketing_channel: 'display', // Popups are display ads
        started_at: new Date().toISOString(),
        utm_campaign: utmParams.utm_campaign,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        description: campaign.name,
        marketed_resources: campaign.targetRules?.productIds?.map(id => ({
          type: 'product',
          id: parseInt(id.replace('gid://shopify/Product/', ''))
        })) || [],
      }
    }
  });
  
  return response.body.marketing_event;
}

function generateUTMParams(campaign: Campaign) {
  return {
    utm_campaign: `revenue-boost-${campaign.id}`,
    utm_source: 'revenue-boost-app',
    utm_medium: campaign.templateType.toLowerCase().replace('_', '-'),
  };
}

function mapTemplateToEventType(templateType: string): string {
  const mapping: Record<string, string> = {
    NEWSLETTER: 'newsletter',
    SPIN_TO_WIN: 'post',
    FLASH_SALE: 'ad',
    ANNOUNCEMENT_BAR: 'message',
    EXIT_INTENT: 'retargeting',
    // ... other mappings
  };
  return mapping[templateType] || 'message';
}
```

#### Step 2: Add UTM Parameters to Popup Links

```typescript
// app/domains/storefront/popups-new/utils/utm.ts
export function addUTMParams(url: string, campaign: Campaign): string {
  const urlObj = new URL(url, 'https://example.com');
  
  urlObj.searchParams.set('utm_campaign', `revenue-boost-${campaign.id}`);
  urlObj.searchParams.set('utm_source', 'revenue-boost-app');
  urlObj.searchParams.set('utm_medium', campaign.templateType.toLowerCase());
  
  return urlObj.toString();
}

// Usage in popup components
<a href={addUTMParams(productUrl, campaign)}>
  Shop Now
</a>
```

#### Step 3: Report Engagement Metrics

```typescript
// app/domains/analytics/services/engagement-tracking.server.ts
export async function reportDailyEngagement(
  admin: AdminApiContext,
  marketingEventId: string,
  metrics: {
    date: string;
    views: number;
    clicks: number;
    conversions: number;
  }
) {
  await admin.rest.post({
    path: `/marketing_events/${marketingEventId}/engagements`,
    data: {
      engagements: [{
        occurred_on: metrics.date,
        views_count: metrics.views,
        clicks_count: metrics.clicks,
        favorites_count: metrics.conversions, // Email signups
        is_cumulative: false,
      }]
    }
  });
}
```

---

## 3. Web Pixels Integration

### What Are Web Pixels?

Web pixels are JavaScript snippets that run on the storefront to track customer behavior. They provide:
- **Client-side event tracking** (page views, clicks, add to cart, etc.)
- **Access to checkout events** (payment submitted, order completed)
- **Custom event publishing** (popup shown, popup dismissed, etc.)
- **Integration with third-party analytics** (Google Analytics, Facebook Pixel, etc.)

### Standard Events Available

```typescript
// Standard Shopify events you can subscribe to:
- page_viewed
- product_viewed
- collection_viewed
- cart_viewed
- product_added_to_cart
- product_removed_from_cart
- checkout_started
- checkout_completed
- payment_info_submitted
- search_submitted
```

### Implementation

#### Step 1: Create Web Pixel Extension

```bash
npm run shopify app generate extension -- --type web_pixel
```

#### Step 2: Configure Extension

```toml
# extensions/revenue-boost-pixel/shopify.extension.toml
api_version = "2025-10"

[[extensions]]
type = "web_pixel_extension"
name = "revenue-boost-pixel"

[extensions.settings]
type = "object"

[extensions.settings.fields.trackingEnabled]
name = "Enable Tracking"
description = "Track popup interactions and conversions"
type = "boolean"
```

#### Step 3: Implement Pixel Logic

```javascript
// extensions/revenue-boost-pixel/src/index.js
import { register } from '@shopify/web-pixels-extension';

register(({ analytics, browser, settings, init }) => {
  // Track popup views
  analytics.subscribe('page_viewed', async (event) => {
    // Check if popup was shown on this page
    const popupShown = await browser.localStorage.getItem('rb_popup_shown');
    
    if (popupShown) {
      // Send custom event
      analytics.publish('popup_viewed', {
        campaignId: popupShown,
        pageUrl: event.context.document.location.href,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Track conversions
  analytics.subscribe('checkout_completed', (event) => {
    const campaignId = event.context.document.location.search
      .match(/utm_campaign=revenue-boost-([^&]+)/)?.[1];
    
    if (campaignId) {
      // Send conversion event
      fetch(`https://your-app.com/api/track/conversion`, {
        method: 'POST',
        body: JSON.stringify({
          campaignId,
          orderId: event.data.checkout.order.id,
          totalPrice: event.data.checkout.totalPrice.amount,
        }),
        keepalive: true,
      });
    }
  });
  
  // Track product clicks from popups
  analytics.subscribe('product_added_to_cart', (event) => {
    const fromPopup = browser.sessionStorage.getItem('rb_last_popup_interaction');
    
    if (fromPopup) {
      analytics.publish('popup_conversion', {
        campaignId: fromPopup,
        productId: event.data.cartLine.merchandise.product.id,
        action: 'add_to_cart',
      });
    }
  });
});
```

---

## 4. Complete Data Flow

### Campaign Lifecycle with Full Attribution

```
1. CAMPAIGN CREATED
   └─> Store campaign in database
   
2. CAMPAIGN ACTIVATED
   ├─> Create Marketing Event (Marketing Events API)
   │   └─> Returns marketing_event_id
   ├─> Store marketing_event_id in campaign record
   └─> Generate UTM parameters

3. POPUP SHOWN ON STOREFRONT
   ├─> Web Pixel tracks 'popup_viewed' event
   ├─> Store campaign ID in localStorage
   └─> Daily aggregation → Report to Marketing Events API

4. CUSTOMER INTERACTS
   ├─> Clicks product link with UTM parameters
   ├─> Web Pixel tracks interaction
   └─> Session storage records last interaction

5. CUSTOMER USES DISCOUNT CODE
   ├─> Discount code applied at checkout
   ├─> UTM parameters in URL
   └─> Both tracked by Shopify

6. ORDER CREATED
   ├─> Webhook: orders/create
   ├─> Extract discount codes
   ├─> Extract UTM parameters from customerJourneySummary
   ├─> Link order to campaign
   └─> Update campaign metrics

7. MERCHANT VIEWS RESULTS
   ├─> Marketing > Attribution (Shopify Admin)
   │   └─> Shows revenue from UTM parameters
   ├─> Marketing > Campaigns (Shopify Admin)
   │   └─> Shows engagement metrics
   └─> Revenue Boost App Dashboard
       └─> Shows detailed campaign analytics
```

---

## 5. Database Schema Updates

```prisma
model Campaign {
  // ... existing fields
  
  // Marketing Events API
  marketingEventId     String?   // Shopify marketing event ID
  marketingEventRemoteId String? // Our campaign ID as remote_id
  
  // UTM Parameters
  utmCampaign         String?
  utmSource           String?
  utmMedium           String?
  
  // Analytics
  conversions         CampaignConversion[]
  engagementMetrics   EngagementMetric[]
}

model CampaignConversion {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  orderId         String   // Shopify order ID
  orderNumber     String   // Human-readable order number
  totalPrice      Decimal
  discountAmount  Decimal
  discountCodes   String[] // Array of discount codes used
  customerId      String?
  
  // Attribution source
  source          String   // 'discount_code' | 'utm_params' | 'both'
  
  createdAt       DateTime @default(now())
  
  @@index([campaignId])
  @@index([orderId])
}

model EngagementMetric {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  date            DateTime @db.Date
  views           Int      @default(0)
  clicks          Int      @default(0)
  interactions    Int      @default(0)
  conversions     Int      @default(0)
  
  // Reported to Shopify
  reportedToShopify Boolean @default(false)
  reportedAt        DateTime?
  
  @@unique([campaignId, date])
  @@index([campaignId])
}
```

---

## 6. Required Scopes

Update `shopify.app.toml`:

```toml
scopes = "write_marketing_events,read_marketing_events,write_pixels,read_customer_events,read_orders,write_discounts,read_discounts"
```

---

## 7. Implementation Checklist

### Phase 1: Marketing Events API (High Priority)
- [ ] Add marketing events scopes to app
- [ ] Create marketing event service
- [ ] Generate UTM parameters for campaigns
- [ ] Create marketing event when campaign activates
- [ ] Update marketing event when campaign ends
- [ ] Add UTM params to all popup links
- [ ] Store marketing_event_id in Campaign model

### Phase 2: Discount Code Tracking (High Priority)
- [ ] Subscribe to orders/create webhook
- [ ] Extract discount codes from orders
- [ ] Link orders to campaigns via discount codes
- [ ] Create CampaignConversion records
- [ ] Display conversion data in app dashboard

### Phase 3: Engagement Tracking (Medium Priority)
- [ ] Track popup views (storefront extension)
- [ ] Track popup interactions
- [ ] Aggregate daily metrics
- [ ] Report metrics to Marketing Events API
- [ ] Create EngagementMetric records

### Phase 4: Web Pixels (Optional, Advanced)
- [ ] Create web pixel extension
- [ ] Subscribe to standard events
- [ ] Publish custom popup events
- [ ] Track full customer journey
- [ ] Integrate with third-party analytics

---

## 8. Benefits Summary

### For Merchants
✅ See ROI directly in Shopify Admin (Marketing > Attribution)
✅ Compare popup campaigns to Facebook/Google ads
✅ Understand which campaigns drive revenue
✅ Track discount code performance
✅ Full customer journey visibility

### For Your App
✅ Appears in Marketing section (increases perceived value)
✅ Native Shopify integration (feels like first-party feature)
✅ Competitive advantage (most popup apps don't have this)
✅ Better data for optimization
✅ Merchant retention (they see the value)

### For Customers
✅ Privacy-compliant tracking
✅ No performance impact
✅ Seamless experience

---

## 9. Next Steps

**Recommended Implementation Order:**

1. **Week 1**: Marketing Events API + UTM Parameters
2. **Week 2**: Discount Code Tracking via Webhooks
3. **Week 3**: Engagement Metrics + Reporting
4. **Week 4**: Dashboard UI for Analytics
5. **Future**: Web Pixels for Advanced Tracking

**Quick Win**: Start with Marketing Events API + UTM parameters. This alone will make your campaigns appear in Shopify's Marketing dashboard with attribution data.

