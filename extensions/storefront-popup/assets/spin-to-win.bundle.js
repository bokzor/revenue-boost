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
  function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

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
    const [wonPrize, setWonPrize] = useState(null);
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
    const [copiedCode, setCopiedCode] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const canvasRef = useRef(null);
    const wheelContainerRef = useRef(null);
    const wheelSize = config.wheelSize || 380;
    const radius = wheelSize / 2;
    const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
    const segmentAngle = 360 / Math.max(1, segments.length);
    const accentColor = config.accentColor || config.buttonColor || "#000000";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 16 : config.borderRadius ?? 16;
    const animDuration = config.animationDuration ?? 300;
    const sizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      if (typeof window === "undefined") return;
      const updateIsMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      updateIsMobile();
      window.addEventListener("resize", updateIsMobile);
      return () => window.removeEventListener("resize", updateIsMobile);
    }, []);
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
      function drawPointer() {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        const pointerTipX = centerX + radiusPx - 8;
        const pointerTipY = centerY;
        const pointerBaseX = centerX + radiusPx + 22;
        const pointerBaseYOffset = 18;
        ctx.moveTo(pointerTipX, pointerTipY);
        ctx.lineTo(pointerBaseX, pointerTipY - pointerBaseYOffset);
        ctx.lineTo(pointerBaseX, pointerTipY + pointerBaseYOffset);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      drawPointer();
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
    const selectPrize = useCallback(() => {
      const totalProbability = segments.reduce((sum, seg) => sum + seg.probability, 0);
      let random = Math.random() * totalProbability;
      for (const segment of segments) {
        random -= segment.probability;
        if (random <= 0) {
          return segment;
        }
      }
      return segments[0];
    }, [segments]);
    const calculateRotation = useCallback(
      (prizeIndex) => {
        const minSpins = config.minSpins ?? 5;
        const baseRotation = minSpins * 360;
        const targetAngle = 90 - (prizeIndex + 0.5) * segmentAngle;
        return baseRotation + targetAngle;
      },
      [segmentAngle, config.minSpins]
    );
    const handleSpin = useCallback(async () => {
      setEmailError("");
      setNameError("");
      setGdprError("");
      if (config.emailRequired && !email.trim()) {
        setEmailError("Email required");
        return;
      }
      if (config.emailRequired && !validateEmail(email)) {
        setEmailError("Invalid email");
        return;
      }
      if (collectName && !name.trim()) {
        setNameError("Name is required");
        return;
      }
      if (showGdpr && !gdprConsent) {
        setGdprError("You must accept the terms to continue");
        return;
      }
      setIsSpinning(true);
      try {
        if (!config.previewMode && onSpin) {
          await onSpin(email);
        }
        const prize = selectPrize();
        const prizeIndex = segments.findIndex((s) => s.id === prize.id);
        const finalRotation = calculateRotation(prizeIndex);
        const duration = config.spinDuration || 4e3;
        const reduceMotion = prefersReducedMotion();
        if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(spinAnimationFrameRef.current);
        }
        if (reduceMotion || typeof requestAnimationFrame === "undefined") {
          setRotation(finalRotation);
        } else {
          spinFromRef.current = rotationRef.current;
          spinToRef.current = finalRotation;
          spinStartTimeRef.current = null;
          const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
          const step = (timestamp) => {
            if (spinStartTimeRef.current === null) {
              spinStartTimeRef.current = timestamp;
            }
            const elapsed = timestamp - spinStartTimeRef.current;
            const t = Math.min(1, elapsed / duration);
            const eased = easeOutCubic(t);
            const current = spinFromRef.current + (spinToRef.current - spinFromRef.current) * eased;
            setRotation(current);
            if (t < 1) {
              spinAnimationFrameRef.current = requestAnimationFrame(step);
            } else {
              spinAnimationFrameRef.current = null;
              setRotation(spinToRef.current);
            }
          };
          spinAnimationFrameRef.current = requestAnimationFrame(step);
        }
        setTimeout(() => {
          setWonPrize(prize);
          setHasSpun(true);
          setIsSpinning(false);
          if (onWin) {
            onWin(prize);
          }
        }, duration);
      } catch (error) {
        console.error("Spin error:", error);
        setEmailError("Error occurred");
        setIsSpinning(false);
      }
    }, [config, email, name, gdprConsent, collectName, showGdpr, onSpin, selectPrize, segments, calculateRotation, onWin]);
    const handleCopyCode = useCallback(async () => {
      if (wonPrize?.discountCode) {
        const success = await copyToClipboard(wonPrize.discountCode);
        if (success) {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2e3);
        }
      }
    }, [wonPrize]);
    const getInputStyles = (isFocused, hasError) => ({
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
    });
    const buttonStyles = {
      width: "100%",
      padding: "16px 32px",
      fontSize: "16px",
      fontWeight: 600,
      border: "none",
      borderRadius: `${borderRadius}px`,
      backgroundColor: config.buttonColor || accentColor,
      color: config.buttonTextColor || "#FFFFFF",
      cursor: isSpinning ? "not-allowed" : "pointer",
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
    const layoutRowStyles = {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      flexWrap: "nowrap",
      alignItems: isMobile ? "center" : "stretch",
      justifyContent: "flex-start",
      width: "100%",
      overflow: "hidden",
      gap: isMobile ? 24 : 0
    };
    const wheelColumnStyles = {
      position: "relative",
      width: isMobile ? "100%" : "60%",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: isMobile ? "center" : "flex-start",
      overflow: "visible",
      marginLeft: isMobile ? 0 : "-10%",
      marginBottom: isMobile ? 24 : 0
    };
    const formColumnStyles = {
      flex: isMobile ? "0 0 auto" : "0 1 360px",
      maxWidth: isMobile ? "100%" : 400,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      alignItems: "stretch"
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
          type: config.animation || "fade"
        },
        position: "center",
        closeOnEscape: config.closeOnEscape !== false,
        closeOnBackdropClick: config.closeOnOverlayClick !== false,
        previewMode: config.previewMode,
        ariaLabel: config.ariaLabel || config.headline,
        ariaDescribedBy: config.ariaDescribedBy,
        children: [
          /* @__PURE__ */ jsx("div", { style: {
            opacity: showContent ? 1 : 0,
            transition: `opacity ${animDuration}ms ease-out`
          }, children: /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "32px 24px",
                borderRadius: `${borderRadius}px`,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                maxWidth: sizeDimensions.maxWidth,
                width: sizeDimensions.width,
                maxHeight: "95vh",
                margin: "0 auto",
                overflowY: "auto",
                ...backgroundStyles
              },
              children: /* @__PURE__ */ jsxs("div", { style: layoutRowStyles, children: [
                /* @__PURE__ */ jsx("div", { style: wheelColumnStyles, children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: config.imagePosition === "top" || config.imagePosition === "bottom" ? "column" : "row",
                      gap: 24,
                      alignItems: "flex-start",
                      justifyContent: "flex-start"
                    },
                    children: /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          position: "relative",
                          width: wheelSize,
                          height: wheelSize
                        },
                        children: [
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
                                pointerEvents: "none"
                              },
                              children: "SPIN"
                            }
                          )
                        ]
                      }
                    )
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { style: formColumnStyles, children: [
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
                        children: hasSpun && wonPrize ? wonPrize.discountCode ? config.successMessage?.replace("{{prize}}", wonPrize.label).replace("{{code}}", wonPrize.discountCode) || `You won ${wonPrize.label}!` : config.failureMessage || wonPrize.label || "Thanks for playing!" : config.headline
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
                    )
                  ] }),
                  !hasSpun ? /* @__PURE__ */ jsxs(Fragment2, { children: [
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
                          value: name,
                          onChange: (e) => {
                            setName(e.target.value);
                            if (nameError) setNameError("");
                          },
                          placeholder: "Enter your name",
                          style: getInputStyles(false, !!nameError),
                          disabled: isSpinning
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
                          value: email,
                          onChange: (e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                          },
                          onFocus: () => setEmailFocused(true),
                          onBlur: () => setEmailFocused(false),
                          placeholder: config.emailPlaceholder || "your@email.com",
                          style: getInputStyles(emailFocused, !!emailError),
                          disabled: isSpinning
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
                            disabled: isSpinning
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
                        disabled: isSpinning,
                        style: buttonStyles,
                        onMouseEnter: (e) => {
                          if (!isSpinning) {
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
                        ] }) : config.spinButtonText || config.buttonText || "Spin the Wheel"
                      }
                    ),
                    /* @__PURE__ */ jsx(
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
                    )
                  ] }) : (
                    // Prize details - shown below the wheel
                    wonPrize?.discountCode && /* @__PURE__ */ jsxs("div", { style: {
                      width: "100%",
                      maxWidth: "400px",
                      marginTop: "8px",
                      padding: "24px",
                      backgroundColor: inputBackground,
                      borderRadius: `${borderRadius}px`,
                      border: `1px solid ${inputBorderColor}`,
                      animation: "slideUp 0.5s ease-out"
                    }, children: [
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
                      /* @__PURE__ */ jsxs("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                      }, children: [
                        /* @__PURE__ */ jsx("code", { style: {
                          fontSize: "28px",
                          fontWeight: 700,
                          padding: "12px 24px",
                          backgroundColor: "#FFFFFF",
                          borderRadius: `${borderRadius - 4}px`,
                          letterSpacing: "2px",
                          color: accentColor,
                          border: `2px solid ${successColor}`,
                          fontFamily: "SF Mono, Monaco, Consolas, monospace"
                        }, children: wonPrize.discountCode }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: handleCopyCode,
                            style: {
                              padding: "12px 20px",
                              fontSize: "14px",
                              fontWeight: 600,
                              border: `2px solid ${copiedCode ? successColor : inputBorderColor}`,
                              borderRadius: `${borderRadius - 4}px`,
                              backgroundColor: copiedCode ? successColor : "#FFFFFF",
                              color: copiedCode ? "#FFFFFF" : config.textColor || "#374151",
                              cursor: "pointer",
                              transition: `all ${animDuration}ms`,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            },
                            children: copiedCode ? "Copied!" : "Copy"
                          }
                        )
                      ] }),
                      wonPrize.discountValue && /* @__PURE__ */ jsxs("p", { style: {
                        fontSize: "15px",
                        margin: "16px 0 0 0",
                        color: config.textColor || "#374151",
                        fontWeight: 500,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        textAlign: "center"
                      }, children: [
                        wonPrize.discountType === "percentage" && `Save ${wonPrize.discountValue}%`,
                        wonPrize.discountType === "fixed_amount" && `Save $${wonPrize.discountValue}`,
                        wonPrize.discountType === "free_shipping" && "Free Shipping"
                      ] })
                    ] })
                  )
                ] })
              ] })
            }
          ) }),
          /* @__PURE__ */ jsx("style", { children: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      ` })
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
//# sourceMappingURL=spin-to-win.bundle.js.map
