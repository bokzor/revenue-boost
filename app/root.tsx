import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "react-router";
import { useEffect } from "react";
import { initSentryClient } from "./lib/sentry.client";

export async function loader() {
  return {
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN || "",
      NODE_ENV: process.env.NODE_ENV || "development",
    },
  };
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  // Initialize Sentry on client side
  useEffect(() => {
    initSentryClient();
  }, []);

  // Load App Bridge script on client-side only to avoid hydration mismatch
  useEffect(() => {
    // Always load the real Shopify App Bridge in production
    // Mock bridge is only for local development testing
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      const urlParams = new URLSearchParams(window.location.search);
      const isEmbedded = urlParams.get("embedded") === "1";
      const host = urlParams.get("host");

      let isMockEnvironment = false;

      // Detect mock environment (only in development)
      if (isEmbedded && host) {
        try {
          const decodedHost = atob(host);
          if (
            decodedHost.includes("localhost") ||
            decodedHost.includes("mock") ||
            window.location.hostname === "localhost"
          ) {
            isMockEnvironment = true;
          }
        } catch (e) {
          // Ignore decode errors
        }
      }

      // Load Mock App Bridge only in development
      if (isMockEnvironment) {
        console.log("[Mock-Bridge] Loading Mock App Bridge from http://localhost:3080/app-bridge.js");
        const script = document.createElement("script");
        script.src = "http://localhost:3080/app-bridge.js";
        script.onerror = () => {
          console.warn("[Mock-Bridge] Failed to load mock App Bridge, falling back to real");
          const fallback = document.createElement("script");
          fallback.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
          document.head.appendChild(fallback);
        };
        document.head.appendChild(script);
        return;
      }
    }

    // Load real Shopify App Bridge (production and non-mock development)
    const script = document.createElement("script");
    script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
    document.head.appendChild(script);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {ENV.SENTRY_DSN && <meta name="sentry-dsn" content={ENV.SENTRY_DSN} />}
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
      </body>
    </html>
  );
}
