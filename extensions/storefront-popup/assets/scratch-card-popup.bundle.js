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

  // extensions/storefront-src/auto-generated/components/popups/ScratchCardPopup.tsx
  var ScratchCardPopup = ({
    config,
    isVisible,
    onClose,
    campaignId,
    renderInline,
    onScratchComplete
  }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const [email, setEmail] = useState("");
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [isScratching, setIsScratching] = useState(false);
    const [scratchPercentage, setScratchPercentage] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localDiscountCode, setLocalDiscountCode] = useState(void 0);
    const revealContainerRef = useRef(null);
    const confettiCanvasRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const scratchedPixelsRef = useRef(/* @__PURE__ */ new Set());
    const totalPixelsRef = useRef(0);
    console.log("[ScratchCardPopup] \u{1F50D} Config received:", {
      emailRequired: config.emailRequired,
      emailBeforeScratching: config.emailBeforeScratching,
      headline: config.headline,
      prizes: config.prizes
    });
    const emailRequired = (_a = config.emailRequired) != null ? _a : true;
    const emailBeforeScratching = (_b = config.emailBeforeScratching) != null ? _b : true;
    console.log("[ScratchCardPopup] \u{1F4CA} Computed values:", {
      emailRequired,
      emailBeforeScratching
    });
    const scratchThreshold = (_c = config.scratchThreshold) != null ? _c : 50;
    const scratchRadius = (_d = config.scratchRadius) != null ? _d : 20;
    const scratchCardWidth = (_e = config.scratchCardWidth) != null ? _e : 300;
    const scratchCardHeight = (_f = config.scratchCardHeight) != null ? _f : 200;
    const scratchOverlayColor = (_g = config.scratchOverlayColor) != null ? _g : "#C0C0C0";
    const scratchCardBg = (_h = config.scratchCardBackgroundColor) != null ? _h : "#F59E0B";
    const scratchCardText = (_i = config.scratchCardTextColor) != null ? _i : "#FFFFFF";
    const shouldShowScratchCard = useCallback(() => {
      if (!emailRequired)
        return true;
      if (!emailBeforeScratching)
        return true;
      if (emailRequired && emailBeforeScratching) {
        return emailSubmitted;
      }
      return true;
    }, [emailRequired, emailBeforeScratching, emailSubmitted]);
    useEffect(() => {
      if (!isVisible) {
        setEmail("");
        setEmailSubmitted(false);
        setIsScratching(false);
        setScratchPercentage(0);
        setIsRevealed(false);
        setError("");
        setCopied(false);
        setShowConfetti(false);
        setIsSubmitting(false);
        setLocalDiscountCode(void 0);
        scratchedPixelsRef.current.clear();
      }
    }, [isVisible]);
    useEffect(() => {
      if (!isVisible)
        return;
      if (!shouldShowScratchCard())
        return;
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;
      scratchedPixelsRef.current.clear();
      setScratchPercentage(0);
      canvas.width = scratchCardWidth;
      canvas.height = scratchCardHeight;
      if (config.scratchOverlayImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, scratchCardWidth, scratchCardHeight);
        };
        img.src = config.scratchOverlayImage;
      } else {
        const grad = ctx.createLinearGradient(
          0,
          0,
          scratchCardWidth,
          scratchCardHeight
        );
        grad.addColorStop(0, "#bfc3c7");
        grad.addColorStop(0.25, "#e3e5e8");
        grad.addColorStop(0.5, "#c7cbcf");
        grad.addColorStop(0.75, "#f1f2f4");
        grad.addColorStop(1, "#b5b8bb");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);
        const patternSize = 16;
        const pCanvas = document.createElement("canvas");
        pCanvas.width = patternSize;
        pCanvas.height = patternSize;
        const pctx = pCanvas.getContext("2d");
        if (pctx) {
          pctx.strokeStyle = "rgba(255,255,255,0.15)";
          pctx.lineWidth = 2;
          pctx.beginPath();
          pctx.moveTo(0, patternSize);
          pctx.lineTo(patternSize, 0);
          pctx.stroke();
          const pattern = ctx.createPattern(pCanvas, "repeat");
          if (pattern) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);
            ctx.globalAlpha = 1;
          }
        }
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillText(
          config.scratchInstruction || "\u{1F3AB} SCRATCH HERE!",
          scratchCardWidth / 2,
          scratchCardHeight / 2
        );
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.globalCompositeOperation = "destination-out";
      contextRef.current = ctx;
      totalPixelsRef.current = scratchCardWidth * scratchCardHeight;
    }, [
      isVisible,
      scratchCardWidth,
      scratchCardHeight,
      config.scratchOverlayImage,
      scratchOverlayColor,
      config.scratchInstruction,
      shouldShowScratchCard,
      emailSubmitted,
      emailRequired,
      emailBeforeScratching
    ]);
    const validateEmail = (email2) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email2);
    };
    const handleEmailSubmit = async (e) => {
      var _a2, _b2, _c2, _d2;
      e.preventDefault();
      setError("");
      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (!campaignId) {
        console.warn(
          "[ScratchCardPopup] Missing campaignId; proceeding without API call"
        );
        setEmailSubmitted(true);
        return;
      }
      try {
        setIsSubmitting(true);
        const sessionId = typeof window !== "undefined" ? ((_a2 = window.sessionStorage) == null ? void 0 : _a2.getItem("split_pop_session_id")) || `session-${Date.now()}` : `session-${Date.now()}`;
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem("split_pop_session_id", sessionId);
          } catch (e2) {
          }
        }
        const shopDomain = typeof window !== "undefined" ? ((_b2 = window.SPLIT_POP_CONFIG) == null ? void 0 : _b2.shopDomain) || ((_c2 = window.Shopify) == null ? void 0 : _c2.shop) || window.location.hostname : "";
        const url = new URL(
          "/apps/split-pop/commerce/leads/subscribe",
          window.location.origin
        );
        if (shopDomain) {
          url.searchParams.set("shop", shopDomain);
        }
        const resp = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            campaignId,
            consent: true,
            sessionId,
            pageUrl: typeof window !== "undefined" ? window.location.href : void 0,
            referrer: typeof window !== "undefined" ? document.referrer : void 0
          })
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const errorMessage = ((_d2 = err == null ? void 0 : err.errors) == null ? void 0 : _d2[0]) || (err == null ? void 0 : err.error) || "Subscription failed";
          throw new Error(errorMessage);
        }
        const result = await resp.json();
        if (result == null ? void 0 : result.discountCode) {
          setLocalDiscountCode(result.discountCode);
        }
        setEmailSubmitted(true);
      } catch (err) {
        console.error("[ScratchCardPopup] Lead subscribe failed", err);
        setError(
          err instanceof Error ? err.message : "Failed to subscribe. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    };
    const scratch = (x, y) => {
      const ctx = contextRef.current;
      if (!ctx)
        return;
      const g = ctx.createRadialGradient(
        x,
        y,
        Math.max(1, scratchRadius * 0.3),
        x,
        y,
        scratchRadius
      );
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, scratchRadius, 0, Math.PI * 2);
      ctx.fill();
      const pixelSize = 5;
      for (let px = x - scratchRadius; px < x + scratchRadius; px += pixelSize) {
        for (let py = y - scratchRadius; py < y + scratchRadius; py += pixelSize) {
          const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
          if (distance <= scratchRadius) {
            scratchedPixelsRef.current.add(`${Math.floor(px)},${Math.floor(py)}`);
          }
        }
      }
      const scratchedCount = scratchedPixelsRef.current.size * (pixelSize * pixelSize);
      const percentage = Math.min(
        scratchedCount / totalPixelsRef.current * 100,
        100
      );
      setScratchPercentage(percentage);
      if (!isRevealed && percentage >= scratchThreshold) {
        handleReveal();
      }
    };
    const handleMouseDown = (e) => {
      var _a2;
      if (!canScratch())
        return;
      setIsScratching(true);
      const rect = (_a2 = canvasRef.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect) {
        scratch(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    const handleMouseMove = (e) => {
      var _a2;
      if (!isScratching || !canScratch())
        return;
      const rect = (_a2 = canvasRef.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect) {
        scratch(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    const handleMouseUp = () => {
      setIsScratching(false);
    };
    const handleTouchStart = (e) => {
      var _a2;
      if (!canScratch())
        return;
      e.preventDefault();
      setIsScratching(true);
      const rect = (_a2 = canvasRef.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect && e.touches[0]) {
        scratch(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
    };
    const handleTouchMove = (e) => {
      var _a2;
      if (!isScratching || !canScratch())
        return;
      e.preventDefault();
      const rect = (_a2 = canvasRef.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect && e.touches[0]) {
        scratch(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
    };
    const handleTouchEnd = () => {
      setIsScratching(false);
    };
    const canScratch = () => {
      if (emailRequired && emailBeforeScratching) {
        return emailSubmitted;
      }
      return true;
    };
    const handleReveal = async () => {
      setIsRevealed(true);
      const ctx = contextRef.current;
      if (ctx) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);
      }
      setShowConfetti(true);
      if (onScratchComplete) {
        await onScratchComplete({
          email: emailSubmitted ? email : void 0,
          revealed: true
        });
      }
      if (config.autoCloseDelay && config.autoCloseDelay > 0) {
        setTimeout(() => {
          onClose();
        }, config.autoCloseDelay * 1e3);
      }
    };
    useEffect(() => {
      if (!showConfetti)
        return;
      const container = revealContainerRef.current;
      const canvas = confettiCanvasRef.current;
      if (!container || !canvas)
        return;
      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      const colors = [
        "#ffffff",
        "#fde68a",
        // amber-200
        "#fca5a5",
        // red-300
        "#93c5fd",
        // blue-300
        "#86efac",
        // green-300
        "#f5d0fe"
        // fuchsia-200
      ];
      const particles = [];
      const count = Math.max(
        24,
        Math.min(80, Math.floor(rect.width * rect.height / 5e3))
      );
      for (let i2 = 0; i2 < count; i2++) {
        particles.push({
          x: Math.random() * rect.width,
          y: -10 - Math.random() * rect.height * 0.3,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.5 + Math.random() * 2.5,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      let raf = 0;
      const start = performance.now();
      const duration = 1800;
      const draw = (now) => {
        const t = now - start;
        ctx.clearRect(0, 0, rect.width, rect.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y > rect.height + 20)
            p.y = -20;
          if (p.x < -20)
            p.x = rect.width + 20;
          if (p.x > rect.width + 20)
            p.x = -20;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });
        if (t < duration) {
          raf = requestAnimationFrame(draw);
        } else {
          const fadeStart = performance.now();
          const fade = () => {
            const ft = performance.now() - fadeStart;
            const alpha = Math.max(0, 1 - ft / 400);
            ctx.globalAlpha = alpha;
            ctx.clearRect(0, 0, rect.width, rect.height);
            particles.forEach((p) => {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              ctx.fillStyle = p.color;
              ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
              ctx.restore();
            });
            if (alpha > 0) {
              raf = requestAnimationFrame(fade);
            } else {
              ctx.globalAlpha = 1;
              setShowConfetti(false);
            }
          };
          raf = requestAnimationFrame(fade);
        }
      };
      raf = requestAnimationFrame(draw);
      const onResize = () => {
        cancelAnimationFrame(raf);
        setShowConfetti(false);
      };
      window.addEventListener("resize", onResize);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
      };
    }, [showConfetti]);
    const handleCopyCode = async () => {
      if (effectiveDiscountCode) {
        try {
          await navigator.clipboard.writeText(effectiveDiscountCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2e3);
        } catch (err) {
          console.error("Failed to copy code:", err);
        }
      }
    };
    const getDiscountInfo = () => {
      const discount = config.discountConfig;
      if (discount == null ? void 0 : discount.enabled) {
        return {
          code: localDiscountCode || void 0,
          // Code will be generated/provided by backend
          valueType: discount.valueType,
          value: discount.value
        };
      }
      return {
        code: localDiscountCode || config.discountCode,
        percentage: config.discountPercentage,
        fixedValue: config.discountValue,
        type: config.discountType
      };
    };
    const renderDiscountValue = () => {
      const discountInfo = getDiscountInfo();
      if (discountInfo.valueType) {
        if (discountInfo.valueType === "PERCENTAGE") {
          return `${discountInfo.value}% OFF`;
        } else if (discountInfo.valueType === "FIXED_AMOUNT") {
          return `$${discountInfo.value} OFF`;
        } else if (discountInfo.valueType === "FREE_SHIPPING") {
          return "FREE SHIPPING";
        }
      }
      if (discountInfo.percentage) {
        return `${discountInfo.percentage}% OFF`;
      } else if (discountInfo.fixedValue) {
        return `$${discountInfo.fixedValue} OFF`;
      } else if (discountInfo.type === "free_shipping") {
        return "FREE SHIPPING";
      }
      return "SPECIAL PRIZE";
    };
    const effectiveDiscountCode = getDiscountInfo().code;
    const popupConfig = __spreadProps(__spreadValues({}, config), {
      // Prevent accidental dismiss only when a code is visible and we aren't auto-closing
      closeOnOverlayClick: !(isRevealed && !!effectiveDiscountCode),
      showCloseButton: config.showCloseButton !== false
    });
    return /* @__PURE__ */ u(
      BasePopup,
      {
        config: popupConfig,
        isVisible,
        onClose,
        onButtonClick: () => {
        },
        renderInline,
        children: /* @__PURE__ */ u("div", { style: { textAlign: "center", padding: "20px" }, children: [
          /* @__PURE__ */ u("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ u("div", { style: { fontSize: "36px", marginBottom: "8px" }, children: "\u{1F3AB}" }),
            /* @__PURE__ */ u(
              "h2",
              {
                style: {
                  fontSize: "28px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                  color: config.textColor || "#1A1A1A"
                },
                children: config.headline || "Scratch & Win!"
              }
            ),
            config.subheadline && /* @__PURE__ */ u(
              "p",
              {
                style: {
                  fontSize: "16px",
                  margin: 0,
                  color: config.textColor || "#666"
                },
                children: config.subheadline
              }
            )
          ] }),
          emailRequired && emailBeforeScratching && emailSubmitted && isSubmitting && /* @__PURE__ */ u(
            "div",
            {
              style: {
                marginBottom: "24px",
                padding: "40px",
                textAlign: "center"
              },
              children: [
                /* @__PURE__ */ u(
                  "div",
                  {
                    style: {
                      display: "inline-block",
                      width: "40px",
                      height: "40px",
                      border: "4px solid #E5E7EB",
                      borderTopColor: config.buttonColor || "#007BFF",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      marginBottom: "16px"
                    }
                  }
                ),
                /* @__PURE__ */ u("style", { children: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            ` }),
                /* @__PURE__ */ u(
                  "p",
                  {
                    style: {
                      fontSize: "16px",
                      color: config.textColor || "#666",
                      margin: 0
                    },
                    children: "Preparing your scratch card..."
                  }
                )
              ]
            }
          ),
          emailRequired && emailBeforeScratching && !emailSubmitted && /* @__PURE__ */ u("form", { onSubmit: handleEmailSubmit, style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ u("div", { style: { marginBottom: "12px" }, children: [
              /* @__PURE__ */ u(
                "label",
                {
                  style: {
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    textAlign: "left",
                    color: config.textColor || "#1A1A1A"
                  },
                  children: config.emailLabel || "Enter your email to play"
                }
              ),
              /* @__PURE__ */ u(
                "input",
                {
                  type: "email",
                  name: "email",
                  autoComplete: "email",
                  value: email,
                  onChange: (e) => {
                    var _a2;
                    return setEmail((_a2 = e.target) == null ? void 0 : _a2.value);
                  },
                  placeholder: config.emailPlaceholder || "your@email.com",
                  required: true,
                  style: {
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E5E7EB",
                    borderRadius: "6px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            error && /* @__PURE__ */ u(
              "p",
              {
                style: { color: "#EF4444", fontSize: "14px", margin: "8px 0" },
                children: error
              }
            ),
            /* @__PURE__ */ u(
              "button",
              {
                type: "submit",
                disabled: isSubmitting,
                style: {
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: isSubmitting ? "#9CA3AF" : config.buttonColor || "#007BFF",
                  color: config.buttonTextColor || "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                },
                children: isSubmitting ? /* @__PURE__ */ u(Fragment2, { children: [
                  /* @__PURE__ */ u(
                    "span",
                    {
                      style: {
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #FFFFFF",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite"
                      }
                    }
                  ),
                  /* @__PURE__ */ u("style", { children: `
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  ` }),
                  "Loading..."
                ] }) : config.submitButtonText || "Start Scratching!"
              }
            )
          ] }),
          shouldShowScratchCard() && !isRevealed && /* @__PURE__ */ u("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  position: "relative",
                  display: "inline-block",
                  cursor: canScratch() ? isScratching ? "grabbing" : "grab" : "not-allowed",
                  transform: isScratching ? "scale(0.99)" : "scale(1)",
                  transition: "transform 120ms ease",
                  touchAction: "none"
                },
                children: [
                  /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${scratchCardWidth}px`,
                        height: `${scratchCardHeight}px`,
                        backgroundColor: scratchCardBg,
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        boxSizing: "border-box"
                      },
                      children: [
                        /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              fontSize: "48px",
                              marginBottom: "8px",
                              color: scratchCardText
                            },
                            children: "\u{1F389}"
                          }
                        ),
                        /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              fontSize: "24px",
                              fontWeight: "bold",
                              color: scratchCardText,
                              marginBottom: "8px"
                            },
                            children: renderDiscountValue()
                          }
                        ),
                        effectiveDiscountCode && /* @__PURE__ */ u(
                          "div",
                          {
                            style: {
                              fontSize: "18px",
                              fontWeight: "600",
                              color: scratchCardText,
                              backgroundColor: "rgba(255,255,255,0.2)",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              marginTop: "8px"
                            },
                            children: effectiveDiscountCode
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ u(
                    "canvas",
                    {
                      ref: canvasRef,
                      onMouseDown: handleMouseDown,
                      onMouseMove: handleMouseMove,
                      onMouseUp: handleMouseUp,
                      onMouseLeave: handleMouseUp,
                      onTouchStart: handleTouchStart,
                      onTouchMove: handleTouchMove,
                      onTouchEnd: handleTouchEnd,
                      style: {
                        position: "relative",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        cursor: canScratch() ? "inherit" : "not-allowed"
                      }
                    }
                  )
                ]
              }
            ),
            scratchPercentage > 0 && scratchPercentage < scratchThreshold && /* @__PURE__ */ u(
              "div",
              {
                style: { marginTop: "12px", fontSize: "14px", color: "#666" },
                children: [
                  Math.round(scratchPercentage),
                  "% revealed - Keep scratching!"
                ]
              }
            )
          ] }),
          isRevealed && /* @__PURE__ */ u("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ u(
              "div",
              {
                ref: revealContainerRef,
                style: {
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: scratchCardBg,
                  borderRadius: "8px",
                  padding: "32px",
                  marginBottom: "16px"
                },
                children: [
                  showConfetti && /* @__PURE__ */ u(
                    "canvas",
                    {
                      ref: confettiCanvasRef,
                      style: {
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none"
                      }
                    }
                  ),
                  /* @__PURE__ */ u("div", { style: { fontSize: "48px", marginBottom: "12px" }, children: "\u{1F389}" }),
                  /* @__PURE__ */ u(
                    "h3",
                    {
                      style: {
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: scratchCardText,
                        margin: "0 0 12px 0"
                      },
                      children: config.prizeMessage || "Congratulations!"
                    }
                  ),
                  /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: scratchCardText,
                        marginBottom: "16px"
                      },
                      children: renderDiscountValue()
                    }
                  ),
                  effectiveDiscountCode && /* @__PURE__ */ u("div", { children: [
                    /* @__PURE__ */ u(
                      "div",
                      {
                        style: {
                          fontSize: "20px",
                          fontWeight: "600",
                          color: scratchCardText,
                          backgroundColor: "rgba(255,255,255,0.3)",
                          padding: "12px 20px",
                          borderRadius: "6px",
                          display: "inline-block",
                          marginBottom: "12px"
                        },
                        children: effectiveDiscountCode
                      }
                    ),
                    config.showCopyCodeButton !== false && /* @__PURE__ */ u("div", { children: /* @__PURE__ */ u(
                      "button",
                      {
                        onClick: handleCopyCode,
                        style: {
                          padding: "10px 20px",
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: scratchCardBg,
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginTop: "8px"
                        },
                        children: copied ? "\u2713 Copied!" : "Copy Code"
                      }
                    ) })
                  ] })
                ]
              }
            ),
            config.revealMessage && /* @__PURE__ */ u(
              "p",
              {
                style: {
                  fontSize: "14px",
                  color: config.textColor || "#666",
                  margin: 0
                },
                children: config.revealMessage
              }
            )
          ] }),
          emailRequired && !emailBeforeScratching && isRevealed && !emailSubmitted && /* @__PURE__ */ u("form", { onSubmit: handleEmailSubmit, style: { marginTop: "24px" }, children: [
            /* @__PURE__ */ u("div", { style: { marginBottom: "12px" }, children: [
              /* @__PURE__ */ u(
                "label",
                {
                  style: {
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    textAlign: "left",
                    color: config.textColor || "#1A1A1A"
                  },
                  children: config.emailLabel || "Enter your email to receive the code"
                }
              ),
              /* @__PURE__ */ u(
                "input",
                {
                  type: "email",
                  name: "email",
                  autoComplete: "email",
                  value: email,
                  onChange: (e) => {
                    var _a2;
                    return setEmail((_a2 = e.target) == null ? void 0 : _a2.value);
                  },
                  placeholder: config.emailPlaceholder || "your@email.com",
                  required: true,
                  style: {
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E5E7EB",
                    borderRadius: "6px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            error && /* @__PURE__ */ u(
              "p",
              {
                style: {
                  color: "#EF4444",
                  fontSize: "14px",
                  margin: "8px 0"
                },
                children: error
              }
            ),
            /* @__PURE__ */ u(
              "button",
              {
                type: "submit",
                style: {
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: config.buttonColor || "#007BFF",
                  color: config.buttonTextColor || "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer"
                },
                children: "Get My Code"
              }
            )
          ] })
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/scratch-card-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["scratch-card"] = ScratchCardPopup;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] ScratchCard popup registered for: scratch-card");
    }
  })();
})();
//# sourceMappingURL=scratch-card-popup.js.map
