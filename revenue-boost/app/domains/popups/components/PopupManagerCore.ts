/**
 * PopupManager Core Logic - Simplified
 */

import type { StorefrontCampaign } from "~/shared/types/campaign";
import { extractTriggerConfig } from "~/shared/utils/trigger-extraction";

// Legacy trigger config structure used by PopupManagerCore
interface LegacyTriggerConfig {
  type?: "time_delay" | "page_load" | "scroll_depth" | "exit_intent" | "product_view" | "add_to_cart" | "checkout_start" | "custom_event";
  delay?: number;
  scrollPercentage?: number;
  customEventName?: string;
}

export interface PopupManagerState {
  activeCampaign: StorefrontCampaign | null;
  displayedCampaigns: Set<string>;
  cooldownCampaigns: Set<string>;
}

export interface PopupManagerCallbacks {
  onPopupShow?: (campaignId: string) => void;
  onPopupClose?: (campaignId: string) => void;
  onPopupClick?: (campaignId: string, buttonUrl?: string) => void;
  onAddToCart?: (variantId: string, quantity: number) => Promise<void>;
  onApplyDiscount?: (discountCode: string) => Promise<void>;
  onUpdateCart?: () => void;
  onSaveForLater?: () => void;
  onShopMore?: () => void;
}

export interface PopupManagerConfig {
  campaigns: StorefrontCampaign[];
  callbacks: PopupManagerCallbacks;
  renderInline?: boolean;
}

export class PopupManagerCore {
  private state: PopupManagerState;
  private callbacks: PopupManagerCallbacks;
  private triggersCleanup: (() => void) | null = null;

  constructor(config: PopupManagerConfig) {
    this.state = {
      activeCampaign: null,
      displayedCampaigns: new Set(),
      cooldownCampaigns: new Set(),
    };
    this.callbacks = config.callbacks;
    this.loadDisplayedCampaigns();
  }

  getActiveCampaign() { return this.state.activeCampaign; }
  getDisplayedCampaigns() { return this.state.displayedCampaigns; }
  getCooldownCampaigns() { return this.state.cooldownCampaigns; }

  setActiveCampaign(campaign: StorefrontCampaign | null) { this.state.activeCampaign = campaign; }
  setDisplayedCampaigns(campaigns: Set<string>) { this.state.displayedCampaigns = campaigns; }
  setCooldownCampaigns(campaigns: Set<string>) { this.state.cooldownCampaigns = campaigns; }

  private loadDisplayedCampaigns() {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("splitpop_displayed_campaigns");
      if (stored) {
        const data = JSON.parse(stored);
        this.state.displayedCampaigns = new Set(data.displayed || []);
        this.state.cooldownCampaigns = new Set(data.cooldowns || []);
      }
    } catch {}
  }

  saveDisplayedCampaigns(displayed: Set<string>, cooldowns: Set<string>) {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem("splitpop_displayed_campaigns", JSON.stringify({
        displayed: Array.from(displayed),
        cooldowns: Array.from(cooldowns),
      }));
    } catch {}
  }

  canDisplayCampaign(campaign: StorefrontCampaign): boolean {
    if (campaign.previewMode) return true;

    // Check debounce
    try {
      if (typeof window !== "undefined") {
        const until = parseInt(window.sessionStorage.getItem(`splitpop_recently_closed_until:${campaign.id}`) || "0");
        if (until > Date.now()) return false;
      }
    } catch {}

    // Check if already displayed or in cooldown
    return !this.state.displayedCampaigns.has(campaign.id) &&
           !this.state.cooldownCampaigns.has(campaign.id);
  }

  async showPopup(campaign: StorefrontCampaign): Promise<boolean> {
    if (!this.canDisplayCampaign(campaign) || this.state.activeCampaign) return false;

    const newDisplayed = new Set(this.state.displayedCampaigns);
    newDisplayed.add(campaign.id);
    this.state.displayedCampaigns = newDisplayed;
    this.saveDisplayedCampaigns(newDisplayed, this.state.cooldownCampaigns);

    this.state.activeCampaign = campaign;
    if (campaign.campaignId) this.callbacks.onPopupShow?.(campaign.campaignId);
    return true;
  }

  closePopup() {
    if (!this.state.activeCampaign) return;

    const campaignId = this.state.activeCampaign.campaignId || this.state.activeCampaign.id;

    // Set debounce
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `splitpop_recently_closed_until:${this.state.activeCampaign.id}`,
          (Date.now() + 5000).toString()
        );
      }
    } catch {}

    this.callbacks.onPopupClose?.(campaignId);

    // Handle cooldown
    if (this.state.activeCampaign.cooldownMinutes) {
      const newCooldowns = new Set(this.state.cooldownCampaigns);
      newCooldowns.add(campaignId);
      this.state.cooldownCampaigns = newCooldowns;
      this.saveDisplayedCampaigns(this.state.displayedCampaigns, newCooldowns);

      setTimeout(() => {
        this.state.cooldownCampaigns.delete(campaignId);
      }, this.state.activeCampaign.cooldownMinutes * 60 * 1000);
    }

    this.state.activeCampaign = null;
  }

  handlePopupClick() {
    if (!this.state.activeCampaign) return;

    this.callbacks.onPopupClick?.(
      this.state.activeCampaign.campaignId || this.state.activeCampaign.id,
      this.state.activeCampaign.buttonUrl
    );

    if (this.state.activeCampaign.buttonUrl) {
      window.open(this.state.activeCampaign.buttonUrl, "_blank");
    }

    this.closePopup();
  }

  getAvailableCampaigns(campaigns: StorefrontCampaign[]) {
    return campaigns
      .filter(c => this.canDisplayCampaign(c))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  setupTriggers(campaigns: StorefrontCampaign[]): () => void {
    const availableCampaigns = this.getAvailableCampaigns(campaigns);

    // Preview mode - show immediately
    const previewCandidate = availableCampaigns.find(c => c.previewMode);
    if (previewCandidate && !this.state.activeCampaign) {
      setTimeout(() => this.showPopup(previewCandidate), 0);
      return () => {};
    }

    // Skip if no campaigns or popup already active
    if (availableCampaigns.length === 0 || this.state.activeCampaign) {
      return () => {};
    }

    const removers: Array<() => void> = [];
    const campaign = availableCampaigns[0]; // Highest priority
    if (!campaign) return () => {};

    const triggerConfig = extractTriggerConfig(campaign);
    this.setupTriggerType(campaign, triggerConfig as unknown as LegacyTriggerConfig, removers);

    this.triggersCleanup = () => removers.forEach(fn => { try { fn(); } catch {} });
    return this.triggersCleanup;
  }

  private setupTriggerType(
    campaign: StorefrontCampaign,
    triggerConfig: LegacyTriggerConfig,
    removers: Array<() => void>,
  ) {
    switch (triggerConfig.type) {
      case "time_delay":
      case "page_load": {
        const t = setTimeout(() => this.showPopup(campaign), triggerConfig.delay || 0);
        removers.push(() => clearTimeout(t));
        break;
      }

      case "scroll_depth": {
        const targetPercentage = triggerConfig.scrollPercentage || 50;
        const handleScroll = () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercentage = (scrollTop / documentHeight) * 100;

          if (scrollPercentage >= targetPercentage) {
            this.showPopup(campaign);
            window.removeEventListener("scroll", handleScroll);
          }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        removers.push(() => window.removeEventListener("scroll", handleScroll));
        break;
      }

      case "exit_intent": {
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            this.showPopup(campaign);
            document.removeEventListener("mouseleave", handleMouseLeave);
          }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        removers.push(() => document.removeEventListener("mouseleave", handleMouseLeave));
        break;
      }

      case "product_view": {
        interface WindowWithProduct extends Window {
          product?: unknown;
          meta?: { product?: unknown };
        }

        const windowWithProduct = window as WindowWithProduct;
        const isProductPage = window.location.pathname.includes("/products/") ||
          document.body.classList.contains("template-product") ||
          Boolean(document.querySelector("[data-product-id]")) ||
          Boolean(windowWithProduct.product) ||
          Boolean(windowWithProduct.meta?.product);

        if (isProductPage) {
          const t = setTimeout(() => this.showPopup(campaign), triggerConfig.delay || 1000);
          removers.push(() => clearTimeout(t));
        }
        break;
      }

      case "add_to_cart": {
        const handleAddToCart = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.matches('[name="add"]') || target.matches(".btn-add-to-cart") ||
              target.closest("[data-add-to-cart]")) {
            this.showPopup(campaign);
          }
        };

        document.addEventListener("click", handleAddToCart, true);
        removers.push(() => document.removeEventListener("click", handleAddToCart, true));
        break;
      }

      case "checkout_start": {
        const handleCheckoutClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.matches('[name="checkout"]') || target.matches(".checkout-button") ||
              target.closest('[href*="/checkout"]')) {
            e.preventDefault();
            this.showPopup(campaign);
          }
        };

        document.addEventListener("click", handleCheckoutClick, true);
        removers.push(() => document.removeEventListener("click", handleCheckoutClick, true));
        break;
      }

      case "custom_event": {
        const eventName = triggerConfig.customEventName || "splitpop_trigger";
        const handleCustomEvent = () => this.showPopup(campaign);

        window.addEventListener(eventName, handleCustomEvent);
        removers.push(() => window.removeEventListener(eventName, handleCustomEvent));
        break;
      }
    }
  }

  cleanupTriggers() {
    this.triggersCleanup?.();
    this.triggersCleanup = null;
  }
}
