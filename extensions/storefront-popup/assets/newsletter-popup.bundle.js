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

  // extensions/storefront-src/auto-generated/components/popups/NewsletterPopup.tsx
  var NewsletterPopup = ({
    config,
    isVisible,
    onClose,
    campaignId,
    onSubscribe
  }) => {
    console.log("[NewsletterPopup] \u{1F3A8} Component rendering", {
      campaignId,
      isVisible,
      hasConfig: !!config,
      config
    });
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [consent, setConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [discountCode, setDiscountCode] = useState();
    const [copied, setCopied] = useState(false);
    useEffect(() => {
      if (!isVisible) {
        setEmail("");
        setFirstName("");
        setLastName("");
        setConsent(false);
        setIsSuccess(false);
        setError("");
      }
    }, [isVisible]);
    const validateEmail = (email2) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email2);
    };
    const handleSubmit = async (e) => {
      var _a;
      e.preventDefault();
      setError("");
      if (!email || !validateEmail(email)) {
        setError(
          config.emailErrorMessage || "Please enter a valid email address"
        );
        return;
      }
      if (config.consentFieldRequired && !consent) {
        setError("Please accept the terms to continue");
        return;
      }
      console.log("[NewsletterPopup] Submitting with campaignId:", campaignId);
      if (!campaignId || campaignId === "") {
        console.error("[NewsletterPopup] ERROR: campaignId is empty!");
        setError(
          "Configuration error: Campaign ID is missing. Please contact support."
        );
        return;
      }
      setIsSubmitting(true);
      try {
        const subscribeData = {
          email,
          consent
        };
        if (config.nameFieldEnabled) {
          subscribeData.firstName = firstName;
          subscribeData.lastName = lastName;
        }
        if (onSubscribe) {
          await onSubscribe(subscribeData);
        } else {
          const response = await fetch(
            "/apps/split-pop/commerce/leads/subscribe",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email,
                campaignId,
                consent,
                sessionId: typeof window !== "undefined" ? ((_a = window.sessionStorage) == null ? void 0 : _a.getItem("sessionId")) || `session-${Date.now()}` : `session-${Date.now()}`,
                firstName: firstName || void 0,
                lastName: lastName || void 0,
                pageUrl: typeof window !== "undefined" ? window.location.href : void 0,
                referrer: typeof window !== "undefined" ? document.referrer : void 0
              })
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Subscription failed");
          }
          const result = await response.json();
          console.log("[NewsletterPopup] Subscription result:", result);
          if (result.discountCode) {
            console.log(
              "[NewsletterPopup] Setting discount code:",
              result.discountCode
            );
            setDiscountCode(result.discountCode);
          } else {
            console.log("[NewsletterPopup] No discount code in response");
          }
        }
        setIsSuccess(true);
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error("Newsletter subscription error:", err);
      } finally {
        setIsSubmitting(false);
      }
    };
    const renderForm = () => /* @__PURE__ */ u("form", { onSubmit: handleSubmit, style: { width: "100%" }, children: [
      /* @__PURE__ */ u("div", { style: { marginBottom: "16px" }, children: [
        config.emailLabel && /* @__PURE__ */ u(
          "label",
          {
            htmlFor: "newsletter-email",
            style: {
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: config.textColor
            },
            children: [
              config.emailLabel,
              config.emailRequired && /* @__PURE__ */ u("span", { style: { color: "#DC2626" }, children: " *" })
            ]
          }
        ),
        /* @__PURE__ */ u(
          "input",
          {
            id: "newsletter-email",
            type: "email",
            name: "email",
            autoComplete: "email",
            value: email,
            onChange: (e) => {
              var _a;
              return setEmail((_a = e.target) == null ? void 0 : _a.value);
            },
            placeholder: config.emailPlaceholder || "Enter your email",
            required: config.emailRequired !== false,
            style: {
              width: "100%",
              padding: "12px 16px",
              fontSize: "16px",
              backgroundColor: config.inputBackgroundColor || "#FFFFFF",
              border: `1px solid ${error ? "#DC2626" : "#D1D5DB"}`,
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.2s, background-color 0.2s"
            },
            onFocus: (e) => {
              e.target.style.borderColor = config.buttonColor || "#007BFF";
            },
            onBlur: (e) => {
              e.target.style.borderColor = error ? "#DC2626" : "#D1D5DB";
            }
          }
        )
      ] }),
      config.nameFieldEnabled && /* @__PURE__ */ u("div", { style: { display: "flex", gap: "12px", marginBottom: "16px" }, children: [
        /* @__PURE__ */ u(
          "input",
          {
            type: "text",
            name: "given-name",
            autoComplete: "given-name",
            value: firstName,
            onChange: (e) => {
              var _a;
              return setFirstName((_a = e.target) == null ? void 0 : _a.value);
            },
            placeholder: "First name",
            required: config.nameFieldRequired,
            style: {
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none"
            }
          }
        ),
        /* @__PURE__ */ u(
          "input",
          {
            type: "text",
            name: "family-name",
            autoComplete: "family-name",
            value: lastName,
            onChange: (e) => {
              var _a;
              return setLastName((_a = e.target) == null ? void 0 : _a.value);
            },
            placeholder: "Last name",
            required: config.nameFieldRequired,
            style: {
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none"
            }
          }
        )
      ] }),
      config.consentFieldEnabled && /* @__PURE__ */ u("div", { style: { marginBottom: "16px" }, children: /* @__PURE__ */ u(
        "label",
        {
          style: {
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            fontSize: "14px",
            color: config.textColor,
            cursor: "pointer"
          },
          children: [
            /* @__PURE__ */ u(
              "input",
              {
                type: "checkbox",
                checked: consent,
                onChange: (e) => {
                  var _a;
                  return setConsent((_a = e.target) == null ? void 0 : _a.checked);
                },
                required: config.consentFieldRequired,
                style: {
                  marginTop: "2px",
                  cursor: "pointer"
                }
              }
            ),
            /* @__PURE__ */ u("span", { style: { opacity: 0.8 }, children: config.consentFieldText || "I agree to receive marketing emails" })
          ]
        }
      ) }),
      error && /* @__PURE__ */ u(
        "div",
        {
          style: {
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "8px",
            fontSize: "14px"
          },
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
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: "600",
            color: config.buttonTextColor || "#FFFFFF",
            backgroundColor: config.buttonColor || "#007BFF",
            border: "none",
            borderRadius: "8px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
            transition: "opacity 0.2s, transform 0.1s"
          },
          onMouseEnter: (e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
          },
          children: isSubmitting ? "Submitting..." : config.submitButtonText || config.buttonText || "Subscribe"
        }
      )
    ] });
    const interpolateSuccessMessage = (message) => {
      const actualDiscountCode = discountCode || config.discountCode || "WELCOME10";
      let displayValue = "";
      const isFreeShipping = config.valueType === "FREE_SHIPPING" || config.discountType === "FREE_SHIPPING" || config.discountType === "free_shipping";
      if (isFreeShipping) {
        displayValue = "Free Shipping";
      } else if (typeof config.discountPercentage === "number" && !Number.isNaN(config.discountPercentage)) {
        displayValue = `${config.discountPercentage}%`;
      } else if (typeof config.discountValue === "number" && !Number.isNaN(config.discountValue)) {
        displayValue = `$${config.discountValue}`;
      } else {
        displayValue = "10%";
      }
      return message.replace(/\{CODE\}/g, actualDiscountCode).replace(/\{code\}/g, actualDiscountCode).replace(/\{DISCOUNT_CODE\}/g, actualDiscountCode).replace(/\{DISCOUNT_VALUE\}/g, displayValue);
    };
    const handleCopy = async () => {
      const code = discountCode || config.discountCode;
      if (!code)
        return;
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2e3);
      } catch (_) {
      }
    };
    const renderSuccess = () => {
      console.log("[NewsletterPopup] Success Message Debug:", {
        "config.successMessage": config.successMessage,
        "discountCode state": discountCode,
        "config.discountCode": config.discountCode,
        "config.discountEnabled": config.discountEnabled,
        "config.discountValue": config.discountValue,
        "config.discountPercentage": config.discountPercentage
      });
      const defaultSuccessMessage = discountCode || config.discountCode ? config.valueType === "FREE_SHIPPING" || config.discountType === "FREE_SHIPPING" ? "Thanks for subscribing! Your free shipping code {CODE} is ready to use." : "Thanks for subscribing! Your discount code {CODE} is ready to use." : "Thank you for subscribing!";
      const messageToUse = config.successMessage || defaultSuccessMessage;
      const processedMessage = interpolateSuccessMessage(messageToUse);
      console.log("[NewsletterPopup] Message to use:", messageToUse);
      console.log(
        "[NewsletterPopup] Processed success message:",
        processedMessage
      );
      return /* @__PURE__ */ u("div", { style: { textAlign: "center", padding: "20px 0" }, children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              width: "64px",
              height: "64px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              backgroundColor: "#D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: /* @__PURE__ */ u(
              "svg",
              {
                width: "32",
                height: "32",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "#10B981",
                strokeWidth: "3",
                children: /* @__PURE__ */ u("polyline", { points: "20 6 9 17 4 12" })
              }
            )
          }
        ),
        /* @__PURE__ */ u(
          "h3",
          {
            style: {
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px",
              color: config.textColor
            },
            children: processedMessage
          }
        ),
        (() => {
          const shouldShowDiscount = (config.discountEnabled || discountCode || config.discountCode) && (discountCode || config.discountCode);
          const codeToShow = discountCode || config.discountCode;
          console.log("[NewsletterPopup] Discount display check:", {
            "config.discountEnabled": config.discountEnabled,
            "discountCode state": discountCode,
            "config.discountCode": config.discountCode,
            shouldShowDiscount,
            codeToShow,
            "config.discountType": config.discountType,
            "config.valueType": config.valueType
          });
          return shouldShowDiscount;
        })() && /* @__PURE__ */ u("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ u("p", { style: { fontSize: "14px", marginBottom: "8px", opacity: 0.8 }, children: config.valueType === "FREE_SHIPPING" || config.discountType === "FREE_SHIPPING" ? "Your free shipping code:" : "Your discount code:" }),
          /* @__PURE__ */ u(
            "div",
            {
              style: {
                padding: "12px 20px",
                backgroundColor: "#F3F4F6",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "700",
                letterSpacing: "1px",
                color: config.buttonColor || "#007BFF"
              },
              children: discountCode || config.discountCode
            }
          ),
          /* @__PURE__ */ u("div", { children: /* @__PURE__ */ u(
            "button",
            {
              onClick: handleCopy,
              style: {
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: config.buttonColor || "#007BFF",
                color: config.buttonTextColor || "#fff",
                cursor: "pointer"
              },
              children: copied ? "\u2713 Copied" : "Copy Code"
            }
          ) }),
          config.deliveryMode === "show_in_popup_authorized_only" ? /* @__PURE__ */ u("div", { style: { marginTop: "8px" }, children: [
            /* @__PURE__ */ u(
              "p",
              {
                style: {
                  fontSize: "12px",
                  color: "#E97317",
                  marginBottom: "4px"
                },
                children: "\u26A0\uFE0F This code is authorized for your email only"
              }
            ),
            /* @__PURE__ */ u("p", { style: { fontSize: "11px", opacity: 0.6 }, children: "You must use the same email address at checkout" })
          ] }) : /* @__PURE__ */ u("p", { style: { fontSize: "12px", marginTop: "8px", opacity: 0.6 }, children: config.valueType === "FREE_SHIPPING" || config.discountType === "FREE_SHIPPING" ? "Copy this code for free shipping at checkout" : "Copy this code to use at checkout" })
        ] })
      ] });
    };
    const popupConfig = __spreadProps(__spreadValues({}, config), {
      // Keep popup open (disable overlay close) after success when a discount code is present
      closeOnOverlayClick: !(isSuccess && (discountCode || config.discountCode))
    });
    return /* @__PURE__ */ u(
      BasePopup,
      {
        config: popupConfig,
        isVisible,
        onClose,
        onButtonClick: () => {
        },
        className: "newsletter-popup",
        children: /* @__PURE__ */ u("div", { style: { padding: "32px", textAlign: "center" }, children: [
          (config.headline || config.title) && /* @__PURE__ */ u(
            "h2",
            {
              style: {
                fontSize: "28px",
                fontWeight: "700",
                marginBottom: "12px",
                color: config.textColor,
                lineHeight: "1.2"
              },
              children: config.headline || config.title
            }
          ),
          (config.subheadline || config.description) && /* @__PURE__ */ u(
            "p",
            {
              style: {
                fontSize: "16px",
                marginBottom: "24px",
                color: config.textColor,
                opacity: 0.8,
                lineHeight: "1.5"
              },
              children: config.subheadline || config.description
            }
          ),
          isSuccess ? renderSuccess() : renderForm()
        ] })
      }
    );
  };

  // extensions/storefront-src/bundles/newsletter-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["newsletter"] = NewsletterPopup;
    g.SplitPopComponents["newsletter-elegant"] = NewsletterPopup;
    g.SplitPopComponents["newsletter-minimal"] = NewsletterPopup;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] Newsletter popup registered for: newsletter, newsletter-elegant, newsletter-minimal"
      );
    }
  })();
})();
//# sourceMappingURL=newsletter-popup.js.map
