import { AppProvider } from "@shopify/shopify-app-react-router/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

/**
 * Auth Login Route
 *
 * Per Shopify App Store requirements:
 * - Apps must NOT request manual entry of myshopify.com URLs
 * - The login process should only happen through Shopify OAuth flow
 *
 * This route handles the OAuth initiation. If no shop is provided,
 * redirect to the App Store for proper installation.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If no shop provided, redirect to App Store - don't show manual login form
  if (!shop) {
    throw redirect("https://apps.shopify.com/revenue-boost");
  }

  // Proceed with normal OAuth login flow
  const errors = loginErrorMessage(await login(request));

  // If there are errors during OAuth, redirect to App Store
  if (errors.shop) {
    throw redirect("https://apps.shopify.com/revenue-boost");
  }

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions should not be needed since we don't show a form
  // But keep for backward compatibility if somehow called
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

/**
 * This component should not render in production as the loader redirects.
 * Kept as a fallback that shows a message directing to proper installation.
 */
export default function Auth() {
  return (
    <AppProvider embedded={false}>
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1>Revenue Boost</h1>
        <p style={{ marginTop: "20px", color: "#666" }}>
          Please install this app from the Shopify App Store or access it through your Shopify
          Admin.
        </p>
        <a
          href="https://apps.shopify.com/revenue-boost"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: "#008060",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Go to Shopify App Store
        </a>
      </div>
    </AppProvider>
  );
}
