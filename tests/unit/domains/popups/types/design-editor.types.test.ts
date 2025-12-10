/**
 * Unit Tests for Design Editor Types
 */

import { describe, it, expect } from "vitest";

import type {
  AnimationSettings,
  AnimationConfig,
  MobileOptimizationConfig,
  TemplateObject,
  CampaignContext,
  PendingTemplateChange,
  PopupDesignConfig,
} from "~/domains/popups/types/design-editor.types";

describe("AnimationSettings", () => {
  it("should support entrance animation", () => {
    const settings: AnimationSettings = {
      entrance: {
        animation: "fadeIn",
        duration: 300,
        easing: "ease-out",
        delay: 100,
      },
    };

    expect(settings.entrance?.animation).toBe("fadeIn");
    expect(settings.entrance?.duration).toBe(300);
  });

  it("should support exit animation", () => {
    const settings: AnimationSettings = {
      exit: {
        animation: "fadeOut",
        duration: 200,
        easing: "ease-in",
      },
    };

    expect(settings.exit?.animation).toBe("fadeOut");
  });

  it("should support hover animation", () => {
    const settings: AnimationSettings = {
      hover: {
        enabled: true,
        animation: "scale",
        duration: 150,
        easing: "ease",
      },
    };

    expect(settings.hover?.enabled).toBe(true);
  });

  it("should support attention animation", () => {
    const settings: AnimationSettings = {
      attention: {
        enabled: true,
        animation: "pulse",
        duration: 1000,
        easing: "ease-in-out",
        interval: 5000,
      },
    };

    expect(settings.attention?.interval).toBe(5000);
  });
});

describe("MobileOptimizationConfig", () => {
  it("should support mobile optimization settings", () => {
    const config: MobileOptimizationConfig = {
      enabled: true,
      responsiveBreakpoint: 768,
      mobilePosition: "bottom",
      mobileSize: "fullscreen",
      hideOnMobile: false,
    };

    expect(config.enabled).toBe(true);
    expect(config.mobilePosition).toBe("bottom");
    expect(config.mobileSize).toBe("fullscreen");
  });
});

describe("TemplateObject", () => {
  it("should support template object structure", () => {
    const template: TemplateObject = {
      id: "template-1",
      name: "Newsletter Popup",
      templateType: "NEWSLETTER",
      category: "popup",
      description: "A newsletter signup popup",
      preview: "/preview.png",
      contentConfig: { headline: "Subscribe!" },
      designConfig: { backgroundColor: "#FFFFFF" },
    };

    expect(template.id).toBe("template-1");
    expect(template.templateType).toBe("NEWSLETTER");
  });
});

describe("CampaignContext", () => {
  it("should support campaign context", () => {
    const context: CampaignContext = {
      triggerType: "exit_intent",
      name: "Exit Intent Campaign",
      description: "Capture leaving visitors",
      campaignGoal: "email_capture",
    };

    expect(context.campaignGoal).toBe("email_capture");
  });
});

describe("PendingTemplateChange", () => {
  it("should support pending template change", () => {
    const change: PendingTemplateChange = {
      templateId: "template-2",
      templateType: "SPIN_TO_WIN",
    };

    expect(change.templateId).toBe("template-2");
    expect(change.templateType).toBe("SPIN_TO_WIN");
  });
});

describe("PopupDesignConfig", () => {
    it("should support design config with content fields", () => {
      const config: PopupDesignConfig = {
        id: "popup-1",
        position: "center",
        size: "medium",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      headline: "Welcome!",
      subheadline: "Get 10% off",
      buttonText: "Subscribe",
    };

    expect(config.headline).toBe("Welcome!");
    expect(config.backgroundColor).toBe("#FFFFFF");
  });

    it("should support editor-specific fields", () => {
      const config: PopupDesignConfig = {
        id: "popup-2",
        position: "center",
        size: "medium",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      slideDirection: "right",
      width: "400px",
      sticky: true,
      animations: {
        entrance: { animation: "fadeIn", duration: 300, easing: "ease" },
      },
    };

    expect(config.slideDirection).toBe("right");
    expect(config.sticky).toBe(true);
    expect(config.animations?.entrance?.animation).toBe("fadeIn");
  });
});
