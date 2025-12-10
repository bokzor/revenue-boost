/**
 * MSW Browser Setup for E2E Testing
 *
 * This file sets up MSW to run in the browser during E2E tests.
 * It intercepts network requests and returns mock responses.
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Create the worker instance
export const worker = setupWorker(...handlers);

// Start the worker with options
export async function startMockServiceWorker() {
  await worker.start({
    onUnhandledRequest: "bypass", // Don't warn about unhandled requests
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
  console.log("[MSW] Mock Service Worker started");
}

