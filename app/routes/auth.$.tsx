import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

/**
 * Auth catch-all route
 *
 * This route handles Shopify OAuth callbacks and token exchange.
 * The actual setup logic (creating store record, welcome campaign, etc.)
 * is handled by the `afterAuth` hook in shopify.server.ts.
 *
 * With Shopify managed installation (use_legacy_install_flow = false):
 * 1. Shopify installs the app without calling our app
 * 2. When merchant opens the app, token exchange happens
 * 3. afterAuth hook is called → setup runs
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
