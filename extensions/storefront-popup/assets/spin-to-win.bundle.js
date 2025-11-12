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
    const segments = config.wheelSegments || [];
    const segmentAngle = 360 / segments.length;
    const accentColor = config.accentColor || config.buttonColor || "#000000";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 16 : config.borderRadius ?? 16;
    const animDuration = config.animationDuration ?? 300;
    useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
      } else {
        setShowContent(false);
      }
    }, [isVisible]);
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
      if (config.emailRequired && !email.trim()) {
        setEmailError("Email required");
        return;
      }
      if (config.emailRequired && !validateEmail(email)) {
        setEmailError("Invalid email");
        return;
      }
      setEmailError("");
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
    }, [config, email, onSpin, selectPrize, segments, rotation, calculateRotation, onWin]);
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
        const hue = index * (360 / segments.length);
        const baseColor = segment.color || `hsl(${hue}, 65%, 58%)`;
        const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
        const strokeColor = isWinningSegment ? "#FFD700" : "#FFFFFF";
        const strokeWidth = isWinningSegment ? 8 : 3;
        const textAngle = startAngle + segmentAngle / 2;
        const textRad = (textAngle - 90) * (Math.PI / 180);
        const textRadius = radius * 0.72;
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
              fontSize: "14",
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
    const wheelTransition = prefersReducedMotion() ? "none" : `transform ${config.spinDuration || 4e3}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    return /* @__PURE__ */ jsxs(BasePopup, { config, isVisible, onClose, children: [
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
        /* @__PURE__ */ jsxs("div", { style: {
          position: "relative",
          width: wheelSize,
          height: wheelSize
        }, children: [
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
                filter: hasSpun ? "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))"
              },
              children: [
                renderWheel(),
                /* @__PURE__ */ jsx(
                  "circle",
                  {
                    cx: radius,
                    cy: radius,
                    r: 28,
                    fill: accentColor,
                    stroke: "#FFFFFF",
                    strokeWidth: 3
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { style: {
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: `22px solid ${accentColor}`,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
            zIndex: 10
          } })
        ] }),
        !hasSpun ? /* @__PURE__ */ jsxs(Fragment2, { children: [
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
                onChange: (e) => setEmail(e.target.value),
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
    ] });
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
