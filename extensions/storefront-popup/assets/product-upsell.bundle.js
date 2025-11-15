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

  // app/domains/storefront/popups-new/ProductUpsellPopup.tsx
  var ProductUpsellPopup = ({
    config,
    isVisible,
    onClose,
    products: propProducts,
    onAddToCart,
    onProductClick
  }) => {
    const [selectedProducts, setSelectedProducts] = useState(/* @__PURE__ */ new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const products = useMemo(() => propProducts || config.products || [], [propProducts, config.products]);
    const displayProducts = useMemo(
      () => config.maxProducts ? products.slice(0, config.maxProducts) : products,
      [config.maxProducts, products]
    );
    useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
      } else {
        setShowContent(false);
      }
    }, [isVisible]);
    const handleProductSelect = useCallback((productId) => {
      if (config.multiSelect) {
        setSelectedProducts((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(productId)) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      } else {
        setSelectedProducts(/* @__PURE__ */ new Set([productId]));
      }
    }, [config.multiSelect]);
    const handleAddToCart = useCallback(async () => {
      if (selectedProducts.size === 0) return;
      setIsLoading(true);
      try {
        if (onAddToCart) {
          await onAddToCart(Array.from(selectedProducts));
          onClose();
        } else {
          onClose();
        }
      } catch (error) {
        console.error("Add to cart error:", error);
      } finally {
        setIsLoading(false);
      }
    }, [selectedProducts, onAddToCart, onClose]);
    const calculateTotal = useCallback(() => {
      let total2 = 0;
      selectedProducts.forEach((id) => {
        const product = products.find((p) => p.id === id);
        if (product) {
          total2 += parseFloat(product.price);
        }
      });
      return total2;
    }, [selectedProducts, products]);
    const calculateSavings = useCallback(() => {
      if (!config.bundleDiscount || selectedProducts.size < 2) return null;
      const total2 = calculateTotal();
      const savings2 = total2 * (config.bundleDiscount / 100);
      return savings2;
    }, [selectedProducts, config.bundleDiscount, calculateTotal]);
    const getSavingsPercent = (product) => {
      if (product.savingsPercent != null) {
        return product.savingsPercent;
      }
      if (!product.compareAtPrice) return null;
      const price = parseFloat(product.price);
      const compare = parseFloat(product.compareAtPrice);
      if (!Number.isFinite(price) || !Number.isFinite(compare) || compare <= 0 || price >= compare) {
        return null;
      }
      return Math.round((1 - price / compare) * 100);
    };
    const calculateDiscountedTotal = useCallback(() => {
      const total2 = calculateTotal();
      const savings2 = calculateSavings();
      return savings2 ? total2 - savings2 : total2;
    }, [calculateTotal, calculateSavings]);
    const handlePrevSlide = useCallback(() => {
      if (displayProducts.length === 0) return;
      setCurrentSlide((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
    }, [displayProducts.length]);
    const handleNextSlide = useCallback(() => {
      if (displayProducts.length === 0) return;
      setCurrentSlide((prev) => (prev + 1) % displayProducts.length);
    }, [displayProducts.length]);
    const handleGoToSlide = useCallback((index) => {
      if (index < 0 || index >= displayProducts.length) return;
      setCurrentSlide(index);
    }, [displayProducts.length]);
    const accentColor = config.accentColor || config.buttonColor || "#6366F1";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 12 : config.borderRadius ?? 12;
    const animDuration = config.animationDuration ?? 300;
    const imageHeight = config.imageAspectRatio === "portrait" ? "280px" : config.imageAspectRatio === "landscape" ? "180px" : "240px";
    const textColor = config.textColor || "#111827";
    const secondaryColor = config.inputBackgroundColor || "#F3F4F6";
    const borderColor = config.inputBorderColor || "rgba(148, 163, 184, 0.5)";
    const renderProduct = (product, index) => {
      const isSelected = selectedProducts.has(product.id);
      const isHovered = hoveredProduct === product.id;
      const cardStyles = {
        border: `2px solid ${isSelected ? accentColor : config.inputBorderColor || "#E5E7EB"}`,
        borderRadius: `${borderRadius}px`,
        padding: "0",
        cursor: "pointer",
        transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        backgroundColor: config.backgroundColor || "#FFFFFF",
        boxShadow: isSelected ? `0 8px 24px ${accentColor}30, 0 0 0 3px ${accentColor}15` : isHovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.08)",
        transform: isSelected ? "scale(1.02)" : isHovered ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
        opacity: showContent ? 1 : 0,
        animation: showContent ? `fadeInUp 0.5s ease-out ${index * 0.1}s both` : "none",
        position: "relative"
      };
      return /* @__PURE__ */ jsxs(
        "div",
        {
          style: cardStyles,
          onClick: () => {
            handleProductSelect(product.id);
            if (onProductClick) {
              onProductClick(product);
            }
          },
          onMouseEnter: () => setHoveredProduct(product.id),
          onMouseLeave: () => setHoveredProduct(null),
          children: [
            isSelected && /* @__PURE__ */ jsx("div", { style: {
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: accentColor,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              animation: "bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
            }, children: "\u2713" }),
            config.showImages !== false && product.imageUrl && /* @__PURE__ */ jsxs("div", { style: {
              width: "100%",
              height: imageHeight,
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#F9FAFB"
            }, children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: product.imageUrl,
                  alt: product.title,
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: `transform ${animDuration}ms ease-out`,
                    transform: isHovered ? "scale(1.08)" : "scale(1)"
                  }
                }
              ),
              isHovered && !isSelected && /* @__PURE__ */ jsx("div", { style: {
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.05)",
                transition: `opacity ${animDuration}ms`
              } })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "16px" }, children: [
              /* @__PURE__ */ jsx("h3", { style: {
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 8px 0",
                lineHeight: 1.4,
                color: config.textColor || "#111827",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }, children: product.title }),
              config.showRatings && product.rating && /* @__PURE__ */ jsxs("div", { style: {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "10px"
              }, children: [
                /* @__PURE__ */ jsxs("div", { style: { color: "#F59E0B", fontSize: "14px", lineHeight: 1 }, children: [
                  "\u2605".repeat(Math.floor(product.rating)),
                  "\u2606".repeat(5 - Math.floor(product.rating))
                ] }),
                config.showReviewCount && product.reviewCount && /* @__PURE__ */ jsxs("span", { style: {
                  fontSize: "13px",
                  color: config.textColor || "#6B7280",
                  fontWeight: 500
                }, children: [
                  "(",
                  product.reviewCount,
                  ")"
                ] })
              ] }),
              config.showPrices !== false && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }, children: [
                /* @__PURE__ */ jsx("span", { style: {
                  fontSize: "20px",
                  fontWeight: 800,
                  color: config.textColor || "#111827",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }, children: formatCurrency(product.price, config.currency) }),
                config.showCompareAtPrice && product.compareAtPrice && /* @__PURE__ */ jsxs(Fragment2, { children: [
                  /* @__PURE__ */ jsx("span", { style: {
                    fontSize: "15px",
                    textDecoration: "line-through",
                    color: config.textColor || "#9CA3AF",
                    fontWeight: 500
                  }, children: formatCurrency(product.compareAtPrice, config.currency) }),
                  getSavingsPercent(product) !== null && /* @__PURE__ */ jsxs("span", { style: {
                    fontSize: "12px",
                    fontWeight: 700,
                    color: config.buttonTextColor || "#FFFFFF",
                    backgroundColor: config.accentColor || config.buttonColor || "#EF4444",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }, children: [
                    "SAVE ",
                    getSavingsPercent(product),
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { style: {
                marginTop: "14px",
                padding: "10px 16px",
                backgroundColor: isSelected ? accentColor : config.inputBackgroundColor || "#F3F4F6",
                color: isSelected ? "#FFFFFF" : config.textColor || "#374151",
                borderRadius: `${borderRadius - 4}px`,
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "center",
                transition: `all ${animDuration}ms`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }, children: isSelected ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                /* @__PURE__ */ jsx("span", { children: "\u2713" }),
                " Selected"
              ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
                config.showAddIcon !== false && /* @__PURE__ */ jsx("span", { children: "+" }),
                config.multiSelect ? "Add to Bundle" : "Select"
              ] }) })
            ] })
          ]
        },
        product.id
      );
    };
    const getGridStyles = () => {
      return {
        display: "grid",
        gap: "16px",
        marginBottom: "24px"
      };
    };
    const renderProductsSection = () => {
      if (displayProducts.length === 0) {
        return /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              padding: "40px 20px",
              textAlign: "center",
              color: config.textColor || "#9CA3AF"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: "48px", marginBottom: "16px" }, children: "\u{1F4E6}" }),
              /* @__PURE__ */ jsx("p", { children: "No products available" })
            ]
          }
        );
      }
      if (config.layout === "carousel") {
        const product = displayProducts[Math.min(currentSlide, displayProducts.length - 1)];
        const isSelected = selectedProducts.has(product.id);
        const savingsPercent = getSavingsPercent(product);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "upsell-carousel-container",
            style: {
              position: "relative"
            },
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handlePrevSlide,
                  "aria-label": "Previous product",
                  style: {
                    borderRadius: "9999px",
                    border: `1px solid ${config.inputBorderColor || "#E5E7EB"}`,
                    backgroundColor: config.inputBackgroundColor || "#F3F4F6",
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  },
                  children: /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u2039" })
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "upsell-carousel-product",
                  style: {
                    width: "100%",
                    maxWidth: 720
                  },
                  children: [
                    config.showImages !== false && product.imageUrl && /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          flex: 1,
                          maxWidth: 280,
                          aspectRatio: "1 / 1",
                          borderRadius: 16,
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#F9FAFB"
                        },
                        children: [
                          /* @__PURE__ */ jsx(
                            "img",
                            {
                              src: product.imageUrl,
                              alt: product.title,
                              style: { width: "100%", height: "100%", objectFit: "cover" }
                            }
                          ),
                          savingsPercent !== null && /* @__PURE__ */ jsxs(
                            "div",
                            {
                              style: {
                                position: "absolute",
                                top: 12,
                                left: 12,
                                padding: "4px 10px",
                                borderRadius: 9999,
                                backgroundColor: config.accentColor || config.buttonColor || "#22C55E",
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: 700
                              },
                              children: [
                                "SAVE ",
                                savingsPercent,
                                "%"
                              ]
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12
                        },
                        children: [
                          /* @__PURE__ */ jsx(
                            "h3",
                            {
                              style: {
                                fontSize: 20,
                                fontWeight: 700,
                                margin: 0,
                                color: config.textColor || "#111827"
                              },
                              children: product.title
                            }
                          ),
                          config.showRatings && product.rating && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                            /* @__PURE__ */ jsxs("div", { style: { color: "#F59E0B", fontSize: 14 }, children: [
                              "\u2605".repeat(Math.floor(product.rating)),
                              "\u2606".repeat(5 - Math.floor(product.rating))
                            ] }),
                            config.showReviewCount && product.reviewCount && /* @__PURE__ */ jsxs(
                              "span",
                              {
                                style: {
                                  fontSize: 13,
                                  color: config.textColor || "#6B7280"
                                },
                                children: [
                                  "(",
                                  product.reviewCount,
                                  ")"
                                ]
                              }
                            )
                          ] }),
                          config.showPrices !== false && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                            /* @__PURE__ */ jsx(
                              "span",
                              {
                                style: {
                                  fontSize: 22,
                                  fontWeight: 800,
                                  color: config.textColor || "#111827"
                                },
                                children: formatCurrency(product.price, config.currency)
                              }
                            ),
                            config.showCompareAtPrice && product.compareAtPrice && /* @__PURE__ */ jsx(
                              "span",
                              {
                                style: {
                                  fontSize: 14,
                                  textDecoration: "line-through",
                                  color: config.textColor || "#9CA3AF"
                                },
                                children: formatCurrency(product.compareAtPrice, config.currency)
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => handleProductSelect(product.id),
                              style: {
                                marginTop: 8,
                                padding: "10px 18px",
                                borderRadius: 9999,
                                border: `2px solid ${accentColor}`,
                                backgroundColor: isSelected ? accentColor : "transparent",
                                color: isSelected ? "#FFFFFF" : accentColor,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8
                              },
                              children: isSelected ? "Selected" : "Select Product"
                            }
                          )
                        ]
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleNextSlide,
                  "aria-label": "Next product",
                  style: {
                    borderRadius: "9999px",
                    border: `1px solid ${config.inputBorderColor || "#E5E7EB"}`,
                    backgroundColor: config.inputBackgroundColor || "#F3F4F6",
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  },
                  children: /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u203A" })
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6
                  },
                  children: displayProducts.map((p, index) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleGoToSlide(index),
                      style: {
                        width: index === currentSlide ? 18 : 8,
                        height: 8,
                        borderRadius: 9999,
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        backgroundColor: index === currentSlide ? accentColor : config.inputBorderColor || "#E5E7EB"
                      }
                    },
                    index
                  ))
                }
              )
            ]
          }
        );
      }
      if (config.layout === "card") {
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: "upsell-cards-container",
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 24
            },
            children: displayProducts.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const savingsPercent = getSavingsPercent(product);
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "upsell-card",
                  style: {
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    border: `2px solid ${isSelected ? accentColor : config.inputBorderColor || "#E5E7EB"}`,
                    borderRadius,
                    padding: "12px 16px",
                    backgroundColor: config.backgroundColor || "#FFFFFF"
                  },
                  children: [
                    config.showImages !== false && product.imageUrl && /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "upsell-card-image-wrapper",
                        style: {
                          width: 96,
                          height: 96,
                          borderRadius: 12,
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#F9FAFB",
                          flexShrink: 0
                        },
                        children: [
                          /* @__PURE__ */ jsx(
                            "img",
                            {
                              src: product.imageUrl,
                              alt: product.title,
                              style: { width: "100%", height: "100%", objectFit: "cover" }
                            }
                          ),
                          savingsPercent !== null && /* @__PURE__ */ jsxs(
                            "div",
                            {
                              style: {
                                position: "absolute",
                                top: 8,
                                left: 8,
                                padding: "2px 8px",
                                borderRadius: 9999,
                                backgroundColor: config.accentColor || config.buttonColor || "#22C55E",
                                color: "#FFFFFF",
                                fontSize: 11,
                                fontWeight: 700
                              },
                              children: [
                                "SAVE ",
                                savingsPercent,
                                "%"
                              ]
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                      /* @__PURE__ */ jsx(
                        "h3",
                        {
                          style: {
                            fontSize: 16,
                            fontWeight: 600,
                            margin: 0,
                            marginBottom: 4,
                            color: config.textColor || "#111827"
                          },
                          children: product.title
                        }
                      ),
                      config.showRatings && product.rating && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
                        /* @__PURE__ */ jsxs("div", { style: { color: "#F59E0B", fontSize: 14 }, children: [
                          "\u2605".repeat(Math.floor(product.rating)),
                          "\u2606".repeat(5 - Math.floor(product.rating))
                        ] }),
                        config.showReviewCount && product.reviewCount && /* @__PURE__ */ jsxs(
                          "span",
                          {
                            style: {
                              fontSize: 13,
                              color: config.textColor || "#6B7280"
                            },
                            children: [
                              "(",
                              product.reviewCount,
                              ")"
                            ]
                          }
                        )
                      ] }),
                      config.showPrices !== false && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              fontSize: 18,
                              fontWeight: 700,
                              color: config.textColor || "#111827"
                            },
                            children: formatCurrency(product.price, config.currency)
                          }
                        ),
                        config.showCompareAtPrice && product.compareAtPrice && /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              fontSize: 14,
                              textDecoration: "line-through",
                              color: config.textColor || "#9CA3AF"
                            },
                            children: formatCurrency(product.compareAtPrice, config.currency)
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: "upsell-card-action-btn",
                        onClick: () => handleProductSelect(product.id),
                        style: {
                          padding: "10px 16px",
                          borderRadius: 9999,
                          border: `2px solid ${accentColor}`,
                          backgroundColor: isSelected ? accentColor : "transparent",
                          color: isSelected ? "#FFFFFF" : accentColor,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8
                        },
                        children: isSelected ? "Added" : "Add"
                      }
                    )
                  ]
                },
                product.id
              );
            })
          }
        );
      }
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: "upsell-products-grid",
          style: {
            ...getGridStyles(),
            // Use CSS variable so media queries can adjust columns like the mockup
            // Desktop uses configured columns; mobile overrides via @media
            "--upsell-columns": Math.min(config.columns || 2, displayProducts.length || 1)
          },
          children: displayProducts.map((product, index) => renderProduct(product, index))
        }
      );
    };
    const buttonStyles = {
      flex: 1,
      padding: "16px 24px",
      fontSize: "16px",
      fontWeight: 700,
      border: "none",
      borderRadius: `${borderRadius}px`,
      backgroundColor: config.buttonColor || "#6366F1",
      color: config.buttonTextColor || "#FFFFFF",
      cursor: selectedProducts.size === 0 || isLoading ? "not-allowed" : "pointer",
      opacity: selectedProducts.size === 0 || isLoading ? 0.5 : 1,
      transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      boxShadow: selectedProducts.size > 0 && !isLoading ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px"
    };
    const savings = calculateSavings();
    const total = calculateTotal();
    const discountedTotal = calculateDiscountedTotal();
    const popupConfig = {
      ...config,
      padding: 0,
      maxWidth: config.maxWidth || "56rem"
    };
    useEffect(() => {
      if (!isVisible || !popupConfig.autoCloseDelay || popupConfig.autoCloseDelay <= 0) return;
      const timer = setTimeout(onClose, popupConfig.autoCloseDelay * 1e3);
      return () => clearTimeout(timer);
    }, [isVisible, popupConfig.autoCloseDelay, onClose]);
    if (!isVisible) return null;
    return /* @__PURE__ */ jsxs(
      PopupPortal,
      {
        isVisible,
        onClose,
        backdrop: {
          color: popupConfig.overlayColor || "rgba(0, 0, 0, 1)",
          opacity: popupConfig.overlayOpacity ?? 0.6,
          blur: 4
        },
        animation: {
          type: popupConfig.animation || "fade"
        },
        position: popupConfig.position || "center",
        closeOnEscape: popupConfig.closeOnEscape !== false,
        closeOnBackdropClick: popupConfig.closeOnOverlayClick !== false,
        previewMode: popupConfig.previewMode,
        ariaLabel: popupConfig.ariaLabel || popupConfig.headline,
        ariaDescribedBy: popupConfig.ariaDescribedBy,
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "upsell-container",
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 0,
                opacity: showContent ? 1 : 0,
                transform: showContent ? "translateY(0)" : "translateY(10px)",
                transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                backgroundColor: config.backgroundColor || "#FFFFFF",
                borderRadius: `${borderRadius}px`
              },
              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      padding: "48px 32px 32px",
                      textAlign: "center",
                      borderBottom: `1px solid ${borderColor}`
                    },
                    children: [
                      /* @__PURE__ */ jsx(
                        "h2",
                        {
                          style: {
                            fontSize: "30px",
                            fontWeight: 800,
                            margin: "0 0 8px 0",
                            lineHeight: 1.2,
                            color: textColor,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            letterSpacing: "-0.02em"
                          },
                          children: config.headline
                        }
                      ),
                      config.subheadline && /* @__PURE__ */ jsx(
                        "p",
                        {
                          style: {
                            fontSize: "16px",
                            margin: 0,
                            color: textColor,
                            opacity: 0.7,
                            lineHeight: 1.5,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          },
                          children: config.subheadline
                        }
                      )
                    ]
                  }
                ),
                config.bundleDiscount && selectedProducts.size >= 2 && /* @__PURE__ */ jsxs("div", { style: {
                  padding: "20px",
                  background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
                  borderRadius: `${borderRadius}px`,
                  border: `2px solid ${accentColor}30`,
                  textAlign: "center",
                  animation: "slideIn 0.4s ease-out"
                }, children: [
                  /* @__PURE__ */ jsx("div", { style: {
                    fontSize: "14px",
                    fontWeight: 700,
                    color: config.textColor || "#374151",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }, children: "\u{1F389} Bundle Deal Active" }),
                  /* @__PURE__ */ jsx("div", { style: {
                    fontSize: "18px",
                    fontWeight: 800,
                    color: accentColor,
                    marginBottom: "4px"
                  }, children: config.bundleDiscountText || `Save ${config.bundleDiscount}% Together!` }),
                  savings && /* @__PURE__ */ jsxs("div", { style: {
                    fontSize: "24px",
                    fontWeight: 800,
                    color: config.successColor || accentColor || "#10B981",
                    marginTop: "8px"
                  }, children: [
                    "-",
                    formatCurrency(savings, config.currency),
                    " off"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "upsell-content", children: renderProductsSection() }),
                /* @__PURE__ */ jsxs("div", { className: "upsell-footer", children: [
                  selectedProducts.size > 0 && /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        marginBottom: "16px"
                      },
                      children: /* @__PURE__ */ jsxs(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: savings ? "12px" : "0"
                          },
                          children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  style: {
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: textColor,
                                    opacity: 0.7,
                                    marginBottom: "4px"
                                  },
                                  children: [
                                    selectedProducts.size,
                                    " item",
                                    selectedProducts.size !== 1 ? "s" : "",
                                    " selected"
                                  ]
                                }
                              ),
                              savings && /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  style: {
                                    fontSize: "12px",
                                    color: config.successColor || accentColor || "#10B981",
                                    fontWeight: 600
                                  },
                                  children: [
                                    "You save ",
                                    formatCurrency(savings, config.currency)
                                  ]
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
                              savings && /* @__PURE__ */ jsx(
                                "div",
                                {
                                  style: {
                                    fontSize: "14px",
                                    textDecoration: "line-through",
                                    color: config.textColor || "#9CA3AF",
                                    fontWeight: 500
                                  },
                                  children: formatCurrency(total, config.currency)
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "div",
                                {
                                  style: {
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    color: config.textColor || "#111827"
                                  },
                                  children: formatCurrency(discountedTotal, config.currency)
                                }
                              )
                            ] })
                          ]
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "upsell-actions", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: handleAddToCart,
                        disabled: selectedProducts.size === 0 || isLoading,
                        style: buttonStyles,
                        onMouseEnter: (e) => {
                          if (selectedProducts.size > 0 && !isLoading) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(99, 102, 241, 0.4)";
                          }
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = selectedProducts.size > 0 ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none";
                        },
                        children: isLoading ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                          /* @__PURE__ */ jsx(
                            "span",
                            {
                              style: {
                                width: "16px",
                                height: "16px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#FFF",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite"
                              }
                            }
                          ),
                          "Adding to Cart..."
                        ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
                          /* @__PURE__ */ jsx("span", { style: { fontSize: "18px" }, children: "\u{1F6D2}" }),
                          (() => {
                            const count = selectedProducts.size;
                            const baseLabel = config.buttonText || config.ctaText;
                            if (baseLabel) {
                              return baseLabel.includes("{count}") ? baseLabel.replace("{count}", String(count || 0)) : baseLabel;
                            }
                            if (count > 0) {
                              return `Add ${count} to Cart`;
                            }
                            return "Select Products";
                          })()
                        ] })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: onClose,
                        style: {
                          ...buttonStyles,
                          backgroundColor: "transparent",
                          color: config.textColor || "#6B7280",
                          border: `2px solid ${config.inputBorderColor || "#E5E7EB"}`,
                          boxShadow: "none",
                          opacity: 0.9,
                          cursor: "pointer"
                        },
                        onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                        onMouseLeave: (e) => e.currentTarget.style.opacity = "0.9",
                        children: config.secondaryCtaLabel || config.dismissLabel || "No thanks"
                      }
                    )
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("style", { children: `
        /* Responsive layout helpers for ProductUpsellPopup (mirrors docs/mockup layout) */
        .upsell-container {
          width: 100%;
          max-width: 56rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .upsell-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
        }

        .upsell-footer {
          border-top: 2px solid ${borderColor};
          padding: 24px 32px;
          background: ${secondaryColor};
        }

        .upsell-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .upsell-products-grid {
          display: grid;
          grid-template-columns: repeat(var(--upsell-columns, 2), minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .upsell-carousel-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 360px;
          padding: 24px 40px;
          gap: 32px;
        }

        .upsell-carousel-product {
          display: flex;
          gap: 24px;
          align-items: center;
          width: 100%;
          max-width: 720px;
        }

        .upsell-card {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .upsell-card-image-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background-color: #F9FAFB;
          flex-shrink: 0;
        }

        .upsell-card-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .upsell-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
          }

          .upsell-carousel-container {
            padding: 16px 24px;
          }

          .upsell-carousel-product {
            flex-direction: column;
            text-align: center;
          }

          .upsell-card {
            flex-direction: column;
            align-items: stretch;
          }

          .upsell-card-image-wrapper {
            width: 100%;
            height: 200px;
          }

          .upsell-card-action-btn {
            align-self: stretch;
            margin-left: 0;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` })
        ]
      }
    );
  };

  // extensions/storefront-src/bundles/product-upsell.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["PRODUCT_UPSELL"] = ProductUpsellPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Product Upsell popup registered");
    }
  })();
})();
//# sourceMappingURL=product-upsell.bundle.js.map
