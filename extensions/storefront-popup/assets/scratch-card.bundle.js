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
    const cardWidth = config.scratchCardWidth || 300;
    const cardHeight = config.scratchCardHeight || 200;
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
      if (!emailSubmitted && config.emailBeforeScratching) return;
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
      prizeCtx.fillStyle = config.scratchCardTextColor || "#ffffff";
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
        x: clientX - rect.left,
        y: clientY - rect.top
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
      color: config.inputTextColor || "#1F2937",
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
    return /* @__PURE__ */ jsxs(
      BasePopup,
      {
        config,
        isVisible,
        onClose,
        className: "scratch-popup-container",
        children: [
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
                    config.subheadline && /* @__PURE__ */ jsx(
                      "p",
                      {
                        style: {
                          fontSize: config.descriptionFontSize || "16px",
                          fontWeight: config.descriptionFontWeight || 400,
                          margin: 0,
                          opacity: 0.8,
                          color: config.descriptionColor || config.textColor
                        },
                        children: config.subheadline
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
                            config.emailLabel && /* @__PURE__ */ jsx(
                              "label",
                              {
                                style: {
                                  display: "block",
                                  marginBottom: "8px",
                                  fontSize: "14px",
                                  fontWeight: 600
                                },
                                children: config.emailLabel
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
                          /* @__PURE__ */ jsx("button", { type: "submit", style: buttonStyles, className: "scratch-popup-button", children: config.buttonText || "Continue" })
                        ]
                      }
                    )
                  ) : showScratchCard && // Scratch card
                  /* @__PURE__ */ jsxs(Fragment2, { children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: `scratch-card-container ${isRevealed ? "revealed-animation" : ""}`,
                        style: { maxWidth: cardWidth, height: cardHeight },
                        children: [
                          /* @__PURE__ */ jsx(
                            "canvas",
                            {
                              ref: prizeCanvasRef,
                              width: cardWidth,
                              height: cardHeight,
                              style: { position: "absolute", top: 0, left: 0 }
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
                                touchAction: "none"
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
                    ] })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("style", { children: `
        .scratch-popup-container {
          margin: 0 auto;
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
          flex-direction: row;
        }

        .scratch-popup-content.vertical.reverse {
          flex-direction: row-reverse;
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
          max-width: 24rem;
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

        @media (min-width: 768px) {
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

        @media (max-width: 767px) {
          .scratch-popup-content.horizontal .scratch-popup-image,
          .scratch-popup-content.vertical .scratch-popup-image {
            height: 12rem;
          }
        }
      ` })
        ]
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
//# sourceMappingURL=scratch-card.bundle.js.map
