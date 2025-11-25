# Revenue Boost - Storefront Popup Extension

This is a Shopify Theme App Extension that automatically loads the Revenue Boost popup system on all storefront pages.

## 🎯 Features

- **Zero Configuration**: Automatically loads on all pages via app embed
- **Smart Context Detection**: Captures page type, product info, cart data, customer info
- **Session Tracking**: Tracks visitor sessions and visit counts
- **Device Detection**: Identifies mobile, tablet, and desktop users
- **Preview Mode**: Supports campaign preview via URL parameter
- **Debug Mode**: Optional debug logging via shop metafield

## 📦 Structure

```
storefront-popup/
├── shopify.extension.toml    # Extension configuration
├── blocks/
│   └── popup-embed.liquid     # App block (REQUIRED - manually added by merchant)
├── assets/
│   └── popup-loader.bundle.js # Compiled popup runtime
└── locales/                   # Translations
```

## ⚠️ Important: Manual Installation Required

This extension uses an **App Block** that must be manually added to the theme by the merchant.

**Why?** Shopify does not allow automatic script injection via app embeds for security reasons.

**Installation:**
1. Shopify Admin → Online Store → Themes → Customize
2. Add block → Apps → "Revenue Boost Popups"
3. Enable popups → ON
4. Save

## 🔧 Configuration

### Shop Metafields

Merchants can configure the extension via shop metafields:

- `revenue_boost.enabled` (boolean) - Enable/disable the extension
- `revenue_boost.api_url` (string) - Custom API URL for development/staging
- `revenue_boost.debug` (boolean) - Enable debug logging

### Global Config Object

The extension creates a global `window.REVENUE_BOOST_CONFIG` object with:

```javascript
{
  // API Configuration
  apiUrl: '',                    // App proxy URL
  shopDomain: 'store.myshopify.com',
  debug: false,
  
  // Customer Data
  customerId: 123456,
  customerEmail: 'customer@example.com',
  customerTags: ['vip', 'subscriber'],
  
  // Cart Data
  cartToken: 'abc123',
  cartValue: 99.99,
  cartItemCount: 3,
  
  // Page Context
  pageType: 'product',
  pageUrl: '/products/example',
  locale: 'en',
  currency: 'USD',
  
  // Product Context (on product pages)
  productId: '789',
  productHandle: 'example-product',
  productTitle: 'Example Product',
  productPrice: 29.99,
  productType: 'Apparel',
  productVendor: 'Brand Name',
  productTags: ['new', 'sale'],
  
  // Collection Context (on collection pages)
  collectionId: '456',
  collectionHandle: 'summer-collection',
  collectionTitle: 'Summer Collection',
  
  // Session Tracking
  sessionId: 'session_123_abc',
  visitCount: 5,
  isReturningVisitor: true,
  deviceType: 'desktop',
  
  // Preview Mode
  previewMode: false,
  previewId: null,
  
  // Performance
  loadTime: 1699999999999
}
```

## 🚀 Development

### Building the Bundle

The popup runtime bundle needs to be compiled and placed in the `assets/` directory:

```bash
# Build the storefront bundle
npm run build:storefront

# The output should be copied to:
# extensions/storefront-popup/assets/popup-loader.bundle.js
```

### Testing Locally

```bash
# Start the dev server with extension
shopify app dev

# The extension will be available in the theme editor
# Add the block: Apps → "Revenue Boost Popups"
```

### Preview Mode

To preview a specific campaign, add the URL parameter:

```
https://store.myshopify.com/products/example?split_pop_preview=CAMPAIGN_ID
```

## 📝 Next Steps

1. ✅ Extension structure created
2. ✅ Auto-load configuration set up
3. ✅ Context detection implemented
4. ⏳ Build popup runtime bundle
5. ⏳ Add compiled bundle to assets
6. ⏳ Test in development store
7. ⏳ Deploy to production

## 🔗 Related Files

- Main app: `revenue-boost/app/`
- Popup components: `revenue-boost/app/domains/popups/`
- Campaign logic: `revenue-boost/app/domains/campaigns/`

