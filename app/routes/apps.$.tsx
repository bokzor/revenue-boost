/**
 * App Proxy Catch-All Route
 * Handles all /apps/* requests and routes them appropriately
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { logger } from "~/lib/logger.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const splat = params["*"] || "";

  logger.debug({ pathname: url.pathname, splat, params }, "[App Proxy] Catch-all route hit");

  // Check if this is a revenue-boost request
  if (splat.startsWith("revenue-boost/")) {
    const path = splat.replace("revenue-boost/", "");
    logger.debug({ path }, "[App Proxy] Revenue Boost path");

    // Handle bundles
    if (path.startsWith("bundles/")) {
      const bundleName = path.replace("bundles/", "").replace(/\?.*$/, ""); // Remove query string
      logger.debug({ bundleName }, "[App Proxy] Bundle request");

      try {
        // Import and call the bundle loader
        const bundleModule = await import("./apps.revenue-boost.bundles.$bundleName");
        logger.debug("[App Proxy] Bundle module loaded");
        return bundleModule.loader({
          request,
          params: { bundleName },
          context: {},
          unstable_pattern: "",
        });
      } catch (error) {
        logger.error({ error }, "[App Proxy] Failed to load bundle module");
        return data({ error: "Failed to load bundle handler" }, { status: 500 });
      }
    }

    // Handle assets (images, etc.)
    if (path.startsWith("assets/")) {
      const assetPath = path.replace("assets/", "").replace(/\?.*$/, ""); // Remove query string
      logger.debug({ assetPath }, "[App Proxy] Asset request");

      try {
        // Import and call the asset loader
        const assetModule = await import("./apps.revenue-boost.assets.$");
        logger.debug("[App Proxy] Asset module loaded");
        return assetModule.loader({
          request,
          params: { "*": assetPath },
          context: {},
          unstable_pattern: "",
        });
      } catch (error) {
        logger.error({ error }, "[App Proxy] Failed to load asset module");
        return data({ error: "Failed to load asset handler" }, { status: 500 });
      }
    }

    // Handle API routes
    if (path.startsWith("api/")) {
      // Strip query string for route matching (query params are in request.url)
      const apiPath = path.replace(/\?.*$/, "");
      logger.debug({ apiPath }, "[App Proxy] API request");

      if (apiPath === "api/health") {
        const { loader: healthLoader } = await import("./apps.revenue-boost.api.health");
        return healthLoader();
      }

      if (apiPath === "api/campaigns/active") {
        const { loader: apiLoader } = await import("./apps.revenue-boost.api.campaigns.active");
        return apiLoader({ request, params } as LoaderFunctionArgs);
      }

      if (apiPath === "api/inventory") {
        const { loader: inventoryLoader } = await import("./apps.revenue-boost.api.inventory");
        return inventoryLoader({ request, params } as LoaderFunctionArgs);
      }

      if (apiPath === "api/upsell-products") {
        const { loader: upsellLoader } = await import("./apps.revenue-boost.api.upsell-products");
        return upsellLoader({ request, params } as LoaderFunctionArgs);
      }

      if (apiPath === "api/social-proof/track") {
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

  logger.debug({ pathname: url.pathname }, "[App Proxy] Action catch-all");

  // Check if this is a revenue-boost request
  if (splat.startsWith("revenue-boost/")) {
    const path = splat.replace("revenue-boost/", "");
    // Strip query string for route matching (query params are in request.url)
    const apiPath = path.replace(/\?.*$/, "");

    // Handle API POST routes
    if (apiPath === "api/social-proof/track") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.social-proof.track");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/popups/scratch-card") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.popups.scratch-card");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/popups/spin-win") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.popups.spin-win");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/leads/submit") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.leads.submit");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/discounts/issue") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.discounts.issue");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/cart/email-recovery") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.cart.email-recovery");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }

    if (apiPath === "api/analytics/track") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.analytics.track");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }
    if (path === "api/analytics/frequency") {
      const { action: apiAction } = await import("./apps.revenue-boost.api.analytics.frequency");
      return apiAction({ request, params } as LoaderFunctionArgs);
    }
  }

  return data({ error: "Not found" }, { status: 404 });
}
