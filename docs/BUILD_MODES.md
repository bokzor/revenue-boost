# Build Modes - Development vs Production

## 🎯 Overview

Revenue Boost supports two build modes:
- **Production** (default): Optimized for deployment
- **Development**: Optimized for debugging

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
- ✅ Tree-shaking enabled
- ✅ Optimized for performance
- ⚠️ Harder to debug

---

## 📊 Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **Bundle Size** | 154 KB (main) | 65 KB (main) |
| **Sourcemaps** | ✅ Yes (.map files) | ❌ No |
| **Minification** | ❌ No | ✅ Yes |
| **Console.log** | ✅ Kept | ❌ Removed |
| **Debugger statements** | ✅ Kept | ❌ Removed |
| **Tree-shaking** | ❌ No | ✅ Yes |
| **Build Speed** | Faster | Slower |
| **Code Readability** | High | Low (minified) |
| **Best For** | Local dev, debugging | Production, deployment |

---

## 🔧 How It Works

### Environment Variables

The build mode is controlled by the `BUILD_MODE` environment variable:

```bash
# Development
BUILD_MODE=development npm run build:storefront

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

### Example 3: Manual Mode Override

```bash
# Force development build
BUILD_MODE=development npm run build:storefront

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

2. **Always use prod mode for deployment**
   ```bash
   npm run build && npm run build:storefront
   ```

3. **Test both modes before deploying**
   ```bash
   # Test in dev mode
   npm run dev
   
   # Test in prod mode
   npm run build && npm start
   ```

4. **Don't commit dev builds**
   - Dev builds are larger
   - Not optimized for production

---

## 📚 Related Documentation

- [BUILD_OPTIMIZATIONS.md](../BUILD_OPTIMIZATIONS.md) - Detailed optimization guide
- [WARP.md](../WARP.md) - Development commands reference
- [package.json](../package.json) - All available scripts

---

**Last Updated**: 2025-11-22

