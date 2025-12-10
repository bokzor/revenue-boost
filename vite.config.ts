import { reactRouter } from "@react-router/dev/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Detect build mode
const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.BUILD_MODE === "development";
const isProduction = process.env.NODE_ENV === "production";

// When running under Storybook (storybook dev / storybook build),
// disable the React Router Vite plugin to avoid the
// "The React Router Vite plugin requires the use of a Vite config file" error.
// See: https://github.com/storybookjs/storybook/discussions/25519
const isStorybook = process.argv[1]?.includes("storybook");

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the Vite server.
// The CLI will eventually stop passing in HOST,
// so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

	// Use staging env directory when TEST_MODE is enabled
const envDir = process.env.TEST_MODE === "true" ? "./env-staging" : undefined;

export default defineConfig({
  // When TEST_MODE is set, load env from env-staging directory instead of root
  envDir,
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    !isStorybook && reactRouter(),
    tsconfigPaths(),
    // Sentry source map upload (only in production builds with auth token)
    isProduction && process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          org: process.env.SENTRY_ORG || "revenue-boost",
          project: process.env.SENTRY_PROJECT || "revenue-boost",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ["./build/**/*.map"],
          },
          release: {
            name: process.env.APP_VERSION || `release-${Date.now()}`,
          },
        })
      : null,
  ],
  build: {
    assetsInlineLimit: 0,
    sourcemap: true, // Enable sourcemaps for Sentry (deleted after upload in prod)
    minify: isDevelopment ? false : "esbuild",
    target: "es2020",
    cssMinify: !isDevelopment,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react"],
  },
}) satisfies UserConfig;
