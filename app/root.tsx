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

  // Note: App Bridge is automatically loaded by the <AppProvider> component
  // from @shopify/shopify-app-react-router/react in app/routes/app.tsx
  // The AppProvider handles injecting the App Bridge script with the correct
  // meta tag and CDN script, which automatically uses session token authentication.

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {ENV.SENTRY_DSN && <meta name="sentry-dsn" content={ENV.SENTRY_DSN} />}
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css" />
        {/* Preload EmptyState images to prevent CLS when images load */}
        <link
          rel="preload"
          href="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          as="image"
        />
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
