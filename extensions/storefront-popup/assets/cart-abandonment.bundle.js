"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo } = window.RevenueBoostPreact.hooks;

  // global-preact:global-preact:react-dom
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var render2 = window.RevenueBoostPreact.render;
  var createPortal2 = window.RevenueBoostPreact.createPortal;
  var global_preact_react_dom_default = { render: window.RevenueBoostPreact.render, createPortal: window.RevenueBoostPreact.createPortal };

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

  // app/domains/storefront/popups-new/PopupPortal.tsx
  var ANIMATION_CHOREOGRAPHY = {
    fade: {
      backdrop: { delay: 0, duration: 200 },
      content: { delay: 0, duration: 200 }
    },
    slide: {
      backdrop: { delay: 0, duration: 150 },
      content: { delay: 50, duration: 300 }
    },
    zoom: {
      backdrop: { delay: 0, duration: 250 },
      content: { delay: 0, duration: 300 }
    },
    bounce: {
      backdrop: { delay: 0, duration: 200 },
      content: { delay: 50, duration: 500 }
    },
    none: {
      backdrop: { delay: 0, duration: 0 },
      content: { delay: 0, duration: 0 }
    }
  };
  var PopupPortal = ({
    isVisible,
    onClose,
    children,
    backdrop = {},
    animation = { type: "fade" },
    position = "center",
    closeOnEscape = true,
    closeOnBackdropClick = true,
    previewMode = false,
    ariaLabel,
    ariaDescribedBy
  }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const previousFocusRef = useRef(null);
    const contentRef = useRef(null);
    const shadowHostRef = useRef(null);
    const shadowRootRef = useRef(null);
    const animationType = animation.type || "fade";
    const choreography = ANIMATION_CHOREOGRAPHY[animationType];
    const backdropTiming = useMemo(() => ({
      delay: animation.backdropDelay ?? choreography.backdrop.delay,
      duration: animation.duration ?? choreography.backdrop.duration
    }), [animation.backdropDelay, animation.duration, choreography.backdrop.delay, choreography.backdrop.duration]);
    const contentTiming = useMemo(() => ({
      delay: animation.contentDelay ?? choreography.content.delay,
      duration: animation.duration ?? choreography.content.duration
    }), [animation.contentDelay, animation.duration, choreography.content.delay, choreography.content.duration]);
    const getBackdropColor = useCallback(() => {
      const opacity = backdrop.opacity ?? 0.6;
      const color = backdrop.color || "rgba(0, 0, 0, 1)";
      if (color.startsWith("rgba")) {
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbaMatch) {
          return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
        }
      }
      if (color.startsWith("rgb")) {
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
        }
      }
      if (color.startsWith("#")) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return `rgba(0, 0, 0, ${opacity})`;
    }, [backdrop.color, backdrop.opacity]);
    const handleClose = useCallback(() => {
      if (animationType !== "none") {
        setIsExiting(true);
        const maxDuration = Math.max(
          backdropTiming.delay + backdropTiming.duration,
          contentTiming.delay + contentTiming.duration
        );
        setTimeout(() => {
          onClose();
          setIsExiting(false);
        }, maxDuration);
      } else {
        onClose();
      }
    }, [animationType, backdropTiming, contentTiming, onClose]);
    useEffect(() => {
      if (!isVisible || !closeOnEscape) return;
      const handleEscape = (event) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isVisible, closeOnEscape, handleClose]);
    const handleBackdropClick = useCallback((e) => {
      if (closeOnBackdropClick) {
        handleClose();
      }
    }, [closeOnBackdropClick, handleClose]);
    const handleContentClick = useCallback((e) => {
      e.stopPropagation();
    }, []);
    useEffect(() => {
      if (isVisible && !previewMode) {
        previousFocusRef.current = document.activeElement;
        if (contentRef.current) {
          contentRef.current.focus();
        }
      }
      return () => {
        if (previousFocusRef.current && !previewMode) {
          previousFocusRef.current.focus();
        }
      };
    }, [isVisible, previewMode]);
    useEffect(() => {
      if (isVisible && !previewMode) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isVisible, previewMode]);
    useEffect(() => {
      if (previewMode) return;
      let host = document.getElementById("revenue-boost-popup-shadow-host");
      if (!host) {
        host = document.createElement("div");
        host.id = "revenue-boost-popup-shadow-host";
        host.style.cssText = "display: block; position: fixed; inset: 0; z-index: 9999; pointer-events: auto;";
        document.body.appendChild(host);
      }
      if (!host.shadowRoot) {
        const shadowRoot = host.attachShadow({ mode: "open" });
        shadowRootRef.current = shadowRoot;
        try {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(`
          * {
            box-sizing: border-box;
          }
        `);
          shadowRoot.adoptedStyleSheets = [sheet];
        } catch (e) {
          console.warn("[PopupPortal] adoptedStyleSheets not supported, falling back to style tag");
        }
      } else {
        shadowRootRef.current = host.shadowRoot;
      }
      shadowHostRef.current = host;
      return () => {
        if (host && host.parentNode) {
          host.parentNode.removeChild(host);
        }
      };
    }, [previewMode]);
    useEffect(() => {
      if (isVisible) {
        setIsMounted(true);
      } else if (!isExiting) {
        setIsMounted(false);
      }
    }, [isVisible, isExiting]);
    if (!isMounted && !isVisible) return null;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveAnimationType = prefersReducedMotion ? "none" : animationType;
    const getAnimationClass = () => {
      if (effectiveAnimationType === "none") return "";
      const direction = isExiting ? "exit" : "enter";
      return `popup-portal-${effectiveAnimationType}-${direction}`;
    };
    const backdropAnimationClass = getAnimationClass();
    const contentAnimationClass = getAnimationClass();
    const overlayStyles = {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      pointerEvents: "auto"
      // Enable pointer events in shadow DOM
    };
    const backdropStyles = {
      position: "absolute",
      inset: 0,
      background: getBackdropColor(),
      backdropFilter: backdrop.blur ? `blur(${backdrop.blur}px)` : void 0,
      animationDelay: `${backdropTiming.delay}ms`,
      animationDuration: `${backdropTiming.duration}ms`
    };
    const contentWrapperStyles = {
      animationDelay: `${contentTiming.delay}ms`,
      animationDuration: `${contentTiming.duration}ms`,
      outline: "none"
    };
    const content = /* @__PURE__ */ jsxs("div", { style: overlayStyles, role: "presentation", children: [
      /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
        * {
          box-sizing: border-box;
        }
        ${getAnimationKeyframes(previewMode, position)}
      ` } }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: backdropAnimationClass,
          style: backdropStyles,
          onClick: handleBackdropClick,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: contentRef,
          className: `popup-portal-dialog-wrapper ${contentAnimationClass}`,
          style: contentWrapperStyles,
          onClick: handleContentClick,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": ariaLabel,
          "aria-describedby": ariaDescribedBy,
          tabIndex: -1,
          children
        }
      )
    ] });
    if (previewMode) {
      return content;
    }
    if (shadowRootRef.current) {
      return createPortal2(content, shadowRootRef.current);
    }
    return null;
  };
  function getAnimationKeyframes(previewMode, position) {
    const alignMap = {
      center: "center",
      top: "flex-start",
      bottom: "flex-end",
      left: "flex-start",
      right: "flex-end"
    };
    const justifyMap = {
      center: "center",
      top: "center",
      bottom: "center",
      left: "flex-start",
      right: "flex-end"
    };
    return `
    /* Base positioning for dialog wrapper */
    .popup-portal-dialog-wrapper {
      position: absolute;
      inset: 0;
      z-index: 1;
      padding: 1rem;
      display: flex;
      align-items: ${alignMap[position]};
      justify-content: ${justifyMap[position]};
    }

    /* Fade animations */
    @keyframes popup-portal-fade-enter {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popup-portal-fade-exit {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .popup-portal-fade-enter {
      animation: popup-portal-fade-enter forwards;
      animation-timing-function: ease-out;
    }
    .popup-portal-fade-exit {
      animation: popup-portal-fade-exit forwards;
      animation-timing-function: ease-in;
    }

    /* Slide animations */
    @keyframes popup-portal-slide-enter {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes popup-portal-slide-exit {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
    .popup-portal-slide-enter {
      animation: popup-portal-slide-enter forwards;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    .popup-portal-slide-exit {
      animation: popup-portal-slide-exit forwards;
      animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
    }

    /* Zoom animations */
    @keyframes popup-portal-zoom-enter {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes popup-portal-zoom-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
    .popup-portal-zoom-enter {
      animation: popup-portal-zoom-enter forwards;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    .popup-portal-zoom-exit {
      animation: popup-portal-zoom-exit forwards;
      animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
    }

    /* Bounce animations */
    @keyframes popup-portal-bounce-enter {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
      70% {
        transform: scale(0.9);
      }
      100% {
        transform: scale(1);
      }
    }
    @keyframes popup-portal-bounce-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.8);
      }
    }
    .popup-portal-bounce-enter {
      animation: popup-portal-bounce-enter forwards;
      animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    .popup-portal-bounce-exit {
      animation: popup-portal-bounce-exit forwards;
      animation-timing-function: ease-in;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .popup-portal-fade-enter,
      .popup-portal-fade-exit,
      .popup-portal-slide-enter,
      .popup-portal-slide-exit,
      .popup-portal-zoom-enter,
      .popup-portal-zoom-exit,
      .popup-portal-bounce-enter,
      .popup-portal-bounce-exit {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;
  }

  // app/domains/storefront/popups-new/utils.ts
  function formatCurrency(amount, currency = "USD") {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const raw = (currency || "").trim();
    const upper = raw.toUpperCase();
    const symbolToCode = {
      "$": "USD",
      "\u20AC": "EUR",
      "\xA3": "GBP",
      "\xA5": "JPY",
      "C$": "CAD",
      "A$": "AUD"
    };
    let code = "USD";
    if (/^[A-Z]{3}$/.test(upper)) {
      code = upper;
    } else if (raw in symbolToCode) {
      code = symbolToCode[raw];
    }
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code
      }).format(numAmount);
    } catch {
      const sign = numAmount < 0 ? "-" : "";
      const absAmount = Math.abs(numAmount || 0);
      const symbol = raw || "$";
      return `${sign}${symbol}${absAmount.toFixed(2)}`;
    }
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
    const dismissButtonStyles = {
      background: "transparent",
      border: "none",
      padding: 0,
      marginTop: "4px",
      color: config.textColor,
      fontSize: "14px",
      opacity: 0.7,
      cursor: "pointer",
      textDecoration: "underline",
      alignSelf: "center",
      transition: "opacity 0.15s ease-out"
    };
    useEffect(() => {
      if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;
      const timer = setTimeout(onClose, config.autoCloseDelay * 1e3);
      return () => clearTimeout(timer);
    }, [isVisible, config.autoCloseDelay, onClose]);
    if (!isVisible) return null;
    return /* @__PURE__ */ jsx(
      PopupPortal,
      {
        isVisible,
        onClose,
        backdrop: {
          color: config.overlayColor || "rgba(0, 0, 0, 1)",
          opacity: config.overlayOpacity ?? 0.6,
          blur: 4
        },
        animation: {
          type: config.animation || "fade"
        },
        position: config.position || "center",
        closeOnEscape: config.closeOnEscape !== false,
        closeOnBackdropClick: config.closeOnOverlayClick !== false,
        previewMode: config.previewMode,
        ariaLabel: config.ariaLabel || config.headline,
        ariaDescribedBy: config.ariaDescribedBy,
        children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "20px" }, children: [
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
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                style: dismissButtonStyles,
                onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                onMouseLeave: (e) => e.currentTarget.style.opacity = "0.7",
                children: config.dismissLabel || "No thanks"
              }
            )
          ] })
        ] })
      }
    );
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
