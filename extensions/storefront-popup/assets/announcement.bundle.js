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
        return { width: "100%", maxWidth: "400px" };
      case "medium":
        return { width: "100%", maxWidth: "700px" };
      case "large":
        return { width: "100%", maxWidth: "900px" };
      default:
        return { width: "100%", maxWidth: "700px" };
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

  // app/domains/storefront/popups-new/NewsletterPopup.tsx
  var NewsletterPopup = ({
    config,
    isVisible,
    onClose,
    onSubmit
  }) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [generatedDiscountCode, setGeneratedDiscountCode] = useState(null);
    const imagePosition = config.imagePosition || "left";
    const backgroundImageMode = config.backgroundImageMode ?? (config.imageUrl ? "file" : "none");
    const imageUrl = backgroundImageMode === "none" ? void 0 : config.imageUrl;
    const title = config.headline || "Join Our Newsletter";
    const description = config.subheadline || "Subscribe to get special offers, free giveaways, and exclusive deals.";
    const buttonText = config.submitButtonText || config.buttonText || "Subscribe";
    const deliveryMode = config.discount?.deliveryMode || "show_code_fallback";
    const successMessage = config.successMessage ?? (deliveryMode === "auto_apply_only" ? "Thanks for subscribing! Your discount will be automatically applied when you checkout." : deliveryMode === "show_in_popup_authorized_only" ? "Thanks for subscribing! Your discount code is authorized for your email address only." : "Thanks for subscribing! Your discount code is ready to use.");
    const discountCode = config.discount?.enabled ? config.discount.code : void 0;
    const showGdprCheckbox = config.consentFieldEnabled ?? false;
    const gdprLabel = config.consentFieldText || "I agree to receive marketing emails and accept the privacy policy";
    const collectName = config.nameFieldEnabled ?? false;
    const sizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);
    useEffect(() => {
      if (!isVisible) {
        const timer = setTimeout(() => {
          setIsSubmitted(false);
          setEmail("");
          setName("");
          setGdprConsent(false);
          setErrors({});
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isVisible]);
    const validateForm = () => {
      const newErrors = {};
      if (config.emailRequired !== false) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
          newErrors.email = config.emailErrorMessage || "Email is required";
        } else if (!emailRegex.test(email)) {
          newErrors.email = "Please enter a valid email";
        }
      }
      if (config.nameFieldEnabled && config.nameFieldRequired && !name.trim()) {
        newErrors.name = "Name is required";
      }
      if (config.consentFieldEnabled && config.consentFieldRequired && !gdprConsent) {
        newErrors.gdpr = "You must accept the terms to continue";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setIsSubmitting(true);
      try {
        if (onSubmit) {
          const code = await onSubmit({
            email,
            name: collectName ? name : void 0,
            gdprConsent
          });
          const discountEnabled = config.discount?.enabled === true;
          if (code && discountEnabled) {
            setGeneratedDiscountCode(code);
          }
          setIsSubmitted(true);
        } else {
          const challengeToken = challengeTokenStore.get(config.campaignId);
          if (!challengeToken) {
            throw new Error("Security check failed. Please refresh the page.");
          }
          const response = await fetch("/apps/revenue-boost/api/leads/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId: config.campaignId,
              email,
              name: collectName ? name : void 0,
              sessionId: typeof window !== "undefined" ? window.sessionStorage?.getItem("rb_session_id") : void 0,
              challengeToken,
              gdprConsent
            })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Submission failed");
          }
          if (data.success) {
            if (data.discountCode) {
              setGeneratedDiscountCode(data.discountCode);
            }
            setIsSubmitted(true);
          } else {
            throw new Error(data.error || "Submission failed");
          }
        }
      } catch (error) {
        console.error("Popup form submission error:", error);
        setErrors({ email: error.message || "Something went wrong. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    };
    if (!isVisible) return null;
    const showImage = imagePosition !== "none";
    const isVertical = imagePosition === "left" || imagePosition === "right";
    const imageFirst = imagePosition === "left" || imagePosition === "top";
    const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=modern email newsletter subscription`;
    const contentClass = showImage ? isVertical ? `vertical ${imageFirst ? "" : "reverse"}` : `horizontal ${imageFirst ? "" : "reverse"}` : "single-column";
    const isGlass = config.backgroundColor?.includes("rgba") && parseFloat(config.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || "1") < 1;
    const hasGradientBg = config.backgroundColor?.includes("gradient");
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
        ariaLabel: config.ariaLabel || title,
        ariaDescribedBy: config.ariaDescribedBy,
        children: [
          /* @__PURE__ */ jsx("style", { children: `

        .email-popup-container {
          position: relative;
          width: ${sizeDimensions.width};
          max-width: ${sizeDimensions.maxWidth};
          border-radius: ${typeof config.borderRadius === "number" ? config.borderRadius : parseFloat(config.borderRadius || "12")}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: zoomIn 0.2s ease-out;
          ${isGlass ? "backdrop-filter: blur(12px);" : ""}
          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
          /* Apply font family to entire popup */
          font-family: ${config.fontFamily || "inherit"};
        }

        .email-popup-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          color: ${config.descriptionColor || "#52525b"};
        }

        .email-popup-close:hover {
          background: rgba(0, 0, 0, 0.2);
          color: ${config.descriptionColor || "#52525b"};
        }

        .email-popup-content {
          display: flex;
        }

        .email-popup-content.horizontal {
          flex-direction: column;
        }

        .email-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }

        /* Base: Mobile-first (vertical stacking)
           For left/right image positions we keep stacking order the same
           (image on top) and only change orientation on larger containers. */
        .email-popup-content.vertical {
          flex-direction: column;
        }

        .email-popup-content.vertical.reverse {
          flex-direction: column;
        }

        .email-popup-content.single-column {
          flex-direction: column;
        }

        .email-popup-content.single-column .email-popup-form-section {
          max-width: 32rem;
          margin: 0 auto;
        }

        /* Mobile-first: Image sizing */
        .email-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${config.imageBgColor || config.inputBackgroundColor || "#f4f4f5"};
          min-height: 200px;
          max-height: 300px;
        }

        .email-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Mobile-first: Form section */
        .email-popup-form-section {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: ${hasGradientBg ? config.backgroundColor : "transparent"};
        }

        .email-popup-title {
          font-size: ${config.titleFontSize || config.fontSize || "1.875rem"};
          font-weight: ${config.titleFontWeight || config.fontWeight || "700"};
          margin-bottom: 0.75rem;
          color: ${config.textColor || "#111827"};
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ""}
        }

        .email-popup-description {
          font-size: ${config.descriptionFontSize || config.fontSize || "1rem"};
          line-height: 1.6;
          margin-bottom: 1.5rem;
          color: ${config.descriptionColor || "#52525b"};
          font-weight: ${config.descriptionFontWeight || config.fontWeight || "400"};
        }

        .email-popup-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .email-popup-input-wrapper {
          position: relative;
        }

        .email-popup-input {
          width: 100%;
          height: 3rem;
          padding: 0 1rem;
          border-radius: 0.5rem;
          border: 2px solid ${config.inputBorderColor || "#d4d4d8"};
          background: ${config.inputBackgroundColor || "#ffffff"};
          color: ${config.inputTextColor || "#111827"};
          font-size: 1rem;
          transition: all 0.2s;
          outline: none;
          ${config.inputBackdropFilter ? `backdrop-filter: ${config.inputBackdropFilter};` : ""}
          ${config.inputBoxShadow ? `box-shadow: ${config.inputBoxShadow};` : ""}
        }

        .email-popup-input::placeholder {
          color: ${config.inputTextColor ? `${config.inputTextColor}80` : "#9ca3af"};
          opacity: 1;
        }

        .email-popup-input:focus {
          border-color: ${config.accentColor || config.buttonColor || "#3b82f6"};
          box-shadow: 0 0 0 3px ${config.accentColor || config.buttonColor || "#3b82f6"}33;
        }

        .email-popup-input.error {
          border-color: #ef4444;
        }

        .email-popup-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .email-popup-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: ${config.textColor || "#111827"};
        }

        .email-popup-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .email-popup-checkbox {
          margin-top: 0.25rem;
          width: 1rem;
          height: 1rem;
          cursor: pointer;
        }

        .email-popup-checkbox-label {
          font-size: 0.875rem;
          color: ${config.descriptionColor || "#52525b"};
          line-height: 1.4;
        }

        .email-popup-button {
          width: 100%;
          height: 3rem;
          border-radius: 0.5rem;
          border: none;
          background: ${config.buttonColor || "#3b82f6"};
          color: ${config.buttonTextColor || "#ffffff"};
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .email-popup-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${config.buttonColor || "#3b82f6"}40;
        }

        .email-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .email-popup-secondary-button {
          margin-top: 0.75rem;
          width: 100%;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || "#6b7280"};
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .email-popup-secondary-button:hover {
          text-decoration: underline;
        }

        .email-popup-success {
          text-align: center;
          padding: 2rem 0;
          animation: fadeInUp 0.5s ease-out;
        }

        .email-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: ${config.successColor ? `${config.successColor}20` : "#dcfce7"};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          animation: bounceIn 0.6s ease-out;
        }

        .email-popup-success-icon svg {
          stroke: ${config.successColor || "#16a34a"};
        }

        .email-popup-success-message {
          font-size: ${config.titleFontSize || config.fontSize || "1.875rem"};
          font-weight: ${config.titleFontWeight || config.fontWeight || "700"};
          color: ${config.textColor || "#111827"};
          margin-bottom: 1.5rem;
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ""}
        }

        .email-popup-discount {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: 2px dashed ${config.accentColor || config.buttonColor || "#3b82f6"};
          background: ${config.accentColor ? `${config.accentColor}15` : config.inputBackgroundColor || "#f4f4f5"};
        }

        .email-popup-discount-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: ${config.descriptionColor || "#52525b"};
        }

        .email-popup-discount-code {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: ${config.accentColor || config.buttonColor || config.textColor || "#111827"};
        }

        .email-popup-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid ${config.buttonTextColor || "#ffffff"}40;
          border-top-color: ${config.buttonTextColor || "#ffffff"};
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Container Query: Desktop layout (\u2265480px container width)
           Note: container width is capped at ~600px for medium size, so
           we use a 480px breakpoint to ensure side-by-side layout activates. */
        @container popup (min-width: 480px) {
          .email-popup-content.vertical {
            flex-direction: row;
          }

          .email-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }

          .email-popup-image {
            flex: 1;
            min-height: 500px;
            max-height: none;
          }

          .email-popup-form-section {
            flex: 1;
            padding: 3rem;
          }
        }

        /* Container Query: Mobile layout (\u2264640px container width)
           Use full width of the viewport container for a better mobile experience. */
        @container viewport (max-width: 640px) {
          .email-popup-container {
            width: 100%;
            max-width: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .email-popup-container,
          .email-popup-success,
          .email-popup-success-icon {
            animation: none;
          }
        }


      ` }),
          /* @__PURE__ */ jsxs("div", { className: "email-popup-container", style: { background: hasGradientBg ? "transparent" : config.backgroundColor || "#ffffff" }, children: [
            config.showCloseButton !== false && /* @__PURE__ */ jsx(
              "button",
              {
                className: "email-popup-close",
                onClick: onClose,
                "aria-label": "Close popup",
                children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M18 6L6 18M6 6l12 12" }) })
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: `email-popup-content ${contentClass}`,
                children: [
                  showImage && imageUrl && /* @__PURE__ */ jsx("div", { className: "email-popup-image", children: /* @__PURE__ */ jsx("img", { src: imageUrl, alt: "" }) }),
                  /* @__PURE__ */ jsx("div", { className: "email-popup-form-section", children: !isSubmitted ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                    /* @__PURE__ */ jsx("h2", { id: "popup-title", className: "email-popup-title", children: title }),
                    /* @__PURE__ */ jsx("p", { className: "email-popup-description", children: description }),
                    /* @__PURE__ */ jsxs("form", { className: "email-popup-form", onSubmit: handleSubmit, children: [
                      collectName && /* @__PURE__ */ jsxs("div", { className: "email-popup-input-wrapper", children: [
                        /* @__PURE__ */ jsx("label", { htmlFor: "name-input", className: "email-popup-label", children: "Name" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            id: "name-input",
                            type: "text",
                            className: `email-popup-input ${errors.name ? "error" : ""}`,
                            placeholder: config.nameFieldPlaceholder || "Your name",
                            value: name,
                            onChange: (e) => {
                              setName(e.target.value);
                              if (errors.name) setErrors({ ...errors, name: void 0 });
                            },
                            disabled: isSubmitting,
                            required: config.nameFieldRequired
                          }
                        ),
                        errors.name && /* @__PURE__ */ jsx("div", { className: "email-popup-error", children: errors.name })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "email-popup-input-wrapper", children: [
                        /* @__PURE__ */ jsx("label", { htmlFor: "email-input", className: "email-popup-label", children: config.emailLabel || "Email" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            id: "email-input",
                            type: "email",
                            className: `email-popup-input ${errors.email ? "error" : ""}`,
                            placeholder: config.emailPlaceholder || "Enter your email",
                            value: email,
                            onChange: (e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors({ ...errors, email: void 0 });
                            },
                            disabled: isSubmitting,
                            required: config.emailRequired !== false
                          }
                        ),
                        errors.email && /* @__PURE__ */ jsx("div", { className: "email-popup-error", children: errors.email })
                      ] }),
                      showGdprCheckbox && /* @__PURE__ */ jsxs("div", { className: "email-popup-checkbox-wrapper", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "gdpr-consent",
                            className: "email-popup-checkbox",
                            checked: gdprConsent,
                            onChange: (e) => {
                              setGdprConsent(e.target.checked);
                              if (errors.gdpr) setErrors({ ...errors, gdpr: void 0 });
                            },
                            disabled: isSubmitting,
                            required: config.consentFieldRequired
                          }
                        ),
                        /* @__PURE__ */ jsx("label", { htmlFor: "gdpr-consent", className: "email-popup-checkbox-label", children: gdprLabel })
                      ] }),
                      errors.gdpr && /* @__PURE__ */ jsx("div", { className: "email-popup-error", children: errors.gdpr }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "submit",
                          className: "email-popup-button",
                          disabled: isSubmitting,
                          children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                            /* @__PURE__ */ jsx("div", { className: "email-popup-spinner" }),
                            "Subscribing..."
                          ] }) : buttonText
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          className: "email-popup-secondary-button",
                          onClick: onClose,
                          disabled: isSubmitting,
                          children: config.dismissLabel || "No thanks"
                        }
                      )
                    ] })
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "email-popup-success", children: [
                    /* @__PURE__ */ jsx("div", { className: "email-popup-success-icon", children: /* @__PURE__ */ jsx("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", strokeWidth: "3", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) }) }),
                    /* @__PURE__ */ jsx("h3", { className: "email-popup-success-message", children: successMessage }),
                    (generatedDiscountCode || discountCode) && /* @__PURE__ */ jsxs("div", { className: "email-popup-discount", children: [
                      /* @__PURE__ */ jsx("p", { className: "email-popup-discount-label", children: "Your discount code:" }),
                      /* @__PURE__ */ jsx("p", { className: "email-popup-discount-code", children: generatedDiscountCode || discountCode })
                    ] })
                  ] }) })
                ]
              }
            )
          ] })
        ]
      }
    );
  };

  // extensions/storefront-src/bundles/announcement.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["ANNOUNCEMENT"] = NewsletterPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Announcement popup registered");
    }
  })();
})();
