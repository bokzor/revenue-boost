# Social Proof Notifications - Implementation Guide

## 🎯 Overview

This implementation provides **real-time social proof notifications** that significantly boost conversions by displaying live activity on your store.

### ✅ Implemented Features

1. **Live Purchase Notifications** - Real Shopify orders with anonymized customer data
2. **Visitor Count Tracking** - Redis-based real-time visitor counting
3. **Sales Statistics** - 24-hour sales counts per product
4. **Smart Polling** - 60-second updates without WebSocket complexity
5. **Privacy-Compliant** - Anonymized names, GDPR-friendly
6. **Intelligent Caching** - 30-second Redis cache for performance

### 📊 Notification Types (Ranked by Conversion Impact)

#### **Tier 1 - Highest Impact** ✅ Implemented

- ✅ **Purchase Notifications** (+15-25% conversion)
- ✅ **Live Visitor Count** (+10-18% conversion)
- ✅ **Sales Count (24h)** (+12-20% conversion)

#### **Tier 2 - High Impact** 🚧 Partially Implemented

- ✅ **Trending Products** (+8-12% conversion)
- 🚧 **Cart Activity** (+8-15% conversion) - TODO
- 🚧 **Low Stock Alerts** (+15-25% conversion) - TODO

#### **Tier 3 - Good Impact** 📋 Planned

- 📋 **Recent Reviews** (+5-10% conversion)
- 📋 **Newsletter Sign-ups** (+3-8% conversion)
- 📋 **Fast Shipping Timer** (+10-15% conversion)

---

## 🏗️ Architecture

### API Endpoints

```
GET  /api/social-proof/:campaignId
     - Fetches notifications for a campaign
     - Query params: shop, productId, pageUrl
     - Cached for 30 seconds

POST /api/social-proof/track
     - Tracks visitor activity (page views, cart events)
     - Used for real-time visitor counting
```

### Service Layer

```
app/domains/social-proof/services/
├── social-proof.server.ts       # Main orchestration service
├── shopify-data.server.ts       # Fetches real Shopify data
└── visitor-tracking.server.ts   # Redis-based visitor tracking
```

### Data Flow

```
Storefront (Client)
    ↓
    ├─→ Track page view → /api/social-proof/track → Redis
    │
    └─→ Fetch notifications → /api/social-proof/:campaignId
            ↓
        Social Proof Service
            ↓
        ├─→ Shopify Data Service → Shopify Admin API → Orders
        ├─→ Visitor Tracking Service → Redis → Live counts
        └─→ Cache in Redis (30s TTL)
            ↓
        Return notifications → Client
            ↓
        Display with rotation (60s polling)
```

---

## 🚀 Usage

### 1. Create a Social Proof Campaign

```typescript
const campaign = await CampaignService.createCampaign(storeId, {
  name: "Social Proof - Homepage",
  templateType: "SOCIAL_PROOF",
  goal: "INCREASE_TRUST",
  status: "ACTIVE",
  contentConfig: {
    // Notification Types
    enablePurchaseNotifications: true,
    enableVisitorNotifications: true,
    enableSalesCountNotifications: true,
    enableTrendingNotifications: true,

    // Display Settings
    position: "bottom-left",
    displayDuration: 5,
    rotationInterval: 8,
    maxNotificationsPerSession: 5,

    // Data Settings
    purchaseLookbackHours: 48,
    minVisitorCount: 5,

    // Privacy
    anonymizeCustomerNames: true,
    showCustomerLocation: true,
  },
});
```

### 2. Frontend Integration

The social proof popup automatically:

- Fetches notifications from API
- Tracks visitor views
- Polls for updates every 60 seconds
- Rotates notifications every 8 seconds
- Auto-dismisses after 5 seconds

---

## 📈 Performance Optimizations

### Caching Strategy

- **API responses**: 30 seconds (HTTP Cache-Control)
- **Redis visitor counts**: 5 minutes TTL
- **Shopify order data**: 30 seconds in Redis
- **Trending data**: 1 hour TTL

### Polling vs WebSocket

We chose **polling** over WebSockets because:

- ✅ Simpler to scale (stateless)
- ✅ Works through Shopify app proxy
- ✅ Better caching with CDN
- ✅ 60-second updates are sufficient for social proof
- ✅ Lower server load with smart caching

---

## 🔒 Privacy & Compliance

### GDPR-Compliant Features

- ✅ Customer names anonymized ("John D.")
- ✅ No email addresses displayed
- ✅ Location limited to city/state
- ✅ Configurable data retention
- ✅ No PII stored in Redis

### Anonymization Logic

```typescript
// "John Smith" → "John S."
const anonymizedName = `${firstName} ${lastName.charAt(0)}.`;
```

---

## 🧪 Testing

### Test with Mock Data

```typescript
<SocialProofPopup
  campaignId="test-campaign"
  notifications={[
    {
      id: "test-1",
      type: "purchase",
      customerName: "Test User",
      location: "New York, NY",
      productName: "Test Product",
      timeAgo: "2 minutes ago",
      verified: true,
      timestamp: Date.now(),
    },
  ]}
/>
```

### Test with Real Data

1. Create test orders in Shopify
2. Visit product pages to generate visitor counts
3. Check Redis for visitor data:
   ```bash
   redis-cli
   KEYS visitor:*
   GET visitor:product:store123:product456
   ```

---

## 🔧 Configuration Options

See `app/domains/storefront/notifications/social-proof/types.ts` for full configuration interface.

---

## 📝 TODO / Future Enhancements

- [ ] Implement low stock alerts (inventory API)
- [ ] Add cart activity tracking
- [ ] Add review notifications (Shopify Product Reviews API)
- [ ] Add fast shipping timer
- [ ] WebSocket support (optional, for high-traffic stores)
- [ ] A/B testing for notification types
- [ ] Analytics dashboard for social proof performance
