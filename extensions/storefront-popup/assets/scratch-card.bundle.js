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

  // app/domains/storefront/popups-new/ScratchCardPopup.tsx
  var ScratchCardPopup = ({
    config,
    isVisible,
    onClose,
    onSubmit,
    onReveal
  }) => {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [gdprError, setGdprError] = useState("");
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [isScratching, setIsScratching] = useState(false);
    const [scratchPercentage, setScratchPercentage] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [wonPrize, setWonPrize] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const canvasRef = useRef(null);
    const prizeCanvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const DEFAULT_CARD_WIDTH = 384;
    const DEFAULT_CARD_HEIGHT = 216;
    const cardWidth = config.scratchCardWidth || DEFAULT_CARD_WIDTH;
    const cardHeight = config.scratchCardHeight || DEFAULT_CARD_HEIGHT;
    const threshold = config.scratchThreshold || 50;
    const brushRadius = config.scratchRadius || 20;
    const selectPrize = useCallback(() => {
      const prizes = config.prizes || [];
      if (!prizes.length) {
        return {
          id: "default",
          label: config.successMessage || "You won! \u{1F389}",
          probability: 1
        };
      }
      const totalProbability = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);
      if (!totalProbability || !Number.isFinite(totalProbability)) {
        return prizes[0];
      }
      let random = Math.random() * totalProbability;
      for (const prize of prizes) {
        const weight = prize.probability || 0;
        random -= weight;
        if (random <= 0) {
          return prize;
        }
      }
      return prizes[0];
    }, [config.prizes, config.successMessage]);
    useEffect(() => {
      if (!canvasRef.current || !prizeCanvasRef.current) return;
      if (config.emailRequired && config.emailBeforeScratching && !emailSubmitted) return;
      const canvas = canvasRef.current;
      const prizeCanvas = prizeCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const prizeCtx = prizeCanvas.getContext("2d");
      if (!ctx || !prizeCtx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      prizeCtx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cardWidth, cardHeight);
      prizeCtx.clearRect(0, 0, cardWidth, cardHeight);
      if (config.scratchCardBackgroundColor) {
        prizeCtx.fillStyle = config.scratchCardBackgroundColor;
        prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
      } else {
        const gradient = prizeCtx.createLinearGradient(0, 0, cardWidth, cardHeight);
        gradient.addColorStop(0, config.accentColor || config.buttonColor || "#4f46e5");
        gradient.addColorStop(1, config.buttonColor || config.accentColor || "#ec4899");
        prizeCtx.fillStyle = gradient;
        prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
      }
      const prize = selectPrize();
      setWonPrize(prize);
      prizeCtx.fillStyle = config.scratchCardTextColor || config.buttonTextColor || config.textColor || "#ffffff";
      prizeCtx.font = "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      prizeCtx.textAlign = "center";
      prizeCtx.textBaseline = "middle";
      prizeCtx.fillText(prize.label, cardWidth / 2, cardHeight / 2);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = config.scratchOverlayColor || "#C0C0C0";
      ctx.fillRect(0, 0, cardWidth, cardHeight);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        config.scratchInstruction || "Scratch to reveal!",
        cardWidth / 2,
        cardHeight / 2
      );
      ctx.globalAlpha = 0.3;
      const sparkleColor = config.accentColor || config.buttonColor || "#FFFFFF";
      ctx.fillStyle = sparkleColor;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * cardWidth;
        const y = Math.random() * cardHeight;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
    }, [emailSubmitted, config, cardWidth, cardHeight, selectPrize]);
    const calculateScratchPercentage = useCallback(() => {
      if (!canvasRef.current) return 0;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      const imageData = ctx.getImageData(0, 0, cardWidth, cardHeight);
      const pixels = imageData.data;
      let transparentPixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 128) {
          transparentPixels++;
        }
      }
      return transparentPixels / (cardWidth * cardHeight) * 100;
    }, [cardWidth, cardHeight]);
    const scratch = useCallback((x, y) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, 2 * Math.PI);
      ctx.fill();
      const percentage = calculateScratchPercentage();
      setScratchPercentage(percentage);
      if (percentage >= threshold && !isRevealed) {
        setIsRevealed(true);
        if (wonPrize && onReveal) {
          onReveal(wonPrize);
        }
      }
    }, [brushRadius, calculateScratchPercentage, threshold, isRevealed, wonPrize, onReveal]);
    const getCoordinates = (e) => {
      if (!canvasRef.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width || 1;
      const scaleY = canvas.height / rect.height || 1;
      let clientX, clientY;
      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };
    const handleStart = (e) => {
      e.preventDefault();
      isDrawingRef.current = true;
      setIsScratching(true);
      const coords = getCoordinates(e);
      if (coords) {
        scratch(coords.x, coords.y);
      }
    };
    const handleMove = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      if (coords) {
        scratch(coords.x, coords.y);
      }
    };
    const handleEnd = () => {
      isDrawingRef.current = false;
      setIsScratching(false);
    };
    const handleMouseStart = (e) => handleStart(e);
    const handleMouseMove = (e) => handleMove(e);
    const handleMouseEnd = (_e) => handleEnd();
    const handleTouchStart = (e) => handleStart(e);
    const handleTouchMove = (e) => handleMove(e);
    const handleTouchEnd = (_e) => handleEnd();
    const handleEmailSubmit = useCallback(async (e) => {
      e.preventDefault();
      let hasError = false;
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        hasError = true;
      } else {
        setEmailError("");
      }
      if (config.showGdprCheckbox && !gdprConsent) {
        setGdprError("You must accept the terms to continue");
        hasError = true;
      } else {
        setGdprError("");
      }
      if (hasError) return;
      try {
        if (!config.previewMode && onSubmit) {
          await onSubmit(email);
        }
        setEmailSubmitted(true);
      } catch (error) {
        setEmailError("Something went wrong. Please try again.");
      }
    }, [email, gdprConsent, config.showGdprCheckbox, config.previewMode, onSubmit]);
    const handleCopyCode = useCallback(async () => {
      if (wonPrize?.discountCode) {
        const success = await copyToClipboard(wonPrize?.discountCode ?? "");
        if (success) {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2e3);
        }
      }
    }, [wonPrize]);
    const inputStyles = {
      width: "100%",
      padding: "12px 16px",
      fontSize: "16px",
      border: `1px solid ${config.inputBorderColor || "#D1D5DB"}`,
      borderRadius: `${config.borderRadius ?? 8}px`,
      backgroundColor: config.inputBackgroundColor || "#FFFFFF",
      color: config.inputTextColor || config.textColor || "#1F2937",
      outline: "none"
    };
    const buttonStyles = {
      width: "100%",
      padding: "14px 24px",
      fontSize: "16px",
      fontWeight: 600,
      border: "none",
      borderRadius: `${config.borderRadius ?? 8}px`,
      backgroundColor: config.buttonColor,
      color: config.buttonTextColor,
      cursor: "pointer"
    };
    const showEmailForm = config.emailRequired && config.emailBeforeScratching && !emailSubmitted;
    const showScratchCard = !showEmailForm;
    const imagePosition = config.imagePosition || "left";
    const showImage = !!config.imageUrl && imagePosition !== "none";
    const isVertical = imagePosition === "left" || imagePosition === "right";
    const imageFirst = imagePosition === "left" || imagePosition === "top";
    const baseSizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);
    const sizeDimensions = showImage && isVertical ? getSizeDimensions("large", config.previewMode) : baseSizeDimensions;
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
        children: /* @__PURE__ */ jsxs("div", { className: "scratch-popup-container", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: `scratch-popup-content ${!showImage ? "single-column" : isVertical ? "vertical" : "horizontal"} ${!imageFirst && showImage ? "reverse" : ""}`,
              children: [
                showImage && /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "scratch-popup-image",
                    style: { background: config.imageBgColor || "#F3F4F6" },
                    children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: config.imageUrl,
                        alt: config.headline || "Scratch Card"
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "scratch-popup-form-section", children: [
                  /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
                    /* @__PURE__ */ jsx(
                      "h2",
                      {
                        style: {
                          fontSize: config.titleFontSize || "28px",
                          fontWeight: config.titleFontWeight || 700,
                          margin: "0 0 8px 0",
                          textShadow: config.titleTextShadow
                        },
                        children: config.headline
                      }
                    ),
                    (config.subheadline || showEmailForm) && /* @__PURE__ */ jsx(
                      "p",
                      {
                        style: {
                          fontSize: config.descriptionFontSize || "16px",
                          fontWeight: config.descriptionFontWeight || 400,
                          margin: 0,
                          opacity: 0.8,
                          color: config.descriptionColor || config.textColor
                        },
                        children: showEmailForm ? "Enter your email below to unlock your scratch card and reveal your prize!" : config.subheadline
                      }
                    )
                  ] }),
                  showEmailForm ? (
                    // Email form
                    /* @__PURE__ */ jsxs(
                      "form",
                      {
                        onSubmit: handleEmailSubmit,
                        style: {
                          width: "100%",
                          maxWidth: "400px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          margin: "0 auto"
                        },
                        children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx(
                              "label",
                              {
                                style: {
                                  display: "block",
                                  marginBottom: "8px",
                                  fontSize: "14px",
                                  fontWeight: 600
                                },
                                children: config.emailLabel || "Email Address"
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "email",
                                value: email,
                                onChange: (e) => setEmail(e.target.value),
                                placeholder: config.emailPlaceholder || "Enter your email",
                                style: inputStyles,
                                className: `scratch-popup-input ${emailError ? "error" : ""}`,
                                required: true
                              }
                            ),
                            emailError && /* @__PURE__ */ jsx("p", { className: "scratch-popup-error", style: { margin: "6px 0 0 0" }, children: emailError })
                          ] }),
                          config.showGdprCheckbox && /* @__PURE__ */ jsxs(
                            "div",
                            {
                              style: {
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.75rem"
                              },
                              children: [
                                /* @__PURE__ */ jsx(
                                  "input",
                                  {
                                    type: "checkbox",
                                    checked: gdprConsent,
                                    onChange: (e) => {
                                      setGdprConsent(e.target.checked);
                                      if (gdprError) setGdprError("");
                                    },
                                    className: "scratch-popup-checkbox",
                                    style: {
                                      borderColor: gdprError ? "#dc2626" : config.inputBorderColor || "#d4d4d8"
                                    }
                                  }
                                ),
                                /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                                  /* @__PURE__ */ jsx(
                                    "label",
                                    {
                                      style: {
                                        fontSize: "0.875rem",
                                        lineHeight: 1.6,
                                        cursor: "pointer"
                                      },
                                      children: config.gdprLabel || "I agree to receive promotional emails"
                                    }
                                  ),
                                  gdprError && /* @__PURE__ */ jsx("div", { className: "scratch-popup-error", children: gdprError })
                                ] })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsx("button", { type: "submit", style: buttonStyles, className: "scratch-popup-button", children: "Unlock Scratch Card" })
                        ]
                      }
                    )
                  ) : showScratchCard && // Scratch card
                  /* @__PURE__ */ jsxs(Fragment2, { children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: `scratch-card-container ${isRevealed ? "revealed-animation" : ""}`,
                        style: { height: cardHeight },
                        children: [
                          /* @__PURE__ */ jsx(
                            "canvas",
                            {
                              ref: prizeCanvasRef,
                              width: cardWidth,
                              height: cardHeight,
                              style: { position: "absolute", inset: 0, width: "100%", height: "100%" }
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "canvas",
                            {
                              ref: canvasRef,
                              width: cardWidth,
                              height: cardHeight,
                              onMouseDown: handleMouseStart,
                              onMouseMove: handleMouseMove,
                              onMouseUp: handleMouseEnd,
                              onMouseLeave: handleMouseEnd,
                              onTouchStart: handleTouchStart,
                              onTouchMove: handleTouchMove,
                              onTouchEnd: handleTouchEnd,
                              className: "scratch-card-canvas",
                              style: {
                                cursor: isScratching ? "grabbing" : "grab",
                                touchAction: "none",
                                width: "100%",
                                height: "100%"
                              }
                            }
                          ),
                          isRevealed && wonPrize && wonPrize.discountCode && /* @__PURE__ */ jsx(
                            "div",
                            {
                              className: "scratch-card-code-overlay",
                              style: {
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none"
                              },
                              children: /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  style: {
                                    padding: "0.75rem 1.5rem",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    borderRadius: "0.5rem",
                                    border: "2px dashed rgba(255, 255, 255, 0.5)",
                                    backdropFilter: "blur(10px)",
                                    pointerEvents: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                  },
                                  children: [
                                    /* @__PURE__ */ jsx(
                                      "div",
                                      {
                                        style: {
                                          fontSize: "0.875rem",
                                          fontWeight: 500,
                                          color: "#ffffff",
                                          marginBottom: "0.25rem"
                                        },
                                        children: "Code:"
                                      }
                                    ),
                                    /* @__PURE__ */ jsx(
                                      "div",
                                      {
                                        style: {
                                          fontSize: "1.5rem",
                                          fontWeight: 700,
                                          color: "#ffffff",
                                          letterSpacing: "0.1em"
                                        },
                                        children: wonPrize?.discountCode ?? ""
                                      }
                                    ),
                                    /* @__PURE__ */ jsx(
                                      "button",
                                      {
                                        type: "button",
                                        onClick: handleCopyCode,
                                        className: "scratch-popup-button",
                                        style: {
                                          width: "auto",
                                          padding: "0.4rem 0.9rem",
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          borderRadius: "9999px",
                                          backgroundColor: config.buttonColor,
                                          color: config.buttonTextColor,
                                          border: "none"
                                        },
                                        children: copiedCode ? "\u2713 Copied!" : "Copy"
                                      }
                                    )
                                  ]
                                }
                              )
                            }
                          )
                        ]
                      }
                    ),
                    scratchPercentage > 0 && scratchPercentage < threshold && /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: cardWidth, margin: "0 auto" }, children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            height: "8px",
                            backgroundColor: "#E5E7EB",
                            borderRadius: "4px",
                            overflow: "hidden"
                          },
                          children: /* @__PURE__ */ jsx(
                            "div",
                            {
                              style: {
                                height: "100%",
                                width: `${scratchPercentage}%`,
                                backgroundColor: config.accentColor || config.buttonColor,
                                transition: "width 0.3s"
                              }
                            }
                          )
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "p",
                        {
                          className: "scratch-progress",
                          style: { fontSize: "12px", marginTop: "4px" },
                          children: [
                            Math.round(scratchPercentage),
                            "% revealed"
                          ]
                        }
                      )
                    ] }),
                    isRevealed && wonPrize && !wonPrize.discountCode && /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          marginTop: "16px",
                          padding: "20px",
                          backgroundColor: config.accentColor || "#F3F4F6",
                          borderRadius: "12px",
                          width: "100%",
                          maxWidth: "400px",
                          marginLeft: "auto",
                          marginRight: "auto"
                        },
                        children: /* @__PURE__ */ jsx(
                          "p",
                          {
                            style: {
                              fontSize: "14px",
                              margin: "0 0 12px 0",
                              textAlign: "center",
                              opacity: 0.8
                            },
                            children: config.successMessage || `Congratulations! You won ${wonPrize.label}.`
                          }
                        )
                      }
                    ),
                    isRevealed && config.emailRequired && !config.emailBeforeScratching && !emailSubmitted && /* @__PURE__ */ jsxs(
                      "form",
                      {
                        onSubmit: handleEmailSubmit,
                        style: {
                          marginTop: "1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                          maxWidth: "400px",
                          marginLeft: "auto",
                          marginRight: "auto"
                        },
                        children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx(
                              "label",
                              {
                                style: {
                                  display: "block",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  marginBottom: "0.5rem"
                                },
                                children: config.emailLabel || "Enter your email to claim your prize"
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "email",
                                value: email,
                                onChange: (e) => setEmail(e.target.value),
                                placeholder: config.emailPlaceholder || "Enter your email",
                                style: inputStyles,
                                className: `scratch-popup-input ${emailError ? "error" : ""}`,
                                required: true
                              }
                            ),
                            emailError && /* @__PURE__ */ jsx("div", { className: "scratch-popup-error", children: emailError }),
                            config.showGdprCheckbox && /* @__PURE__ */ jsxs(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "0.75rem",
                                  marginTop: "0.75rem"
                                },
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "input",
                                    {
                                      type: "checkbox",
                                      checked: gdprConsent,
                                      onChange: (e) => {
                                        setGdprConsent(e.target.checked);
                                        if (gdprError) setGdprError("");
                                      },
                                      className: "scratch-popup-checkbox",
                                      style: {
                                        borderColor: gdprError ? "#dc2626" : config.inputBorderColor || "#d4d4d8"
                                      }
                                    }
                                  ),
                                  /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                                    /* @__PURE__ */ jsx(
                                      "label",
                                      {
                                        style: {
                                          fontSize: "0.875rem",
                                          lineHeight: 1.6,
                                          cursor: "pointer"
                                        },
                                        children: config.gdprLabel || "I agree to receive promotional emails"
                                      }
                                    ),
                                    gdprError && /* @__PURE__ */ jsx("div", { className: "scratch-popup-error", children: gdprError })
                                  ] })
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "submit",
                              className: "scratch-popup-button",
                              style: {
                                backgroundColor: config.buttonColor,
                                color: config.buttonTextColor
                              },
                              children: config.buttonText || "Claim Prize"
                            }
                          )
                        ]
                      }
                    ),
                    emailSubmitted && !config.emailBeforeScratching && /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "2rem 0" }, children: [
                      /* @__PURE__ */ jsx("div", { className: "scratch-popup-success-icon", children: /* @__PURE__ */ jsx("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "#16a34a", strokeWidth: "3", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) }) }),
                      /* @__PURE__ */ jsx(
                        "h3",
                        {
                          style: {
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            marginBottom: "0.75rem"
                          },
                          children: "Prize Claimed!"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          style: {
                            color: config.descriptionColor || "rgba(0,0,0,0.7)",
                            lineHeight: 1.6
                          },
                          children: "Check your email for details on how to redeem your prize."
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("div", { style: { marginTop: "16px", textAlign: "center" }, children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: "scratch-popup-dismiss-button",
                        onClick: onClose,
                        children: config.dismissLabel || "No thanks"
                      }
                    ) })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("style", { children: `
        .scratch-popup-container {
          position: relative;
          width: ${sizeDimensions.width};
          max-width: ${sizeDimensions.maxWidth};
          margin: 0 auto;
          border-radius: ${typeof config.borderRadius === "number" ? config.borderRadius : parseFloat(String(config.borderRadius || 16))}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor};
          color: ${config.textColor};
          container-type: inline-size;
          container-name: scratch-popup;
          font-family: ${config.fontFamily || "inherit"};
        }

        @container viewport (max-width: 640px) {
          .scratch-popup-container {
            width: 100%;
            max-width: 100%;
          }
        }

        .scratch-popup-content {
          display: flex;
        }

        .scratch-popup-content.horizontal {
          flex-direction: column;
        }

        .scratch-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }

        .scratch-popup-content.vertical {
          flex-direction: column;
        }

        .scratch-popup-content.vertical.reverse {
          flex-direction: column;
        }

        .scratch-popup-content.single-column {
          flex-direction: column;
        }

        .scratch-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scratch-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scratch-popup-form-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.25rem;
        }

        .scratch-card-container {
          position: relative;
          width: 100%;
          max-width: min(24rem, 90vw);
          margin: 0 auto 1.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }

        .scratch-card-canvas {
          position: absolute;
          inset: 0;
          cursor: pointer;
          touch-action: none;
        }

        .scratch-progress {
          font-size: 0.875rem;
          text-align: center;
          margin-top: 0.5rem;
          opacity: 0.7;
        }

        .scratch-popup-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .scratch-popup-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
        }

        .scratch-popup-input.error {
          border-color: #dc2626;
        }

        .scratch-popup-checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid;
          cursor: pointer;
          flex-shrink: 0;
        }

        .scratch-popup-button {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-size: 0.875rem;
        }

        .scratch-popup-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .scratch-popup-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .scratch-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .scratch-popup-dismiss-button {
          margin-top: 0.75rem;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || "rgba(15, 23, 42, 0.7)"};
          font-size: 0.875rem;
          cursor: pointer;
        }

        .scratch-popup-dismiss-button:hover {
          text-decoration: underline;
        }

        .scratch-popup-error {
          font-size: 0.875rem;
          color: #dc2626;
          margin-top: 0.25rem;
        }

        .scratch-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .revealed-animation {
          animation: pulse 0.5s ease-out;
        }

        /* Container Query: Desktop-ish layout (\u2265480px container width)
           Match NewsletterPopup behavior so left/right images go side-by-side
           once the popup has enough width, even inside the editor preview. */
        @container scratch-popup (min-width: 480px) {
          .scratch-popup-content.vertical {
            flex-direction: row;
          }

          .scratch-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }

          .scratch-popup-content.horizontal .scratch-popup-image {
            height: 16rem;
          }

          .scratch-popup-content.vertical .scratch-popup-image {
            width: 50%;
            height: auto;
            min-height: 400px;
          }

          .scratch-popup-content.vertical .scratch-popup-form-section {
            width: 50%;
          }

          .scratch-popup-form-section {
            padding: 3.5rem 3rem;
          }

          .scratch-popup-content.single-column .scratch-popup-form-section {
            max-width: 36rem;
            margin: 0 auto;
          }
        }

        /* Container Query: Mobile layout (640px container width)
           Use full width for the popup and constrain image height. */
        @container scratch-popup (max-width: 640px) {
          .scratch-popup-content.horizontal .scratch-popup-image,
          .scratch-popup-content.vertical .scratch-popup-image {
            height: 12rem;
          }
        }

      ` })
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/scratch-card.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["SCRATCH_CARD"] = ScratchCardPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Scratch Card popup registered");
    }
  })();
})();
