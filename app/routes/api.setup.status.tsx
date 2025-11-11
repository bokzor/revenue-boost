/**
 * Setup Status API
 *
 * Checks if the app is properly set up:
 * - Theme extension enabled
 * - Metafield set
 * - Welcome campaign created
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!session?.shop) {
      return data({ error: "No shop session" }, { status: 401 });
    }

    const status = {
      shop: session.shop,
      themeExtensionEnabled: false,
      metafieldSet: false,
      welcomeCampaignCreated: false,
      storeCreated: false,
      appProxyOk: false,
    };

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: session.shop },
    });

    status.storeCreated = !!store;

    // Check if theme extension is enabled
    const themesQuery = `
      query {
        themes(first: 1, query: "role:main") {
          nodes {
            id
            name
          }
        }
      }
    `;

    const themesResponse = await admin.graphql(themesQuery);
    const themesData = await themesResponse.json();
    const themeId = themesData.data?.themes?.nodes?.[0]?.id;

    if (themeId) {
      // Check if app embed is enabled
      const appEmbedQuery = `
        query($themeId: ID!) {
          appEmbed(themeId: $themeId) {
            id
            enabled
          }
        }
      `;

      const appEmbedResponse = await admin.graphql(appEmbedQuery, {
        variables: { themeId },
      });

      const appEmbedData = await appEmbedResponse.json();
      status.themeExtensionEnabled = appEmbedData.data?.appEmbed?.enabled || false;
    }

    // Check if App Proxy is reachable via storefront path
    try {
      const proxyTestUrls = [
        `https://${session.shop}/apps/revenue-boost/bundles/popup-loader.bundle.js`,
        `https://${session.shop}/apps/revenue-boost/bundles/newsletter.bundle.js`,
      ];

      for (const url of proxyTestUrls) {
        const resp = await fetch(url, { method: "HEAD" });
        if (resp.ok) {
          status.appProxyOk = true;
          break;
        }
      }
    } catch (err) {
      // leave as false
    }

    // Check if metafield is set
    const metafieldQuery = `
      query {
        shop {
          metafield(namespace: "revenue_boost", key: "api_url") {
            value
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(metafieldQuery);
    const metafieldData = await metafieldResponse.json();
    status.metafieldSet = !!metafieldData.data?.shop?.metafield?.value;

    // Check if welcome campaign exists
    if (store) {
      const welcomeCampaign = await prisma.campaign.findFirst({
        where: {
          storeId: store.id,
          name: "Welcome Popup",
        },
      });

      status.welcomeCampaignCreated = !!welcomeCampaign;
    }

    return data({
      success: true,
      status,
      setupComplete: status.themeExtensionEnabled && status.metafieldSet && status.welcomeCampaignCreated,
    });
  } catch (error) {
    console.error("[Setup Status] Error:", error);
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

