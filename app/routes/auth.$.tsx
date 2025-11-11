
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { setupAppOnInstall } from "~/lib/app-setup.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Run setup after successful authentication (idempotent - safe to run multiple times)
  if (session) {
    // Run setup in background - don't block auth flow
    setupAppOnInstall(admin, session.shop).catch((error) => {
      console.error("[Auth] Setup failed (non-blocking):", error);
    });
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
