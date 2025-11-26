const cache = new Map<string, string>();

export function buildScopedCss(
  globalCss: string | undefined,
  campaignCss: string | undefined,
  scopeAttr: string,
  cacheKey?: string,
): string {
  const combined = [globalCss, campaignCss].filter(Boolean).join("\n\n");
  if (!combined.trim()) return "";

  const key = cacheKey ? `${cacheKey}:${combined}` : combined;
  const existing = cache.get(key);
  if (existing !== undefined) return existing;

  const scoped = combined
    .split("}")
    .map((block) => {
      const parts = block.split("{");
      if (parts.length < 2) return block;
      const selectors = parts[0]?.trim();
      const body = parts.slice(1).join("{");
      if (!selectors || !body) return "";
      if (selectors.startsWith("@")) {
        return `${selectors} {${body}}`;
      }
      const scopedSelectors = selectors
        .split(",")
        .map((sel) => `[${scopeAttr}] ${sel.trim()}`)
        .join(", ");
      return `${scopedSelectors}{${body}}`;
    })
    .filter(Boolean)
    .join("}");

  cache.set(key, scoped);
  return scoped;
}
