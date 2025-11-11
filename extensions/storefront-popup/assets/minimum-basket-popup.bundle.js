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

  // extensions/storefront-src/auto-generated/components/popups/MinimumBasketPopup.tsx
  var MinimumBasketPopup = ({
    config,
    isVisible,
    onClose,
    onButtonClick,
    onAddToCart,
    onUpdateCart
  }) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedProducts, setAddedProducts] = useState(/* @__PURE__ */ new Set());
    const remainingAmount = Math.max(
      0,
      config.minimumAmount - config.currentAmount
    );
    const progressPercentage = Math.min(
      100,
      config.currentAmount / config.minimumAmount * 100
    );
    const isThresholdMet = config.currentAmount >= config.minimumAmount;
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency || "USD"
      }).format(amount);
    };
    const handleAddToCart = async (variantId) => {
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
    const getThresholdMessage = () => {
      if (isThresholdMet) {
        return "\u{1F389} Congratulations! You qualify for free delivery!";
      }
      const message = config.thresholdMessage || `Add ${formatCurrency(remainingAmount)} more for free delivery`;
      return message.replace(/\$\{remaining\}/g, formatCurrency(remainingAmount)).replace(/\$\{amount\}/g, formatCurrency(remainingAmount));
    };
    const getProgressMessage = () => {
      if (isThresholdMet) {
        return "You've reached the minimum order amount!";
      }
      const message = config.progressMessage || `You're ${Math.round(progressPercentage)}% of the way to free delivery!`;
      return message.replace(
        /\$\{progress\}/g,
        Math.round(progressPercentage).toString()
      );
    };
    const progressBarStyle = {
      width: "100%",
      height: "8px",
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "8px"
    };
    const progressFillStyle = {
      height: "100%",
      backgroundColor: isThresholdMet ? "#28a745" : config.progressColor || "#007bff",
      width: `${progressPercentage}%`,
      transition: "width 0.3s ease",
      borderRadius: "4px"
    };
    const productCardStyle = {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #e1e5e9",
      borderRadius: "8px",
      marginBottom: "12px",
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease"
    };
    const productImageStyle = {
      width: "60px",
      height: "60px",
      objectFit: "cover",
      borderRadius: "4px",
      marginRight: "12px"
    };
    const addButtonStyle = {
      backgroundColor: config.buttonColor || "#007bff",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      minWidth: "80px"
    };
    const addedButtonStyle = __spreadProps(__spreadValues({}, addButtonStyle), {
      backgroundColor: "#28a745",
      cursor: "default"
    });
    const mainButtonStyle = {
      backgroundColor: config.buttonColor || "#007bff",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "12px 24px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s ease",
      width: "100%",
      marginBottom: "12px"
    };
    const secondaryButtonStyle = {
      backgroundColor: "transparent",
      color: config.textColor,
      border: `1px solid ${config.textColor}`,
      borderRadius: "6px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      opacity: 0.7,
      width: "100%"
    };
    return /* @__PURE__ */ u(
      BasePopup,
      {
        config,
        isVisible,
        onClose,
        onButtonClick: () => {
        },
        className: "minimum-basket-popup",
        children: /* @__PURE__ */ u("div", { style: { padding: "24px" }, children: [
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
                children: getThresholdMessage()
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
          config.showProgress !== false && /* @__PURE__ */ u("div", { style: { marginBottom: "20px" }, children: [
            /* @__PURE__ */ u("div", { style: progressBarStyle, children: /* @__PURE__ */ u("div", { style: progressFillStyle }) }),
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "14px",
                  color: config.textColor,
                  opacity: 0.8
                },
                children: [
                  /* @__PURE__ */ u("span", { children: getProgressMessage() }),
                  /* @__PURE__ */ u("span", { children: [
                    formatCurrency(config.currentAmount),
                    " /",
                    " ",
                    formatCurrency(config.minimumAmount)
                  ] })
                ]
              }
            )
          ] }),
          !isThresholdMet && config.products && config.products.length > 0 && /* @__PURE__ */ u("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ u(
              "h3",
              {
                style: {
                  color: config.textColor,
                  fontSize: "18px",
                  marginBottom: "16px",
                  textAlign: "center"
                },
                children: "Add one of these to qualify:"
              }
            ),
            /* @__PURE__ */ u("div", { style: { maxHeight: "300px", overflowY: "auto" }, children: config.products.slice(0, 4).map((product) => {
              const isAdded = addedProducts.has(product.variantId);
              const productPrice = parseFloat(product.price);
              const willQualify = config.currentAmount + productPrice >= config.minimumAmount;
              return /* @__PURE__ */ u(
                "div",
                {
                  style: __spreadProps(__spreadValues({}, productCardStyle), {
                    borderColor: willQualify ? "#28a745" : "#e1e5e9",
                    backgroundColor: willQualify ? "#f8fff9" : "#ffffff"
                  }),
                  children: [
                    /* @__PURE__ */ u(
                      "img",
                      {
                        src: product.imageUrl,
                        alt: product.title,
                        style: productImageStyle,
                        onError: (e) => {
                          e.currentTarget.src = "/placeholder-product.png";
                        }
                      }
                    ),
                    /* @__PURE__ */ u("div", { style: { flex: 1, marginRight: "12px" }, children: [
                      /* @__PURE__ */ u(
                        "h4",
                        {
                          style: {
                            fontSize: "16px",
                            margin: "0 0 4px 0",
                            color: config.textColor,
                            lineHeight: "1.3"
                          },
                          children: product.title
                        }
                      ),
                      /* @__PURE__ */ u(
                        "p",
                        {
                          style: {
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: config.textColor,
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
                            color: "#28a745",
                            margin: "4px 0 0 0",
                            fontWeight: "bold"
                          },
                          children: "\u2713 This will qualify you for free delivery!"
                        }
                      )
                    ] }),
                    isAdded ? /* @__PURE__ */ u("button", { style: addedButtonStyle, disabled: true, children: "\u2713 Added" }) : /* @__PURE__ */ u(
                      "button",
                      {
                        style: addButtonStyle,
                        onClick: () => handleAddToCart(product.variantId),
                        disabled: isAddingToCart,
                        onMouseEnter: (e) => {
                          e.currentTarget.style.opacity = "0.9";
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.opacity = "1";
                        },
                        children: isAddingToCart ? "Adding..." : "Add"
                      }
                    )
                  ]
                },
                product.variantId
              );
            }) })
          ] }),
          /* @__PURE__ */ u("div", { style: { textAlign: "center" }, children: isThresholdMet ? /* @__PURE__ */ u(
            "button",
            {
              style: __spreadProps(__spreadValues({}, mainButtonStyle), {
                backgroundColor: "#28a745"
              }),
              onClick: onButtonClick,
              children: "\u{1F389} Continue to Checkout"
            }
          ) : /* @__PURE__ */ u(Fragment2, { children: [
            /* @__PURE__ */ u("button", { style: mainButtonStyle, onClick: onButtonClick, children: config.buttonText || "Continue Shopping" }),
            /* @__PURE__ */ u("button", { style: secondaryButtonStyle, onClick: onClose, children: config.secondaryCtaLabel || "Continue anyway" })
          ] }) })
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/minimum-basket-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["minimum-basket"] = MinimumBasketPopup;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] MinimumBasket popup registered for: minimum-basket"
      );
    }
  })();
})();
//# sourceMappingURL=minimum-basket-popup.js.map
