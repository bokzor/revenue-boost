# Analytics & Attribution Quick Start Guide

This guide provides step-by-step instructions to implement analytics and attribution tracking for revenue-boost campaigns.

## Prerequisites

- [ ] Shopify app with admin API access
- [ ] Database with Campaign model
- [ ] Active campaigns creating discount codes

## Phase 1: Marketing Events API (Week 1)

### Step 1: Add Required Scopes

**File**: `shopify.app.toml`

```toml
scopes = "write_marketing_events,read_marketing_events,read_orders,write_discounts,read_discounts"
```

**Action**: Reinstall app on development store to get new scopes.

### Step 2: Update Database Schema

**File**: `prisma/schema.prisma`

```prisma
model Campaign {
  // ... existing fields
  
  // Marketing Events API
  marketingEventId     String?   // Shopify marketing event ID
  utmCampaign         String?
  utmSource           String?
  utmMedium           String?
  
  // Analytics
  conversions         CampaignConversion[]
}

model CampaignConversion {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  orderId         String   @unique
  orderNumber     String
  totalPrice      Decimal
  discountAmount  Decimal
  discountCodes   String[]
  customerId      String?
  source          String   // 'discount_code' | 'utm_params' | 'both'
  
  createdAt       DateTime @default(now())
  
  @@index([campaignId])
}
```

**Actions**:
```bash
npx prisma migrate dev --name add_analytics_fields
npx prisma generate
```

### Step 3: Create Marketing Events Service

**File**: `app/domains/analytics/services/marketing-events.server.ts`

```typescript
import { AdminApiContext } from '@shopify/shopify-app-remix/server';
import { Campaign } from '@prisma/client';

export interface MarketingEventParams {
  campaignId: string;
  campaignName: string;
  templateType: string;
  startedAt: Date;
  productIds?: string[];
}

export async function createMarketingEvent(
  admin: AdminApiContext,
  params: MarketingEventParams
) {
  const utmParams = generateUTMParams(params.campaignId, params.templateType);
  
  try {
    const response = await admin.rest.post({
      path: '/marketing_events',
      data: {
        marketing_event: {
          remote_id: params.campaignId,
          event_type: mapTemplateToEventType(params.templateType),
          marketing_channel: 'display',
          started_at: params.startedAt.toISOString(),
          utm_campaign: utmParams.utm_campaign,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          description: params.campaignName,
          marketed_resources: params.productIds?.map(id => ({
            type: 'product',
            id: parseInt(id.replace('gid://shopify/Product/', ''))
          })) || [],
        }
      }
    });
    
    return {
      marketingEventId: response.body.marketing_event.id,
      ...utmParams,
    };
  } catch (error) {
    console.error('Failed to create marketing event:', error);
    throw error;
  }
}

export async function updateMarketingEvent(
  admin: AdminApiContext,
  marketingEventId: string,
  updates: {
    endedAt?: Date;
    budget?: number;
  }
) {
  await admin.rest.put({
    path: `/marketing_events/${marketingEventId}`,
    data: {
      marketing_event: {
        ended_at: updates.endedAt?.toISOString(),
        budget: updates.budget,
      }
    }
  });
}

function generateUTMParams(campaignId: string, templateType: string) {
  return {
    utm_campaign: `revenue-boost-${campaignId}`,
    utm_source: 'revenue-boost-app',
    utm_medium: templateType.toLowerCase().replace('_', '-'),
  };
}

function mapTemplateToEventType(templateType: string): string {
  const mapping: Record<string, string> = {
    NEWSLETTER: 'newsletter',
    SPIN_TO_WIN: 'post',
    FLASH_SALE: 'ad',
    ANNOUNCEMENT_BAR: 'message',
    EXIT_INTENT: 'retargeting',
    PRODUCT_RECOMMENDATION: 'ad',
    COUNTDOWN_TIMER: 'ad',
    SOCIAL_PROOF: 'message',
    VIDEO_POPUP: 'post',
    SURVEY: 'post',
    FREE_SHIPPING_BAR: 'message',
  };
  return mapping[templateType] || 'message';
}
```

### Step 4: Update Campaign Activation

**File**: `app/routes/api.campaigns.$campaignId.activate.ts`

```typescript
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/db.server';
import { createMarketingEvent } from '~/domains/analytics/services/marketing-events.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const campaignId = params.campaignId!;
  
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  
  if (!campaign) {
    return json({ error: 'Campaign not found' }, { status: 404 });
  }
  
  // Create marketing event
  const { marketingEventId, utm_campaign, utm_source, utm_medium } = 
    await createMarketingEvent(admin, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      templateType: campaign.templateType,
      startedAt: new Date(),
      productIds: campaign.targetRules?.productIds,
    });
  
  // Update campaign with marketing event data
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'ACTIVE',
      marketingEventId,
      utmCampaign: utm_campaign,
      utmSource: utm_source,
      utmMedium: utm_medium,
    },
  });
  
  return json({ success: true, marketingEventId });
}
```

### Step 5: Add UTM Parameters to Popup Links

**File**: `app/domains/storefront/utils/utm.ts`

```typescript
export function addUTMParams(
  url: string,
  campaign: {
    utmCampaign?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
  }
): string {
  if (!campaign.utmCampaign) return url;
  
  try {
    const urlObj = new URL(url, 'https://placeholder.com');
    
    urlObj.searchParams.set('utm_campaign', campaign.utmCampaign);
    if (campaign.utmSource) {
      urlObj.searchParams.set('utm_source', campaign.utmSource);
    }
    if (campaign.utmMedium) {
      urlObj.searchParams.set('utm_medium', campaign.utmMedium);
    }
    
    // Return relative URL if input was relative
    if (!url.startsWith('http')) {
      return urlObj.pathname + urlObj.search;
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}
```

**Usage in Popup Components**:

```typescript
// app/domains/storefront/popups-new/SpinToWinPopup.tsx
import { addUTMParams } from '../utils/utm';

export function SpinToWinPopup({ campaign, onClose }: PopupProps) {
  const productUrl = addUTMParams('/products/example', campaign);
  
  return (
    <div>
      {/* ... popup content ... */}
      <a href={productUrl}>Shop Now</a>
    </div>
  );
}
```

---

## Phase 2: Discount Code Tracking (Week 2)

### Step 1: Create Webhook Handler

**File**: `app/webhooks/orders.create.ts`

```typescript
import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/db.server';

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, session, payload } = await authenticate.webhook(request);
  
  if (topic !== 'ORDERS_CREATE') {
    return new Response('Invalid topic', { status: 400 });
  }
  
  const order = payload as ShopifyOrder;
  
  // Check for our discount codes
  const ourDiscountCodes = order.discount_codes?.filter(
    (dc) => dc.code.startsWith('REVENUE-BOOST-')
  ) || [];
  
  if (ourDiscountCodes.length === 0) {
    return new Response('No relevant discount codes', { status: 200 });
  }
  
  // Find campaign by discount code
  const discountCode = ourDiscountCodes[0].code;
  const campaign = await prisma.campaign.findFirst({
    where: {
      shop,
      discountConfig: {
        path: ['code'],
        equals: discountCode,
      },
    },
  });
  
  if (!campaign) {
    console.warn(`Campaign not found for discount code: ${discountCode}`);
    return new Response('Campaign not found', { status: 200 });
  }
  
  // Create conversion record
  await prisma.campaignConversion.create({
    data: {
      campaignId: campaign.id,
      orderId: order.id.toString(),
      orderNumber: order.order_number.toString(),
      totalPrice: parseFloat(order.total_price),
      discountAmount: parseFloat(order.total_discounts),
      discountCodes: ourDiscountCodes.map(dc => dc.code),
      customerId: order.customer?.id?.toString(),
      source: 'discount_code',
    },
  });
  
  console.log(`Tracked conversion for campaign ${campaign.id}, order ${order.order_number}`);
  
  return new Response('OK', { status: 200 });
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  total_price: string;
  total_discounts: string;
  discount_codes?: Array<{ code: string; amount: string }>;
  customer?: { id: number };
}
```

### Step 2: Register Webhook

**File**: `app/shopify.server.ts`

```typescript
import '@shopify/shopify-app-remix/adapters/node';
import { shopifyApp } from '@shopify/shopify-app-remix/server';

const shopify = shopifyApp({
  // ... existing config
  
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks/orders/create',
    },
  },
});

export default shopify;
```

### Step 3: Test Webhook

```bash
# In development, use Shopify CLI to trigger test webhook
shopify app webhook trigger --topic orders/create
```

---

## Phase 3: Display Analytics (Week 3)

### Step 1: Create Analytics Route

**File**: `app/routes/app.campaigns.$campaignId.analytics.tsx`

```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/db.server';
import { Card, Text, BlockStack, InlineGrid } from '@shopify/polaris';

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const campaignId = params.campaignId!;
  
  const [campaign, conversions] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
    }),
    prisma.campaignConversion.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  
  const totalRevenue = conversions.reduce(
    (sum, c) => sum + Number(c.totalPrice),
    0
  );
  
  const totalDiscount = conversions.reduce(
    (sum, c) => sum + Number(c.discountAmount),
    0
  );
  
  return json({
    campaign,
    conversions,
    stats: {
      totalConversions: conversions.length,
      totalRevenue,
      totalDiscount,
      averageOrderValue: conversions.length > 0 ? totalRevenue / conversions.length : 0,
    },
  });
}

export default function CampaignAnalytics() {
  const { campaign, conversions, stats } = useLoaderData<typeof loader>();
  
  return (
    <BlockStack gap="400">
      <Text variant="headingLg" as="h1">
        Analytics: {campaign?.name}
      </Text>
      
      <InlineGrid columns={4} gap="400">
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" tone="subdued">Total Conversions</Text>
            <Text variant="heading2xl" as="p">{stats.totalConversions}</Text>
          </BlockStack>
        </Card>
        
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" tone="subdued">Total Revenue</Text>
            <Text variant="heading2xl" as="p">${stats.totalRevenue.toFixed(2)}</Text>
          </BlockStack>
        </Card>
        
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" tone="subdued">Total Discount</Text>
            <Text variant="heading2xl" as="p">${stats.totalDiscount.toFixed(2)}</Text>
          </BlockStack>
        </Card>
        
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" tone="subdued">Avg Order Value</Text>
            <Text variant="heading2xl" as="p">${stats.averageOrderValue.toFixed(2)}</Text>
          </BlockStack>
        </Card>
      </InlineGrid>
      
      {/* Add conversion list, charts, etc. */}
    </BlockStack>
  );
}
```

---

## Testing Checklist

### Marketing Events API
- [ ] Campaign activation creates marketing event
- [ ] Marketing event ID stored in database
- [ ] UTM parameters generated correctly
- [ ] Event appears in Shopify Marketing dashboard
- [ ] Campaign deactivation updates marketing event

### Discount Code Tracking
- [ ] Webhook receives orders/create events
- [ ] Discount codes extracted correctly
- [ ] Campaign found by discount code
- [ ] Conversion record created
- [ ] Analytics dashboard shows conversions

### UTM Parameters
- [ ] Popup links include UTM parameters
- [ ] Parameters persist through navigation
- [ ] Shopify tracks UTM in customer journey
- [ ] Orders show UTM in customerJourneySummary

---

## Troubleshooting

### Marketing Event Not Appearing
- Check scopes are approved
- Verify marketing event ID is stored
- Check event_type is valid
- Ensure started_at is not in future

### Webhook Not Firing
- Verify webhook is registered in Shopify admin
- Check webhook URL is publicly accessible
- Test with `shopify app webhook trigger`
- Check app logs for errors

### Conversions Not Tracked
- Verify discount code format matches
- Check webhook handler is processing correctly
- Ensure campaign exists in database
- Check for duplicate order IDs

---

## Next Steps

After completing these phases:

1. **Add Engagement Tracking**: Track popup views, clicks, interactions
2. **Report to Marketing Events API**: Send daily engagement metrics
3. **Create Web Pixel Extension**: Advanced client-side tracking
4. **Build Analytics Dashboard**: Charts, graphs, insights
5. **Add A/B Testing**: Compare campaign variants

See `ANALYTICS_ATTRIBUTION_INTEGRATION.md` for complete details.

