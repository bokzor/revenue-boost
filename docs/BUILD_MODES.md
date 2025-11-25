# Build Modes - Development vs Staging vs Production

## 🎯 Overview

Revenue Boost supports three build modes:
- **Development**: Optimized for local debugging (no minification)
- **Staging**: Optimized for staging environment (minified with debugging tools)
- **Production** (default): Fully optimized for deployment

## 🚀 Quick Start

### Development Mode (Recommended for local dev)

```bash
# Start development server with dev build
npm run dev

# Or build storefront only in dev mode
npm run build:storefront:dev
```

**Features:**
- ✅ Console.log kept
- ✅ Sourcemaps enabled
- ✅ No minification (readable code)
- ✅ Faster debugging
- ⚠️ Larger bundle size (~2x)

### Staging Mode (Recommended for staging environment)

```bash
# Build for staging
npm run build:storefront:staging
```

**Features:**
- ✅ Minified code
- ✅ Console.log kept (for debugging)
- ✅ Sourcemaps enabled (for debugging)
- ✅ Tree-shaking enabled
- ✅ Production-like performance
- ✅ Easier to debug than production

### Production Mode (Default for deployment)

```bash
# Build for production
npm run build
npm run build:storefront

# Or combined
npm run build && npm run build:storefront
```

**Features:**
- ✅ Minified code (-40% size)
- ✅ Console.log removed
- ✅ Sourcemaps disabled
- ✅ Tree-shaking enabled
- ✅ Fully optimized for performance
- ⚠️ Harder to debug

---

## 📊 Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Bundle Size** | 154 KB (main) | 65 KB (main) | 65 KB (main) |
| **Sourcemaps** | ✅ Yes (.map files) | ✅ Yes (.map files) | ❌ No |
| **Minification** | ❌ No | ✅ Yes | ✅ Yes |
| **Console.log** | ✅ Kept | ✅ Kept | ❌ Removed |
| **Debugger statements** | ✅ Kept | ✅ Kept | ❌ Removed |
| **Tree-shaking** | ❌ No | ✅ Yes | ✅ Yes |
| **Build Speed** | Fastest | Medium | Medium |
| **Code Readability** | High | Medium (minified) | Low (minified) |
| **Best For** | Local dev | Staging env | Production |

---

## 🔧 How It Works

### Environment Variables

The build mode is controlled by the `BUILD_MODE` environment variable:

```bash
# Development
BUILD_MODE=development npm run build:storefront

# Staging
BUILD_MODE=staging npm run build:storefront

# Production (default)
npm run build:storefront
```

### Vite Config

The main app build (Vite) detects the mode automatically:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development' || 
                      process.env.BUILD_MODE === 'development';
```

### Storefront Build Script

The storefront build script reads `BUILD_MODE`:

```javascript
const BUILD_MODE = process.env.BUILD_MODE || 'production';
const isDevelopment = BUILD_MODE === 'development';
```

---

## 📝 Examples

### Example 1: Local Development

```bash
# Start dev server (uses dev build automatically)
npm run dev

# Output:
# 🔧 Build Mode: DEVELOPMENT
# ⚠️  Development build: console.log kept, no minification, sourcemaps enabled
# Main bundle: 154.3 KB
```

### Example 2: Production Build

```bash
# Build for production
npm run build:storefront

# Output:
# 🔧 Build Mode: PRODUCTION
# ✅ Production build: minified, console.log removed, optimized
# Main bundle: 64.8 KB
```

### Example 3: Staging Build

```bash
# Build for staging
npm run build:storefront:staging

# Output:
# 🔧 Build Mode: STAGING
# 🔶 Staging build: console.log kept, minified, sourcemaps enabled
# Main bundle: 65.2 KB
```

### Example 4: Manual Mode Override

```bash
# Force development build
BUILD_MODE=development npm run build:storefront

# Force staging build
BUILD_MODE=staging npm run build:storefront

# Force production build
BUILD_MODE=production npm run build:storefront
```

---

## 🐛 Debugging Tips

### In Development Mode

1. **Use browser DevTools**
   - Sourcemaps are enabled
   - Original code is visible
   - Breakpoints work perfectly

2. **Console.log freely**
   - All logs are preserved
   - No need to remove them

3. **Readable stack traces**
   - Error messages show original code
   - Easy to identify issues

### In Production Mode

1. **Use server-side logging**
   - Console.log is removed
   - Use server logs instead

2. **Monitor with tools**
   - Sentry for error tracking
   - LogRocket for session replay

3. **Test locally first**
   - Build in dev mode to debug
   - Then build in prod mode to verify

---

## ⚡ Performance Impact

### Development Build
- **Size**: ~681 KB total (if all bundles loaded)
- **Parse time**: Slower (unminified)
- **Network**: More data to download
- **Best for**: Local development only

### Production Build
- **Size**: ~323 KB total (if all bundles loaded)
- **Parse time**: Faster (minified)
- **Network**: Less data to download
- **Best for**: Production deployment

**Savings**: ~52% smaller in production! 🎉

---

## 🎯 Best Practices

1. **Always use dev mode locally**
   ```bash
   npm run dev  # Uses dev build automatically
   ```

2. **Use staging mode for staging environment**
   ```bash
   npm run build:storefront:staging
   ```
   - Allows debugging in production-like environment
   - Console.log and sourcemaps available
   - Performance similar to production

3. **Always use prod mode for production deployment**
   ```bash
   npm run build && npm run build:storefront
   ```
   - Fully optimized
   - No debugging overhead
   - Smallest bundle size

4. **Test all modes before deploying**
   ```bash
   # Test in dev mode
   npm run dev

   # Test in staging mode
   npm run build:storefront:staging && npm start

   # Test in prod mode
   npm run build && npm run build:storefront && npm start
   ```

5. **Don't commit built bundles**
   - All bundles are gitignored
   - Built during deployment

---

## 📚 Related Documentation

- [BUILD_OPTIMIZATIONS.md](../BUILD_OPTIMIZATIONS.md) - Detailed optimization guide
- [WARP.md](../WARP.md) - Development commands reference
- [package.json](../package.json) - All available scripts

---

**Last Updated**: 2025-11-22

