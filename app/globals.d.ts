declare module "*.css";

/**
 * Shopify App Bridge global type declarations
 * The shopify global is injected by app-bridge.js when running embedded
 */
interface Window {
  shopify?: {
    /**
     * Opens a URL in a new tab from an embedded app context
     * @param url - The URL to open
     */
    open: (url: string) => void;
    /**
     * Environment info
     */
    environment?: {
      embedded: boolean;
      mobile: boolean;
    };
  };
}
