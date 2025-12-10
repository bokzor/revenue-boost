import { PrismaClient } from "@prisma/client";
import "./load-staging-env";

const STORE_DOMAIN = "revenue-boost-staging.myshopify.com";
const STORE_PASSWORD = process.env.STORE_PASSWORD || "a";
const STAGING_CLOUD_RUN_URL = "https://revenueboost-staging-532516069850.us-central1.run.app";

interface PreflightResult {
  success: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

/**
 * Pre-flight checks for E2E staging tests.
 * 
 * Verifies:
 * 1. Staging store exists in the staging database
 * 2. App Proxy is responding correctly (staging app is installed)
 * 3. Direct backend is reachable
 * 
 * Run this before E2E tests to catch configuration issues early.
 */
export async function runPreflightChecks(): Promise<PreflightResult> {
  const checks: PreflightResult["checks"] = [];
  let prisma: PrismaClient | null = null;

  console.log("\n🔍 Running E2E Pre-flight Checks...\n");

  // Check 1: Database connection and store existence
  try {
    prisma = new PrismaClient();
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: STORE_DOMAIN },
    });

    if (store) {
      checks.push({
        name: "Staging Store in Database",
        passed: true,
        message: `Store found: ${store.id} (created: ${store.createdAt.toISOString()})`,
      });
    } else {
      checks.push({
        name: "Staging Store in Database",
        passed: false,
        message: `Store "${STORE_DOMAIN}" not found in staging database.\n` +
          `   → The staging app needs to be installed on the store.\n` +
          `   → Visit the staging app in Shopify Partners to install it.`,
      });
    }
  } catch (error) {
    checks.push({
      name: "Staging Store in Database",
      passed: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    await prisma?.$disconnect();
  }

  // Check 2: Direct backend reachability
  try {
    const directUrl = `${STAGING_CLOUD_RUN_URL}/api/campaigns/active?shop=${STORE_DOMAIN}`;
    const response = await fetch(directUrl);
    const data = await response.json();

    if (response.ok && Array.isArray(data.campaigns)) {
      checks.push({
        name: "Direct Backend (Cloud Run)",
        passed: true,
        message: `Backend responding: ${data.campaigns.length} campaigns`,
      });
    } else {
      checks.push({
        name: "Direct Backend (Cloud Run)",
        passed: false,
        message: `Backend returned unexpected response: ${JSON.stringify(data).substring(0, 100)}`,
      });
    }
  } catch (error) {
    checks.push({
      name: "Direct Backend (Cloud Run)",
      passed: false,
      message: `Backend unreachable: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Check 3: App Proxy (requires password authentication for password-protected store)
  try {
    // First, authenticate with the password page
    const authResponse = await fetch(`https://${STORE_DOMAIN}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `password=${encodeURIComponent(STORE_PASSWORD)}`,
      redirect: "manual",
    });

    // Get the session cookie
    const cookies = authResponse.headers.get("set-cookie") || "";
    
    // Now try the App Proxy with the session cookie
    const proxyUrl = `https://${STORE_DOMAIN}/apps/revenue-boost/api/campaigns/active?shop=${STORE_DOMAIN}`;
    const proxyResponse = await fetch(proxyUrl, {
      headers: { Cookie: cookies },
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (Array.isArray(data.campaigns)) {
        checks.push({
          name: "App Proxy (Storefront)",
          passed: true,
          message: `App Proxy responding: ${data.campaigns.length} campaigns`,
        });
      } else {
        checks.push({
          name: "App Proxy (Storefront)",
          passed: false,
          message: `App Proxy returned unexpected data: ${JSON.stringify(data).substring(0, 100)}`,
        });
      }
    } else if (proxyResponse.status === 404) {
      checks.push({
        name: "App Proxy (Storefront)",
        passed: false,
        message: `App Proxy returned 404 - staging app may not be installed.\n` +
          `   → Install the staging app on ${STORE_DOMAIN}\n` +
          `   → Check shopify.app.staging.toml has correct app_proxy settings`,
      });
    } else {
      checks.push({
        name: "App Proxy (Storefront)",
        passed: false,
        message: `App Proxy returned ${proxyResponse.status}: ${await proxyResponse.text().catch(() => "no body")}`,
      });
    }
  } catch (error) {
    checks.push({
      name: "App Proxy (Storefront)",
      passed: false,
      message: `App Proxy check failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Check 4: Theme App Extension is enabled (extension script loads on storefront)
  try {
    // First, authenticate with the password page
    const authResponse = await fetch(`https://${STORE_DOMAIN}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `password=${encodeURIComponent(STORE_PASSWORD)}`,
      redirect: "manual",
    });

    // Get the session cookie
    const cookies = authResponse.headers.get("set-cookie") || "";

    // Fetch the storefront HTML
    const storefrontResponse = await fetch(`https://${STORE_DOMAIN}/`, {
      headers: { Cookie: cookies },
      redirect: "follow",
    });

    if (storefrontResponse.ok) {
      const html = await storefrontResponse.text();

      // Check for signs of the extension being enabled
      const hasRevenueBoostEmbed = html.includes('id="revenue-boost-embed"');
      const hasPopupLoader = html.includes('popup-loader.bundle.js');
      const hasRevenueBoostConfig = html.includes('REVENUE_BOOST_CONFIG');

      if (hasRevenueBoostEmbed || hasPopupLoader || hasRevenueBoostConfig) {
        checks.push({
          name: "Theme App Extension",
          passed: true,
          message: `Extension is enabled on the theme (found: ${[
            hasRevenueBoostEmbed && 'embed div',
            hasPopupLoader && 'popup-loader.js',
            hasRevenueBoostConfig && 'config script'
          ].filter(Boolean).join(', ')})`,
        });
      } else {
        checks.push({
          name: "Theme App Extension",
          passed: false,
          message: `Extension NOT enabled on the theme!\n` +
            `   → Go to Shopify Admin → Online Store → Themes → Customize\n` +
            `   → Find "App embeds" in the sidebar\n` +
            `   → Enable "Revenue Boost Popups" and click Save\n` +
            `   → This is a one-time setup required for the extension to work`,
        });
      }
    } else {
      checks.push({
        name: "Theme App Extension",
        passed: false,
        message: `Could not fetch storefront HTML: ${storefrontResponse.status}`,
      });
    }
  } catch (error) {
    checks.push({
      name: "Theme App Extension",
      passed: false,
      message: `Extension check failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Print results
  const allPassed = checks.every((c) => c.passed);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  checks.forEach((check) => {
    const icon = check.passed ? "✅" : "❌";
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (allPassed) {
    console.log("\n✅ All pre-flight checks passed! Ready to run E2E tests.\n");
  } else {
    console.log("\n❌ Some pre-flight checks failed. Fix the issues above before running E2E tests.\n");
  }

  return { success: allPassed, checks };
}

// Allow running directly: npx tsx tests/e2e/staging/helpers/preflight-check.ts
// Check if this file is being run directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runPreflightChecks()
    .then((result) => process.exit(result.success ? 0 : 1))
    .catch((error) => {
      console.error("Pre-flight check crashed:", error);
      process.exit(1);
    });
}

