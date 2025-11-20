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
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
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
    const prefersReducedMotion2 = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveAnimationType = prefersReducedMotion2 ? "none" : animationType;
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

  // app/domains/storefront/popups-new/SpinToWinPopup.tsx
  var SpinToWinPopup = ({
    config,
    isVisible,
    onClose,
    onSpin,
    onWin
  }) => {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [gdprError, setGdprError] = useState("");
    const [hasSpun, setHasSpun] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [wonPrize, setWonPrize] = useState(null);
    const [codeError, setCodeError] = useState("");
    const [rotation, setRotation] = useState(0);
    const rotationRef = useRef(0);
    const spinAnimationFrameRef = useRef(null);
    const spinStartTimeRef = useRef(null);
    const spinFromRef = useRef(0);
    const spinToRef = useRef(0);
    useEffect(() => {
      rotationRef.current = rotation;
    }, [rotation]);
    useEffect(() => {
      return () => {
        if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(spinAnimationFrameRef.current);
        }
      };
    }, []);
    const [showContent, setShowContent] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const canvasRef = useRef(null);
    const wheelContainerRef = useRef(null);
    const wheelCellRef = useRef(null);
    const cardRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(null);
    const [cardWidth, setCardWidth] = useState(null);
    const [wheelSize, setWheelSize] = useState(config.wheelSize || 380);
    const radius = wheelSize / 2;
    const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
    const segmentAngle = 360 / Math.max(1, segments.length);
    const accentColor = config.accentColor || config.buttonColor || "#000000";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 16 : config.borderRadius ?? 16;
    const animDuration = config.animationDuration ?? 300;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : null;
    const effectiveWidth = cardWidth ?? viewportWidth;
    const isMobile = effectiveWidth !== null ? effectiveWidth < 640 : false;
    const updateWheelSize = useCallback(() => {
      if (typeof window === "undefined") return;
      const container = wheelCellRef.current;
      if (!container) return;
      const measuredWidth = container.clientWidth;
      const measuredHeight = container.clientHeight;
      console.log("[SpinToWin] updateWheelSize", {
        containerSize: `${measuredWidth}x${measuredHeight}`,
        isMobile,
        container
      });
      if (!measuredWidth || !measuredHeight) return;
      let newSize;
      if (isMobile) {
        newSize = measuredWidth;
      } else {
        newSize = measuredHeight;
      }
      console.log("[SpinToWin] Calculated newSize", newSize);
      newSize = Math.max(250, newSize);
      setWheelSize(newSize);
    }, [isMobile]);
    const debouncedUpdateWheelSize = useMemo(
      () => debounce(updateWheelSize, 100),
      [updateWheelSize]
    );
    useEffect(() => {
      debouncedUpdateWheelSize();
    }, [cardWidth, debouncedUpdateWheelSize]);
    useEffect(() => {
      if (!isVisible || typeof window === "undefined") return;
      let frameId = null;
      const runInitialMeasure = () => {
        frameId = window.requestAnimationFrame(() => {
          updateWheelSize();
        });
      };
      runInitialMeasure();
      window.addEventListener("resize", debouncedUpdateWheelSize);
      return () => {
        if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frameId);
        }
        window.removeEventListener("resize", debouncedUpdateWheelSize);
      };
    }, [isVisible, updateWheelSize, debouncedUpdateWheelSize]);
    useEffect(() => {
      if (!isVisible || typeof window === "undefined") return;
      const measureCardWidth = () => {
        if (cardRef.current) {
          setCardWidth(cardRef.current.clientWidth);
        }
      };
      measureCardWidth();
      let observer = null;
      if (typeof ResizeObserver !== "undefined" && cardRef.current) {
        observer = new ResizeObserver(() => {
          measureCardWidth();
        });
        observer.observe(cardRef.current);
      } else {
        window.addEventListener("resize", measureCardWidth);
      }
      return () => {
        if (observer) {
          observer.disconnect();
        } else {
          window.removeEventListener("resize", measureCardWidth);
        }
      };
    }, [isVisible]);
    const wheelBorderColor = config.wheelBorderColor || "#FFFFFF";
    const wheelBorderWidth = config.wheelBorderWidth ?? 3;
    const baseBackground = config.backgroundColor || "#FFFFFF";
    const backgroundStyles = baseBackground.startsWith("linear-gradient(") ? {
      backgroundImage: baseBackground,
      backgroundColor: "transparent"
    } : {
      backgroundColor: baseBackground
    };
    const inputBackground = config.inputBackgroundColor || "#FFFFFF";
    const inputTextColor = config.inputTextColor || "#111827";
    const inputBorderColor = config.inputBorderColor || "#E5E7EB";
    const successColor = config.successColor || accentColor;
    const descriptionColor = config.descriptionColor || "#6B7280";
    const collectName = config.collectName ?? false;
    const showGdpr = config.showGdprCheckbox ?? false;
    const gdprLabel = config.gdprLabel || "I agree to receive marketing emails and accept the privacy policy";
    const resultMessage = hasSpun && wonPrize ? wonPrize.generatedCode ? `You won ${wonPrize.label}!` : config.failureMessage || wonPrize.label || "Thanks for playing!" : null;
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || segments.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const logicalSize = wheelSize;
      canvas.width = logicalSize * dpr;
      canvas.height = logicalSize * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const centerX = logicalSize / 2;
      const centerY = logicalSize / 2;
      const radiusPx = logicalSize / 2 - 10;
      const segmentAngleRad = 2 * Math.PI / Math.max(1, segments.length);
      const rotationRad = rotation * Math.PI / 180;
      ctx.clearRect(0, 0, logicalSize, logicalSize);
      segments.forEach((segment, index) => {
        const baseAngle = index * segmentAngleRad - Math.PI / 2;
        const startAngle = rotationRad + baseAngle;
        const endAngle = startAngle + segmentAngleRad;
        const baseColor = segment.color || accentColor;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radiusPx, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
        const borderColor = isWinningSegment ? "#FFD700" : wheelBorderColor;
        const borderWidth = isWinningSegment ? wheelBorderWidth + 2 : wheelBorderWidth;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngleRad / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        const label = segment.label || "";
        const maxTextWidth = radiusPx * 0.6;
        const textDistance = radiusPx * 0.65;
        let fontSize = Math.max(10, logicalSize / 25);
        ctx.font = `bold ${fontSize}px sans-serif`;
        let textWidth = ctx.measureText(label).width;
        if (textWidth > maxTextWidth) {
          fontSize = fontSize * maxTextWidth / textWidth;
          ctx.font = `bold ${fontSize}px sans-serif`;
          textWidth = ctx.measureText(label).width;
        }
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        const words = label.split(" ");
        if (words.length > 1 && textWidth > maxTextWidth * 0.9) {
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          ctx.fillText(line1, textDistance, -fontSize * 0.5);
          ctx.fillText(line2, textDistance, fontSize * 0.5);
        } else {
          ctx.fillText(label, textDistance, 0);
        }
        ctx.restore();
      });
    }, [segments, wheelSize, accentColor, wheelBorderColor, wheelBorderWidth, hasSpun, wonPrize, rotation]);
    useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
      } else {
        setShowContent(false);
      }
    }, [isVisible]);
    useEffect(() => {
      if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;
      const timer = setTimeout(onClose, config.autoCloseDelay * 1e3);
      return () => clearTimeout(timer);
    }, [isVisible, config.autoCloseDelay, onClose]);
    const validateForm = useCallback(() => {
      setEmailError("");
      setNameError("");
      setGdprError("");
      if (config.emailRequired && !email.trim()) {
        setEmailError("Email required");
        return false;
      }
      if (config.emailRequired && !validateEmail(email)) {
        setEmailError("Invalid email");
        return false;
      }
      if (collectName && config.nameFieldRequired && !name.trim()) {
        setNameError("Name is required");
        return false;
      }
      if (showGdpr && config.consentFieldRequired && !gdprConsent) {
        setGdprError("You must accept the terms to continue");
        return false;
      }
      return true;
    }, [config.emailRequired, config.nameFieldRequired, config.consentFieldRequired, email, collectName, name, showGdpr, gdprConsent]);
    const handleSpin = useCallback(async () => {
      const isValid = validateForm();
      if (!isValid) return;
      setIsSpinning(true);
      setCodeError("");
      const duration = config.spinDuration || 4e3;
      const reduceMotion = prefersReducedMotion();
      if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(spinAnimationFrameRef.current);
      }
      spinFromRef.current = rotationRef.current;
      const initialTarget = rotationRef.current + 360 * 10;
      spinToRef.current = initialTarget;
      spinStartTimeRef.current = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const animate = (timestamp) => {
        if (spinStartTimeRef.current === null) return;
        const elapsed = timestamp - spinStartTimeRef.current;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);
        const current = spinFromRef.current + (spinToRef.current - spinFromRef.current) * eased;
        setRotation(current);
        if (t < 1) {
          spinAnimationFrameRef.current = requestAnimationFrame(animate);
        } else {
          spinAnimationFrameRef.current = null;
          setRotation(spinToRef.current);
          setHasSpun(true);
          setIsSpinning(false);
        }
      };
      spinAnimationFrameRef.current = requestAnimationFrame(animate);
      try {
        if (!config.previewMode && onSpin) {
          await onSpin(email);
        }
        let serverPrize = null;
        let discountCode;
        let autoApply = false;
        if (!config.previewMode && config.campaignId) {
          setIsGeneratingCode(true);
          try {
            const response = await fetch("/apps/revenue-boost/api/popups/spin-win", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaignId: config.campaignId,
                email,
                sessionId: typeof window !== "undefined" ? window.sessionStorage?.getItem("rb_session_id") : void 0,
                challengeToken: challengeTokenStore.get(config.campaignId)
              })
            });
            const data = await response.json();
            if (data.success && data.prize && data.discountCode) {
              serverPrize = {
                id: data.prize.id,
                label: data.prize.label,
                color: data.prize.color,
                probability: 0,
                generatedCode: data.discountCode
              };
              discountCode = data.discountCode;
              autoApply = data.autoApply;
            } else {
              setCodeError(data.error || "Could not generate discount code");
            }
          } catch (err) {
            console.error("API error", err);
            setCodeError("Network error");
          } finally {
            setIsGeneratingCode(false);
          }
        } else {
          const randomIdx = Math.floor(Math.random() * segments.length);
          serverPrize = segments[randomIdx];
          discountCode = "PREVIEW10";
        }
        if (serverPrize) {
          setWonPrize(serverPrize);
          const prizeIndex = segments.findIndex((s) => s.id === serverPrize?.id);
          if (prizeIndex !== -1) {
            const segmentAngle2 = 360 / segments.length;
            const segmentCenter = prizeIndex * segmentAngle2 - 90 + segmentAngle2 / 2;
            const baseTarget = -segmentCenter;
            const currentRot = rotationRef.current;
            const minSpins = 5;
            const targetRotation = currentRot + 360 * minSpins + (baseTarget - currentRot % 360);
            spinFromRef.current = currentRot;
            spinToRef.current = targetRotation;
            spinStartTimeRef.current = performance.now();
          }
          if (onWin && serverPrize) onWin(serverPrize);
          if (autoApply && discountCode && typeof window !== "undefined") {
            window.localStorage.setItem("rb_discount_code", discountCode);
          }
        }
      } catch (error) {
        console.error("Spin error:", error);
        setEmailError("Error occurred");
        setIsSpinning(false);
      }
    }, [validateForm, config, email, onSpin, segments, onWin]);
    const getInputStyles = (isFocused, hasError) => {
      const placeholderColor = inputTextColor ? `${inputTextColor}80` : "rgba(107, 114, 128, 0.5)";
      return {
        width: "100%",
        padding: "14px 16px",
        fontSize: "15px",
        border: `2px solid ${hasError ? "#EF4444" : isFocused ? accentColor : inputBorderColor}`,
        borderRadius: `${borderRadius}px`,
        backgroundColor: inputBackground,
        color: inputTextColor,
        outline: "none",
        transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      };
    };
    const buttonStyles = {
      width: "100%",
      padding: "16px 32px",
      fontSize: "16px",
      fontWeight: 600,
      border: "none",
      borderRadius: `${borderRadius}px`,
      backgroundColor: config.buttonColor || accentColor,
      color: config.buttonTextColor || "#FFFFFF",
      cursor: "pointer",
      opacity: isSpinning ? 0.6 : 1,
      transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
    const secondaryButtonStyles = {
      ...buttonStyles,
      backgroundColor: "transparent",
      color: config.textColor || "#4B5563",
      boxShadow: "none",
      cursor: "pointer",
      opacity: 0.9
    };
    const gridContainerStyles = {
      display: "grid",
      // Use minmax(0, 1fr) to ensure strictly equal tracks even if content is wide
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gridTemplateRows: isMobile ? "repeat(2, minmax(0, 1fr))" : "1fr",
      width: "100%",
      height: "100%",
      minHeight: isMobile ? "auto" : 450
    };
    const wheelCellStyles = {
      position: "relative",
      display: "flex",
      // Desktop: Right edge touches middle (justify-end of left cell)
      // Mobile: Bottom edge touches middle (align-end of top cell)
      justifyContent: isMobile ? "center" : "flex-end",
      alignItems: isMobile ? "flex-end" : "center",
      overflow: "visible",
      // Allow wheel to overflow
      padding: 0,
      zIndex: 10
    };
    const formCellStyles = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: isMobile ? "24px 16px" : "40px",
      zIndex: 20,
      backgroundColor: isMobile ? baseBackground : "transparent"
      // Ensure form is readable
    };
    const formInnerStyles = {
      maxWidth: 448,
      width: "100%",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 16
    };
    const wheelWrapperStyles = {
      position: "absolute",
      width: wheelSize,
      height: wheelSize,
      // Mobile: Bottom-center alignment
      // Desktop: Right-center alignment
      left: isMobile ? "50%" : "auto",
      bottom: isMobile ? 0 : "auto",
      right: isMobile ? "auto" : 0,
      top: isMobile ? "auto" : "50%",
      // Mobile: Rotate 90deg so 3 o'clock (East) becomes 6 o'clock (South)
      // AND center horizontally (translateX -50%)
      // Desktop: Center vertically (translateY -50%)
      transform: isMobile ? "translateX(-50%) rotate(90deg)" : "translateY(-50%)",
      transformOrigin: "center center",
      transition: "transform 0.3s ease",
      zIndex: 10
    };
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
          type: config.animation || "fade",
          duration: animDuration
        },
        position: "center",
        size: config.size || "large",
        closeOnEscape: config.closeOnEscape !== false,
        closeOnBackdropClick: config.closeOnOverlayClick !== false,
        previewMode: config.previewMode,
        ariaLabel: config.ariaLabel || config.headline,
        ariaDescribedBy: config.ariaDescribedBy,
        children: [
          /* @__PURE__ */ jsx("style", { children: `
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Dynamic placeholder color based on inputTextColor */
          .spin-to-win-input::placeholder {
            color: ${inputTextColor ? `${inputTextColor}80` : "rgba(107, 114, 128, 0.5)"};
            opacity: 1;
          }
        ` }),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                opacity: showContent ? 1 : 0,
                transition: `opacity ${animDuration}ms ease-out`
              },
              children: /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: cardRef,
                  style: {
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    padding: isMobile ? "24px 16px" : "40px 40px",
                    borderRadius: 0,
                    boxShadow: "none",
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: "100vh",
                    margin: "0 auto",
                    overflow: "hidden",
                    ...backgroundStyles
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: onClose,
                        "aria-label": config.closeLabel || "Close popup",
                        style: {
                          position: "absolute",
                          top: isMobile ? 12 : 16,
                          right: isMobile ? 12 : 16,
                          width: 32,
                          height: 32,
                          borderRadius: 9999,
                          border: "none",
                          backgroundColor: "rgba(15,23,42,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: config.textColor || "#4B5563",
                          boxShadow: "0 1px 3px rgba(15,23,42,0.15)"
                        },
                        children: /* @__PURE__ */ jsx("span", { style: { fontSize: 18, lineHeight: 1 }, children: "X" })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: gridContainerStyles, children: [
                      /* @__PURE__ */ jsx("div", { style: wheelCellStyles, ref: wheelCellRef, children: /* @__PURE__ */ jsxs("div", { style: wheelWrapperStyles, children: [
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            ref: wheelContainerRef,
                            style: {
                              position: "relative",
                              width: "100%",
                              height: "100%",
                              filter: hasSpun ? "drop-shadow(0 18px 45px rgba(15,23,42,0.55))" : "drop-shadow(0 10px 30px rgba(15,23,42,0.35))"
                            },
                            children: /* @__PURE__ */ jsx(
                              "canvas",
                              {
                                ref: canvasRef,
                                width: wheelSize,
                                height: wheelSize,
                                style: {
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%"
                                }
                              }
                            )
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              top: "50%",
                              right: -12,
                              // Slightly overlapping or just outside
                              transform: "translateY(-50%)",
                              width: 0,
                              height: 0,
                              borderTop: "16px solid transparent",
                              borderBottom: "16px solid transparent",
                              borderRight: "24px solid #FFFFFF",
                              // Points Left
                              filter: "drop-shadow(-2px 0 4px rgba(0,0,0,0.2))",
                              zIndex: 20
                            }
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 80,
                              height: 80,
                              borderRadius: "50%",
                              backgroundColor: accentColor,
                              border: "4px solid rgba(15,23,42,0.85)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#F9FAFB",
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              boxShadow: "0 4px 12px rgba(15,23,42,0.4)",
                              pointerEvents: "none",
                              zIndex: 15
                            },
                            children: "SPIN"
                          }
                        )
                      ] }) }),
                      /* @__PURE__ */ jsx("div", { style: formCellStyles, children: /* @__PURE__ */ jsxs("div", { style: formInnerStyles, children: [
                        /* @__PURE__ */ jsxs("div", { style: { marginBottom: 24 }, children: [
                          /* @__PURE__ */ jsx(
                            "h2",
                            {
                              style: {
                                fontSize: "28px",
                                fontWeight: 700,
                                margin: "0 0 8px 0",
                                lineHeight: 1.3,
                                color: config.textColor || "#111827",
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: config.headline
                            }
                          ),
                          !hasSpun && config.subheadline && /* @__PURE__ */ jsx(
                            "p",
                            {
                              style: {
                                fontSize: "16px",
                                margin: 0,
                                color: config.textColor || "#6B7280",
                                lineHeight: 1.5,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: config.subheadline
                            }
                          ),
                          hasSpun && resultMessage && /* @__PURE__ */ jsx(
                            "div",
                            {
                              style: {
                                marginTop: 12,
                                padding: "12px 16px",
                                borderRadius: 9999,
                                backgroundColor: wonPrize?.generatedCode ? successColor : "#374151",
                                // Dark gray for failure message
                                color: "#FFFFFF",
                                // Always white text for good contrast
                                fontSize: "14px",
                                fontWeight: 500,
                                textAlign: "center",
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: resultMessage
                            }
                          )
                        ] }),
                        collectName && /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: "400px" }, children: [
                          /* @__PURE__ */ jsx(
                            "label",
                            {
                              style: {
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: config.textColor || "#374151",
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: "Name"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              className: "spin-to-win-input",
                              value: name,
                              onChange: (e) => {
                                setName(e.target.value);
                                if (nameError) setNameError("");
                              },
                              placeholder: config.nameFieldPlaceholder || "Enter your name",
                              style: getInputStyles(false, !!nameError),
                              disabled: isSpinning || hasSpun
                            }
                          ),
                          nameError && /* @__PURE__ */ jsx(
                            "p",
                            {
                              style: {
                                color: "#EF4444",
                                fontSize: "13px",
                                margin: "6px 0 0 0",
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: nameError
                            }
                          )
                        ] }),
                        config.emailRequired && /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: "400px" }, children: [
                          config.emailLabel && /* @__PURE__ */ jsx("label", { style: {
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: config.textColor || "#374151",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }, children: config.emailLabel }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "email",
                              className: "spin-to-win-input",
                              value: email,
                              onChange: (e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError("");
                              },
                              onFocus: () => setEmailFocused(true),
                              onBlur: () => setEmailFocused(false),
                              placeholder: config.emailPlaceholder || "your@email.com",
                              style: getInputStyles(emailFocused, !!emailError),
                              disabled: isSpinning || hasSpun
                            }
                          ),
                          emailError && /* @__PURE__ */ jsx("p", { style: {
                            color: "#EF4444",
                            fontSize: "13px",
                            margin: "6px 0 0 0",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }, children: emailError })
                        ] }),
                        showGdpr && /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: "400px" }, children: [
                          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "8px" }, children: [
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                id: "spin-gdpr",
                                type: "checkbox",
                                checked: gdprConsent,
                                onChange: (e) => {
                                  setGdprConsent(e.target.checked);
                                  if (gdprError) setGdprError("");
                                },
                                style: {
                                  width: "16px",
                                  height: "16px",
                                  marginTop: "2px",
                                  cursor: "pointer"
                                },
                                disabled: isSpinning || hasSpun
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "label",
                              {
                                htmlFor: "spin-gdpr",
                                style: {
                                  fontSize: "13px",
                                  lineHeight: 1.5,
                                  color: config.textColor || "#4B5563",
                                  cursor: "pointer",
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                },
                                children: gdprLabel
                              }
                            )
                          ] }),
                          gdprError && /* @__PURE__ */ jsx(
                            "p",
                            {
                              style: {
                                color: "#EF4444",
                                fontSize: "13px",
                                margin: "6px 0 0 0",
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              },
                              children: gdprError
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: handleSpin,
                            disabled: isSpinning || hasSpun,
                            style: {
                              ...buttonStyles,
                              cursor: isSpinning || hasSpun ? "not-allowed" : "pointer"
                            },
                            onMouseEnter: (e) => {
                              if (!isSpinning && !hasSpun) {
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }
                            },
                            onMouseLeave: (e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                            },
                            children: isSpinning ? /* @__PURE__ */ jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }, children: [
                              /* @__PURE__ */ jsx("span", { style: {
                                width: "16px",
                                height: "16px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#FFF",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite"
                              } }),
                              config.loadingText || "Spinning..."
                            ] }) : config.spinButtonText || "Spin to Win!"
                          }
                        ),
                        !hasSpun && /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: onClose,
                            style: {
                              ...secondaryButtonStyles,
                              marginTop: "8px"
                            },
                            onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                            onMouseLeave: (e) => e.currentTarget.style.opacity = "0.9",
                            children: config.dismissLabel || "No thanks"
                          }
                        ),
                        wonPrize?.generatedCode && /* @__PURE__ */ jsxs("div", { style: {
                          width: "100%",
                          maxWidth: "400px",
                          marginTop: "8px",
                          padding: "24px",
                          backgroundColor: inputBackground,
                          borderRadius: `${borderRadius}px`,
                          border: `1px solid ${inputBorderColor}`,
                          animation: "slideUpFade 0.6s ease-out"
                        }, children: [
                          isGeneratingCode ? /* @__PURE__ */ jsx("p", { style: {
                            fontSize: "15px",
                            margin: "0",
                            color: descriptionColor,
                            fontWeight: 500,
                            textAlign: "center",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }, children: "Generating your discount code..." }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
                            /* @__PURE__ */ jsx("p", { style: {
                              fontSize: "13px",
                              margin: "0 0 12px 0",
                              color: descriptionColor,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              textAlign: "center"
                            }, children: "Your Discount Code" }),
                            /* @__PURE__ */ jsx("div", { style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "12px",
                              flexWrap: "wrap"
                            }, children: /* @__PURE__ */ jsx("code", { style: {
                              fontSize: "28px",
                              fontWeight: 700,
                              padding: "12px 24px",
                              backgroundColor: "#FFFFFF",
                              borderRadius: `${borderRadius - 4}px`,
                              letterSpacing: "2px",
                              color: accentColor,
                              border: `2px solid ${successColor}`,
                              fontFamily: "SF Mono, Monaco, Consolas, monospace"
                            }, children: wonPrize.generatedCode }) }),
                            /* @__PURE__ */ jsx("p", { style: {
                              fontSize: "14px",
                              margin: "16px 0 0 0",
                              color: descriptionColor,
                              fontWeight: 500,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              textAlign: "center"
                            }, children: wonPrize.label }),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => {
                                  if (typeof navigator !== "undefined" && navigator.clipboard && wonPrize.generatedCode) {
                                    navigator.clipboard.writeText(wonPrize.generatedCode).then(() => console.log("[Spin-to-Win] Code copied to clipboard")).catch((err) => console.error("[Spin-to-Win] Copy failed:", err));
                                  }
                                },
                                style: {
                                  marginTop: "12px",
                                  padding: "10px 20px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: accentColor,
                                  backgroundColor: "transparent",
                                  border: `2px solid ${accentColor}`,
                                  borderRadius: `${borderRadius}px`,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                },
                                onMouseEnter: (e) => {
                                  e.currentTarget.style.backgroundColor = accentColor;
                                  e.currentTarget.style.color = "#FFFFFF";
                                },
                                onMouseLeave: (e) => {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = accentColor;
                                },
                                children: "Copy Code"
                              }
                            )
                          ] }),
                          codeError && /* @__PURE__ */ jsx("p", { style: {
                            fontSize: "13px",
                            margin: "12px 0 0 0",
                            color: "#EF4444",
                            fontWeight: 500,
                            textAlign: "center"
                          }, children: codeError })
                        ] })
                      ] }) })
                    ] })
                  ]
                }
              )
            }
          )
        ]
      }
    );
  };

  // extensions/storefront-src/bundles/spin-to-win.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["SPIN_TO_WIN"] = SpinToWinPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Spin to Win popup registered");
    }
  })();
})();
