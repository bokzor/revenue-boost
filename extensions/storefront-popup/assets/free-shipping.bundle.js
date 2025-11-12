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
    const handleEscapeKey = useCallback((event) => {
      if (event.key === "Escape" && config.closeOnEscape !== false) {
        handleClose();
      }
    }, [config.closeOnEscape]);
    const handleOverlayClick = useCallback((event) => {
      if (event.target === event.currentTarget && config.closeOnOverlayClick !== false) {
        handleClose();
      }
    }, [config.closeOnOverlayClick]);
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

  // app/domains/storefront/popups-new/FreeShippingPopup.tsx
  var FreeShippingPopup = ({
    config,
    isVisible,
    onClose,
    cartTotal: propCartTotal
  }) => {
    const cartTotal = propCartTotal ?? config.currentCartTotal ?? 0;
    const threshold = config.freeShippingThreshold;
    const { remaining, percentage, hasReached } = useMemo(() => {
      const remaining2 = Math.max(0, threshold - cartTotal);
      const percentage2 = Math.min(100, cartTotal / threshold * 100);
      const hasReached2 = cartTotal >= threshold;
      return { remaining: remaining2, percentage: percentage2, hasReached: hasReached2 };
    }, [cartTotal, threshold]);
    const getMessage = useCallback(() => {
      if (hasReached) {
        return config.successTitle || "You unlocked FREE SHIPPING! \u{1F389}";
      }
      const message = config.initialMessage || "Add {{remaining}} more for FREE SHIPPING! \u{1F69A}";
      return message.replace("{{remaining}}", formatCurrency(remaining, config.currency)).replace("{{percentage}}", Math.round(percentage).toString());
    }, [hasReached, remaining, percentage, config]);
    const renderBanner = () => {
      const bannerStyles = {
        position: config.displayStyle === "sticky" ? "sticky" : "fixed",
        [config.position === "bottom" ? "bottom" : "top"]: 0,
        left: 0,
        right: 0,
        backgroundColor: hasReached ? "#10B981" : config.backgroundColor,
        color: hasReached ? "#FFFFFF" : config.textColor,
        padding: "16px 20px",
        zIndex: 1e4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      };
      const containerStyles = {
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      };
      const headerStyles = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      };
      const closeButtonStyles = {
        background: "transparent",
        border: "none",
        color: hasReached ? "#FFFFFF" : config.textColor,
        fontSize: "24px",
        cursor: "pointer",
        padding: "0 8px",
        opacity: 0.8,
        lineHeight: 1
      };
      return /* @__PURE__ */ jsx("div", { style: bannerStyles, children: /* @__PURE__ */ jsxs("div", { style: containerStyles, children: [
        /* @__PURE__ */ jsxs("div", { style: headerStyles, children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, fontSize: "16px" }, children: getMessage() }),
          config.showCloseButton !== false && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              style: closeButtonStyles,
              "aria-label": "Close banner",
              onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
              onMouseLeave: (e) => e.currentTarget.style.opacity = "0.8",
              children: "\xD7"
            }
          )
        ] }),
        config.showProgress !== false && !hasReached && /* @__PURE__ */ jsx("div", { style: {
          height: "8px",
          backgroundColor: "rgba(0,0,0,0.1)",
          borderRadius: "4px",
          overflow: "hidden"
        }, children: /* @__PURE__ */ jsx("div", { style: {
          height: "100%",
          width: `${percentage}%`,
          backgroundColor: config.progressColor || config.accentColor || "#10B981",
          transition: "width 0.3s ease"
        } }) }),
        !hasReached && config.progressMessage && /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", opacity: 0.9, textAlign: "center" }, children: config.progressMessage.replace("{{percentage}}", Math.round(percentage).toString()) }),
        hasReached && config.successSubhead && /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", opacity: 0.9, textAlign: "center" }, children: config.successSubhead })
      ] }) });
    };
    const renderModal = () => {
      return /* @__PURE__ */ jsx(BasePopup, { config, isVisible, onClose, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "20px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "48px" }, children: hasReached ? "\u{1F389}" : "\u{1F69A}" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { style: { fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }, children: getMessage() }),
          !hasReached && config.progressMessage && /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", margin: 0, opacity: 0.8 }, children: config.progressMessage.replace("{{percentage}}", Math.round(percentage).toString()) }),
          hasReached && config.successSubhead && /* @__PURE__ */ jsx("p", { style: { fontSize: "16px", margin: 0, opacity: 0.8 }, children: config.successSubhead })
        ] }),
        config.showProgress !== false && !hasReached && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: {
            height: "12px",
            backgroundColor: "#E5E7EB",
            borderRadius: "6px",
            overflow: "hidden"
          }, children: /* @__PURE__ */ jsx("div", { style: {
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: config.progressColor || config.accentColor || "#10B981",
            transition: "width 0.3s ease"
          } }) }),
          /* @__PURE__ */ jsxs("p", { style: { fontSize: "14px", marginTop: "8px", fontWeight: 600 }, children: [
            Math.round(percentage),
            "% there!"
          ] })
        ] })
      ] }) });
    };
    if (!isVisible) return null;
    return config.displayStyle === "banner" || config.displayStyle === "sticky" ? renderBanner() : renderModal();
  };

  // extensions/storefront-src/bundles/free-shipping.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["FREE_SHIPPING"] = FreeShippingPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Free Shipping popup registered");
    }
  })();
})();
//# sourceMappingURL=free-shipping.bundle.js.map
