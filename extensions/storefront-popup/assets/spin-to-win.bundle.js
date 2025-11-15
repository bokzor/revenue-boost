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
    const [copiedCode, setCopiedCode] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const wheelRef = useRef(null);
    const wheelSize = config.wheelSize || 380;
    const radius = wheelSize / 2;
    const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
    const segmentAngle = 360 / Math.max(1, segments.length);
    const accentColor = config.accentColor || config.buttonColor || "#000000";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 16 : config.borderRadius ?? 16;
    const animDuration = config.animationDuration ?? 300;
    const collectName = config.collectName ?? false;
    const showGdpr = config.showGdprCheckbox ?? false;
    const gdprLabel = config.gdprLabel || "I agree to receive marketing emails and accept the privacy policy";
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
    const calculateRotation = useCallback((prizeIndex) => {
      const minSpins = config.minSpins || 5;
      const baseRotation = minSpins * 360;
      const segmentRotation = prizeIndex * segmentAngle;
      const centerOffset = segmentAngle / 2;
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.5);
      return baseRotation + (360 - segmentRotation) + centerOffset + randomOffset;
    }, [segmentAngle, config.minSpins]);
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
        const finalRotation = rotation + calculateRotation(prizeIndex);
        setRotation(finalRotation);
        const duration = config.spinDuration || 4e3;
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
    }, [config, email, name, gdprConsent, collectName, showGdpr, onSpin, selectPrize, segments, rotation, calculateRotation, onWin]);
    const handleCopyCode = useCallback(async () => {
      if (wonPrize?.discountCode) {
        const success = await copyToClipboard(wonPrize.discountCode);
        if (success) {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2e3);
        }
      }
    }, [wonPrize]);
    const renderWheel = () => {
      return segments.map((segment, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);
        const x1 = radius + radius * Math.cos(startRad);
        const y1 = radius + radius * Math.sin(startRad);
        const x2 = radius + radius * Math.cos(endRad);
        const y2 = radius + radius * Math.sin(endRad);
        const largeArc = segmentAngle > 180 ? 1 : 0;
        const pathData = [
          `M ${radius} ${radius}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
          "Z"
        ].join(" ");
        const baseColor = segment.color || accentColor;
        const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
        const strokeColor = isWinningSegment ? "#FFD700" : "#FFFFFF";
        const strokeWidth = isWinningSegment ? 8 : 3;
        const textAngle = startAngle + segmentAngle / 2;
        const textRad = (textAngle - 90) * (Math.PI / 180);
        const textRadius = radius * 0.68;
        const textX = radius + textRadius * Math.cos(textRad);
        const textY = radius + textRadius * Math.sin(textRad);
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx(
            "path",
            {
              d: pathData,
              fill: baseColor,
              stroke: strokeColor,
              strokeWidth,
              style: {
                transition: "stroke 0.5s ease-out, stroke-width 0.5s ease-out"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "text",
            {
              x: textX,
              y: textY,
              fill: "#FFFFFF",
              fontSize: "13",
              fontWeight: "600",
              textAnchor: "middle",
              dominantBaseline: "middle",
              transform: `rotate(${textAngle}, ${textX}, ${textY})`,
              style: {
                pointerEvents: "none",
                userSelect: "none",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              children: segment.label
            }
          )
        ] }, segment.id);
      });
    };
    const getInputStyles = (isFocused, hasError) => ({
      width: "100%",
      padding: "14px 16px",
      fontSize: "15px",
      border: `2px solid ${hasError ? "#EF4444" : isFocused ? accentColor : "#E5E7EB"}`,
      borderRadius: `${borderRadius}px`,
      backgroundColor: "#FFFFFF",
      color: "#111827",
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
      backgroundColor: accentColor,
      color: "#FFFFFF",
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
    const wheelTransition = prefersReducedMotion() ? "none" : `transform ${config.spinDuration || 4e3}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
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
          /* @__PURE__ */ jsx("div", { style: {
            opacity: showContent ? 1 : 0,
            transition: `opacity ${animDuration}ms ease-out`
          }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
              /* @__PURE__ */ jsx("h2", { style: {
                fontSize: "28px",
                fontWeight: 700,
                margin: "0 0 8px 0",
                lineHeight: 1.3,
                color: config.textColor || "#111827",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }, children: hasSpun && wonPrize ? wonPrize.discountCode ? config.successMessage?.replace("{{prize}}", wonPrize.label).replace("{{code}}", wonPrize.discountCode) || `You won ${wonPrize.label}!` : config.failureMessage || wonPrize.label || "Thanks for playing!" : config.headline }),
              !hasSpun && config.subheadline && /* @__PURE__ */ jsx("p", { style: {
                fontSize: "16px",
                margin: 0,
                color: config.textColor || "#6B7280",
                lineHeight: 1.5,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }, children: config.subheadline })
            ] }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: config.imagePosition === "top" || config.imagePosition === "bottom" ? "column" : "row",
                  gap: 24,
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: [
                  config.imageUrl && config.imagePosition !== "none" && /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        flexShrink: 0,
                        order: config.imagePosition === "right" || config.imagePosition === "bottom" ? 2 : 0,
                        width: 220,
                        height: 220,
                        borderRadius: 24,
                        overflow: "hidden",
                        backgroundColor: config.imageBgColor || "#0F172A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(15,23,42,0.4)"
                      },
                      children: /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: config.imageUrl,
                          alt: config.headline || "Promotion image",
                          style: {
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "relative",
                        width: wheelSize,
                        height: wheelSize
                      },
                      children: [
                        /* @__PURE__ */ jsxs(
                          "svg",
                          {
                            ref: wheelRef,
                            width: wheelSize,
                            height: wheelSize,
                            viewBox: `0 0 ${wheelSize} ${wheelSize}`,
                            style: {
                              transform: `rotate(${rotation}deg)`,
                              transition: wheelTransition,
                              filter: hasSpun ? "drop-shadow(0 18px 45px rgba(15,23,42,0.55))" : "drop-shadow(0 10px 30px rgba(15,23,42,0.35))"
                            },
                            children: [
                              /* @__PURE__ */ jsx(
                                "circle",
                                {
                                  cx: radius,
                                  cy: radius,
                                  r: radius - 4,
                                  fill: config.backgroundColor || "#020617",
                                  stroke: config.wheelBorderColor || "#111827",
                                  strokeWidth: config.wheelBorderWidth ?? 6
                                }
                              ),
                              renderWheel(),
                              /* @__PURE__ */ jsx(
                                "circle",
                                {
                                  cx: radius,
                                  cy: radius,
                                  r: 40,
                                  fill: accentColor,
                                  stroke: "rgba(15,23,42,0.85)",
                                  strokeWidth: 4
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "circle",
                                {
                                  cx: radius,
                                  cy: radius,
                                  r: 12,
                                  fill: "#F9FAFB",
                                  stroke: "rgba(15,23,42,0.3)",
                                  strokeWidth: 2
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "text",
                                {
                                  x: radius,
                                  y: radius,
                                  textAnchor: "middle",
                                  dominantBaseline: "middle",
                                  fill: "#F9FAFB",
                                  fontSize: "12",
                                  fontWeight: "600",
                                  style: {
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                  },
                                  children: "SPIN"
                                }
                              )
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              top: -22,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 0,
                              height: 0,
                              borderLeft: "16px solid transparent",
                              borderRight: "16px solid transparent",
                              borderTop: `30px solid ${accentColor}`,
                              filter: "drop-shadow(0 4px 10px rgba(15,23,42,0.5))",
                              zIndex: 10
                            }
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            ),
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
                backgroundColor: "#F9FAFB",
                borderRadius: `${borderRadius}px`,
                border: "1px solid #E5E7EB",
                animation: "slideUp 0.5s ease-out"
              }, children: [
                /* @__PURE__ */ jsx("p", { style: {
                  fontSize: "13px",
                  margin: "0 0 12px 0",
                  color: "#6B7280",
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
                    border: "2px solid #E5E7EB",
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
                        border: `2px solid ${copiedCode ? "#10B981" : "#E5E7EB"}`,
                        borderRadius: `${borderRadius - 4}px`,
                        backgroundColor: copiedCode ? "#10B981" : "#FFFFFF",
                        color: copiedCode ? "#FFFFFF" : "#374151",
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
                  color: "#374151",
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
          ] }) }),
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
