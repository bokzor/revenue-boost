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
  function formatCurrency(amount, currency = "USD") {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(numAmount);
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
        if (config.previewMode) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          onClose();
        } else if (onAddToCart) {
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
    }, [selectedProducts, onAddToCart, onClose, config.previewMode]);
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
    const calculateDiscountedTotal = useCallback(() => {
      const total2 = calculateTotal();
      const savings2 = calculateSavings();
      return savings2 ? total2 - savings2 : total2;
    }, [calculateTotal, calculateSavings]);
    const accentColor = config.accentColor || config.buttonColor || "#6366F1";
    const borderRadius = typeof config.borderRadius === "string" ? parseFloat(config.borderRadius) || 12 : config.borderRadius ?? 12;
    const animDuration = config.animationDuration ?? 300;
    const imageHeight = config.imageAspectRatio === "portrait" ? "280px" : config.imageAspectRatio === "landscape" ? "180px" : "240px";
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
                  /* @__PURE__ */ jsxs("span", { style: {
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#EF4444",
                    backgroundColor: "#FEE2E2",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }, children: [
                    "SAVE ",
                    Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100),
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { style: {
                marginTop: "14px",
                padding: "10px 16px",
                backgroundColor: isSelected ? accentColor : "#F3F4F6",
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
      const columns = config.columns || 2;
      return {
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(columns, displayProducts.length)}, 1fr)`,
        gap: "16px",
        marginBottom: "24px"
      };
    };
    const buttonStyles = {
      width: "100%",
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
    return /* @__PURE__ */ jsxs(BasePopup, { config, isVisible, onClose, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        opacity: showContent ? 1 : 0,
        transform: showContent ? "translateY(0)" : "translateY(10px)",
        transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: "4px" }, children: [
          /* @__PURE__ */ jsx("h2", { style: {
            fontSize: "32px",
            fontWeight: 800,
            margin: "0 0 12px 0",
            lineHeight: 1.2,
            color: config.textColor || "#111827",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: "-0.02em"
          }, children: config.headline }),
          config.subheadline && /* @__PURE__ */ jsx("p", { style: {
            fontSize: "16px",
            margin: 0,
            color: config.textColor || "#6B7280",
            lineHeight: 1.6,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }, children: config.subheadline })
        ] }),
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
            color: "#10B981",
            marginTop: "8px"
          }, children: [
            "-",
            formatCurrency(savings, config.currency),
            " off"
          ] })
        ] }),
        displayProducts.length > 0 ? /* @__PURE__ */ jsx("div", { style: getGridStyles(), children: displayProducts.map((product, index) => renderProduct(product, index)) }) : /* @__PURE__ */ jsxs("div", { style: {
          padding: "40px 20px",
          textAlign: "center",
          color: config.textColor || "#9CA3AF"
        }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "48px", marginBottom: "16px" }, children: "\u{1F4E6}" }),
          /* @__PURE__ */ jsx("p", { children: "No products available" })
        ] }),
        selectedProducts.size > 0 && /* @__PURE__ */ jsx("div", { style: {
          padding: "20px",
          background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`,
          borderRadius: `${borderRadius}px`,
          border: `2px solid ${accentColor}20`,
          animation: "fadeIn 0.3s ease-out"
        }, children: /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: savings ? "12px" : "0"
        }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { style: {
              fontSize: "14px",
              fontWeight: 600,
              color: config.textColor || "#6B7280",
              marginBottom: "4px"
            }, children: [
              selectedProducts.size,
              " item",
              selectedProducts.size !== 1 ? "s" : "",
              " selected"
            ] }),
            savings && /* @__PURE__ */ jsxs("div", { style: {
              fontSize: "12px",
              color: "#10B981",
              fontWeight: 600
            }, children: [
              "You save ",
              formatCurrency(savings, config.currency)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
            savings && /* @__PURE__ */ jsx("div", { style: {
              fontSize: "14px",
              textDecoration: "line-through",
              color: config.textColor || "#9CA3AF",
              fontWeight: 500
            }, children: formatCurrency(total, config.currency) }),
            /* @__PURE__ */ jsx("div", { style: {
              fontSize: "24px",
              fontWeight: 800,
              color: config.textColor || "#111827"
            }, children: formatCurrency(discountedTotal, config.currency) })
          ] })
        ] }) }),
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
              /* @__PURE__ */ jsx("span", { style: {
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#FFF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              } }),
              "Adding to Cart..."
            ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "18px" }, children: "\u{1F6D2}" }),
              config.buttonText || config.ctaText || (selectedProducts.size > 0 ? `Add ${selectedProducts.size} to Cart` : "Select Products")
            ] })
          }
        ),
        config.secondaryCtaLabel && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            style: {
              ...buttonStyles,
              backgroundColor: "transparent",
              color: config.textColor || "#6B7280",
              border: `2px solid ${config.inputBorderColor || "#E5E7EB"}`,
              boxShadow: "none",
              opacity: 1
            },
            children: config.secondaryCtaLabel
          }
        )
      ] }),
      /* @__PURE__ */ jsx("style", { children: `
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
    ] });
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
