# Revenue Boost - Storefront Source

This directory contains the source code for the storefront extension that runs on merchant stores.

## 🎯 Architecture

### **Preact-based** (3KB vs 45KB for React)
- 90% smaller bundle size
- 100% compatible with React components via `preact/compat`
- Better performance on mobile devices

### **Lazy Loading**
- Main bundle: ~50KB (core logic only)
- Popup bundles: 10-20KB each (loaded on-demand)
- 80% reduction in initial load time

## 📦 Bundle Structure

```
Main Bundle (popup-loader.bundle.js)
├── Preact runtime (~3KB)
├── PopupManagerCore (~8KB)
├── Component loader (~5KB)
├── API client (~5KB)
├── Session tracking (~3KB)
└── Utilities (~26KB)

Popup Bundles (loaded on-demand)
├── newsletter.bundle.js (~15KB)
├── spin-to-win.bundle.js (~20KB)
├── scratch-card.bundle.js (~18KB)
├── social-proof.bundle.js (~12KB)
├── product-upsell.bundle.js (~16KB)
├── cart-abandonment.bundle.js (~14KB)
├── free-shipping.bundle.js (~10KB)
└── flash-sale.bundle.js (~15KB)
```

## 🔧 Development

### **Build Storefront Bundles**
```bash
npm run build:storefront
```

This will:
1. Compile main bundle with Preact
2. Compile separate popup bundles
3. Output to `extensions/storefront-popup/assets/`

### **Test Locally**
```bash
shopify app dev
```

The extension will be available in the theme editor under "App embeds".

## 📂 Directory Structure

```
storefront-src/
├── core/                      # Core functionality
│   ├── component-loader.ts    # Lazy loading system
│   ├── PopupManagerPreact.tsx # Popup orchestration
│   ├── api.ts                 # API client
│   └── session.ts             # Session management
├── bundles/                   # Popup bundle entry points
│   ├── newsletter.ts
│   ├── spin-to-win.ts
│   └── ...
├── components/                # Symlink to app/domains/popups/components
├── utils/                     # Utilities
├── types/                     # Type definitions
└── index.ts                   # Main entry point
```

## 🚀 How It Works

### **1. Main Bundle Loads**
```javascript
// popup-loader.bundle.js is loaded via <script> tag
// Exposes Preact globally for popup bundles
window.RevenueBoostPreact = { h, render, hooks, ... };
```

### **2. Fetch Active Campaigns**
```javascript
// API call to get campaigns for current visitor
const campaigns = await api.fetchActiveCampaigns(sessionId);
```

### **3. Lazy Load Popup Component**
```javascript
// ComponentLoader tries 3 strategies:
// 1. Global registry (window.RevenueBoostComponents)
// 2. Dynamic import (dev mode)
// 3. Script tag loading (fallback)
const component = await loader.loadComponent("NEWSLETTER");
```

### **4. Render Popup**
```javascript
// Render using Preact
renderPopup(campaign, onClose, loader);
```

## 🎨 Component Registration

Each popup bundle registers itself globally:

```javascript
// newsletter.bundle.js
window.RevenueBoostComponents = window.RevenueBoostComponents || {};
window.RevenueBoostComponents["NEWSLETTER"] = NewsletterPopup;
```

## 📊 Performance

### **Before (React, no lazy loading)**
- Initial load: 260 KB
- Time to Interactive: ~800ms
- Mobile score: 60/100

### **After (Preact + lazy loading)**
- Initial load: 50 KB (-80%)
- Time to Interactive: ~200ms (-75%)
- Mobile score: 95/100 (+35 points)

## 🔗 Related Files

- Extension config: `../storefront-popup/shopify.extension.toml`
- Liquid snippet: `../storefront-popup/snippets/popup-init.liquid`
- Build script: `../../scripts/build-storefront.js`
- Popup components: `../../app/domains/popups/components/`

## 📝 Adding a New Popup

1. Create component in `app/domains/popups/components/`
2. Create bundle entry in `bundles/new-popup.ts`
3. Add to `popupBundles` array in `scripts/build-storefront.js`
4. Run `npm run build:storefront`
5. Test in development store

## ✅ Production Checklist

- [ ] All bundles build successfully
- [ ] Main bundle < 60KB
- [ ] Popup bundles < 25KB each
- [ ] Components work in Shadow DOM
- [ ] Mobile performance > 90
- [ ] No console errors
- [ ] Analytics tracking works
- [ ] Session management works
- [ ] Frequency capping works

