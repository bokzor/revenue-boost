import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect } from "react";

export default function App() {
  // Load App Bridge script on client-side only to avoid hydration mismatch
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get("embedded") === "1";
    const host = urlParams.get("host");

    let isMockEnvironment = false;

    // Detect mock environment
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

    // Load appropriate App Bridge
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
    } else {
      console.log("[Mock-Bridge] Loading Real Shopify App Bridge");
      const script = document.createElement("script");
      script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
      document.head.appendChild(script);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
