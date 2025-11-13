import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";
import { authenticateWithMockBridge } from "../lib/mock-bridge-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Support both real Shopify and mock-bridge authentication
  const auth = await authenticateWithMockBridge(request, authenticate.admin);

  if (auth.isMock) {
    console.log("[Mock-Bridge] Mock session active for shop:", auth.session.shop);
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={en}>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/campaigns">Campaigns</s-link>
          <s-link href="/app/campaigns/new">New campaign</s-link>
          <s-link href="/app/setup">Setup Status</s-link>
          <s-link href="/app/additional">Additional page</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
