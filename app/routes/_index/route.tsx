import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

/**
 * Root Route Handler
 *
 * This route handles the root path of the app. Per Shopify App Store requirements:
 * - Apps must NOT request manual entry of myshopify.com URLs
 * - Apps should only be accessed through proper OAuth flow from Shopify Admin
 *
 * If a shop parameter is present, redirect to the app.
 * If no shop parameter, redirect to Shopify App Store listing or show a message.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // If shop param is present, redirect to the app (OAuth flow will handle auth)
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  // No shop param - this means user accessed the app URL directly
  // Redirect to Shopify App Store for proper installation
  // Note: Replace with your actual App Store URL once published
  throw redirect("https://apps.shopify.com/revenue-boost");
};

/**
 * This component should never render because the loader always redirects.
 * It's kept as a fallback for edge cases.
 */
export default function RootRedirect() {
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1>Revenue Boost</h1>
      <p style={{ marginTop: "20px", color: "#666" }}>
        Please install this app from the Shopify App Store or access it through your Shopify Admin.
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
  );
}
