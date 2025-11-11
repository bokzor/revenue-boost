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

  // extensions/storefront-src/auto-generated/components/popups/SlideInPopup.tsx
  var SlideInPopup = ({
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
    if (!mounted || !isVisible) {
      return null;
    }
    const slideDirection = config.slideDirection || "right";
    const getPositionStyles = () => {
      const baseStyles = {
        position: "fixed",
        zIndex: 999999,
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        transition: "transform 0.3s ease-out"
      };
      switch (slideDirection) {
        case "left":
          return __spreadProps(__spreadValues({}, baseStyles), {
            top: "50%",
            left: "20px",
            transform: "translateY(-50%)",
            width: config.width || "320px",
            maxHeight: "80vh",
            borderRadius: "8px"
          });
        case "right":
          return __spreadProps(__spreadValues({}, baseStyles), {
            top: "50%",
            right: "20px",
            transform: "translateY(-50%)",
            width: config.width || "320px",
            maxHeight: "80vh",
            borderRadius: "8px"
          });
        case "bottom":
          return __spreadProps(__spreadValues({}, baseStyles), {
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: config.width || "400px",
            maxWidth: "90vw",
            borderRadius: "8px"
          });
        default:
          return baseStyles;
      }
    };
    const containerStyle = {
      padding: "24px",
      overflow: "auto"
    };
    const closeButtonStyle = {
      position: "absolute",
      top: "8px",
      right: "8px",
      background: "none",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      color: config.textColor,
      opacity: 0.7,
      transition: "opacity 0.2s ease",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    };
    const buttonStyle = {
      backgroundColor: config.buttonColor || "#007cba",
      color: config.buttonTextColor || "#ffffff",
      border: "none",
      borderRadius: "4px",
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
      textAlign: "center",
      transition: "all 0.2s ease",
      width: "100%"
    };
    const content = /* @__PURE__ */ u("div", { style: getPositionStyles(), children: /* @__PURE__ */ u("div", { style: containerStyle, children: [
      /* @__PURE__ */ u(
        "button",
        {
          style: closeButtonStyle,
          onClick: onClose,
          "aria-label": "Close popup",
          onMouseEnter: (e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.backgroundColor = "transparent";
          },
          children: "\xD7"
        }
      ),
      config.imageUrl && /* @__PURE__ */ u("div", { style: { marginBottom: "16px", textAlign: "center" }, children: /* @__PURE__ */ u(
        "img",
        {
          src: config.imageUrl,
          alt: config.title,
          style: {
            maxWidth: "100%",
            height: "auto",
            borderRadius: "4px",
            maxHeight: "120px",
            objectFit: "cover"
          }
        }
      ) }),
      /* @__PURE__ */ u(
        "h3",
        {
          style: {
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: "bold",
            color: config.textColor,
            paddingRight: "30px"
          },
          children: config.title
        }
      ),
      /* @__PURE__ */ u(
        "p",
        {
          style: {
            margin: "0 0 20px 0",
            fontSize: "14px",
            lineHeight: "1.4",
            color: config.textColor
          },
          children: config.description
        }
      ),
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
      )
    ] }) });
    return createPortal(content, document.body);
  };

  // extensions/storefront-src/bundles/slide-in-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["slide-in"] = SlideInPopup;
    g.SplitPopComponents["slide"] = SlideInPopup;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] SlideIn popup registered for: slide-in, slide");
    }
  })();
})();
//# sourceMappingURL=slide-in-popup.js.map
