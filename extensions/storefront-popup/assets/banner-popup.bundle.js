"use strict";
(() => {
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

  // extensions/storefront-src/auto-generated/components/popups/BannerPopup.tsx
  var BannerPopup = ({
    config,
    isVisible,
    onClose,
    onButtonClick
  }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    useEffect(() => {
      if (isVisible && config.sticky) {
        const position2 = config.position || "top";
        const height = config.height || "80px";
        if (position2 === "top") {
          document.body.style.paddingTop = height;
        } else {
          document.body.style.paddingBottom = height;
        }
        return () => {
          document.body.style.paddingTop = "";
          document.body.style.paddingBottom = "";
        };
      }
    }, [isVisible, config.sticky, config.position, config.height]);
    if (!mounted || !isVisible) {
      return null;
    }
    const position = config.position || "top";
    const bannerStyle = {
      position: config.sticky ? "fixed" : "relative",
      [position]: 0,
      left: 0,
      right: 0,
      backgroundColor: config.backgroundColor,
      color: config.textColor,
      zIndex: 999999,
      boxShadow: position === "top" ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "0 -2px 10px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease-out",
      minHeight: config.height || "auto"
    };
    const containerStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
      gap: "16px"
    };
    const contentStyle = {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flex: 1
    };
    const textContentStyle = {
      flex: 1
    };
    const titleStyle = {
      margin: "0 0 4px 0",
      fontSize: "16px",
      fontWeight: "bold",
      color: config.textColor
    };
    const descriptionStyle = {
      margin: 0,
      fontSize: "14px",
      color: config.textColor,
      opacity: 0.9
    };
    const actionsStyle = {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    };
    const buttonStyle = {
      backgroundColor: config.buttonColor || "#007cba",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
      textAlign: "center",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap"
    };
    const closeButtonStyle = {
      background: "none",
      border: "none",
      fontSize: "18px",
      cursor: "pointer",
      color: config.textColor,
      opacity: 0.7,
      transition: "opacity 0.2s ease",
      padding: "4px",
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    };
    const content = /* @__PURE__ */ u("div", { style: bannerStyle, children: /* @__PURE__ */ u("div", { style: containerStyle, children: [
      /* @__PURE__ */ u("div", { style: contentStyle, children: [
        config.imageUrl && /* @__PURE__ */ u(
          "img",
          {
            src: config.imageUrl,
            alt: config.title,
            style: {
              width: "40px",
              height: "40px",
              borderRadius: "4px",
              objectFit: "cover"
            }
          }
        ),
        /* @__PURE__ */ u("div", { style: textContentStyle, children: [
          /* @__PURE__ */ u("h4", { style: titleStyle, children: config.title }),
          /* @__PURE__ */ u("p", { style: descriptionStyle, children: config.description })
        ] })
      ] }),
      /* @__PURE__ */ u("div", { style: actionsStyle, children: [
        /* @__PURE__ */ u(
          "button",
          {
            style: buttonStyle,
            onClick: onButtonClick,
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            },
            children: config.buttonText
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            style: closeButtonStyle,
            onClick: onClose,
            "aria-label": "Close banner",
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.backgroundColor = "transparent";
            },
            children: "\xD7"
          }
        )
      ] })
    ] }) });
    return createPortal(content, document.body);
  };

  // extensions/storefront-src/bundles/banner-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["banner"] = BannerPopup;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] Banner popup registered for: banner");
    }
  })();
})();
//# sourceMappingURL=banner-popup.js.map
