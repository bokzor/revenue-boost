"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // global-preact:preact/hooks
  if (typeof window === "undefined" || !window.SplitPopPreact || !window.SplitPopPreact.hooks) {
    throw new Error("SplitPopPreact hooks not found. Make sure main bundle is loaded first.");
  }
  var useState = window.SplitPopPreact.hooks.useState;
  var useEffect = window.SplitPopPreact.hooks.useEffect;
  var useContext = window.SplitPopPreact.hooks.useContext;
  var useReducer = window.SplitPopPreact.hooks.useReducer;
  var useCallback = window.SplitPopPreact.hooks.useCallback;
  var useMemo = window.SplitPopPreact.hooks.useMemo;
  var useRef = window.SplitPopPreact.hooks.useRef;
  var useImperativeHandle = window.SplitPopPreact.hooks.useImperativeHandle;
  var useLayoutEffect = window.SplitPopPreact.hooks.useLayoutEffect;
  var useDebugValue = window.SplitPopPreact.hooks.useDebugValue;

  // global-preact:preact/compat
  if (typeof window === "undefined" || !window.SplitPopPreact || !window.SplitPopPreact.compat) {
    throw new Error("SplitPopPreact compat not found. Make sure main bundle is loaded first.");
  }
  var compat_default = window.SplitPopPreact.compat;
  var version = window.SplitPopPreact.compat.version;
  var Children = window.SplitPopPreact.compat.Children;
  var render = window.SplitPopPreact.compat.render;
  var hydrate = window.SplitPopPreact.compat.hydrate;
  var unmountComponentAtNode = window.SplitPopPreact.compat.unmountComponentAtNode;
  var createPortal = window.SplitPopPreact.compat.createPortal;
  var createElement = window.SplitPopPreact.compat.createElement;
  var createContext = window.SplitPopPreact.compat.createContext;
  var createRef = window.SplitPopPreact.compat.createRef;
  var forwardRef = window.SplitPopPreact.compat.forwardRef;
  var lazy = window.SplitPopPreact.compat.lazy;
  var memo = window.SplitPopPreact.compat.memo;
  var useCallback2 = window.SplitPopPreact.compat.useCallback;
  var useContext2 = window.SplitPopPreact.compat.useContext;
  var useDebugValue2 = window.SplitPopPreact.compat.useDebugValue;
  var useEffect2 = window.SplitPopPreact.compat.useEffect;
  var useImperativeHandle2 = window.SplitPopPreact.compat.useImperativeHandle;
  var useLayoutEffect2 = window.SplitPopPreact.compat.useLayoutEffect;
  var useMemo2 = window.SplitPopPreact.compat.useMemo;
  var useReducer2 = window.SplitPopPreact.compat.useReducer;
  var useRef2 = window.SplitPopPreact.compat.useRef;
  var useState2 = window.SplitPopPreact.compat.useState;
  var Suspense = window.SplitPopPreact.compat.Suspense;
  var Component = window.SplitPopPreact.compat.Component;
  var Fragment = window.SplitPopPreact.compat.Fragment;

  // global-preact:preact
  if (typeof window === "undefined" || !window.SplitPopPreact) {
    throw new Error("SplitPopPreact global runtime not found. Make sure main bundle is loaded first.");
  }
  var h = window.SplitPopPreact.h;
  var render2 = window.SplitPopPreact.render;
  var Fragment2 = window.SplitPopPreact.Fragment;
  var Component2 = window.SplitPopPreact.Component;
  var createContext2 = window.SplitPopPreact.createContext;
  var cloneElement = window.SplitPopPreact.cloneElement;
  var createRef2 = window.SplitPopPreact.createRef;
  var isValidElement = window.SplitPopPreact.isValidElement;
  var options = window.SplitPopPreact.options;
  var preact_default = window.SplitPopPreact;

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f = 0;
  var i = Array.isArray;
  function u(e, t, n, o, i2, u2) {
    t || (t = {});
    var a, c, p = t;
    if ("ref" in p)
      for (c in p = {}, t)
        "ref" == c ? a = t[c] : p[c] = t[c];
    var l = { type: e, props: p, key: n, ref: a, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e && (a = e.defaultProps))
      for (c in a)
        void 0 === p[c] && (p[c] = a[c]);
    return options.vnode && options.vnode(l), l;
  }

  // extensions/storefront-src/auto-generated/components/popups/BasePopup.tsx
  var BasePopup = ({
    config,
    isVisible,
    onClose,
    onButtonClick,
    className = "",
    children,
    renderInline = false
  }) => {
    console.log("[BasePopup] \u{1F3A8} Component rendering", {
      isVisible,
      hasConfig: !!config,
      hasChildren: !!children,
      className,
      configId: config == null ? void 0 : config.id,
      renderInline,
      renderInlineType: typeof renderInline,
      previewMode: config == null ? void 0 : config.previewMode,
      previewModeType: typeof (config == null ? void 0 : config.previewMode)
    });
    const [portalReady, setPortalReady] = useState(false);
    const [present, setPresent] = useState(config.previewMode && isVisible);
    const [exiting, setExiting] = useState(false);
    const exitTimerRef = useRef(null);
    useEffect(() => {
      setPortalReady(true);
      return () => setPortalReady(false);
    }, []);
    const prefersReducedMotion = useMemo(() => {
      if (typeof window === "undefined" || !window.matchMedia)
        return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);
    const anim = useMemo(() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const anyCfg = config;
      const wizardAnims = ((_b = (_a = anyCfg == null ? void 0 : anyCfg.designConfig) == null ? void 0 : _a.popupDesign) == null ? void 0 : _b.animations) || (anyCfg == null ? void 0 : anyCfg.animations);
      const legacyVariant = ((_d = (_c = anyCfg == null ? void 0 : anyCfg.designConfig) == null ? void 0 : _c.popupDesign) == null ? void 0 : _d.animation) || (anyCfg == null ? void 0 : anyCfg.animation);
      const entrance = ((_e = wizardAnims == null ? void 0 : wizardAnims.entrance) == null ? void 0 : _e.animation) || (legacyVariant === "fade" ? "popupFadeIn" : legacyVariant === "slideDown" ? "slideInDown" : "scaleIn");
      const exit = ((_f = wizardAnims == null ? void 0 : wizardAnims.exit) == null ? void 0 : _f.animation) || (legacyVariant === "fade" ? "popupFadeOut" : legacyVariant === "slideDown" ? "slideOutDown" : "scaleOut");
      const mapEasing = (e) => {
        switch (e) {
          case "smooth":
            return "cubic-bezier(0.4, 0, 0.2, 1)";
          case "snappy":
            return "cubic-bezier(0.4, 0, 0.6, 1)";
          case "gentle":
            return "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          case "bounce":
            return "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          case "elastic":
            return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          case "back":
            return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          case "ease-in":
          case "ease-out":
          case "ease-in-out":
          case "ease":
            return e;
          default:
            return "ease-out";
        }
      };
      return {
        entranceName: prefersReducedMotion ? "popupFadeIn" : entrance,
        exitName: prefersReducedMotion ? "popupFadeOut" : exit,
        entranceDuration: prefersReducedMotion ? 150 : Number((_g = wizardAnims == null ? void 0 : wizardAnims.entrance) == null ? void 0 : _g.duration) || 300,
        exitDuration: prefersReducedMotion ? 120 : Number((_h = wizardAnims == null ? void 0 : wizardAnims.exit) == null ? void 0 : _h.duration) || 220,
        entranceEasing: prefersReducedMotion ? "linear" : mapEasing((_i = wizardAnims == null ? void 0 : wizardAnims.entrance) == null ? void 0 : _i.easing),
        exitEasing: prefersReducedMotion ? "linear" : mapEasing(((_j = wizardAnims == null ? void 0 : wizardAnims.exit) == null ? void 0 : _j.easing) || "ease-in")
      };
    }, [config, prefersReducedMotion]);
    useEffect(() => {
      if (isVisible) {
        if (exitTimerRef.current) {
          window.clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        setExiting(false);
        setPresent(true);
      } else if (present) {
        setExiting(true);
        const t = window.setTimeout(
          () => {
            setPresent(false);
            setExiting(false);
          },
          Math.max(50, anim.exitDuration)
        );
        exitTimerRef.current = t;
      }
    }, [isVisible, present, anim.exitDuration]);
    useEffect(() => {
      if (present && !config.previewMode) {
        document.body.style.overflow = "hidden";
        const handleEscape = (e) => {
          if (e.key === "Escape") {
            onClose();
          }
        };
        document.addEventListener("keydown", handleEscape);
        return () => {
          document.body.style.overflow = "unset";
          document.removeEventListener("keydown", handleEscape);
        };
      }
    }, [present, onClose, config.previewMode]);
    if (!portalReady || !present) {
      return null;
    }
    const overlayStyle = config.previewMode ? {
      position: "relative",
      width: "100%",
      minHeight: "400px",
      backgroundColor: "transparent",
      // Overlay handled by PreviewContainer
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    } : {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity || 0.5})`,
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animationName: exiting ? "overlayFadeOut" : "overlayFadeIn",
      animationDuration: `${exiting ? Math.min(anim.exitDuration, 250) : Math.min(anim.entranceDuration, 250)}ms`,
      animationTimingFunction: "ease-out",
      animationFillMode: "both"
    };
    const popupStyle = {
      backgroundColor: config.backgroundColor,
      color: config.textColor,
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      position: "relative",
      maxWidth: "90vw",
      maxHeight: "90vh",
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      willChange: "transform, opacity",
      animationName: exiting ? anim.exitName : anim.entranceName,
      animationDuration: `${exiting ? anim.exitDuration : anim.entranceDuration}ms`,
      animationTimingFunction: exiting ? anim.exitEasing : anim.entranceEasing,
      animationFillMode: "both"
    };
    const getSizeStyles = () => {
      switch (config.size) {
        case "small":
          return { width: "360px", padding: "24px" };
        case "large":
          return { width: "520px", padding: "40px" };
        default:
          return { width: "420px", padding: "32px" };
      }
    };
    const buttonStyle = {
      backgroundColor: config.buttonColor || "#007cba",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "14px 28px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
      textAlign: "center",
      transition: "all 0.2s ease",
      minWidth: "140px"
    };
    const closeButtonStyle = {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: config.textColor,
      opacity: 0.7,
      transition: "opacity 0.2s ease",
      zIndex: 10
      // Ensure close button is always on top
    };
    const handleOverlayClick = () => {
      if (!config.previewMode && config.closeOnOverlayClick !== false) {
        onClose();
      }
    };
    const content = /* @__PURE__ */ u(Fragment2, { children: [
      /* @__PURE__ */ u("style", { children: `
        @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.92); } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(40px); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayFadeOut { from { opacity: 1; } to { opacity: 0; } }
      ` }),
      /* @__PURE__ */ u("div", { style: overlayStyle, onClick: handleOverlayClick, children: /* @__PURE__ */ u(
        "div",
        {
          style: __spreadValues(__spreadValues({}, popupStyle), getSizeStyles()),
          className,
          onClick: (e) => e.stopPropagation(),
          children: [
            config.showCloseButton !== false && /* @__PURE__ */ u(
              "button",
              {
                style: closeButtonStyle,
                onClick: onClose,
                "aria-label": "Close popup",
                onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                onMouseLeave: (e) => e.currentTarget.style.opacity = "0.7",
                children: "\xD7"
              }
            ),
            children || /* @__PURE__ */ u(Fragment2, { children: [
              /* @__PURE__ */ u(
                "div",
                {
                  style: { flex: 1, display: "flex", flexDirection: "column" },
                  children: [
                    config.imageUrl && /* @__PURE__ */ u("div", { style: { marginBottom: "20px", textAlign: "center" }, children: /* @__PURE__ */ u(
                      "img",
                      {
                        src: config.imageUrl,
                        alt: config.title,
                        style: {
                          maxWidth: "100%",
                          height: "auto",
                          borderRadius: "6px",
                          maxHeight: "120px",
                          objectFit: "cover"
                        }
                      }
                    ) }),
                    /* @__PURE__ */ u(
                      "h2",
                      {
                        style: {
                          margin: "0 0 16px 0",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: config.textColor,
                          lineHeight: "1.3",
                          textAlign: "left",
                          paddingRight: config.showCloseButton ? "30px" : "0"
                        },
                        children: config.title
                      }
                    ),
                    /* @__PURE__ */ u(
                      "p",
                      {
                        style: {
                          margin: "0 0 24px 0",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          color: config.textColor,
                          opacity: 0.85,
                          textAlign: "left",
                          flex: 1
                        },
                        children: config.description
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ u(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginTop: "8px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)"
                  },
                  children: /* @__PURE__ */ u(
                    "button",
                    {
                      style: buttonStyle,
                      onClick: onButtonClick,
                      onMouseEnter: (e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      },
                      children: config.buttonText
                    }
                  )
                }
              )
            ] })
          ]
        }
      ) })
    ] });
    console.log("[BasePopup] Portal decision:", {
      previewMode: config.previewMode,
      renderInline,
      willRenderInline: config.previewMode || renderInline
    });
    if (config.previewMode || renderInline) {
      console.log("[BasePopup] Rendering INLINE (no portal)");
      return content;
    }
    console.log("[BasePopup] Rendering with PORTAL to document.body");
    return createPortal(content, document.body);
  };

  // extensions/storefront-src/auto-generated/components/popups/ProductUpsellPopup.tsx
  var ProductUpsellPopup = ({
    config,
    isVisible,
    onClose,
    onButtonClick,
    onAddToCart,
    onUpdateCart,
    onProductClick
  }) => {
    const [selectedProducts, setSelectedProducts] = useState(
      /* @__PURE__ */ new Set()
    );
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedProducts, setAddedProducts] = useState(/* @__PURE__ */ new Set());
    const maxProducts = config.maxProducts || 4;
    const displayProducts = config.products.slice(0, maxProducts);
    const handleProductSelect = (variantId) => {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(variantId)) {
        newSelected.delete(variantId);
      } else {
        newSelected.add(variantId);
      }
      setSelectedProducts(newSelected);
    };
    const handleAddSelectedToCart = async () => {
      if (selectedProducts.size === 0)
        return;
      setIsAddingToCart(true);
      try {
        for (const variantId of selectedProducts) {
          await onAddToCart(variantId, 1);
        }
        setAddedProducts(new Set(selectedProducts));
        setSelectedProducts(/* @__PURE__ */ new Set());
        onUpdateCart == null ? void 0 : onUpdateCart();
        onButtonClick();
      } catch (error) {
        console.error("Error adding products to cart:", error);
      } finally {
        setIsAddingToCart(false);
      }
    };
    const handleQuickAdd = async (variantId) => {
      setIsAddingToCart(true);
      try {
        await onAddToCart(variantId, 1);
        setAddedProducts((prev) => /* @__PURE__ */ new Set([...prev, variantId]));
        onUpdateCart == null ? void 0 : onUpdateCart();
      } catch (error) {
        console.error("Error adding product to cart:", error);
      } finally {
        setIsAddingToCart(false);
      }
    };
    const formatPrice = (price) => {
      const numPrice = parseFloat(price);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(numPrice);
    };
    const productGridStyle = {
      display: config.layout === "carousel" ? "flex" : "grid",
      gridTemplateColumns: config.layout === "grid" ? `repeat(${config.columns || 2}, 1fr)` : void 0,
      flexDirection: config.layout === "carousel" ? "row" : void 0,
      gap: config.layout === "minimal-card" ? "12px" : "16px",
      marginBottom: "24px",
      maxHeight: config.layout === "minimal-card" ? "none" : "400px",
      overflowX: config.layout === "carousel" ? "auto" : "visible",
      overflowY: config.layout === "grid" ? "auto" : "visible",
      padding: config.layout === "carousel" ? "0 4px 0 0" : "0",
      // Smooth scrolling for carousel
      scrollBehavior: config.layout === "carousel" ? "smooth" : void 0,
      // Hide scrollbar but keep functionality
      scrollbarWidth: config.layout === "carousel" ? "none" : void 0,
      msOverflowStyle: config.layout === "carousel" ? "none" : void 0,
      WebkitOverflowScrolling: config.layout === "carousel" ? "touch" : void 0
    };
    const getProductCardStyle = (layout) => {
      const baseStyle = {
        cursor: "pointer",
        transition: "all 0.3s ease",
        backgroundColor: "#ffffff",
        position: "relative"
      };
      switch (layout) {
        case "carousel":
          return __spreadProps(__spreadValues({}, baseStyle), {
            border: "1px solid #e1e5e9",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            minWidth: "220px",
            maxWidth: "220px",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          });
        case "minimal-card":
          return __spreadProps(__spreadValues({}, baseStyle), {
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#f8f9fa"
          });
        default:
          return __spreadProps(__spreadValues({}, baseStyle), {
            border: "1px solid #e1e5e9",
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center"
          });
      }
    };
    const getSelectedCardStyle = (layout) => {
      const baseCardStyle = getProductCardStyle(layout);
      return __spreadProps(__spreadValues({}, baseCardStyle), {
        borderColor: config.buttonColor || "#007bff",
        backgroundColor: layout === "minimal-card" ? "#e3f2fd" : "#f8f9fa",
        transform: "translateY(-2px)",
        boxShadow: layout === "carousel" ? "0 8px 24px rgba(0, 123, 255, 0.15)" : "0 4px 12px rgba(0, 123, 255, 0.15)"
      });
    };
    const getProductImageStyle = (layout) => {
      const baseStyle = {
        objectFit: "cover",
        borderRadius: layout === "carousel" ? "8px" : "4px"
      };
      switch (layout) {
        case "carousel":
          return __spreadProps(__spreadValues({}, baseStyle), {
            width: "100%",
            height: "140px",
            marginBottom: config.showImages !== false ? "12px" : "0px"
          });
        case "minimal-card":
          return __spreadProps(__spreadValues({}, baseStyle), {
            width: "60px",
            height: "60px",
            borderRadius: "6px",
            marginBottom: "0px",
            flexShrink: 0
          });
        default:
          return __spreadProps(__spreadValues({}, baseStyle), {
            width: "100%",
            height: "120px",
            marginBottom: config.showImages !== false ? "8px" : "0px"
          });
      }
    };
    const _priceStyle = {
      fontWeight: "bold",
      color: config.textColor,
      marginBottom: "8px"
    };
    const _compareAtPriceStyle = {
      textDecoration: "line-through",
      color: "#6c757d",
      fontSize: "0.9em",
      marginRight: "8px"
    };
    const _quickAddButtonStyle = {
      backgroundColor: config.buttonColor || "#007bff",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "4px",
      padding: "6px 12px",
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      width: "100%"
    };
    const mainButtonStyle = {
      backgroundColor: selectedProducts.size > 0 ? config.buttonColor || "#007bff" : "#6c757d",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "12px 24px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: selectedProducts.size > 0 ? "pointer" : "not-allowed",
      transition: "all 0.2s ease",
      opacity: isAddingToCart ? 0.7 : 1
    };
    return /* @__PURE__ */ u(
      BasePopup,
      {
        config,
        isVisible,
        onClose,
        onButtonClick: () => {
        },
        className: "product-upsell-popup",
        children: /* @__PURE__ */ u("div", { style: { padding: "20px" }, children: [
          /* @__PURE__ */ u("div", { style: { textAlign: "center", marginBottom: "20px" }, children: [
            /* @__PURE__ */ u(
              "h2",
              {
                style: {
                  color: config.textColor,
                  marginBottom: "8px",
                  fontSize: "24px",
                  fontWeight: "bold"
                },
                children: config.title
              }
            ),
            /* @__PURE__ */ u(
              "p",
              {
                style: {
                  color: config.textColor,
                  opacity: 0.8,
                  fontSize: "16px",
                  margin: 0
                },
                children: config.description
              }
            )
          ] }),
          /* @__PURE__ */ u(
            "div",
            {
              style: productGridStyle,
              className: config.layout === "carousel" ? "carousel-container" : "",
              children: [
                config.layout === "carousel" && /* @__PURE__ */ u(
                  "style",
                  {
                    dangerouslySetInnerHTML: {
                      __html: `
                .carousel-container::-webkit-scrollbar {
                  display: none;
                }
                .carousel-container {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `
                    }
                  }
                ),
                displayProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.variantId);
                  const isAdded = addedProducts.has(product.variantId);
                  const cardStyle = isSelected ? getSelectedCardStyle(config.layout || "grid") : getProductCardStyle(config.layout || "grid");
                  const imageStyle = getProductImageStyle(config.layout || "grid");
                  if (config.layout === "minimal-card") {
                    return /* @__PURE__ */ u(
                      "div",
                      {
                        style: cardStyle,
                        onClick: () => !isAdded && handleProductSelect(product.variantId),
                        children: [
                          config.showImages !== false && /* @__PURE__ */ u(
                            "img",
                            {
                              src: product.imageUrl,
                              alt: product.title,
                              style: imageStyle,
                              onError: (e) => {
                                const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                          <rect width="150" height="150" fill="#f8f9fa"/>
                          <rect x="30" y="25" width="90" height="75" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
                          <rect x="37" y="32" width="76" height="61" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
                          <circle cx="75" cy="62" r="12" fill="#6c757d"/>
                          <path d="M68 67 L72 71 L82 58" stroke="#ffffff" stroke-width="2" fill="none"/>
                          <text x="75" y="115" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="11">
                            Product
                          </text>
                          <text x="75" y="130" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="9">
                            Image
                          </text>
                        </svg>`;
                                e.currentTarget.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                              }
                            }
                          ),
                          /* @__PURE__ */ u("div", { style: { flex: 1, minWidth: 0 }, children: [
                            /* @__PURE__ */ u(
                              "h4",
                              {
                                style: {
                                  fontSize: "14px",
                                  margin: "0 0 4px 0",
                                  color: config.textColor,
                                  lineHeight: "1.3",
                                  fontWeight: "600"
                                },
                                children: product.title
                              }
                            ),
                            config.showPrices !== false && /* @__PURE__ */ u(
                              "div",
                              {
                                style: {
                                  fontSize: "13px",
                                  marginBottom: "8px",
                                  fontWeight: "bold",
                                  color: config.textColor
                                },
                                children: [
                                  config.showCompareAtPrice && product.compareAtPrice && /* @__PURE__ */ u(
                                    "span",
                                    {
                                      style: {
                                        textDecoration: "line-through",
                                        color: "#6c757d",
                                        fontSize: "12px",
                                        marginRight: "6px"
                                      },
                                      children: formatPrice(product.compareAtPrice)
                                    }
                                  ),
                                  /* @__PURE__ */ u("span", { children: formatPrice(product.price) })
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ u("div", { style: { marginLeft: "auto" }, children: isAdded ? /* @__PURE__ */ u(
                            "div",
                            {
                              style: {
                                backgroundColor: "#28a745",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: "bold"
                              },
                              children: "\u2713 Added"
                            }
                          ) : /* @__PURE__ */ u(
                            "button",
                            {
                              style: {
                                backgroundColor: config.buttonColor || "#007bff",
                                color: config.buttonTextColor || "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "11px",
                                cursor: "pointer",
                                fontWeight: "500"
                              },
                              onClick: (e) => {
                                e.stopPropagation();
                                handleQuickAdd(product.variantId);
                              },
                              disabled: isAddingToCart,
                              children: "Add"
                            }
                          ) }),
                          isSelected && /* @__PURE__ */ u(
                            "div",
                            {
                              style: {
                                position: "absolute",
                                top: "6px",
                                left: "6px",
                                backgroundColor: config.buttonColor || "#007bff",
                                color: "#ffffff",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "bold"
                              },
                              children: "\u2713"
                            }
                          )
                        ]
                      },
                      product.variantId
                    );
                  }
                  return /* @__PURE__ */ u(
                    "div",
                    {
                      style: cardStyle,
                      onClick: () => !isAdded && handleProductSelect(product.variantId),
                      children: [
                        config.showImages !== false && /* @__PURE__ */ u(
                          "img",
                          {
                            src: product.imageUrl,
                            alt: product.title,
                            style: imageStyle,
                            onError: (e) => {
                              const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                        <rect width="150" height="150" fill="#f8f9fa"/>
                        <rect x="30" y="25" width="90" height="75" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
                        <rect x="37" y="32" width="76" height="61" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
                        <circle cx="75" cy="62" r="12" fill="#6c757d"/>
                        <path d="M68 67 L72 71 L82 58" stroke="#ffffff" stroke-width="2" fill="none"/>
                        <text x="75" y="115" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="11">
                          Product
                        </text>
                        <text x="75" y="130" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="9">
                          Image
                        </text>
                      </svg>`;
                              e.currentTarget.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                            }
                          }
                        ),
                        /* @__PURE__ */ u(
                          "h4",
                          {
                            style: {
                              fontSize: config.layout === "carousel" ? "15px" : "14px",
                              margin: config.showImages !== false ? "0 0 8px 0" : "0 0 12px 0",
                              color: config.textColor,
                              lineHeight: "1.3",
                              fontWeight: config.layout === "carousel" ? "600" : "500"
                            },
                            children: product.title
                          }
                        ),
                        config.showPrices !== false && /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              fontWeight: "bold",
                              color: config.textColor,
                              marginBottom: "8px",
                              fontSize: config.layout === "carousel" ? "14px" : "13px"
                            },
                            children: [
                              config.showCompareAtPrice && product.compareAtPrice && /* @__PURE__ */ u(
                                "span",
                                {
                                  style: {
                                    textDecoration: "line-through",
                                    color: "#6c757d",
                                    fontSize: config.layout === "carousel" ? "13px" : "12px",
                                    marginRight: "8px"
                                  },
                                  children: formatPrice(product.compareAtPrice)
                                }
                              ),
                              /* @__PURE__ */ u("span", { children: formatPrice(product.price) })
                            ]
                          }
                        ),
                        isAdded ? /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              backgroundColor: "#28a745",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: config.layout === "carousel" ? "6px" : "4px",
                              padding: config.layout === "carousel" ? "8px 16px" : "6px 12px",
                              fontSize: config.layout === "carousel" ? "13px" : "12px",
                              cursor: "default",
                              width: "100%",
                              fontWeight: "600"
                            },
                            children: "\u2713 Added"
                          }
                        ) : /* @__PURE__ */ u(
                          "button",
                          {
                            style: {
                              backgroundColor: config.buttonColor || "#007bff",
                              color: config.buttonTextColor || "#ffffff",
                              border: "none",
                              borderRadius: config.layout === "carousel" ? "6px" : "4px",
                              padding: config.layout === "carousel" ? "8px 16px" : "6px 12px",
                              fontSize: config.layout === "carousel" ? "13px" : "12px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              width: "100%",
                              fontWeight: "600"
                            },
                            onClick: (e) => {
                              e.stopPropagation();
                              handleQuickAdd(product.variantId);
                            },
                            disabled: isAddingToCart,
                            onMouseEnter: (e) => {
                              e.currentTarget.style.opacity = "0.9";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            },
                            onMouseLeave: (e) => {
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.transform = "translateY(0px)";
                            },
                            children: "Quick Add"
                          }
                        ),
                        isSelected && /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              top: config.layout === "carousel" ? "12px" : "8px",
                              right: config.layout === "carousel" ? "12px" : "8px",
                              backgroundColor: config.buttonColor || "#007bff",
                              color: "#ffffff",
                              borderRadius: "50%",
                              width: config.layout === "carousel" ? "28px" : "24px",
                              height: config.layout === "carousel" ? "28px" : "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: config.layout === "carousel" ? "16px" : "14px",
                              fontWeight: "bold",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                            },
                            children: "\u2713"
                          }
                        )
                      ]
                    },
                    product.variantId
                  );
                })
              ]
            }
          ),
          /* @__PURE__ */ u(
            "div",
            {
              style: {
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                alignItems: "center"
              },
              children: [
                /* @__PURE__ */ u(
                  "button",
                  {
                    style: mainButtonStyle,
                    onClick: handleAddSelectedToCart,
                    disabled: selectedProducts.size === 0 || isAddingToCart,
                    children: isAddingToCart ? "Adding..." : selectedProducts.size > 0 ? `Add ${selectedProducts.size} Selected (${config.buttonText})` : "Select Products Above"
                  }
                ),
                /* @__PURE__ */ u(
                  "button",
                  {
                    style: {
                      backgroundColor: "transparent",
                      color: config.textColor,
                      border: `1px solid ${config.textColor}`,
                      borderRadius: "6px",
                      padding: "12px 24px",
                      fontSize: "16px",
                      cursor: "pointer",
                      opacity: 0.7
                    },
                    onClick: onClose,
                    children: config.secondaryCtaLabel || "No thanks"
                  }
                )
              ]
            }
          )
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/product-upsell-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["product-upsell"] = ProductUpsellPopup;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] ProductUpsell popup registered for: product-upsell"
      );
    }
  })();
})();
//# sourceMappingURL=product-upsell-popup.js.map
