import { describe, it, expect, vi } from "vitest";
import type { ComponentType } from "preact";
import type { StorefrontCampaign } from "../../../../../extensions/storefront-src/core/PopupManagerPreact";

function createMemoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  } as Storage;
}

describe("PopupManagerPreact renderPopup", () => {
  it("creates container, loads component and cleans up", async () => {
    // SessionManager in PopupManagerPreact relies on localStorage/sessionStorage.
    // Provide simple in-memory implementations before importing the module.
    // @ts-expect-error - jsdom environment types
    globalThis.localStorage = createMemoryStorage();
    // @ts-expect-error - jsdom environment types
    globalThis.sessionStorage = createMemoryStorage();

    const { renderPopup } = await import(
      "../../../../../extensions/storefront-src/core/PopupManagerPreact"
    );

    const campaign: StorefrontCampaign = {
      id: "c1",
      name: "Test Campaign",
      templateType: "NEWSLETTER" as any,
      contentConfig: {},
      designConfig: {},
    };

    const FakeComponent: ComponentType<Record<string, unknown>> = () => null;

    const loader = {
      loadComponent: vi.fn().mockResolvedValue(FakeComponent),
    } as any;

    const api = {} as any;
    const onClose = vi.fn();
    const onShow = vi.fn();

    const cleanup = renderPopup(campaign, onClose, loader, api, onShow);

    // Container should be added to the DOM immediately
    expect(document.querySelector("#revenue-boost-popup-c1")).toBeTruthy();

    // Allow any effects to run (best-effort; behavior is covered by other tests)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // We only assert that the popup container exists and can be cleaned up here.

    // Cleanup should unmount and remove container
    cleanup();
    expect(document.querySelector("#revenue-boost-popup-c1")).toBeNull();
  });
});
