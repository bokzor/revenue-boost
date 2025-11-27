/**
 * URL Utilities for Storefront
 *
 * Centralized URL manipulation including:
 * - UTM parameter handling
 * - URL decoration
 */

export interface UTMParams {
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}

/**
 * Add UTM parameters to a URL
 */
export function addUTMParams(
  url: string | null | undefined,
  params: UTMParams
): string | null | undefined {
  if (!url || !params?.utmCampaign) return url;

  try {
    const urlObj = new URL(
      url,
      url.startsWith("http") ? undefined : "https://placeholder.local"
    );
    urlObj.searchParams.set("utm_campaign", params.utmCampaign);
    if (params.utmSource) urlObj.searchParams.set("utm_source", params.utmSource);
    if (params.utmMedium) urlObj.searchParams.set("utm_medium", params.utmMedium);

    if (!url.startsWith("http")) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Decorate URL with discount code parameter
 */
export function decorateUrlWithDiscount(
  url: string,
  discountCode?: string
): string {
  if (!discountCode) return url;

  try {
    const urlObj = new URL(
      url,
      url.startsWith("http") ? undefined : "https://placeholder.local"
    );
    urlObj.searchParams.set("discount", discountCode);

    if (!url.startsWith("http")) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Normalize a URL path (remove leading slash for relative paths)
 */
export function normalizePath(path: string): string {
  return path.replace(/^\//, "");
}

/**
 * Build a full URL from root and path
 */
export function buildUrl(root: string, path: string, queryString?: string): string {
  const normalizedPath = normalizePath(path);
  const base = `${root}${normalizedPath}`;
  return queryString ? `${base}${queryString}` : base;
}

