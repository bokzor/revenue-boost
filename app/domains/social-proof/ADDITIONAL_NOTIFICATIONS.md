# Additional Social Proof Notification Types

## 🎯 Implementation Roadmap

This document outlines additional high-converting notification types that can be added to the social proof system.

---

## ✅ Currently Implemented (Tier 1)

1. **Purchase Notifications** - Real Shopify orders (+15-25% conversion)
2. **Live Visitor Count** - Redis-based tracking (+10-18% conversion)
3. **Sales Count (24h)** - Product sales statistics (+12-20% conversion)
4. **Trending Products** - High view count alerts (+8-12% conversion)

---

## 🚧 Ready to Implement (Tier 2)

### 1. **Low Stock Alerts** (+15-25% conversion)

**Display**: "Only 3 left in stock!" or "Low stock - 2 remaining"

**Implementation**:
```typescript
// In shopify-data.server.ts
static async getLowStockNotification(params: GetLowStockParams) {
  const { storeId, productId, threshold = 10 } = params;
  
  // Query Shopify Inventory API
  const query = `
    query getInventory($productId: ID!) {
      product(id: $productId) {
        variants(first: 10) {
          edges {
            node {
              inventoryQuantity
            }
          }
        }
      }
    }
  `;
  
  // Sum inventory across variants
  const totalInventory = variants.reduce((sum, v) => sum + v.inventoryQuantity, 0);
  
  if (totalInventory > 0 && totalInventory <= threshold) {
    return {
      id: `low-stock-${productId}`,
      type: 'visitor', // Reuse visitor type
      count: totalInventory,
      context: 'left in stock!',
      trending: totalInventory <= 5,
      timestamp: Date.now(),
    };
  }
  
  return null;
}
```

**Conversion Impact**: Creates urgency without being pushy. Very effective for limited inventory items.

---

### 2. **Cart Activity Notifications** (+8-15% conversion)

**Display**: "3 people added this to cart in the last hour" or "Sarah just added this to cart"

**Implementation**:
```typescript
// In visitor-tracking.server.ts
static async trackCartActivity(params: {
  storeId: string;
  productId: string;
  visitorId: string;
}) {
  const redis = getRedis();
  if (!redis) return;
  
  const key = `${REDIS_PREFIXES.STATS}:cart:${storeId}:${productId}`;
  
  // Add to sorted set with timestamp
  await redis.zadd(key, Date.now(), visitorId);
  
  // Remove entries older than 1 hour
  const oneHourAgo = Date.now() - 3600000;
  await redis.zremrangebyscore(key, 0, oneHourAgo);
  
  // Set expiry
  await redis.expire(key, REDIS_TTL.HOUR);
}

static async getCartActivityNotification(params: GetCartActivityParams) {
  const redis = getRedis();
  if (!redis) return null;
  
  const key = `${REDIS_PREFIXES.STATS}:cart:${storeId}:${productId}`;
  const count = await redis.zcard(key);
  
  if (count < 2) return null;
  
  return {
    id: `cart-activity-${productId}`,
    type: 'visitor',
    count,
    context: 'added to cart in the last hour',
    trending: count > 5,
    timestamp: Date.now(),
  };
}
```

**Frontend Tracking**:
```typescript
// In storefront, listen for add-to-cart events
document.addEventListener('cart:add', (e) => {
  api.trackSocialProofEvent({
    eventType: 'add_to_cart',
    productId: e.detail.productId,
    shop: shopDomain,
  });
});
```

**Conversion Impact**: Shows active interest, creates FOMO.

---

### 3. **Recently Viewed Notifications** (+5-10% conversion)

**Display**: "15 people viewed this in the last hour"

**Implementation**: Similar to trending, but with different threshold and messaging.

```typescript
static async getRecentlyViewedNotification(params: {
  storeId: string;
  productId: string;
}) {
  const redis = getRedis();
  if (!redis) return null;
  
  const key = `${REDIS_PREFIXES.STATS}:views:${storeId}:${productId}`;
  const views = await redis.get(key);
  const viewCount = views ? parseInt(views, 10) : 0;
  
  if (viewCount < 10) return null;
  
  return {
    id: `recently-viewed-${productId}`,
    type: 'visitor',
    count: viewCount,
    context: 'viewed this in the last hour',
    trending: viewCount > 30,
    timestamp: Date.now(),
  };
}
```

---

## 📋 Future Enhancements (Tier 3)

### 4. **Recent Reviews** (+5-10% conversion)

**Display**: "Emily just left a 5-star review" or "Rated 4.8/5 by 234 customers"

**Requirements**:
- Shopify Product Reviews API integration
- Or third-party review app (Yotpo, Judge.me, etc.)

### 5. **Newsletter Sign-ups** (+3-8% conversion)

**Display**: "Sarah just joined our newsletter" or "Join 10,000+ subscribers"

**Requirements**:
- Track newsletter sign-ups
- Store count in Redis
- Display recent sign-ups

### 6. **Fast Shipping Timer** (+10-15% conversion)

**Display**: "Order in next 2 hours for same-day shipping" or "Order by 3 PM for next-day delivery"

**Implementation**:
```typescript
static getFastShippingNotification() {
  const now = new Date();
  const cutoffHour = 15; // 3 PM
  const currentHour = now.getHours();
  
  if (currentHour >= cutoffHour) {
    return null; // Too late for today
  }
  
  const hoursRemaining = cutoffHour - currentHour;
  
  return {
    id: 'fast-shipping',
    type: 'visitor',
    count: hoursRemaining,
    context: 'hours left for next-day delivery',
    trending: hoursRemaining <= 2,
    timestamp: Date.now(),
  };
}
```

### 7. **Discount Expiry Timer** (+12-18% conversion)

**Display**: "Sale ends in 3 hours!" or "Limited time: 20% off expires soon"

**Requirements**:
- Track active discount campaigns
- Calculate time remaining
- Display countdown

---

## 🎨 Custom Notification Templates

You can also create custom notification types for specific use cases:

### **Seasonal/Holiday Notifications**
- "🎄 Holiday Sale - 30% off everything!"
- "🎃 Halloween Special - Limited time only"

### **Milestone Notifications**
- "🎉 We just hit 10,000 customers!"
- "⭐ 5,000+ 5-star reviews"

### **Scarcity Notifications**
- "⚡ Flash Sale - Only 2 hours left"
- "🔥 Last chance - Sale ends tonight"

---

## 📊 A/B Testing Recommendations

Test different notification types to find what works best for your audience:

1. **Test 1**: Purchase vs Visitor Count
2. **Test 2**: Sales Count vs Low Stock
3. **Test 3**: Trending vs Cart Activity
4. **Test 4**: Position (bottom-left vs bottom-right)
5. **Test 5**: Display duration (3s vs 5s vs 7s)

---

## 🚀 Implementation Priority

**Phase 1** (Completed):
- ✅ Purchase notifications
- ✅ Visitor count
- ✅ Sales count
- ✅ Trending products

**Phase 2** (Next):
- 🚧 Low stock alerts
- 🚧 Cart activity
- 🚧 Recently viewed

**Phase 3** (Future):
- 📋 Recent reviews
- 📋 Newsletter sign-ups
- 📋 Fast shipping timer

---

## 💡 Best Practices

1. **Don't overwhelm** - Max 5 notifications per session
2. **Rotate variety** - Mix different notification types
3. **Match context** - Show product-specific notifications on product pages
4. **Test everything** - A/B test to find what converts best
5. **Monitor performance** - Track which notifications drive conversions
6. **Respect privacy** - Always anonymize customer data
7. **Be authentic** - Only show real data, never fake it

---

## 📈 Expected Conversion Lift

Based on industry benchmarks:

- **Tier 1 notifications**: +15-25% conversion lift
- **Tier 2 notifications**: +8-15% additional lift
- **Tier 3 notifications**: +5-10% additional lift

**Combined effect**: 30-50% total conversion improvement when properly implemented and tested.

---

**Ready to implement more notification types? Start with Tier 2 for maximum impact!**

