"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo } = window.RevenueBoostPreact.hooks;

  // app/domains/storefront/popups-new/utils.ts
  function getSizeDimensions(size, previewMode) {
    if (previewMode) {
      switch (size) {
        case "small":
          return { width: "50%", maxWidth: "400px" };
        case "medium":
          return { width: "65%", maxWidth: "600px" };
        case "large":
          return { width: "80%", maxWidth: "900px" };
        default:
          return { width: "65%", maxWidth: "600px" };
      }
    }
    switch (size) {
      case "small":
        return { width: "90%", maxWidth: "400px" };
      case "medium":
        return { width: "90%", maxWidth: "600px" };
      case "large":
        return { width: "90%", maxWidth: "900px" };
      default:
        return { width: "90%", maxWidth: "600px" };
    }
  }
  function getPositionStyles(position) {
    const baseStyles = {
      position: "fixed",
      zIndex: 1e4
    };
    switch (position) {
      case "center":
        return {
          ...baseStyles,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        };
      case "top":
        return {
          ...baseStyles,
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)"
        };
      case "bottom":
        return {
          ...baseStyles,
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)"
        };
      case "left":
        return {
          ...baseStyles,
          top: "50%",
          left: "20px",
          transform: "translateY(-50%)"
        };
      case "right":
        return {
          ...baseStyles,
          top: "50%",
          right: "20px",
          transform: "translateY(-50%)"
        };
      default:
        return {
          ...baseStyles,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        };
    }
  }
  function getAnimationClass(animation, isExiting = false) {
    if (animation === "none") return "";
    const prefix = isExiting ? "popup-exit" : "popup-enter";
    return `${prefix}-${animation}`;
  }
  function getAnimationKeyframes() {
    return `
    @keyframes popup-enter-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes popup-exit-fade {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes popup-enter-slide {
      from { 
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to { 
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
    
    @keyframes popup-exit-slide {
      from { 
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      to { 
        opacity: 0;
        transform: translate(-50%, -60%);
      }
    }
    
    @keyframes popup-enter-bounce {
      0% { 
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
      50% { 
        transform: translate(-50%, -50%) scale(1.05);
      }
      70% { 
        transform: translate(-50%, -50%) scale(0.9);
      }
      100% { 
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
    
    @keyframes popup-exit-bounce {
      from { 
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      to { 
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
    }
    
    .popup-enter-fade { animation: popup-enter-fade 0.3s ease-out; }
    .popup-exit-fade { animation: popup-exit-fade 0.3s ease-in; }
    .popup-enter-slide { animation: popup-enter-slide 0.3s ease-out; }
    .popup-exit-slide { animation: popup-exit-slide 0.3s ease-in; }
    .popup-enter-bounce { animation: popup-enter-bounce 0.5s ease-out; }
    .popup-exit-bounce { animation: popup-exit-bounce 0.3s ease-in; }
    
    @media (prefers-reduced-motion: reduce) {
      .popup-enter-fade,
      .popup-enter-slide,
      .popup-enter-bounce,
      .popup-exit-fade,
      .popup-exit-slide,
      .popup-exit-bounce {
        animation: none !important;
      }
    }
  `;
  }
  function formatCurrency(amount, currency = "USD") {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(numAmount);
  }
  function calculateTimeRemaining(endDate) {
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;
    const now = /* @__PURE__ */ new Date();
    const total = end.getTime() - now.getTime();
    if (total <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return {
      total,
      days: Math.floor(total / (1e3 * 60 * 60 * 24)),
      hours: Math.floor(total / (1e3 * 60 * 60) % 24),
      minutes: Math.floor(total / (1e3 * 60) % 60),
      seconds: Math.floor(total / 1e3 % 60)
    };
  }
  function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // global-preact:global-preact:preact/jsx-runtime
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var options = window.RevenueBoostPreact.options || {};
  var h2 = window.RevenueBoostPreact.h;
  var vnodeId = 0;
  function jsx(type, props, key, isStaticChildren, __source, __self) {
    if (!props) props = {};
    let normalizedProps = props;
    let ref;
    if ("ref" in props) {
      normalizedProps = {};
      for (let i in props) {
        if (i === "ref") ref = props[i];
        else normalizedProps[i] = props[i];
      }
    }
    const vnode = {
      type,
      props: normalizedProps,
      key: key !== void 0 ? key : null,
      ref: ref !== void 0 ? ref : null,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __c: null,
      constructor: void 0,
      __v: --vnodeId,
      __i: -1,
      __u: 0,
      __source,
      __self
    };
    if (typeof type === "function" && (ref = type.defaultProps)) {
      for (let i in ref) {
        if (normalizedProps[i] === void 0) {
          normalizedProps[i] = ref[i];
        }
      }
    }
    if (options.vnode) options.vnode(vnode);
    return vnode;
  }
  var jsxs = jsx;
  var Fragment2 = window.RevenueBoostPreact.Fragment;

  // app/domains/storefront/popups-new/BasePopup.tsx
  var BasePopup = ({
    config,
    isVisible,
    onClose,
    children,
    className = ""
  }) => {
    const [isExiting, setIsExiting] = useState(false);
    const popupRef = useRef(null);
    const previousFocusRef = useRef(null);
    const handleClose = useCallback(() => {
      if (config.animation && config.animation !== "none" && !prefersReducedMotion()) {
        setIsExiting(true);
        setTimeout(() => {
          onClose();
          setIsExiting(false);
        }, 300);
      } else {
        onClose();
      }
    }, [config.animation, onClose]);
    const handleEscapeKey = useCallback((event) => {
      if (event.key === "Escape" && config.closeOnEscape !== false) {
        handleClose();
      }
    }, [config.closeOnEscape, handleClose]);
    const handleOverlayClick = useCallback((event) => {
      if (event.target === event.currentTarget && config.closeOnOverlayClick !== false) {
        handleClose();
      }
    }, [config.closeOnOverlayClick, handleClose]);
    useEffect(() => {
      if (isVisible) {
        document.addEventListener("keydown", handleEscapeKey);
        return () => document.removeEventListener("keydown", handleEscapeKey);
      }
    }, [isVisible, handleEscapeKey]);
    useEffect(() => {
      if (isVisible) {
        previousFocusRef.current = document.activeElement;
        setTimeout(() => popupRef.current?.focus(), 100);
      } else if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }, [isVisible]);
    useEffect(() => {
      if (isVisible && config.autoCloseDelay && config.autoCloseDelay > 0) {
        const timer = setTimeout(handleClose, config.autoCloseDelay * 1e3);
        return () => clearTimeout(timer);
      }
    }, [isVisible, config.autoCloseDelay, handleClose]);
    if (!isVisible && !isExiting) return null;
    const sizeDimensions = getSizeDimensions(config.size, config.previewMode);
    const positionStyles = getPositionStyles(config.position);
    const animationClass = getAnimationClass(config.animation || "fade", isExiting);
    const overlayStyles = {
      position: config.previewMode ? "absolute" : "fixed",
      // Use absolute in preview to stay within container
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: config.overlayColor || "rgba(0, 0, 0, 0.5)",
      opacity: config.overlayOpacity ?? 1,
      zIndex: config.previewMode ? 1 : 9999,
      // Lower z-index in preview mode
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    };
    const popupStyles = {
      ...positionStyles,
      width: config.maxWidth || sizeDimensions.width,
      maxWidth: config.maxWidth || sizeDimensions.maxWidth,
      backgroundColor: config.backgroundColor,
      color: config.textColor,
      borderRadius: `${config.borderRadius ?? 8}px`,
      padding: config.padding ?? "24px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      outline: "none",
      maxHeight: config.previewMode ? "85%" : "90vh",
      // Use percentage in preview mode
      overflowY: "auto"
    };
    const closeButtonStyles = {
      position: "absolute",
      top: "12px",
      right: "12px",
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: config.textColor,
      opacity: 0.6,
      transition: "opacity 0.2s",
      padding: "4px 8px",
      lineHeight: 1
    };
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("style", { children: getAnimationKeyframes() }),
      /* @__PURE__ */ jsx("div", { style: overlayStyles, onClick: handleOverlayClick, role: "presentation", "data-testid": "popup-overlay", children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: popupRef,
          className: `${className} ${animationClass}`.trim(),
          style: popupStyles,
          role: "dialog",
          "data-testid": "popup-container",
          "aria-modal": "true",
          "aria-label": config.ariaLabel || config.headline,
          "aria-describedby": config.ariaDescribedBy,
          tabIndex: -1,
          children: [
            config.showCloseButton !== false && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleClose,
                style: closeButtonStyles,
                "aria-label": "Close popup",
                "data-testid": "popup-close",
                onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                onMouseLeave: (e) => e.currentTarget.style.opacity = "0.6",
                children: "\xD7"
              }
            ),
            children
          ]
        }
      ) })
    ] });
  };

  // app/domains/storefront/popups-new/CartAbandonmentPopup.tsx
  var CartAbandonmentPopup = ({
    config,
    isVisible,
    onClose,
    cartItems = [],
    cartTotal,
    onResumeCheckout,
    onSaveForLater
  }) => {
    const [timeRemaining, setTimeRemaining] = useState(() => {
      if (config.urgencyTimer) {
        const endDate = new Date(Date.now() + config.urgencyTimer * 1e3);
        return calculateTimeRemaining(endDate);
      }
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    });
    useEffect(() => {
      if (!config.showUrgency || !config.urgencyTimer) return;
      const timer = setInterval(() => {
        const endDate = new Date(Date.now() + config.urgencyTimer * 1e3);
        const newTime = calculateTimeRemaining(endDate);
        setTimeRemaining(newTime);
        if (newTime.total <= 0) {
          clearInterval(timer);
        }
      }, 1e3);
      return () => clearInterval(timer);
    }, [config.showUrgency, config.urgencyTimer]);
    const handleResumeCheckout = useCallback(() => {
      if (onResumeCheckout) {
        onResumeCheckout();
      } else if (config.ctaUrl) {
        window.location.href = config.ctaUrl;
      }
    }, [config.ctaUrl, onResumeCheckout]);
    const handleSaveForLater = useCallback(() => {
      if (onSaveForLater) {
        onSaveForLater();
      }
      onClose();
    }, [onSaveForLater, onClose]);
    const displayItems = config.maxItemsToShow ? cartItems.slice(0, config.maxItemsToShow) : cartItems;
    const buttonStyles = {
      width: "100%",
      padding: "14px 24px",
      fontSize: "16px",
      fontWeight: 600,
      border: "none",
      borderRadius: `${config.borderRadius ?? 8}px`,
      backgroundColor: config.buttonColor,
      color: config.buttonTextColor,
      cursor: "pointer",
      transition: "transform 0.1s"
    };
    const secondaryButtonStyles = {
      ...buttonStyles,
      backgroundColor: "transparent",
      color: config.textColor,
      border: `2px solid ${config.textColor}`,
      opacity: 0.7
    };
    return /* @__PURE__ */ jsx(BasePopup, { config, isVisible, onClose, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "20px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0" }, children: config.headline }),
        config.subheadline && /* @__PURE__ */ jsx("p", { style: { fontSize: "16px", margin: 0, opacity: 0.8 }, children: config.subheadline })
      ] }),
      config.showUrgency && config.urgencyTimer && timeRemaining.total > 0 && /* @__PURE__ */ jsx("div", { style: {
        padding: "16px",
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: 600
      }, children: config.urgencyMessage?.replace("{{time}}", `${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, "0")}`) || `Complete your order in ${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, "0")}` }),
      config.discount?.enabled && config.discount.code && /* @__PURE__ */ jsxs("div", { style: {
        padding: "16px",
        backgroundColor: config.accentColor || "#DBEAFE",
        borderRadius: "8px",
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", margin: "0 0 8px 0", fontWeight: 600 }, children: "Special offer for you!" }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: "20px", fontWeight: 700 }, children: [
          config.discount.percentage && `${config.discount.percentage}% OFF`,
          config.discount.value && `$${config.discount.value} OFF`
        ] }),
        /* @__PURE__ */ jsx("code", { style: {
          display: "inline-block",
          marginTop: "8px",
          padding: "6px 12px",
          backgroundColor: config.backgroundColor,
          borderRadius: "4px",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "1px"
        }, children: config.discount.code })
      ] }),
      config.showCartItems !== false && displayItems.length > 0 && /* @__PURE__ */ jsxs("div", { style: {
        maxHeight: "300px",
        overflowY: "auto",
        border: `1px solid ${config.inputBorderColor || "#E5E7EB"}`,
        borderRadius: "8px",
        padding: "12px"
      }, children: [
        displayItems.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              gap: "12px",
              padding: "12px 0",
              borderBottom: `1px solid ${config.inputBorderColor || "#E5E7EB"}`
            },
            children: [
              item.imageUrl && /* @__PURE__ */ jsx(
                "img",
                {
                  src: item.imageUrl,
                  alt: item.title,
                  style: {
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "6px"
                  }
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, fontSize: "14px", marginBottom: "4px" }, children: item.title }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: "14px", opacity: 0.7 }, children: [
                  "Qty: ",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: "16px" }, children: formatCurrency(item.price, config.currency) })
            ]
          },
          item.id
        )),
        cartItems.length > displayItems.length && /* @__PURE__ */ jsxs("div", { style: { padding: "12px 0", textAlign: "center", fontSize: "14px", opacity: 0.7 }, children: [
          "+",
          cartItems.length - displayItems.length,
          " more item",
          cartItems.length - displayItems.length !== 1 ? "s" : ""
        ] })
      ] }),
      config.showCartTotal !== false && cartTotal && /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        backgroundColor: config.accentColor || "#F3F4F6",
        borderRadius: "8px",
        fontSize: "18px",
        fontWeight: 700
      }, children: [
        /* @__PURE__ */ jsx("span", { children: "Total:" }),
        /* @__PURE__ */ jsx("span", { children: typeof cartTotal === "number" ? formatCurrency(cartTotal, config.currency) : cartTotal })
      ] }),
      config.showStockWarnings && /* @__PURE__ */ jsx("div", { style: {
        padding: "12px",
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 600,
        textAlign: "center"
      }, children: config.stockWarningMessage || "\u26A0\uFE0F Items in your cart are selling fast!" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleResumeCheckout,
            style: buttonStyles,
            onMouseEnter: (e) => e.currentTarget.style.transform = "translateY(-1px)",
            onMouseLeave: (e) => e.currentTarget.style.transform = "translateY(0)",
            children: config.buttonText || config.ctaText || "Resume Checkout"
          }
        ),
        config.saveForLaterText && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSaveForLater,
            style: secondaryButtonStyles,
            onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
            onMouseLeave: (e) => e.currentTarget.style.opacity = "0.7",
            children: config.saveForLaterText
          }
        )
      ] })
    ] }) });
  };

  // extensions/storefront-src/bundles/cart-abandonment.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["CART_ABANDONMENT"] = CartAbandonmentPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Cart Abandonment popup registered");
    }
  })();
})();
//# sourceMappingURL=cart-abandonment.bundle.js.map
