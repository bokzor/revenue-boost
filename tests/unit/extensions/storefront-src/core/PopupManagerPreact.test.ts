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

async function loadPopupManager() {
  // SessionManager in PopupManagerPreact relies on localStorage/sessionStorage.
  // Provide simple in-memory implementations before importing the module.
  globalThis.localStorage = createMemoryStorage() as any;
  globalThis.sessionStorage = createMemoryStorage() as any;

  return import(
    "../../../../../extensions/storefront-src/core/PopupManagerPreact"
  );
}

async function waitForValue<T>(
  getter: () => T | null | undefined,
  timeoutMs = 1000,
): Promise<T> {
  const start = Date.now();

  return new Promise<T>((resolve, reject) => {
    const check = () => {
      const value = getter();
      if (value != null) {
        resolve(value);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Timed out waiting for value"));
        return;
      }
      setTimeout(check, 10);
    };

    check();
  });
}

describe("PopupManagerPreact renderPopup", () => {
  it("creates container, loads component and cleans up", async () => {
    const { renderPopup } = await loadPopupManager();

    const campaign: StorefrontCampaign = {
      id: "c1",
      name: "Test Campaign",
      templateType: "NEWSLETTER",
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

    // Cleanup should unmount and remove container
    cleanup();
    expect(document.querySelector("#revenue-boost-popup-c1")).toBeNull();
  });

  it("passes SpinToWin content/design/discount config through to popup component", async () => {
    const { renderPopup } = await loadPopupManager();

    let capturedProps: any = null;
    const FakeComponent: ComponentType<Record<string, unknown>> = (props) => {
      capturedProps = props;
      return null;
    };

    const campaign: StorefrontCampaign = {
      id: "spin-1",
      name: "Spin Campaign",
      templateType: "SPIN_TO_WIN",
      contentConfig: {
        headline: "Spin Headline",
        wheelSegments: [
          {
            id: "prize-10",
            label: "10% OFF",
            probability: 1,
          },
        ],
        emailRequired: true,
      },
      designConfig: {
        backgroundColor: "#123456",
      },
      discountConfig: {
        enabled: true,
        code: "SAVE10",
        valueType: "PERCENTAGE",
        value: 10,
        deliveryMode: "show_code_fallback",
      } as any,
    };

    const loader = {
      loadComponent: vi.fn().mockResolvedValue(FakeComponent),
    } as any;
    const api = {} as any;
    const onClose = vi.fn();

    const cleanup = renderPopup(campaign, onClose, loader, api);

    const props = await waitForValue(() => capturedProps);
    const config = (props as any).config;

    expect(config.id).toBe("spin-1");
    expect(config.headline).toBe("Spin Headline");
    expect(config.backgroundColor).toBe("#123456");
    expect(config.wheelSegments).toEqual([
      expect.objectContaining({
        label: "10% OFF",
        probability: 1,
      }),
    ]);

    expect(config.discount).toMatchObject({
      enabled: true,
      code: "SAVE10",
      percentage: 10,
      type: "PERCENTAGE",
      deliveryMode: "show_code_fallback",
    });

    cleanup();
  });

  it("passes ScratchCard content/config through to popup component", async () => {
    const { renderPopup } = await loadPopupManager();

    let capturedProps: any = null;
    const FakeComponent: ComponentType<Record<string, unknown>> = (props) => {
      capturedProps = props;
      return null;
    };

    const campaign: StorefrontCampaign = {
      id: "scratch-1",
      name: "Scratch Campaign",
      templateType: "SCRATCH_CARD",
      contentConfig: {
        headline: "Scratch & Win",
        prizes: [
          {
            id: "prize-10",
            label: "10% OFF",
            probability: 1,
          },
        ],
        scratchThreshold: 70,
        scratchRadius: 30,
      },
      designConfig: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      discountConfig: {} as any,
    };

    const loader = {
      loadComponent: vi.fn().mockResolvedValue(FakeComponent),
    } as any;
    const api = {} as any;
    const onClose = vi.fn();

    const cleanup = renderPopup(campaign, onClose, loader, api);

    const props = await waitForValue(() => capturedProps);
    const config = (props as any).config;

    expect(config.id).toBe("scratch-1");
    expect(config.headline).toBe("Scratch & Win");
    expect(config.backgroundColor).toBe("#ffffff");
    expect(config.textColor).toBe("#000000");
    expect(config.prizes).toEqual([
      expect.objectContaining({
        label: "10% OFF",
        probability: 1,
      }),
    ]);
    expect(config.scratchThreshold).toBe(70);
    expect(config.scratchRadius).toBe(30);

    cleanup();
  });
});
