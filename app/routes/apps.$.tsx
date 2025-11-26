/**
 * App Proxy Catch-All Route
 * Handles all /apps/* requests and routes them appropriately
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const splat = params["*"] || "";

  console.log(`[App Proxy] Catch-all route hit: ${url.pathname}`);
  console.log(`[App Proxy] Splat param: ${splat}`);
  console.log(`[App Proxy] Full params:`, params);

  // Check if this is a revenue-boost request
  if (splat.startsWith("revenue-boost/")) {
    const path = splat.replace("revenue-boost/", "");
    console.log(`[App Proxy] Revenue Boost path: ${path}`);

    // Handle bundles
    if (path.startsWith("bundles/")) {
      const bundleName = path.replace("bundles/", "").replace(/\?.*$/, ""); // Remove query string
      console.log(`[App Proxy] ⚡ Bundle request: ${bundleName}`);

      try {
        // Import and call the bundle loader
        const bundleModule = await import("./apps.revenue-boost.bundles.$bundleName");
        console.log(`[App Proxy] ✅ Bundle module loaded`);
        return bundleModule.loader({
          request,
          params: { bundleName },
          context: {},
          unstable_pattern: "",
        });
      } catch (error) {
        console.error(`[App Proxy] ❌ Failed to load bundle module:`, error);
        return data({ error: "Failed to load bundle handler" }, { status: 500 });
      }
    }

    // Handle assets (images, etc.)
    if (path.startsWith("assets/")) {
      const assetPath = path.replace("assets/", "").replace(/\?.*$/, ""); // Remove query string
      console.log(`[App Proxy] 🖼️  Asset request: ${assetPath}`);

      try {
        // Import and call the asset loader
        const assetModule = await import("./apps.revenue-boost.assets.$");
        console.log(`[App Proxy] ✅ Asset module loaded`);
        return assetModule.loader({
          request,
          params: { "*": assetPath },
          context: {},
          unstable_pattern: "",
        });
      } catch (error) {
        console.error(`[App Proxy] ❌ Failed to load asset module:`, error);
        return data({ error: "Failed to load asset handler" }, { status: 500 });
      }
    }

    // Handle API routes
    if (path.startsWith("api/")) {
      console.log(`[App Proxy] API request: ${path}`);

      if (path === "api/health") {
        const { loader: healthLoader } = await import("./apps.revenue-boost.api.health");
        return healthLoader();
      }

      if (path === "api/campaigns/active") {
        const { loader: apiLoader } = await import("./apps.revenue-boost.api.campaigns.active");
        return apiLoader({ request, params } as LoaderFunctionArgs);
      }

      if (path === "api/inventory") {
        const { loader: inventoryLoader } = await import("./apps.revenue-boost.api.inventory");
        return inventoryLoader({ request, params } as LoaderFunctionArgs);
      }

      if (path === "api/upsell-products") {
        const { loader: upsellLoader } = await import("./apps.revenue-boost.api.upsell-products");
        return upsellLoader({ request, params } as LoaderFunctionArgs);
      }

      if (path === "api/social-proof/track") {
        const { action: apiAction } = await import("./apps.revenue-boost.api.social-proof.track");
        return apiAction({ request, params } as LoaderFunctionArgs);
      }
    }
  }

  return data({ error: "Not found" }, { status: 404 });
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const splat = params["*"] || "";

  console.log(`[App Proxy] Action catch-all: ${url.pathname}`);

  // Check if this is a revenue-boost request
  if (splat.startsWith("revenue-boost/")) {
    const path = splat.replace("revenue-boost/", "");

    // Handle API POST routes
    if (path === "api/social-proof/track") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.social-proof.track");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/popups/scratch-card") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.popups.scratch-card");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/popups/spin-win") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.popups.spin-win");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/leads/submit") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.leads.submit");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/discounts/issue") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.discounts.issue");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/cart/email-recovery") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.cart.email-recovery");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/analytics/track") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.analytics.track");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (path === "api/challenge/request") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.challenge.request");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }
  }

  return data({ error: "Not found" }, { status: 404 });
}
