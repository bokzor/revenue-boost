import { describe, it, expect, vi } from "vitest";
import { h } from "preact";

const storageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Provide storage globals before dynamic imports
// @ts-expect-error test env
global.localStorage = storageMock;
// @ts-expect-error test env
global.sessionStorage = storageMock;

describe("PopupManagerPreact - CSS threading", () => {
  it("passes globalCustomCSS and customCSS into PopupPortal styles", async () => {
    const { renderPopup } = await import("../../../../../extensions/storefront-src/core/PopupManagerPreact");
    const { ComponentLoader } = await import("../../../../../extensions/storefront-src/core/component-loader");
    const typeApi = await import("../../../../../extensions/storefront-src/core/api");

    const campaign: any = {
      id: "css-test",
      name: "Test Campaign",
      templateType: "NEWSLETTER",
      contentConfig: {},
      designConfig: { customCSS: ".campaign-rule { color: red; }", previewMode: true },
      globalCustomCSS: ".global-rule { color: blue; }",
    };

    const onClose = () => {};
    const loader = new ComponentLoader({ baseUrl: "", version: "test", debug: false });
    const FakeComponent = ({ config }: { config: { globalCustomCSS?: string; customCSS?: string } }) =>
      h("div", null, [
        config.globalCustomCSS ? h("style", null, config.globalCustomCSS) : null,
        config.customCSS ? h("style", null, config.customCSS) : null,
      ]);
    vi.spyOn(loader, "loadComponent").mockResolvedValue(FakeComponent);

    const api = { recordFrequency: () => Promise.resolve(), trackEvent: () => Promise.resolve() } as unknown as typeApi.ApiClient;

    const cleanup = renderPopup(campaign, onClose, loader, api);

    // Allow effects + async component loading to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    const styleTags = Array.from(document.querySelectorAll("style"));
    const hasGlobal = styleTags.some((tag) => tag.textContent?.includes(".global-rule"));
    const hasCampaign = styleTags.some((tag) => tag.textContent?.includes(".campaign-rule"));

    expect(hasGlobal).toBe(true);
    expect(hasCampaign).toBe(true);

    cleanup();
  });
});
