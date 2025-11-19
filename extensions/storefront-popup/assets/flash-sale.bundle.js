"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal, createContext } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo, useContext, useDebugValue } = window.RevenueBoostPreact.hooks;

  // global-preact:global-preact:react-dom
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var render2 = window.RevenueBoostPreact.render;
  var createPortal2 = window.RevenueBoostPreact.createPortal;
  var global_preact_react_dom_default = { render: window.RevenueBoostPreact.render, createPortal: window.RevenueBoostPreact.createPortal };

  // app/domains/storefront/popups-new/utils.ts
  function getSizeDimensions(size, previewMode) {
    if (previewMode) {
      switch (size) {
        case "small":
          return { width: "50%", maxWidth: "400px" };
        case "medium":
          return { width: "65%", maxWidth: "600px" };
        case "large":
          return { width: "90%", maxWidth: "900px" };
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
    size,
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
    const frameStyles = useMemo(() => {
      if (!size) return void 0;
      const { width, maxWidth } = getSizeDimensions(size, previewMode);
      return {
        width,
        maxWidth,
        margin: "0 auto"
      };
    }, [size, previewMode]);
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
          children: frameStyles ? /* @__PURE__ */ jsx("div", { className: "popup-portal-frame", style: frameStyles, children }) : children
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
      /* Enable container queries for popup content (e.g. mobile full-width layouts) */
      container-type: inline-size;
      container-name: viewport;
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

  // app/domains/storefront/popups-new/FlashSalePopup.tsx
  function calculateTimeRemaining(endTime) {
    const end = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();
    const now = Date.now();
    const diff = Math.max(0, end - now);
    return {
      total: diff,
      days: Math.floor(diff / (1e3 * 60 * 60 * 24)),
      hours: Math.floor(diff / (1e3 * 60 * 60) % 24),
      minutes: Math.floor(diff / (1e3 * 60) % 60),
      seconds: Math.floor(diff / 1e3 % 60)
    };
  }
  var FlashSalePopup = ({
    config,
    isVisible,
    onClose,
    onExpiry,
    onCtaClick,
    issueDiscount
  }) => {
    const [timeRemaining, setTimeRemaining] = useState(() => {
      const timerMode = config.timer?.mode || "duration";
      if (timerMode === "fixed_end" && config.timer?.endTimeISO) {
        return calculateTimeRemaining(config.timer.endTimeISO);
      } else if (timerMode === "personal" && config.timer?.personalWindowSeconds) {
        const endDate = new Date(Date.now() + config.timer.personalWindowSeconds * 1e3);
        return calculateTimeRemaining(endDate);
      } else if (config.endTime) {
        return calculateTimeRemaining(config.endTime);
      } else if (config.countdownDuration) {
        const endDate = new Date(Date.now() + config.countdownDuration * 1e3);
        return calculateTimeRemaining(endDate);
      }
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    });
    const [hasExpired, setHasExpired] = useState(false);
    const [inventoryTotal, setInventoryTotal] = useState(null);
    const [reservationTime, setReservationTime] = useState(null);
    const [hasClaimedDiscount, setHasClaimedDiscount] = useState(false);
    const [isClaimingDiscount, setIsClaimingDiscount] = useState(false);
    const [claimedDiscountCode, setClaimedDiscountCode] = useState(null);
    const [discountError, setDiscountError] = useState(null);
    useEffect(() => {
      if (config.previewMode) {
        if (!config.inventory || config.inventory.mode === "pseudo") {
          if (config.inventory?.pseudoMax) {
            setInventoryTotal(config.inventory.pseudoMax);
          }
        }
        return;
      }
      if (!config.inventory || config.inventory.mode === "pseudo") {
        if (config.inventory?.pseudoMax) {
          setInventoryTotal(config.inventory.pseudoMax);
        }
        return;
      }
      const fetchInventory = async () => {
        try {
          const params = new URLSearchParams();
          if (config.inventory?.productIds?.length) {
            params.set("productIds", JSON.stringify(config.inventory.productIds));
          }
          if (config.inventory?.variantIds?.length) {
            params.set("variantIds", JSON.stringify(config.inventory.variantIds));
          }
          if (config.inventory?.collectionIds?.length) {
            params.set("collectionIds", JSON.stringify(config.inventory.collectionIds));
          }
          const response = await fetch(`/apps/revenue-boost/api/inventory?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setInventoryTotal(data.total);
          }
        } catch (error) {
          console.error("[FlashSalePopup] Failed to fetch inventory:", error);
        }
      };
      fetchInventory();
      const interval = setInterval(fetchInventory, 1e4);
      return () => clearInterval(interval);
    }, [config.inventory]);
    useEffect(() => {
      if (!config.showCountdown || hasExpired) return;
      const timerMode = config.timer?.mode || "duration";
      let endTimestamp = null;
      if (timerMode === "fixed_end" && config.timer?.endTimeISO) {
        endTimestamp = new Date(config.timer.endTimeISO).getTime();
      } else if (timerMode === "personal" && config.timer?.personalWindowSeconds) {
        endTimestamp = Date.now() + config.timer.personalWindowSeconds * 1e3;
      } else if (config.endTime) {
        endTimestamp = new Date(config.endTime).getTime();
      } else if (config.countdownDuration) {
        endTimestamp = Date.now() + config.countdownDuration * 1e3;
      }
      if (!endTimestamp) return;
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, endTimestamp - now);
        const newTime = {
          total: diff,
          days: Math.floor(diff / (1e3 * 60 * 60 * 24)),
          hours: Math.floor(diff / (1e3 * 60 * 60) % 24),
          minutes: Math.floor(diff / (1e3 * 60) % 60),
          seconds: Math.floor(diff / 1e3 % 60)
        };
        setTimeRemaining(newTime);
        if (newTime.total <= 0) {
          setHasExpired(true);
          if (onExpiry) {
            onExpiry();
          }
          const onExpireAction = config.timer?.onExpire || "auto_hide";
          if (onExpireAction === "auto_hide" || config.hideOnExpiry || config.autoHideOnExpire) {
            setTimeout(() => onClose(), config.autoHideOnExpire ? 2e3 : 0);
          }
        }
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1e3);
      return () => clearInterval(timer);
    }, [
      config.showCountdown,
      config.timer?.mode,
      config.timer?.endTimeISO,
      config.timer?.personalWindowSeconds,
      config.endTime,
      config.countdownDuration,
      hasExpired,
      onExpiry,
      onClose
    ]);
    useEffect(() => {
      if (!config.reserve?.enabled || !config.reserve?.minutes) {
        setReservationTime(null);
        return;
      }
      const reservationEnd = new Date(Date.now() + config.reserve.minutes * 60 * 1e3);
      const updateReservation = () => {
        const remaining = calculateTimeRemaining(reservationEnd);
        setReservationTime(remaining);
        if (remaining.total <= 0) {
          setReservationTime(null);
        }
      };
      updateReservation();
      const interval = setInterval(updateReservation, 1e3);
      return () => clearInterval(interval);
    }, [config.reserve]);
    const isPreview = config.previewMode;
    const discount = config.discount ?? config.discount;
    const hasDiscount = isPreview ? true : !!discount?.enabled;
    const isSoldOut = inventoryTotal !== null && inventoryTotal <= 0;
    const isSoldOutAndMissed = isSoldOut && config.inventory?.soldOutBehavior === "missed_it";
    const getCartSubtotalCents = () => {
      const total = config.currentCartTotal;
      if (typeof total === "number" && Number.isFinite(total)) {
        return Math.round(total * 100);
      }
      return void 0;
    };
    const getCtaLabel = () => {
      if (hasExpired || isSoldOutAndMissed) {
        return config.buttonText || config.ctaText || "Offer unavailable";
      }
      if (isClaimingDiscount) {
        return "Applying...";
      }
      if (hasDiscount && !hasClaimedDiscount) {
        return config.buttonText || config.ctaText || "Get this offer";
      }
      return config.buttonText || config.ctaText || "Shop Now";
    };
    const handleCtaClick = async () => {
      const canClaimDiscount = hasDiscount && !hasClaimedDiscount && !hasExpired && !isSoldOutAndMissed;
      if (canClaimDiscount) {
        setDiscountError(null);
        setIsClaimingDiscount(true);
        try {
          if (issueDiscount) {
            const cartSubtotalCents = getCartSubtotalCents();
            const result = await issueDiscount(
              cartSubtotalCents ? { cartSubtotalCents } : void 0
            );
            if (result?.code) {
              setClaimedDiscountCode(result.code);
            }
            setHasClaimedDiscount(true);
          }
        } catch (error) {
          console.error("[FlashSalePopup] Failed to claim discount:", error);
          setDiscountError("Something went wrong applying your discount. Please try again.");
        } finally {
          setIsClaimingDiscount(false);
        }
        return;
      }
      if (isPreview) {
        return;
      }
      if (onCtaClick) {
        onCtaClick();
      }
      if (config.ctaUrl) {
        if (config.ctaOpenInNewTab) {
          window.open(config.ctaUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = config.ctaUrl;
        }
      }
    };
    if (!isVisible) return null;
    if (isSoldOut && config.inventory?.soldOutBehavior === "hide") {
      return null;
    }
    const getDiscountMessage = () => {
      const dc = config.discountConfig;
      if (dc?.tiers?.length) {
        const tiers = dc.tiers.map((t) => {
          const threshold = (t.thresholdCents / 100).toFixed(0);
          if (t.discount.kind === "free_shipping") return `$${threshold} free ship`;
          return `$${threshold} get ${t.discount.value}${t.discount.kind === "percentage" ? "%" : "$"} off`;
        });
        return `Spend more, save more: ${tiers.join(", ")}`;
      }
      if (dc?.bogo) {
        const buy = dc.bogo.buy.quantity;
        const get = dc.bogo.get.quantity;
        if (dc.bogo.get.discount.kind === "free_product") {
          return `Buy ${buy} Get ${get} Free`;
        }
        return `Buy ${buy} Get ${get} at ${dc.bogo.get.discount.value}% off`;
      }
      if (dc?.freeGift) {
        const min = dc.freeGift.minSubtotalCents ? `over $${(dc.freeGift.minSubtotalCents / 100).toFixed(0)}` : "";
        return `Free gift with purchase ${min}`.trim();
      }
      if (config.discountPercentage) {
        return `${config.discountPercentage}% OFF`;
      }
      return null;
    };
    const popupSize = config.popupSize || "wide";
    const maxWidth = popupSize === "compact" ? "24rem" : popupSize === "wide" ? "56rem" : popupSize === "full" ? "90%" : "32rem";
    const designSize = config.size || "medium";
    const sizeScale = designSize === "small" ? 0.9 : designSize === "large" ? 1.1 : 1;
    const effectiveMaxWidth = sizeScale === 1 ? maxWidth : `calc(${maxWidth} * ${sizeScale})`;
    const padding = popupSize === "compact" ? "2rem 1.5rem" : popupSize === "wide" || popupSize === "full" ? "3rem" : "2.5rem 2rem";
    const headlineSize = popupSize === "compact" ? "2rem" : popupSize === "wide" || popupSize === "full" ? "3rem" : "2.5rem";
    const discountSize = popupSize === "compact" ? "6rem" : popupSize === "wide" || popupSize === "full" ? "10rem" : "8rem";
    const discountMessage = getDiscountMessage();
    const presentationShowInventory = config.presentation?.showInventory !== false;
    const showInventory = presentationShowInventory && config.inventory?.showOnlyXLeft && inventoryTotal !== null && inventoryTotal <= (config.inventory?.showThreshold || 10);
    const displayMode = config.displayMode || "modal";
    if (displayMode === "banner") {
      const bannerPosition = config.position === "bottom" ? "bottom" : "top";
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("style", { children: `
          .flash-sale-banner {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .flash-sale-banner-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.25rem;
            position: relative;
            padding-right: 3.5rem;
          }
          .flash-sale-banner-left {
            flex: 1;
            min-width: 0;
          }
          .flash-sale-banner-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
            background: ${config.accentColor || "#ef4444"};
            color: ${config.backgroundColor || "#ffffff"};
          }
          .flash-sale-banner-headline {
            font-size: 1.125rem;
            font-weight: 700;
            line-height: 1.4;
            margin: 0 0 0.25rem 0;
          }
          .flash-sale-banner-subheadline {
            font-size: 0.875rem;
            line-height: 1.4;
            margin: 0;
            opacity: 0.9;
          }
          .flash-sale-banner-discount {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
          }
          .flash-sale-banner-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
          .flash-sale-banner-timer {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }
          .flash-sale-banner-timer-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            min-width: 3.25rem;
          }
          .flash-sale-banner-timer-value {
            font-size: 1.35rem;
            font-weight: 700;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }
          .flash-sale-banner-timer-label {
            font-size: 0.625rem;
            text-transform: uppercase;
            opacity: 0.85;
            margin-top: 0.15rem;
            letter-spacing: 0.5px;
          }
          .flash-sale-banner-timer-separator {
            font-size: 1.25rem;
            font-weight: 700;
            opacity: 0.6;
          }
          .flash-sale-banner-stock {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            white-space: nowrap;
          }
          .flash-sale-banner-reservation {
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0.9;
          }
          .flash-sale-banner-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .flash-sale-banner-cta {
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .flash-sale-banner-cta:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          .flash-sale-banner-cta:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .flash-sale-banner-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            padding: 0.25rem;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .flash-sale-banner-close:hover {
            opacity: 1;
          }
          .flash-sale-banner-expired {
            text-align: center;
            font-weight: 600;
            font-size: 0.875rem;
          }
          @media (max-width: 768px) {
            .flash-sale-banner-inner {
              flex-direction: column;
              padding: 1.1rem 1rem;
              gap: 0.75rem;
              text-align: center;
              padding-right: 3rem;
            }
            .flash-sale-banner-right {
              width: 100%;
              justify-content: center;
            }
            .flash-sale-banner-cta {
              width: 100%;
            }
            .flash-sale-banner-headline {
              font-size: 1rem;
            }
            .flash-sale-banner-subheadline {
              font-size: 0.8125rem;
            }
          }
        ` }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "flash-sale-banner",
            style: {
              position: "fixed",
              [bannerPosition]: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: config.backgroundColor || "#111827",
              color: config.textColor || "#ffffff",
              boxShadow: bannerPosition === "bottom" ? "0 -2px 8px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.15)"
            },
            children: /* @__PURE__ */ jsxs("div", { className: "flash-sale-banner-inner", children: [
              config.showCloseButton !== false && /* @__PURE__ */ jsx(
                "button",
                {
                  className: "flash-sale-banner-close",
                  onClick: onClose,
                  "aria-label": "Close flash sale banner",
                  children: "\xD7"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flash-sale-banner-left", children: [
                /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-badge", children: "Limited Time Offer" }),
                /* @__PURE__ */ jsx("h2", { className: "flash-sale-banner-headline", children: config.headline || "Flash Sale!" }),
                config.subheadline && /* @__PURE__ */ jsx("p", { className: "flash-sale-banner-subheadline", children: config.subheadline }),
                (claimedDiscountCode || discountMessage) && /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-discount", children: claimedDiscountCode ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                  "Use code ",
                  /* @__PURE__ */ jsx("strong", { children: claimedDiscountCode }),
                  " at checkout."
                ] }) : discountMessage })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-center", children: isSoldOut && config.inventory?.soldOutBehavior === "missed_it" ? /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-expired", children: config.inventory?.soldOutMessage || "This deal is sold out. Check back later!" }) : hasExpired ? /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-expired", children: config.timer?.expiredMessage || "Sale ended" }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
                config.showCountdown && timeRemaining.total > 0 && /* @__PURE__ */ jsxs("div", { className: "flash-sale-banner-timer", children: [
                  timeRemaining.days > 0 && /* @__PURE__ */ jsxs(Fragment2, { children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "flash-sale-banner-timer-unit",
                        style: {
                          background: config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.15)",
                          color: config.accentColor || "#ffffff"
                        },
                        children: [
                          /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-value", children: String(timeRemaining.days).padStart(2, "0") }),
                          /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-label", children: "Days" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: "flash-sale-banner-timer-separator",
                        children: ":"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flash-sale-banner-timer-unit",
                      style: {
                        background: config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.15)",
                        color: config.accentColor || "#ffffff"
                      },
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-value", children: String(timeRemaining.hours).padStart(2, "0") }),
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-label", children: "Hours" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "flash-sale-banner-timer-separator", children: ":" }),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flash-sale-banner-timer-unit",
                      style: {
                        background: config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.15)",
                        color: config.accentColor || "#ffffff"
                      },
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-value", children: String(timeRemaining.minutes).padStart(2, "0") }),
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-label", children: "Mins" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "flash-sale-banner-timer-separator", children: ":" }),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flash-sale-banner-timer-unit",
                      style: {
                        background: config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.15)",
                        color: config.accentColor || "#ffffff"
                      },
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-value", children: String(timeRemaining.seconds).padStart(2, "0") }),
                        /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-timer-label", children: "Secs" })
                      ]
                    }
                  )
                ] }),
                showInventory && inventoryTotal !== null && /* @__PURE__ */ jsxs("div", { className: "flash-sale-banner-stock", children: [
                  "\u26A1 Only ",
                  inventoryTotal,
                  " left in stock"
                ] }),
                reservationTime && reservationTime.total > 0 && /* @__PURE__ */ jsxs("div", { className: "flash-sale-banner-reservation", children: [
                  (config.reserve?.label || "Offer reserved for:") + " ",
                  reservationTime.minutes,
                  ":",
                  String(reservationTime.seconds).padStart(2, "0")
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "flash-sale-banner-right", children: (config.buttonText || config.ctaText) && /* @__PURE__ */ jsx(
                "button",
                {
                  className: "flash-sale-banner-cta",
                  onClick: handleCtaClick,
                  disabled: hasExpired || isSoldOutAndMissed || isClaimingDiscount,
                  style: {
                    background: config.buttonColor || config.accentColor || "#ffffff",
                    color: config.buttonTextColor || config.textColor || "#111827",
                    borderRadius: typeof config.borderRadius === "number" ? `${config.borderRadius}px` : config.borderRadius || "6px"
                  },
                  children: getCtaLabel()
                }
              ) })
            ] })
          }
        )
      ] });
    }
    return /* @__PURE__ */ jsxs(
      PopupPortal,
      {
        isVisible,
        onClose,
        backdrop: {
          color: config.overlayColor || "rgba(0, 0, 0, 0.7)",
          opacity: config.overlayOpacity ?? 0.7,
          blur: 4
        },
        animation: {
          type: config.animation || "zoom"
        },
        position: config.position || "center",
        closeOnEscape: config.closeOnEscape !== false,
        closeOnBackdropClick: config.closeOnOverlayClick !== false,
        previewMode: config.previewMode,
        ariaLabel: config.ariaLabel || config.headline || "Flash Sale",
        ariaDescribedBy: config.ariaDescribedBy,
        children: [
          /* @__PURE__ */ jsx("style", { children: `
        .flash-sale-container {
          position: relative;
          width: 100%;
          max-width: ${effectiveMaxWidth};
          border-radius: ${typeof config.borderRadius === "number" ? config.borderRadius : parseFloat(config.borderRadius || "16")}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor || "#ffffff"};
          color: ${config.textColor || "#111827"};
          font-family: ${config.fontFamily || "inherit"};
          container-type: inline-size;
          container-name: flash-sale;
        }

        .flash-sale-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          color: ${config.descriptionColor || config.textColor || "#52525b"};
        }

        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .flash-sale-content {
          padding: ${padding};
          text-align: center;
        }

        .flash-sale-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          text-transform: uppercase;
          background: ${config.accentColor || "#ef4444"};
          color: ${config.backgroundColor || "#ffffff"};
        }

        .flash-sale-headline {
          font-size: ${headlineSize};
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: ${config.textColor || "#111827"};
        }

        .flash-sale-supporting {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          color: ${config.descriptionColor || config.textColor || "#52525b"};
        }

        .flash-sale-discount-message {
          font-size: 1rem;
          font-weight: 600;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          background: ${config.accentColor ? `${config.accentColor}15` : "rgba(239, 68, 68, 0.1)"};
          color: ${config.accentColor || "#ef4444"};
          border: 2px solid ${config.accentColor ? `${config.accentColor}40` : "rgba(239, 68, 68, 0.25)"};
        }

        .flash-sale-urgency {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          color: ${config.descriptionColor || config.textColor || "#52525b"};
        }

        .flash-sale-timer {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-width: 4rem;
          padding: 1rem 0.75rem;
          border-radius: 0.5rem;
          background: ${config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.1)"};
          color: ${config.accentColor || "#ef4444"};
        }

        .flash-sale-timer-value {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .flash-sale-timer-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .flash-sale-inventory {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          background: ${config.accentColor ? `${config.accentColor}20` : "rgba(239, 68, 68, 0.1)"};
          color: ${config.accentColor || "#ef4444"};
        }

        .flash-sale-inventory-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: ${config.accentColor || "#ef4444"};
          animation: pulse 2s infinite;
        }

        .flash-sale-reservation {
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .flash-sale-cta {
          width: 100%;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 1.125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${config.buttonColor || config.accentColor || "#ef4444"};
          color: ${config.buttonTextColor || "#ffffff"};
        }

        .flash-sale-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .flash-sale-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .flash-sale-secondary-cta {
          margin-top: 0.75rem;
          width: 100%;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: transparent;
          color: ${config.textColor || "#e5e7eb"};
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .flash-sale-secondary-cta:hover {
          background: rgba(15, 23, 42, 0.08);
        }

        .flash-sale-expired {
          padding: 2rem;
          text-align: center;
        }

        .flash-sale-sold-out {
          padding: 2rem;
          text-align: center;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Container query for preview/device-based responsiveness */
        @container flash-sale (max-width: 640px) {
          .flash-sale-content {
            padding: 2rem 1.5rem;
          }

          .flash-sale-headline {
            font-size: 2rem;
          }

          .flash-sale-timer-unit {
            min-width: 3.5rem;
            padding: 0.75rem 0.5rem;
          }

          .flash-sale-timer-value {
            font-size: 1.5rem;
          }
        }

      ` }),
          /* @__PURE__ */ jsxs("div", { className: "flash-sale-container", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                className: "flash-sale-close",
                "aria-label": "Close popup",
                children: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            ),
            isSoldOut && config.inventory?.soldOutBehavior === "missed_it" ? /* @__PURE__ */ jsxs("div", { className: "flash-sale-sold-out", children: [
              /* @__PURE__ */ jsx("h3", { style: { marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "700" }, children: "You Missed It!" }),
              /* @__PURE__ */ jsx("p", { style: { opacity: 0.8 }, children: config.inventory.soldOutMessage || "This deal is sold out. Check back later!" })
            ] }) : hasExpired ? /* @__PURE__ */ jsxs("div", { className: "flash-sale-expired", children: [
              /* @__PURE__ */ jsx("h3", { style: { marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "700" }, children: "Sale Ended" }),
              /* @__PURE__ */ jsx("p", { style: { opacity: 0.8 }, children: config.timer?.expiredMessage || "This flash sale has expired. Check back soon for more deals!" })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flash-sale-content", children: [
              /* @__PURE__ */ jsx("div", { className: "flash-sale-badge", children: "Limited Time" }),
              /* @__PURE__ */ jsx("h2", { className: "flash-sale-headline", children: config.headline || "Flash Sale!" }),
              /* @__PURE__ */ jsx("p", { className: "flash-sale-supporting", children: config.subheadline || "Limited time offer - Don't miss out!" }),
              (claimedDiscountCode || discountMessage) && /* @__PURE__ */ jsx("div", { className: "flash-sale-discount-message", children: claimedDiscountCode ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                "Use code ",
                /* @__PURE__ */ jsx("strong", { children: claimedDiscountCode }),
                " at checkout."
              ] }) : discountMessage }),
              config.urgencyMessage && /* @__PURE__ */ jsx("div", { className: "flash-sale-urgency", children: config.urgencyMessage }),
              config.showCountdown && timeRemaining.total > 0 && /* @__PURE__ */ jsxs("div", { className: "flash-sale-timer", children: [
                timeRemaining.days > 0 && /* @__PURE__ */ jsxs("div", { className: "flash-sale-timer-unit", children: [
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-value", children: String(timeRemaining.days).padStart(2, "0") }),
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-label", children: "Days" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flash-sale-timer-unit", children: [
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-value", children: String(timeRemaining.hours).padStart(2, "0") }),
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-label", children: "Hours" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flash-sale-timer-unit", children: [
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-value", children: String(timeRemaining.minutes).padStart(2, "0") }),
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-label", children: "Mins" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flash-sale-timer-unit", children: [
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-value", children: String(timeRemaining.seconds).padStart(2, "0") }),
                  /* @__PURE__ */ jsx("div", { className: "flash-sale-timer-label", children: "Secs" })
                ] })
              ] }),
              showInventory && /* @__PURE__ */ jsxs("div", { className: "flash-sale-inventory", children: [
                /* @__PURE__ */ jsx("div", { className: "flash-sale-inventory-dot" }),
                "Only ",
                inventoryTotal,
                " left in stock!"
              ] }),
              reservationTime && reservationTime.total > 0 && /* @__PURE__ */ jsxs("div", { className: "flash-sale-reservation", children: [
                config.reserve?.label || "Offer reserved for:",
                " ",
                reservationTime.minutes,
                ":",
                String(reservationTime.seconds).padStart(2, "0"),
                config.reserve?.disclaimer && /* @__PURE__ */ jsx("div", { style: { fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.7 }, children: config.reserve.disclaimer })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleCtaClick,
                  className: "flash-sale-cta",
                  disabled: hasExpired || isSoldOutAndMissed || isClaimingDiscount,
                  children: getCtaLabel()
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "flash-sale-secondary-cta",
                  children: config.dismissLabel || "No thanks"
                }
              )
            ] })
          ] })
        ]
      }
    );
  };

  // extensions/storefront-src/bundles/flash-sale.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["FLASH_SALE"] = FlashSalePopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Flash Sale popup registered");
    }
  })();
})();
