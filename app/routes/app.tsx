import type { HeadersFunction, LinksFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, Link as ReactRouterLink } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { forwardRef, createContext, useContext } from "react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { BillingService } from "../domains/billing/services/billing.server";
import { PLAN_DEFINITIONS, type PlanTier, type PlanFeatures } from "../domains/billing/types/plan";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: polarisStyles }];

// =============================================================================
// BILLING CONTEXT
// =============================================================================

export interface BillingContextType {
  planTier: PlanTier;
  planName: string;
  features: PlanFeatures;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  canAccessFeature: (feature: keyof PlanFeatures) => boolean;
}

const BillingContext = createContext<BillingContextType | null>(null);

export function useBilling(): BillingContextType {
  const context = useContext(BillingContext);
  if (!context) {
    // Return a safe default for FREE plan if context is not available
    return {
      planTier: "FREE",
      planName: "Free",
      features: PLAN_DEFINITIONS.FREE.features,
      hasActiveSubscription: false,
      isTrialing: false,
      canAccessFeature: (feature) => PLAN_DEFINITIONS.FREE.features[feature],
    };
  }
  return context;
}

// =============================================================================
// LOADER
// =============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Get billing status with smart caching (syncs from Shopify only if cache is stale)
  const billingContext = await BillingService.getOrSyncBillingContext(admin, session.shop);
  const planDef = PLAN_DEFINITIONS[billingContext.planTier];

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    billing: {
      planTier: billingContext.planTier,
      planName: planDef.name,
      features: planDef.features,
      hasActiveSubscription: billingContext.hasActiveSubscription,
      isTrialing: billingContext.isTrialing,
    },
  };
};

// ...

type LinkProps = {
  children: React.ReactNode;
  url?: string;
  external?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, url = "", external, ...rest }, ref) => {
    if (external || url.startsWith("http")) {
      return (
        <a href={url} ref={ref} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }

    return (
      <ReactRouterLink to={url} ref={ref} {...rest}>
        {children}
      </ReactRouterLink>
    );
  }
);

Link.displayName = "Link";

export default function App() {
  const { apiKey, billing } = useLoaderData<typeof loader>();

  // Create billing context value with helper function
  const billingContextValue: BillingContextType = {
    ...billing,
    canAccessFeature: (feature: keyof PlanFeatures) => billing.features[feature],
  };

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Polaris Link type incompatibility */}
      <PolarisAppProvider i18n={en} linkComponent={Link as any}>
        <BillingContext.Provider value={billingContextValue}>
          <s-app-nav>
            <s-link href="/app">Dashboard</s-link>
            <s-link href="/app/analytics">Analytics</s-link>
            <s-link href="/app/campaigns/recipe">New campaign</s-link>
            <s-link href="/app/billing">Plans</s-link>
            <s-link href="/app/settings">Settings</s-link>
          </s-app-nav>
          <Outlet />
        </BillingContext.Provider>
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
