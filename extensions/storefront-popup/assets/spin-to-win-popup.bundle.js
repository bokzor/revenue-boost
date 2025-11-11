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

  // extensions/storefront-src/auto-generated/components/popups/SpinToWinPopup.tsx
  var SpinToWinPopup = ({
    config,
    isVisible,
    onClose,
    campaignId,
    renderInline = false,
    onSpinComplete
  }) => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [spinning, setSpinning] = useState(false);
    const [spun, setSpun] = useState(false);
    const [copied, setCopied] = useState(false);
    const [outcomeIndex, setOutcomeIndex] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copyError, setCopyError] = useState(null);
    const [localDiscountCode, setLocalDiscountCode] = useState(void 0);
    const wheelRef = useRef(null);
    const copyBtnRef = useRef(null);
    const celebrationRef = useRef(null);
    const prefersReducedMotion = useMemo(() => {
      if (typeof window === "undefined" || !window.matchMedia)
        return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);
    const isEmailValid = useMemo(() => {
      if (!config.emailRequired)
        return true;
      return validateEmail(email);
    }, [config.emailRequired, email]);
    const prizes = useMemo(() => {
      var _a;
      console.log("[SpinToWinPopup] Prizes config received:", {
        hasPrizes: !!config.prizes,
        isArray: Array.isArray(config.prizes),
        length: (_a = config.prizes) == null ? void 0 : _a.length,
        prizesJSON: JSON.stringify(config.prizes),
        configKeys: Object.keys(config)
      });
      if (!config.prizes || !Array.isArray(config.prizes) || config.prizes.length === 0) {
        console.warn(
          "[SpinToWinPopup] No prizes provided in config! Using minimal fallback for debugging."
        );
        console.warn("[SpinToWinPopup] Config keys:", Object.keys(config));
        console.warn("[SpinToWinPopup] Config.prizes:", config.prizes);
        const fallback = [
          {
            id: "fallback",
            label: "Debug Prize",
            probability: 1,
            discountCode: "DEBUG10",
            discountPercentage: 10
          }
        ];
        return fallback.map((p, idx) => ({
          id: p.id || String(idx),
          label: p.label || `Prize ${idx + 1}`,
          probability: 1,
          discountCode: p.discountCode,
          discountPercentage: p.discountPercentage
        }));
      }
      const rawArr = config.prizes;
      console.log("[SpinToWinPopup] Using prizes from config:", {
        prizesCount: rawArr.length,
        firstPrize: rawArr[0]
      });
      const list = rawArr.map((p, idx) => {
        if (typeof p === "string") {
          return { id: String(idx), label: p, probability: 1 };
        }
        return {
          id: p.id || String(idx),
          label: p.label || `Prize ${idx + 1}`,
          probability: typeof p.probability === "number" ? p.probability : 1,
          discountCode: p.discountCode,
          discountPercentage: p.discountPercentage
        };
      });
      const total = list.reduce((sum, p) => sum + (p.probability || 0), 0) || list.length || 1;
      return list.map((p) => __spreadProps(__spreadValues({}, p), {
        probability: (p.probability || 1) / total
      }));
    }, [config.prizes]);
    const currentPrize = outcomeIndex != null ? prizes[outcomeIndex] : null;
    const isWinningPrize = useMemo(() => {
      if (!currentPrize)
        return false;
      if (currentPrize.discountCode)
        return true;
      if (currentPrize.discountPercentage && currentPrize.discountPercentage > 0)
        return true;
      if (currentPrize.discountValue && currentPrize.discountValue > 0)
        return true;
      return false;
    }, [currentPrize]);
    const effectiveDiscountCode = (currentPrize == null ? void 0 : currentPrize.discountCode) || localDiscountCode || config.discountCode;
    const sliceCount = Math.max(prizes.length, 1);
    const sliceAngle = 360 / sliceCount;
    const wheelColors = useMemo(() => {
      const defaults = [
        "#FF6B6B",
        "#FFD166",
        "#06D6A0",
        "#118AB2",
        "#8338EC",
        "#EF476F"
      ];
      let src = defaults;
      if (config.wheelColors) {
        if (Array.isArray(config.wheelColors) && config.wheelColors.length > 0) {
          src = config.wheelColors;
        } else if (typeof config.wheelColors === "string" && config.wheelColors.trim()) {
          src = config.wheelColors.split(",").map((c) => c.trim()).filter(Boolean);
        }
      }
      const arr = [];
      for (let i2 = 0; i2 < sliceCount; i2++)
        arr.push(src[i2 % src.length]);
      return arr;
    }, [config.wheelColors, sliceCount]);
    const [rotation, setRotation] = useState(0);
    useEffect(() => {
      if (!isVisible) {
        setSpinning(false);
        setRotation(0);
        setCopied(false);
        setError("");
        setIsSubmitting(false);
      } else {
        try {
          document.dispatchEvent(
            new CustomEvent("splitpop:spin2win:view", {
              detail: { campaignId }
            })
          );
        } catch (e) {
        }
      }
    }, [isVisible, campaignId]);
    const launchConfetti = () => {
      const container = celebrationRef.current;
      if (!container)
        return;
      const canvas = document.createElement("canvas");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;
      ctx.scale(dpr, dpr);
      container.appendChild(canvas);
      const colors = [
        "#FFD166",
        "#06D6A0",
        "#118AB2",
        "#EF476F",
        "#FFA500",
        "#9B5DE5"
      ];
      const count = 80;
      const particles = Array.from({ length: count }).map(() => ({
        x: rect.width / 2,
        y: 0,
        r: 4 + Math.random() * 4,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 3,
        gravity: 0.1 + Math.random() * 0.15,
        life: 60 + Math.random() * 30,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2
      }));
      let frame = 0;
      const anim = () => {
        frame++;
        ctx.clearRect(0, 0, rect.width, rect.height);
        particles.forEach((p) => {
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life -= 1;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
          ctx.restore();
        });
        if (frame < 90) {
          requestAnimationFrame(anim);
        } else {
          container.removeChild(canvas);
        }
      };
      requestAnimationFrame(anim);
    };
    useEffect(() => {
      if (spun && isWinningPrize) {
        if (!prefersReducedMotion) {
          try {
            launchConfetti();
          } catch (e) {
          }
        }
        const t = setTimeout(() => {
          var _a;
          (_a = copyBtnRef.current) == null ? void 0 : _a.focus();
        }, 50);
        return () => clearTimeout(t);
      }
    }, [spun, isWinningPrize, prefersReducedMotion]);
    function validateEmail(val) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    const pickWeightedIndex = () => {
      const r = Math.random();
      let acc = 0;
      for (let i2 = 0; i2 < prizes.length; i2++) {
        acc += prizes[i2].probability;
        if (r <= acc)
          return i2;
      }
      return prizes.length - 1;
    };
    const handleSpin = async () => {
      var _a;
      setError("");
      const index = pickWeightedIndex();
      const prize = prizes[index];
      if (config.emailRequired) {
        if (!email || !validateEmail(email)) {
          setError("Please enter a valid email");
          return;
        }
        if (!campaignId) {
          console.warn(
            "[SpinToWinPopup] Missing campaignId; proceeding without API call"
          );
        } else {
          try {
            setIsSubmitting(true);
            const sessionId = typeof window !== "undefined" ? ((_a = window.sessionStorage) == null ? void 0 : _a.getItem("split_pop_session_id")) || `session-${Date.now()}` : `session-${Date.now()}`;
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.setItem("split_pop_session_id", sessionId);
              } catch (e) {
              }
            }
            const resp = await fetch("/apps/split-pop/commerce/leads/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                campaignId,
                consent: true,
                sessionId,
                pageUrl: typeof window !== "undefined" ? window.location.href : void 0,
                referrer: typeof window !== "undefined" ? document.referrer : void 0,
                metadata: {
                  prize: {
                    id: prize.id,
                    label: prize.label,
                    // New discount type fields
                    discountType: prize.discountType,
                    discountValue: prize.discountValue,
                    // Legacy fields for backward compatibility
                    discountCode: prize.discountCode,
                    discountPercentage: prize.discountPercentage
                  }
                }
              })
            });
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              throw new Error((err == null ? void 0 : err.error) || "Subscription failed");
            }
            const result = await resp.json();
            if (result == null ? void 0 : result.discountCode) {
              setLocalDiscountCode(result.discountCode);
            }
          } catch (e) {
            console.error("[SpinToWinPopup] Lead subscribe failed", e);
            setError("Failed to subscribe. Please try again.");
            setIsSubmitting(false);
            return;
          } finally {
            setIsSubmitting(false);
          }
        }
      }
      if (spinning || spun)
        return;
      document.dispatchEvent(
        new CustomEvent("splitpop:spin2win:spin", {
          detail: { campaignId, emailProvided: !!email }
        })
      );
      const spinDurationMs = typeof config.spinDuration === "number" ? config.spinDuration : 4500;
      const baseRotations = 4;
      const sliceCenterAngle = -90 + (index + 0.5) * sliceAngle;
      const offsetWithinSlice = (Math.random() - 0.5) * sliceAngle * 0.5;
      const targetAngle = -sliceCenterAngle - offsetWithinSlice;
      const normalizedTarget = (targetAngle % 360 + 360) % 360;
      const finalRotation = baseRotations * 360 + normalizedTarget;
      console.log("[SpinToWin] \u{1F3AF} Spin calculation:", {
        index,
        sliceAngle,
        sliceCenterAngle,
        offsetWithinSlice,
        targetAngle,
        normalizedTarget,
        finalRotation,
        prizeLabel: prize.label
      });
      setOutcomeIndex(index);
      if (prefersReducedMotion) {
        setRotation(finalRotation % 360);
        setSpun(true);
        if (onSpinComplete) {
          await onSpinComplete({
            email: config.emailRequired ? email : void 0,
            prizeLabel: prize.label,
            discountCode: localDiscountCode || prize.discountCode
          });
        }
        document.dispatchEvent(
          new CustomEvent("splitpop:spin2win:win", {
            detail: {
              campaignId,
              prize: { id: prize.id, label: prize.label },
              code: localDiscountCode || prize.discountCode
            }
          })
        );
        document.dispatchEvent(
          new CustomEvent("splitpop:spin2win:win", {
            detail: {
              campaignId,
              prize: { id: prize.id, label: prize.label },
              code: localDiscountCode || prize.discountCode
            }
          })
        );
        return;
      }
      setSpinning(true);
      requestAnimationFrame(() => {
        setRotation(finalRotation);
      });
      window.setTimeout(async () => {
        setSpinning(false);
        setSpun(true);
        if (onSpinComplete) {
          await onSpinComplete({
            email: config.emailRequired ? email : void 0,
            prizeLabel: prize.label,
            discountCode: localDiscountCode || prize.discountCode
          });
        }
      }, spinDurationMs + 50);
    };
    const handleCopy = async () => {
      if (!effectiveDiscountCode)
        return;
      try {
        await navigator.clipboard.writeText(effectiveDiscountCode);
        setCopied(true);
        setCopyError(null);
        document.dispatchEvent(
          new CustomEvent("splitpop:spin2win:copy", {
            detail: { campaignId, code: effectiveDiscountCode }
          })
        );
        setTimeout(() => setCopied(false), 2e3);
      } catch (e) {
        setCopyError("Unable to copy. Long-press to copy manually.");
      }
    };
    const handleApply = async () => {
      if (!effectiveDiscountCode)
        return;
      await handleCopy();
      try {
        const returnTo = config.applyReturnTo || "/";
        const href = `/discount/${encodeURIComponent(effectiveDiscountCode)}?return_to=${encodeURIComponent(returnTo)}`;
        document.dispatchEvent(
          new CustomEvent("splitpop:spin2win:apply", {
            detail: { campaignId, code: effectiveDiscountCode, returnTo }
          })
        );
        if (typeof window !== "undefined")
          window.location.href = href;
      } catch (e) {
      }
    };
    const renderWheelSVG = () => {
      const size = 320;
      const radius = size / 2 - 8;
      const cx = size / 2;
      const cy = size / 2;
      const paths = [];
      for (let i2 = 0; i2 < sliceCount; i2++) {
        const startAngle = (i2 * sliceAngle - 90) * (Math.PI / 180);
        const endAngle = ((i2 + 1) * sliceAngle - 90) * (Math.PI / 180);
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        const isWin = spun && outcomeIndex === i2;
        const transform = isWin ? `translate(${cx}, ${cy}) scale(1.03) translate(-${cx}, -${cy})` : void 0;
        paths.push(
          /* @__PURE__ */ u(
            "path",
            {
              d,
              fill: wheelColors[i2],
              stroke: isWin ? "#FFD700" : "#ffffff",
              strokeWidth: isWin ? 3 : 2,
              style: isWin ? { filter: "drop-shadow(0 0 6px rgba(255,215,0,0.9))" } : void 0,
              transform,
              className: isWin ? "spw-win-slice" : void 0,
              "aria-current": isWin ? "true" : void 0
            },
            i2
          )
        );
      }
      const labels = prizes.map((p, i2) => {
        const angle = (i2 + 0.5) * sliceAngle - 90;
        const rad = angle * (Math.PI / 180);
        const lx = cx + radius * 0.6 * Math.cos(rad);
        const ly = cy + radius * 0.6 * Math.sin(rad);
        return /* @__PURE__ */ u(
          "text",
          {
            x: lx,
            y: ly,
            fill: "#fff",
            fontSize: "12",
            textAnchor: "middle",
            dominantBaseline: "middle",
            style: { pointerEvents: "none" },
            children: p.label
          },
          `label-${i2}`
        );
      });
      return /* @__PURE__ */ u(
        "svg",
        {
          width: "100%",
          height: "100%",
          viewBox: `0 0 ${size} ${size}`,
          role: "img",
          "aria-label": "Spin wheel",
          children: [
            /* @__PURE__ */ u("g", { children: [
              paths,
              labels
            ] }),
            /* @__PURE__ */ u("title", { children: "Fortune wheel" })
          ]
        }
      );
    };
    const wheelStyle = {
      // In preview mode, use fixed size to avoid viewport-based sizing issues
      // In storefront, use responsive sizing with viewport units
      width: config.previewMode ? "280px" : "min(80vw, 320px)",
      height: config.previewMode ? "280px" : "min(80vw, 320px)",
      borderRadius: "50%",
      willChange: "transform",
      transition: spinning ? `transform ${(typeof config.spinDuration === "number" ? config.spinDuration : 4500) / 1e3}s cubic-bezier(0.15, 0.85, 0.3, 1)` : void 0,
      transform: `rotate(${rotation}deg)`
    };
    const popupConfig = __spreadProps(__spreadValues({}, config), {
      closeOnOverlayClick: !(spun && isWinningPrize && !!effectiveDiscountCode),
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
        children: [
          /* @__PURE__ */ u("style", { children: `
          /* Spin-to-win specific */
          .spw-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
          @keyframes spw-glow { 0%, 100% { filter: drop-shadow(0 0 2px rgba(255,215,0,0.5)); } 50% { filter: drop-shadow(0 0 10px rgba(255,215,0,0.95)); } }
          .spw-win-slice { animation: spw-glow 1.4s ease-in-out infinite; }
          @keyframes spw-pointer-pulse { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.1); } 100% { transform: translateX(-50%) scale(1); } }
        ` }),
          /* @__PURE__ */ u("div", { style: { textAlign: "center", padding: 20 }, children: [
            /* @__PURE__ */ u("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ u("div", { style: { fontSize: 36, marginBottom: 8 }, children: "\u{1F3B0}" }),
              /* @__PURE__ */ u(
                "h2",
                {
                  style: {
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 700,
                    color: config.textColor || "#1A1A1A"
                  },
                  children: config.headline || "Spin to Win!"
                }
              ),
              config.subheadline && /* @__PURE__ */ u(
                "p",
                {
                  style: { margin: "8px 0 0 0", color: config.textColor || "#666" },
                  children: config.subheadline
                }
              )
            ] }),
            spun && effectiveDiscountCode && /* @__PURE__ */ u(
              "div",
              {
                role: "group",
                "aria-label": "Your discount code",
                style: {
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 0 12px 0",
                  flexWrap: "wrap"
                },
                children: [
                  /* @__PURE__ */ u(
                    "div",
                    {
                      style: {
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "rgba(0,0,0,0.06)",
                        fontWeight: 800,
                        letterSpacing: 0.5
                      },
                      "aria-live": "polite",
                      children: effectiveDiscountCode
                    }
                  ),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      ref: copyBtnRef,
                      onClick: handleCopy,
                      style: {
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: config.buttonColor || "#007BFF",
                        color: config.buttonTextColor || "#fff",
                        cursor: "pointer",
                        fontWeight: 700
                      },
                      "aria-label": "Copy discount code to clipboard",
                      children: copied ? "\u2713 Copied" : "Copy"
                    }
                  )
                ]
              }
            ),
            config.emailRequired && !spun && /* @__PURE__ */ u("div", { style: { margin: "0 0 16px 0" }, children: [
              /* @__PURE__ */ u(
                "input",
                {
                  type: "email",
                  name: "email",
                  autoComplete: "email",
                  value: email,
                  onChange: (e) => {
                    var _a;
                    return setEmail((_a = e.target) == null ? void 0 : _a.value);
                  },
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !spinning && !isSubmitting && isEmailValid) {
                      handleSpin();
                    }
                  },
                  placeholder: config.emailPlaceholder || "your@email.com",
                  required: true,
                  "aria-label": "Email address",
                  "aria-describedby": error ? "spw-email-error" : void 0,
                  style: {
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E5E7EB",
                    borderRadius: 6,
                    fontSize: 16,
                    boxSizing: "border-box"
                  }
                }
              ),
              error && /* @__PURE__ */ u(
                "div",
                {
                  id: "spw-email-error",
                  role: "alert",
                  style: { color: "#EF4444", fontSize: 14, marginTop: 8 },
                  children: error
                }
              ),
              /* @__PURE__ */ u("div", { style: { color: "#6B7280", fontSize: 12, marginTop: 6 }, children: "By entering your email, you agree to receive occasional marketing emails." })
            ] }),
            /* @__PURE__ */ u(
              "div",
              {
                style: {
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 16
                },
                "aria-live": "polite",
                children: [
                  /* @__PURE__ */ u(
                    "div",
                    {
                      "aria-hidden": "true",
                      style: {
                        position: "absolute",
                        top: -10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 2,
                        animation: spun && !prefersReducedMotion ? "spw-pointer-pulse 1.2s ease-in-out infinite" : void 0,
                        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))"
                      },
                      children: /* @__PURE__ */ u(
                        "div",
                        {
                          style: {
                            width: 0,
                            height: 0,
                            borderLeft: "10px solid transparent",
                            borderRight: "10px solid transparent",
                            borderBottom: `20px solid ${config.buttonColor || "#007BFF"}`
                          }
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ u(
                    "div",
                    {
                      ref: celebrationRef,
                      "aria-hidden": "true",
                      style: {
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 3
                      }
                    }
                  ),
                  /* @__PURE__ */ u("div", { ref: wheelRef, style: wheelStyle, children: renderWheelSVG() })
                ]
              }
            ),
            !spun && /* @__PURE__ */ u(
              "button",
              {
                onClick: handleSpin,
                disabled: spinning || isSubmitting || !isEmailValid,
                style: {
                  padding: "12px 24px",
                  minHeight: 44,
                  backgroundColor: config.buttonColor || "#007BFF",
                  color: config.buttonTextColor || "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: spinning || isSubmitting || !isEmailValid ? "not-allowed" : "pointer",
                  width: "100%",
                  maxWidth: 320,
                  opacity: !isEmailValid ? 0.7 : 1
                },
                "aria-disabled": spinning || isSubmitting || !isEmailValid,
                "aria-label": spinning ? "Spinning" : isSubmitting ? "Submitting" : !isEmailValid ? "Enter a valid email to enable spin" : "Spin the wheel",
                children: isSubmitting ? "Submitting..." : spinning ? "Spinning..." : config.spinButtonText || "Spin Now"
              }
            ),
            spun && currentPrize && /* @__PURE__ */ u("div", { style: { marginTop: 12 }, children: [
              /* @__PURE__ */ u("div", { style: { fontSize: 22, fontWeight: 700, marginBottom: 4 }, children: isWinningPrize ? config.successMessage || "Congratulations! \u{1F389}" : config.failureMessage || "Better luck next time!" }),
              /* @__PURE__ */ u("div", { style: { fontSize: 18, marginBottom: 4 }, children: currentPrize.label }),
              isWinningPrize && (() => {
                const raw = (currentPrize == null ? void 0 : currentPrize.expiresAt) || (currentPrize == null ? void 0 : currentPrize.validUntil) || (currentPrize == null ? void 0 : currentPrize.expiry);
                if (!raw)
                  return null;
                const d = new Date(raw);
                if (isNaN(d.getTime()))
                  return null;
                return /* @__PURE__ */ u("div", { style: { fontSize: 12, color: "#6B7280" }, children: [
                  "Expires on ",
                  d.toLocaleDateString(),
                  " at",
                  " ",
                  d.toLocaleTimeString()
                ] });
              })(),
              isWinningPrize && effectiveDiscountCode && /* @__PURE__ */ u(
                "div",
                {
                  style: {
                    marginTop: 8,
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap"
                  },
                  children: [
                    /* @__PURE__ */ u(
                      "button",
                      {
                        onClick: handleCopy,
                        style: {
                          padding: "10px 14px",
                          minHeight: 44,
                          borderRadius: 8,
                          border: "none",
                          background: config.buttonColor || "#007BFF",
                          color: config.buttonTextColor || "#fff",
                          cursor: "pointer",
                          fontWeight: 700
                        },
                        "aria-label": "Copy discount code to clipboard",
                        children: copied ? "\u2713 Copied" : "Copy Code"
                      }
                    ),
                    /* @__PURE__ */ u(
                      "button",
                      {
                        onClick: handleApply,
                        style: {
                          padding: "10px 14px",
                          minHeight: 44,
                          borderRadius: 8,
                          border: "none",
                          background: "#10B981",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 700
                        },
                        "aria-label": "Apply discount and continue shopping",
                        children: "Apply & Shop"
                      }
                    )
                  ]
                }
              ),
              copyError && /* @__PURE__ */ u(
                "div",
                {
                  role: "alert",
                  style: { color: "#EF4444", fontSize: 12, marginTop: 6 },
                  children: copyError
                }
              )
            ] }),
            /* @__PURE__ */ u(
              "div",
              {
                className: "spw-visually-hidden",
                role: "status",
                "aria-live": "assertive",
                children: spun && currentPrize ? isWinningPrize ? `You won ${currentPrize.label}! ${effectiveDiscountCode ? `Your code is ${effectiveDiscountCode}.` : ""}` : `${currentPrize.label}. Try spinning again next time!` : "Spin the wheel for a chance to win."
              }
            )
          ] })
        ]
      }
    );
  };

  // extensions/storefront-src/bundles/spin-to-win-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["spin-to-win"] = SpinToWinPopup;
    g.SplitPopComponents["lottery"] = SpinToWinPopup;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] SpinToWin popup registered for: spin-to-win, lottery"
      );
    }
  })();
})();
//# sourceMappingURL=spin-to-win-popup.js.map
