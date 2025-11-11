"use strict";
(() => {
  var __defProp = Object.defineProperty;
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

  // extensions/storefront-src/auto-generated/components/popups/FreeShippingPopup.tsx
  var FreeShippingPopup = ({
    config,
    isVisible,
    onClose,
    onButtonClick,
    onAddToCart,
    onUpdateCart,
    onShopMore
  }) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedProducts, setAddedProducts] = useState(/* @__PURE__ */ new Set());
    const remainingAmount = Math.max(
      0,
      config.freeShippingThreshold - config.currentCartTotal
    );
    const progressPercentage = Math.min(
      100,
      config.currentCartTotal / config.freeShippingThreshold * 100
    );
    const isQualified = config.currentCartTotal >= config.freeShippingThreshold;
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency || "USD"
      }).format(amount);
    };
    const handleAddToCart = async (variantId) => {
      if (!onAddToCart)
        return;
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
    const getMainMessage = () => {
      if (isQualified) {
        return config.successTitle || "You qualify for free shipping!";
      }
      const message = config.headline || config.title || `Free shipping on orders over ${formatCurrency(config.freeShippingThreshold)}`;
      return message.replace(/\$\{threshold\}/g, formatCurrency(config.freeShippingThreshold)).replace(/\$\{remaining\}/g, formatCurrency(remainingAmount));
    };
    const getSubMessage = () => {
      if (isQualified) {
        return config.successSubhead || "Your order ships free!";
      }
      const message = config.subheadline || config.description || `Add ${formatCurrency(remainingAmount)} more to qualify!`;
      return message.replace(/\$\{remaining\}/g, formatCurrency(remainingAmount)).replace(/\$\{progress\}/g, Math.round(progressPercentage).toString());
    };
    if (config.displayStyle === "banner") {
      return /* @__PURE__ */ u(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: isQualified ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : `linear-gradient(135deg, ${config.backgroundColor || "#3b82f6"} 0%, ${config.backgroundColor ? `${config.backgroundColor}dd` : "#2563eb"} 100%)`,
            color: config.textColor || "#ffffff",
            padding: "16px 24px",
            zIndex: 1e4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "slideDown 0.4s ease-out",
            backdropFilter: "blur(10px)"
          },
          children: [
            /* @__PURE__ */ u("style", { children: `
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        ` }),
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  maxWidth: "1200px",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "20px"
                },
                children: [
                  /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                      },
                      children: [
                        /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              fontSize: "32px",
                              lineHeight: 1,
                              animation: isQualified ? "bounce 0.6s ease" : "none"
                            },
                            children: isQualified ? "\u{1F389}" : "\u{1F69A}"
                          }
                        ),
                        /* @__PURE__ */ u("div", { style: { flex: 1 }, children: [
                          /* @__PURE__ */ u(
                            "div",
                            {
                              style: {
                                fontSize: "16px",
                                fontWeight: "700",
                                letterSpacing: "-0.01em"
                              },
                              children: getMainMessage()
                            }
                          ),
                          !isQualified && /* @__PURE__ */ u(Fragment2, { children: [
                            /* @__PURE__ */ u(
                              "div",
                              {
                                style: {
                                  fontSize: "13px",
                                  opacity: 0.95,
                                  marginTop: "4px",
                                  fontWeight: "500"
                                },
                                children: getSubMessage()
                              }
                            ),
                            config.showProgress && /* @__PURE__ */ u(
                              "div",
                              {
                                style: {
                                  width: "100%",
                                  maxWidth: "300px",
                                  height: "6px",
                                  backgroundColor: "rgba(255,255,255,0.25)",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  marginTop: "10px",
                                  position: "relative"
                                },
                                children: /* @__PURE__ */ u(
                                  "div",
                                  {
                                    style: {
                                      height: "100%",
                                      background: "linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 100%)",
                                      width: `${progressPercentage}%`,
                                      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                      borderRadius: "10px",
                                      boxShadow: "0 0 10px rgba(255,255,255,0.5)"
                                    }
                                  }
                                )
                              }
                            )
                          ] })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ u("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
                    !isQualified && /* @__PURE__ */ u(
                      "button",
                      {
                        style: {
                          background: "rgba(255,255,255,0.2)",
                          color: "#ffffff",
                          border: "1px solid rgba(255,255,255,0.4)",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          backdropFilter: "blur(10px)",
                          whiteSpace: "nowrap"
                        },
                        onClick: onShopMore || onButtonClick,
                        onMouseOver: (e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        },
                        onMouseOut: (e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                          e.currentTarget.style.transform = "translateY(0)";
                        },
                        children: config.buttonText || "Shop More"
                      }
                    ),
                    /* @__PURE__ */ u(
                      "button",
                      {
                        style: {
                          background: "transparent",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "24px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          transition: "all 0.2s ease",
                          lineHeight: 1
                        },
                        onClick: onClose,
                        onMouseOver: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)",
                        onMouseOut: (e) => e.currentTarget.style.background = "transparent",
                        children: "\xD7"
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      );
    }
    if (config.displayStyle === "sticky") {
      return /* @__PURE__ */ u(
        "div",
        {
          style: {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: isQualified ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : `linear-gradient(135deg, ${config.backgroundColor || "#3b82f6"} 0%, ${config.backgroundColor ? `${config.backgroundColor}dd` : "#2563eb"} 100%)`,
            color: config.textColor || "#ffffff",
            padding: "20px 24px",
            zIndex: 1e4,
            boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
            animation: "slideUp 0.4s ease-out",
            backdropFilter: "blur(10px)"
          },
          children: [
            /* @__PURE__ */ u("style", { children: `
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        ` }),
            /* @__PURE__ */ u(
              "div",
              {
                style: { maxWidth: "1200px", margin: "0 auto", textAlign: "center" },
                children: [
                  /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        fontSize: "18px",
                        fontWeight: "700",
                        marginBottom: "8px",
                        letterSpacing: "-0.01em"
                      },
                      children: [
                        isQualified ? "\u{1F389} " : "\u{1F69A} ",
                        getMainMessage()
                      ]
                    }
                  ),
                  !isQualified && /* @__PURE__ */ u(Fragment2, { children: [
                    /* @__PURE__ */ u(
                      "div",
                      {
                        style: {
                          fontSize: "14px",
                          opacity: 0.95,
                          marginBottom: "12px",
                          fontWeight: "500"
                        },
                        children: getSubMessage()
                      }
                    ),
                    config.showProgress && /* @__PURE__ */ u(
                      "div",
                      {
                        style: {
                          width: "100%",
                          maxWidth: "400px",
                          height: "8px",
                          backgroundColor: "rgba(255,255,255,0.25)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          margin: "0 auto",
                          position: "relative"
                        },
                        children: /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              height: "100%",
                              background: "linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 100%)",
                              width: `${progressPercentage}%`,
                              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                              borderRadius: "10px",
                              boxShadow: "0 0 10px rgba(255,255,255,0.5)"
                            }
                          }
                        )
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      );
    }
    return /* @__PURE__ */ u(
      BasePopup,
      {
        config,
        onButtonClick: () => {
        },
        isVisible,
        onClose,
        children: /* @__PURE__ */ u("div", { style: { padding: "32px 28px 28px" }, children: [
          /* @__PURE__ */ u("div", { style: { textAlign: "center", marginBottom: "28px" }, children: [
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  fontSize: "56px",
                  lineHeight: 1,
                  marginBottom: "16px",
                  animation: isQualified ? "bounce 0.6s ease" : "pulse 2s ease infinite"
                },
                children: isQualified ? "\u{1F389}" : "\u{1F69A}"
              }
            ),
            /* @__PURE__ */ u("style", { children: `
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          ` }),
            /* @__PURE__ */ u(
              "h2",
              {
                style: {
                  color: isQualified ? "#10b981" : config.textColor || "#1f2937",
                  marginBottom: "8px",
                  fontSize: "28px",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.2"
                },
                children: getMainMessage()
              }
            ),
            /* @__PURE__ */ u(
              "p",
              {
                style: {
                  color: config.textColor || "#6b7280",
                  fontSize: "16px",
                  margin: 0,
                  fontWeight: "500"
                },
                children: getSubMessage()
              }
            )
          ] }),
          config.showProgress !== false && !isQualified && /* @__PURE__ */ u("div", { style: { marginBottom: "28px" }, children: [
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  position: "relative",
                  width: "100%",
                  height: "14px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)"
                },
                children: /* @__PURE__ */ u(
                  "div",
                  {
                    style: {
                      height: "100%",
                      background: `linear-gradient(90deg, ${config.progressColor || config.buttonColor || "#3b82f6"} 0%, ${config.progressColor || config.buttonColor ? `${config.progressColor || config.buttonColor}cc` : "#2563eb"} 100%)`,
                      width: `${progressPercentage}%`,
                      transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: "12px",
                      position: "relative",
                      overflow: "hidden"
                    },
                    children: /* @__PURE__ */ u(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2s infinite"
                        }
                      }
                    )
                  }
                )
              }
            ),
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: config.textColor || "#6b7280",
                  marginTop: "10px",
                  fontWeight: "600"
                },
                children: [
                  /* @__PURE__ */ u(
                    "span",
                    {
                      style: {
                        color: config.progressColor || config.buttonColor || "#3b82f6"
                      },
                      children: [
                        Math.round(progressPercentage),
                        "% complete"
                      ]
                    }
                  ),
                  /* @__PURE__ */ u("span", { children: [
                    formatCurrency(config.currentCartTotal),
                    " /",
                    " ",
                    /* @__PURE__ */ u(
                      "span",
                      {
                        style: {
                          color: config.thresholdTextColor || "#059669",
                          fontWeight: "600"
                        },
                        children: formatCurrency(config.freeShippingThreshold)
                      }
                    )
                  ] })
                ]
              }
            )
          ] }),
          config.showProducts && !isQualified && config.products && config.products.length > 0 && /* @__PURE__ */ u("div", { style: { marginBottom: "28px" }, children: [
            /* @__PURE__ */ u(
              "h3",
              {
                style: {
                  color: config.textColor || "#1f2937",
                  fontSize: "18px",
                  marginBottom: "16px",
                  fontWeight: "700",
                  letterSpacing: "-0.01em"
                },
                children: "Add one of these to qualify:"
              }
            ),
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "280px",
                  overflowY: "auto"
                },
                children: config.products.slice(0, 3).map((product) => {
                  const isAdded = addedProducts.has(product.variantId);
                  const productPrice = parseFloat(product.price);
                  const willQualify = config.currentCartTotal + productPrice >= config.freeShippingThreshold;
                  return /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        padding: "14px",
                        border: willQualify ? "2px solid #10b981" : "2px solid #e5e7eb",
                        borderRadius: "12px",
                        backgroundColor: willQualify ? "#f0fdf4" : "#ffffff",
                        transition: "all 0.3s ease",
                        boxShadow: willQualify ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 2px 6px rgba(0,0,0,0.04)",
                        cursor: "default"
                      },
                      children: [
                        /* @__PURE__ */ u(
                          "img",
                          {
                            src: product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23e5e7eb' width='60' height='60'/%3E%3C/svg%3E",
                            alt: product.title,
                            style: {
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              marginRight: "14px",
                              flexShrink: 0,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }
                          }
                        ),
                        /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              flex: 1,
                              textAlign: "left",
                              marginRight: "12px"
                            },
                            children: [
                              /* @__PURE__ */ u(
                                "h4",
                                {
                                  style: {
                                    fontSize: "15px",
                                    margin: "0 0 6px 0",
                                    color: config.textColor || "#1f2937",
                                    lineHeight: "1.3",
                                    fontWeight: "600"
                                  },
                                  children: product.title
                                }
                              ),
                              /* @__PURE__ */ u(
                                "p",
                                {
                                  style: {
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: config.textColor || "#1f2937",
                                    margin: 0
                                  },
                                  children: formatCurrency(productPrice)
                                }
                              ),
                              willQualify && /* @__PURE__ */ u(
                                "p",
                                {
                                  style: {
                                    fontSize: "12px",
                                    color: "#10b981",
                                    margin: "6px 0 0 0",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  },
                                  children: [
                                    /* @__PURE__ */ u("span", { children: "\u2713" }),
                                    " Unlocks free shipping!"
                                  ]
                                }
                              )
                            ]
                          }
                        ),
                        isAdded ? /* @__PURE__ */ u(
                          "button",
                          {
                            style: {
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "10px 16px",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "default",
                              minWidth: "90px",
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                            },
                            disabled: true,
                            children: "\u2713 Added"
                          }
                        ) : /* @__PURE__ */ u(
                          "button",
                          {
                            style: {
                              background: `linear-gradient(135deg, ${config.buttonColor || "#3b82f6"} 0%, ${config.buttonColor ? `${config.buttonColor}dd` : "#2563eb"} 100%)`,
                              color: config.buttonTextColor || "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "10px 16px",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              minWidth: "90px",
                              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)"
                            },
                            onClick: () => handleAddToCart(product.variantId),
                            disabled: isAddingToCart,
                            onMouseOver: (e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                            },
                            onMouseOut: (e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                            },
                            children: isAddingToCart ? "Adding..." : "Add"
                          }
                        )
                      ]
                    },
                    product.variantId
                  );
                })
              }
            )
          ] }),
          /* @__PURE__ */ u(
            "button",
            {
              style: {
                background: isQualified ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : `linear-gradient(135deg, ${config.buttonColor || "#3b82f6"} 0%, ${config.buttonColor ? `${config.buttonColor}dd` : "#2563eb"} 100%)`,
                color: config.buttonTextColor || "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "16px 32px",
                fontSize: "17px",
                fontWeight: "700",
                cursor: "pointer",
                width: "100%",
                transition: "all 0.3s ease",
                boxShadow: isQualified ? "0 4px 16px rgba(16, 185, 129, 0.4)" : "0 4px 16px rgba(59, 130, 246, 0.4)",
                letterSpacing: "-0.01em"
              },
              onClick: onShopMore || onButtonClick,
              onMouseOver: (e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = isQualified ? "0 6px 20px rgba(16, 185, 129, 0.5)" : "0 6px 20px rgba(59, 130, 246, 0.5)";
              },
              onMouseOut: (e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isQualified ? "0 4px 16px rgba(16, 185, 129, 0.4)" : "0 4px 16px rgba(59, 130, 246, 0.4)";
              },
              children: isQualified ? "\u{1F389} Continue to Checkout" : config.buttonText || "Shop More"
            }
          )
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/free-shipping-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["free-shipping"] = FreeShippingPopup;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] FreeShipping popup registered for: free-shipping"
      );
    }
  })();
})();
//# sourceMappingURL=free-shipping-popup.js.map
