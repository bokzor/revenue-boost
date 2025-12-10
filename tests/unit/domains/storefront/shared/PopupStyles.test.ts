/**
 * Unit Tests for Popup Styles
 */

import { describe, it, expect } from "vitest";

import {
  getPopupTitleStyles,
  getPopupDescriptionStyles,
  getPopupButtonContainerStyles,
  getPopupButtonStyles,
  getPopupCloseButtonStyles,
  getPopupSizeStyles,
  getBannerTitleStyles,
  getBannerDescriptionStyles,
  getOverlayStyles,
  getBasePopupStyles,
  getFormInputStyles,
  getSuccessMessageStyles,
  getErrorMessageStyles,
  getDiscountCodeStyles,
} from "~/domains/storefront/shared/PopupStyles";

const mockConfig = {
  backgroundColor: "#FFFFFF",
  textColor: "#000000",
  buttonColor: "#007BFF",
  buttonTextColor: "#FFFFFF",
};

describe("getPopupTitleStyles", () => {
  it("should return title styles with text color", () => {
    const styles = getPopupTitleStyles(mockConfig);

    expect(styles.color).toBe("#000000");
    expect(styles.fontSize).toBe("28px");
    expect(styles.fontWeight).toBe("700");
    expect(styles.textAlign).toBe("center");
  });

  it("should apply urgency styles for sales template", () => {
    const config = { ...mockConfig, urgencyTextColor: "#FF0000" };
    const styles = getPopupTitleStyles(config, true, "sales");

    expect(styles.color).toBe("#FF0000");
  });
});

describe("getPopupDescriptionStyles", () => {
  it("should return description styles", () => {
    const styles = getPopupDescriptionStyles(mockConfig);

    expect(styles.color).toBe("#000000");
    expect(styles.fontSize).toBe("16px");
    expect(styles.textAlign).toBe("center");
  });
});

describe("getPopupButtonContainerStyles", () => {
  it("should return button container styles", () => {
    const styles = getPopupButtonContainerStyles();

    expect(styles.display).toBe("flex");
    expect(styles.justifyContent).toBe("center");
  });
});

describe("getPopupButtonStyles", () => {
  it("should return primary button styles", () => {
    const styles = getPopupButtonStyles(mockConfig, "primary");

    expect(styles.backgroundColor).toBe("#007BFF");
    expect(styles.color).toBe("#FFFFFF");
    expect(styles.cursor).toBe("pointer");
  });

  it("should return secondary button styles", () => {
    const config = { ...mockConfig, secondaryColor: "#F0F0F0" };
    const styles = getPopupButtonStyles(config, "secondary");

    expect(styles.backgroundColor).toBe("#F0F0F0");
  });
});

describe("getPopupCloseButtonStyles", () => {
  it("should return close button styles", () => {
    const styles = getPopupCloseButtonStyles("#000000");

    expect(styles.position).toBe("absolute");
    expect(styles.top).toBe("10px");
    expect(styles.right).toBe("10px");
    expect(styles.color).toBe("#000000");
  });
});

describe("getPopupSizeStyles", () => {
  it("should return small size styles", () => {
    const styles = getPopupSizeStyles("small");
    expect(styles.width).toBe("360px");
  });

  it("should return medium size styles", () => {
    const styles = getPopupSizeStyles("medium");
    expect(styles.width).toBe("420px");
  });

  it("should return large size styles", () => {
    const styles = getPopupSizeStyles("large");
    expect(styles.width).toBe("520px");
  });

  it("should return fullscreen size styles", () => {
    const styles = getPopupSizeStyles("fullscreen");
    expect(styles.width).toBe("100%");
  });
});

describe("getBannerTitleStyles", () => {
  it("should return banner title styles", () => {
    const styles = getBannerTitleStyles(mockConfig);

    expect(styles.fontSize).toBe("18px");
    expect(styles.color).toBe("#000000");
  });
});

describe("getBannerDescriptionStyles", () => {
  it("should return banner description styles", () => {
    const styles = getBannerDescriptionStyles(mockConfig);

    expect(styles.fontSize).toBe("14px");
    expect(styles.color).toBe("#000000");
  });
});

describe("getOverlayStyles", () => {
  it("should return overlay styles with default opacity", () => {
    const styles = getOverlayStyles();

    expect(styles.position).toBe("fixed");
    expect(styles.zIndex).toBe(999999);
  });

  it("should apply custom opacity", () => {
    const styles = getOverlayStyles({ overlayOpacity: 0.8 } as any);

    expect(styles.backgroundColor).toContain("0.8");
  });
});

describe("getBasePopupStyles", () => {
  it("should return base popup styles", () => {
    const styles = getBasePopupStyles(mockConfig);

    expect(styles.backgroundColor).toBe("#FFFFFF");
    expect(styles.color).toBe("#000000");
    expect(styles.borderRadius).toBe("12px");
  });
});

describe("getFormInputStyles", () => {
  it("should return form input styles", () => {
    const styles = getFormInputStyles(mockConfig as any);

    expect(styles.width).toBe("100%");
    expect(styles.fontSize).toBe("16px");
    expect(styles.borderRadius).toBe("8px");
  });
});

describe("getSuccessMessageStyles", () => {
  it("should return success message styles", () => {
    const styles = getSuccessMessageStyles(mockConfig as any);

    expect(styles.textAlign).toBe("center");
    expect(styles.borderRadius).toBe("8px");
  });
});

describe("getErrorMessageStyles", () => {
  it("should return error message styles", () => {
    const styles = getErrorMessageStyles(mockConfig as any);

    expect(styles.borderRadius).toBe("6px");
  });
});

describe("getDiscountCodeStyles", () => {
  it("should return discount code styles", () => {
    const styles = getDiscountCodeStyles(mockConfig as any);

    expect(styles.fontFamily).toBe("monospace");
    expect(styles.letterSpacing).toBe("2px");
    expect(styles.textAlign).toBe("center");
  });
});

