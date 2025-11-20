"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
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
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
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

  // app/domains/storefront/services/challenge-token.client.ts
  function isChallengeTokenValid(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) > /* @__PURE__ */ new Date();
  }
  var ChallengeTokenStore = class {
    constructor() {
      __publicField(this, "tokens", /* @__PURE__ */ new Map());
    }
    set(campaignId, token, expiresAt) {
      this.tokens.set(campaignId, { token, expiresAt });
    }
    get(campaignId) {
      const data = this.tokens.get(campaignId);
      if (!data) return null;
      if (!isChallengeTokenValid(data.expiresAt)) {
        this.tokens.delete(campaignId);
        return null;
      }
      return data.token;
    }
    delete(campaignId) {
      this.tokens.delete(campaignId);
    }
    clear() {
      this.tokens.clear();
    }
  };
  var challengeTokenStore = new ChallengeTokenStore();

  // app/domains/storefront/popups-new/CartAbandonmentPopup.tsx
  var CartAbandonmentPopup = ({
    config,
    isVisible,
    onClose,
    cartItems = [],
    cartTotal,
    onResumeCheckout,
    onSaveForLater,
    onEmailRecovery,
    issueDiscount,
    onTrack
  }) => {
    const [timeRemaining, setTimeRemaining] = useState(() => {
      if (config.urgencyTimer) {
        const endDate = new Date(Date.now() + config.urgencyTimer * 1e3);
        return calculateTimeRemaining(endDate);
      }
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    });
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(null);
    const [emailSuccessMessage, setEmailSuccessMessage] = useState(null);
    const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
    const [discountCodeToShow, setDiscountCodeToShow] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const discountDeliveryMode = config.discount?.deliveryMode || "show_code_fallback";
    const emailSuccessCopy = config.emailSuccessMessage || (discountDeliveryMode === "auto_apply_only" ? "We'll automatically apply your discount at checkout." : discountDeliveryMode === "show_in_popup_authorized_only" ? "Your discount code is authorized for this email address only." : "Your discount code is ready to use at checkout.");
    useEffect(() => {
      if (!config.showUrgency || !config.urgencyTimer) return;
      const endDate = new Date(Date.now() + config.urgencyTimer * 1e3);
      const timer = setInterval(() => {
        const newTime = calculateTimeRemaining(endDate);
        setTimeRemaining(newTime);
        if (newTime.total <= 0) {
          clearInterval(timer);
        }
      }, 1e3);
      return () => clearInterval(timer);
    }, [config.showUrgency, config.urgencyTimer]);
    const handleResumeCheckout = useCallback(
      async () => {
        let shouldRedirect = true;
        try {
          if (config.discount?.enabled && typeof issueDiscount === "function" && !discountCodeToShow) {
            let numericTotal;
            if (typeof cartTotal === "number") {
              numericTotal = cartTotal;
            } else if (typeof cartTotal === "string") {
              const parsed = parseFloat(cartTotal);
              if (!Number.isNaN(parsed)) {
                numericTotal = parsed;
              }
            }
            const cartSubtotalCents = typeof numericTotal === "number" ? Math.round(numericTotal * 100) : void 0;
            const result = await issueDiscount(
              cartSubtotalCents ? { cartSubtotalCents } : void 0
            );
            const code = result?.code;
            const shouldShowCodeFromCta = !!code && (discountDeliveryMode === "show_code_always" || discountDeliveryMode === "show_code_fallback" || discountDeliveryMode === "show_in_popup_authorized_only");
            if (shouldShowCodeFromCta) {
              setDiscountCodeToShow(code || null);
              shouldRedirect = false;
            }
          }
        } catch (err) {
          console.error("[CartAbandonmentPopup] Failed to issue discount on resume:", err);
        }
        if (shouldRedirect) {
          if (onResumeCheckout) {
            onResumeCheckout();
          } else if (config.ctaUrl) {
            window.location.href = config.ctaUrl;
          }
        }
        if (onTrack) {
          onTrack({
            action: "resume_checkout",
            discountApplied: !!discountCodeToShow
          });
        }
      },
      [
        config.discount?.enabled,
        config.ctaUrl,
        cartTotal,
        discountCodeToShow,
        discountDeliveryMode,
        issueDiscount,
        onResumeCheckout
      ]
    );
    const handleSaveForLater = useCallback(() => {
      if (onSaveForLater) {
        onSaveForLater();
      }
      if (onTrack) {
        onTrack({ action: "save_for_later" });
      }
      onClose();
    }, [onSaveForLater, onClose]);
    const handleEmailSubmit = useCallback(
      async (e) => {
        e.preventDefault();
        setEmailError(null);
        setEmailSuccessMessage(null);
        const trimmed = email.trim();
        if (!trimmed) {
          setEmailError(config.emailErrorMessage || "Please enter your email");
          return;
        }
        if (!validateEmail(trimmed)) {
          setEmailError(config.emailErrorMessage || "Please enter a valid email");
          return;
        }
        if (!config.enableEmailRecovery) {
          handleResumeCheckout();
          return;
        }
        setIsEmailSubmitting(true);
        try {
          const challengeToken = challengeTokenStore.get(config.campaignId);
          if (!challengeToken) {
            throw new Error("Security check failed. Please refresh the page.");
          }
          const response = await fetch("/apps/revenue-boost/api/cart/email-recovery", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              campaignId: config.campaignId,
              email: trimmed,
              sessionId: typeof window !== "undefined" ? window.sessionStorage?.getItem("rb_session_id") : void 0,
              challengeToken,
              cartItems,
              cartSubtotalCents: typeof cartTotal === "number" ? Math.round(cartTotal * 100) : void 0
            })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Submission failed");
          }
          if (data.success) {
            if (data.discountCode) {
              setDiscountCodeToShow(data.discountCode);
            }
            setEmailSuccessMessage(emailSuccessCopy);
          } else {
            throw new Error(data.error || "Submission failed");
          }
        } catch (err) {
          console.error("[CartAbandonmentPopup] Email recovery failed", err);
          setEmailError(
            err.message || config.emailErrorMessage || "Something went wrong. Please try again."
          );
        } finally {
          setIsEmailSubmitting(false);
        }
      },
      [
        email,
        config.campaignId,
        config.emailErrorMessage,
        config.enableEmailRecovery,
        emailSuccessCopy,
        handleResumeCheckout,
        cartItems,
        cartTotal
      ]
    );
    const handleCopyCode = useCallback(async () => {
      if (!discountCodeToShow) return;
      try {
        const success = await copyToClipboard(discountCodeToShow);
        if (success) {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2e3);
        }
      } catch (err) {
        console.error("[CartAbandonmentPopup] Failed to copy discount code:", err);
      }
    }, [discountCodeToShow]);
    const displayItems = cartItems.slice(0, config.maxItemsToShow || 3);
    const isBottomPosition = (config.position || "center") === "bottom";
    const isEmailGateActive = !!config.enableEmailRecovery && !!config.requireEmailBeforeCheckout && !discountCodeToShow;
    const borderRadiusValue = typeof config.borderRadius === "number" ? `${config.borderRadius}px` : config.borderRadius || "16px";
    const cardMaxWidth = config.maxWidth || (config.size === "small" ? "24rem" : config.size === "large" ? "32rem" : "28rem");
    const descriptionColor = config.descriptionColor || "#6b7280";
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
    return /* @__PURE__ */ jsxs(
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
        children: [
          /* @__PURE__ */ jsx("style", { children: `
        /* Base Container (Mobile First - Bottom Sheet) */
        .cart-ab-popup-container {
          width: 100%;
          background: ${config.backgroundColor || "#ffffff"};
          color: ${config.textColor || "#111827"};
          border-radius: 1.5rem 1.5rem 0 0; /* Bottom sheet rounded top */
          padding: 1.5rem;
          box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out forwards;
          z-index: 10000;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Desktop/Tablet Overrides (Centered Card) */
        @media (min-width: 768px) {
          .cart-ab-popup-container {
            position: relative;
            bottom: auto;
            left: auto;
            right: auto;
            max-width: ${cardMaxWidth};
            border-radius: ${borderRadiusValue};
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: fadeIn 0.3s ease-out forwards;
            margin: 0 auto;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        }

        .cart-ab-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .cart-ab-header-text {
          flex: 1;
        }

        .cart-ab-title {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .cart-ab-subtitle {
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
          color: ${descriptionColor};
        }

        .cart-ab-close {
          padding: 0.5rem;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${descriptionColor};
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .cart-ab-close:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: rotate(90deg);
        }

        .cart-ab-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-ab-urgency {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          background: transparent;
          color: ${config.accentColor || "#b45309"};
          border: 1px solid ${config.accentColor || "#fcd34d"};
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          opacity: 0.9;
        }

        .cart-ab-discount {
          padding: 1rem;
          border-radius: 1rem;
          text-align: center;
          background: rgba(0, 0, 0, 0.03);
          border: 1px dashed ${config.buttonColor || "#3b82f6"};
        }

        .cart-ab-discount-label {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${descriptionColor};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cart-ab-discount-amount {
          font-size: 1.5rem;
          font-weight: 800;
          color: ${config.buttonColor || "#1d4ed8"};
        }

        .cart-ab-discount-code {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .cart-ab-items {
          border-radius: 1rem;
          border: 1px solid ${config.inputBorderColor || "rgba(0,0,0,0.1)"};
          padding: 0;
          max-height: 250px;
          overflow-y: auto;
          background: transparent;
        }

        .cart-ab-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid ${config.inputBorderColor || "rgba(0,0,0,0.1)"};
          background: transparent;
        }

        .cart-ab-item:last-child {
          border-bottom: none;
        }

        .cart-ab-item-image {
          width: 4rem;
          height: 4rem;
          border-radius: 0.5rem;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .cart-ab-item-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cart-ab-item-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        .cart-ab-item-meta {
          font-size: 0.85rem;
          color: ${descriptionColor};
        }

        .cart-ab-item-price {
          font-size: 1rem;
          font-weight: 700;
          align-self: center;
        }

        .cart-ab-more {
          padding: 0.75rem;
          text-align: center;
          font-size: 0.875rem;
          color: ${descriptionColor};
          font-weight: 500;
          background: transparent;
        }

        .cart-ab-total-section {
          background: transparent;
          border: 1px solid ${config.accentColor || "#e5e7eb"};
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cart-ab-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .cart-ab-new-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 800;
          color: ${config.successColor || "#16a34a"};
        }

        .cart-ab-savings {
          font-size: 0.9rem;
          color: ${config.successColor || "#16a34a"};
          text-align: right;
          font-weight: 600;
        }

        .cart-ab-stock-warning {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(254, 226, 226, 0.5);
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
          border: 1px solid #fecaca;
        }

        .cart-ab-footer {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-ab-primary-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: ${config.borderRadius ?? 12}px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .cart-ab-primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .cart-ab-secondary-button {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .cart-ab-email-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-ab-email-row {
          display: flex;
          flex-direction: column; /* Stack input and button for better readability */
          gap: 0.75rem;
        }

        .cart-ab-email-input {
          flex: 1;
          min-width: 0;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid ${config.inputBorderColor || "#d1d5db"};
          background: ${config.inputBackgroundColor || "#ffffff"};
          color: ${config.inputTextColor || config.textColor || "#111827"};
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cart-ab-email-input:focus {
          outline: none;
          border-color: ${config.buttonColor};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .cart-ab-dismiss-button {
          background: transparent;
          border: none;
          padding: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: ${descriptionColor};
          text-decoration: none;
          cursor: pointer;
          align-self: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .cart-ab-dismiss-button:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* Mobile specific adjustments */
        @media (max-width: 767px) {
          .cart-ab-email-row {
            flex-direction: column;
          }
          
          .cart-ab-primary-button {
            padding: 1.125rem; /* Larger touch target */
          }
        }
      ` }),
          /* @__PURE__ */ jsxs("div", { className: "cart-ab-popup-container", children: [
            /* @__PURE__ */ jsxs("div", { className: "cart-ab-header", children: [
              /* @__PURE__ */ jsxs("div", { className: "cart-ab-header-text", children: [
                /* @__PURE__ */ jsx("h2", { className: "cart-ab-title", children: config.headline }),
                config.subheadline && /* @__PURE__ */ jsx("p", { className: "cart-ab-subtitle", children: config.subheadline })
              ] }),
              config.showCloseButton !== false && /* @__PURE__ */ jsx(
                "button",
                {
                  className: "cart-ab-close",
                  onClick: onClose,
                  "aria-label": "Close popup",
                  children: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                    /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                    /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "cart-ab-body", children: [
              config.showUrgency && config.urgencyTimer && timeRemaining.total > 0 && /* @__PURE__ */ jsx("div", { className: "cart-ab-urgency", children: config.urgencyMessage?.replace(
                "{{time}}",
                `${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, "0")}`
              ) || `Complete your order in ${timeRemaining.minutes}:${String(
                timeRemaining.seconds
              ).padStart(2, "0")}` }),
              config.discount?.enabled && config.discount.code && /* @__PURE__ */ jsxs("div", { className: "cart-ab-discount", children: [
                /* @__PURE__ */ jsx("p", { className: "cart-ab-discount-label", children: "Special offer for you!" }),
                /* @__PURE__ */ jsxs("div", { className: "cart-ab-discount-amount", children: [
                  config.discount.percentage && `${config.discount.percentage}% OFF`,
                  config.discount.value && !config.discount.percentage && `$${config.discount.value} OFF`
                ] }),
                /* @__PURE__ */ jsx("code", { className: "cart-ab-discount-code", children: config.discount.code })
              ] }),
              config.showCartItems !== false && displayItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "cart-ab-items", children: [
                displayItems.map((item) => {
                  const basePrice = parseFloat(item.price);
                  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
                  const discountedPrice = config.discount?.enabled && typeof config.discount.percentage === "number" ? safeBasePrice * (1 - config.discount.percentage / 100) : safeBasePrice;
                  return /* @__PURE__ */ jsxs("div", { className: "cart-ab-item", children: [
                    item.imageUrl && /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: item.imageUrl,
                        alt: item.title,
                        className: "cart-ab-item-image"
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "cart-ab-item-main", children: [
                      /* @__PURE__ */ jsx("div", { className: "cart-ab-item-title", children: item.title }),
                      /* @__PURE__ */ jsxs("div", { className: "cart-ab-item-meta", children: [
                        "Qty: ",
                        item.quantity
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "cart-ab-item-price", children: config.discount?.enabled && typeof config.discount.percentage === "number" ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { textDecoration: "line-through", opacity: 0.6, fontSize: "0.9em" }, children: formatCurrency(safeBasePrice, config.currency) }),
                      /* @__PURE__ */ jsx("span", { style: { color: config.successColor || "#16a34a" }, children: formatCurrency(discountedPrice, config.currency) })
                    ] }) : formatCurrency(safeBasePrice, config.currency) })
                  ] }, item.id);
                }),
                cartItems.length > displayItems.length && /* @__PURE__ */ jsxs("div", { className: "cart-ab-more", children: [
                  "+",
                  cartItems.length - displayItems.length,
                  " more item",
                  cartItems.length - displayItems.length !== 1 ? "s" : ""
                ] })
              ] }),
              config.showCartTotal !== false && cartTotal && /* @__PURE__ */ jsxs("div", { className: "cart-ab-total-section", children: [
                /* @__PURE__ */ jsxs("div", { className: "cart-ab-total", children: [
                  /* @__PURE__ */ jsx("span", { children: "Total:" }),
                  /* @__PURE__ */ jsx("span", { style: {
                    textDecoration: config.discount?.enabled && (config.discount.percentage || config.discount.value) && config.discount.type !== "free_shipping" ? "line-through" : "none",
                    opacity: config.discount?.enabled && (config.discount.percentage || config.discount.value) && config.discount.type !== "free_shipping" ? 0.7 : 1
                  }, children: typeof cartTotal === "number" ? formatCurrency(cartTotal, config.currency) : cartTotal })
                ] }),
                config.discount?.enabled && (() => {
                  if (config.discount.type === "free_shipping") {
                    return /* @__PURE__ */ jsx("div", { className: "cart-ab-savings", children: "+ Free Shipping!" });
                  }
                  const numericTotal = typeof cartTotal === "number" ? cartTotal : parseFloat(String(cartTotal));
                  if (Number.isNaN(numericTotal)) {
                    return /* @__PURE__ */ jsx("div", { className: "cart-ab-savings", children: "Discount applied at checkout" });
                  }
                  let discountAmount = 0;
                  let canCalculate = false;
                  if (config.discount.percentage) {
                    discountAmount = numericTotal * (config.discount.percentage / 100);
                    canCalculate = true;
                  } else if (config.discount.value) {
                    discountAmount = config.discount.value;
                    canCalculate = true;
                  }
                  if (!canCalculate) {
                    return /* @__PURE__ */ jsx("div", { className: "cart-ab-savings", children: "Special offer applied at checkout" });
                  }
                  if (discountAmount <= 0) return null;
                  const newTotal = Math.max(0, numericTotal - discountAmount);
                  return /* @__PURE__ */ jsxs(Fragment2, { children: [
                    /* @__PURE__ */ jsxs("div", { className: "cart-ab-new-total", children: [
                      /* @__PURE__ */ jsx("span", { children: "New Total:" }),
                      /* @__PURE__ */ jsx("span", { children: formatCurrency(newTotal, config.currency) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "cart-ab-savings", children: [
                      "You save ",
                      formatCurrency(discountAmount, config.currency),
                      "!"
                    ] })
                  ] });
                })()
              ] }),
              config.showStockWarnings && /* @__PURE__ */ jsx("div", { className: "cart-ab-stock-warning", children: config.stockWarningMessage || "\u26A0\uFE0F Items in your cart are selling fast!" }),
              /* @__PURE__ */ jsxs("div", { className: "cart-ab-footer", children: [
                (config.enableEmailRecovery || config.previewMode && config.requireEmailBeforeCheckout) && /* @__PURE__ */ jsxs("form", { onSubmit: handleEmailSubmit, className: "cart-ab-email-form", children: [
                  /* @__PURE__ */ jsxs("div", { className: "cart-ab-email-row", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "email",
                        className: "cart-ab-email-input",
                        value: email,
                        onChange: (e) => setEmail(e.target.value),
                        placeholder: config.emailPlaceholder || "Enter your email to receive your cart and discount",
                        "aria-label": "Email address for cart recovery"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "submit",
                        style: buttonStyles,
                        disabled: isEmailSubmitting,
                        children: isEmailSubmitting ? "Sending\u2026" : config.emailButtonText || "Email me my cart"
                      }
                    )
                  ] }),
                  emailError && /* @__PURE__ */ jsx("p", { className: "cart-ab-email-error", children: emailError }),
                  emailSuccessMessage && /* @__PURE__ */ jsx("p", { className: "cart-ab-email-success", children: emailSuccessMessage })
                ] }),
                discountCodeToShow && /* @__PURE__ */ jsxs("div", { className: "cart-ab-code-block", children: [
                  /* @__PURE__ */ jsx("p", { className: "cart-ab-code-label", children: "Your discount code:" }),
                  /* @__PURE__ */ jsx("p", { className: "cart-ab-code-value", children: discountCodeToShow }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "cart-ab-code-copy",
                      onClick: handleCopyCode,
                      children: copiedCode ? "Copied!" : "Copy"
                    }
                  )
                ] }),
                !isEmailGateActive && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleResumeCheckout,
                    style: buttonStyles,
                    className: "cart-ab-primary-button",
                    onMouseEnter: (e) => e.currentTarget.style.transform = "translateY(-1px)",
                    onMouseLeave: (e) => e.currentTarget.style.transform = "translateY(0)",
                    children: config.buttonText || config.ctaText || "Resume Checkout"
                  }
                ),
                config.saveForLaterText && !isEmailGateActive && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleSaveForLater,
                    style: secondaryButtonStyles,
                    className: "cart-ab-secondary-button",
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
                    className: "cart-ab-dismiss-button",
                    onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                    onMouseLeave: (e) => e.currentTarget.style.opacity = "0.7",
                    children: config.dismissLabel || "No thanks"
                  }
                )
              ] })
            ] })
          ] })
        ]
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
