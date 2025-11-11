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

  // global-preact:preact
  if (typeof window === "undefined" || !window.SplitPopPreact) {
    throw new Error("SplitPopPreact global runtime not found. Make sure main bundle is loaded first.");
  }
  var h = window.SplitPopPreact.h;
  var render = window.SplitPopPreact.render;
  var Fragment = window.SplitPopPreact.Fragment;
  var Component = window.SplitPopPreact.Component;
  var createContext = window.SplitPopPreact.createContext;
  var cloneElement = window.SplitPopPreact.cloneElement;
  var createRef = window.SplitPopPreact.createRef;
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

  // extensions/storefront-src/auto-generated/components/sales/CountdownTimer.tsx
  var CountdownTimer = ({
    endDate,
    endTime,
    timezone: _timezone,
    showDays: _showDays = true,
    onExpire,
    className = "",
    style
  }) => {
    const [timeRemaining, setTimeRemaining] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false
    });
    useEffect(() => {
      const endDateTime = parseEndDateTime(endDate, endTime, _timezone);
      const updateTimer = () => {
        const remaining = calculateTimeRemaining(endDateTime);
        setTimeRemaining(remaining);
        if (remaining.expired && onExpire) {
          onExpire();
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1e3);
      return () => clearInterval(interval);
    }, [endDate, endTime, _timezone, onExpire]);
    const format = getTimerFormat(timeRemaining, _showDays);
    const display = formatTimeDisplay(timeRemaining, format, _showDays);
    return /* @__PURE__ */ u(
      "div",
      {
        className: `countdown-timer ${className}`,
        style,
        "data-testid": "countdown-timer",
        children: display
      }
    );
  };
  function parseEndDateTime(endDate, endTime, _timezone) {
    const dateTimeString = `${endDate}T${endTime}:00`;
    const date = new Date(dateTimeString);
    return date;
  }
  function calculateTimeRemaining(endDate) {
    const now = /* @__PURE__ */ new Date();
    const diff = endDate.getTime() - now.getTime();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
    const hours = Math.floor(diff % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
    const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
    const seconds = Math.floor(diff % (1e3 * 60) / 1e3);
    return { days, hours, minutes, seconds, expired: false };
  }
  function getTimerFormat(time, showDays) {
    if (time.expired)
      return "minutes";
    if (time.days > 0 && showDays) {
      return "full";
    }
    if (time.days === 0 && time.hours > 0) {
      return "time";
    }
    return "minutes";
  }
  function formatTimeDisplay(time, format, _showDays) {
    if (time.expired)
      return "00:00";
    switch (format) {
      case "full":
        return `${time.days}d ${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`;
      case "time":
        return `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`;
      case "minutes":
        return `${pad(time.minutes)}:${pad(time.seconds)}`;
      default:
        return "00:00";
    }
  }
  function pad(num) {
    return num.toString().padStart(2, "0");
  }

  // extensions/storefront-src/auto-generated/components/sales/FlashSaleModal.tsx
  var FlashSaleModal = ({
    config,
    onClose,
    onCtaClick,
    previewMode = false
  }) => {
    var _a;
    const [isVisible, setIsVisible] = useState(true);
    const getCountdownEndTime = () => {
      const now = /* @__PURE__ */ new Date();
      const hours = config.countdownDuration || 24;
      const endTime2 = new Date(now.getTime() + hours * 60 * 60 * 1e3);
      return {
        endDate: endTime2.toISOString().split("T")[0],
        endTime: endTime2.toTimeString().split(" ")[0].substring(0, 5)
      };
    };
    const { endDate, endTime } = getCountdownEndTime();
    const handleClose = () => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    };
    const handleCtaClick = () => {
      if (onCtaClick) {
        onCtaClick();
      } else if (config.ctaUrl) {
        window.location.href = config.ctaUrl;
      }
    };
    if (!isVisible) {
      return null;
    }
    const sizeStyles = {
      small: { maxWidth: "400px", padding: "24px" },
      medium: { maxWidth: "500px", padding: "32px" },
      large: { maxWidth: "600px", padding: "40px" }
    };
    const modalSize = config.size || "medium";
    const backgroundColor = config.backgroundColor || "#FFFFFF";
    const textColor = config.textColor || "#000000";
    const buttonColor = config.buttonColor || "#FF4444";
    const buttonTextColor = config.buttonTextColor || "#FFFFFF";
    const overlayOpacity = (_a = config.overlayOpacity) != null ? _a : 0.8;
    return /* @__PURE__ */ u(Fragment, { children: [
      /* @__PURE__ */ u(
        "div",
        {
          "data-testid": "flash-sale-modal",
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: previewMode ? 1 : 999999,
            animation: "fadeIn 0.3s ease-out"
          },
          onClick: handleClose,
          children: /* @__PURE__ */ u(
            "div",
            {
              style: __spreadProps(__spreadValues({
                backgroundColor,
                color: textColor,
                borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                position: "relative",
                width: "90%"
              }, sizeStyles[modalSize]), {
                animation: "scaleIn 0.3s ease-out"
              }),
              onClick: (e) => e.stopPropagation(),
              children: [
                config.showCloseButton !== false && /* @__PURE__ */ u(
                  "button",
                  {
                    "data-testid": "close-button",
                    onClick: handleClose,
                    style: {
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      fontSize: "24px",
                      cursor: "pointer",
                      color: textColor,
                      opacity: 0.6,
                      transition: "opacity 0.2s",
                      padding: "4px 8px",
                      lineHeight: 1
                    },
                    onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                    onMouseLeave: (e) => e.currentTarget.style.opacity = "0.6",
                    "aria-label": "Close",
                    children: "\xD7"
                  }
                ),
                /* @__PURE__ */ u("div", { style: { textAlign: "center" }, children: [
                  config.discountPercentage && /* @__PURE__ */ u(
                    "div",
                    {
                      "data-testid": "discount-badge",
                      style: {
                        display: "inline-block",
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                        padding: "8px 20px",
                        borderRadius: "24px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        marginBottom: "16px",
                        animation: "pulse 2s infinite"
                      },
                      children: [
                        config.discountPercentage,
                        "% OFF"
                      ]
                    }
                  ),
                  /* @__PURE__ */ u(
                    "h2",
                    {
                      style: {
                        fontSize: "28px",
                        fontWeight: "bold",
                        margin: "0 0 12px 0",
                        lineHeight: 1.2
                      },
                      children: config.headline
                    }
                  ),
                  config.subheadline && /* @__PURE__ */ u(
                    "p",
                    {
                      style: {
                        fontSize: "16px",
                        margin: "0 0 24px 0",
                        opacity: 0.8,
                        lineHeight: 1.5
                      },
                      children: config.subheadline
                    }
                  ),
                  config.showCountdown && /* @__PURE__ */ u("div", { style: { marginBottom: "20px" }, children: [
                    config.urgencyMessage && /* @__PURE__ */ u(
                      "div",
                      {
                        style: {
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          opacity: 0.9
                        },
                        children: config.urgencyMessage
                      }
                    ),
                    /* @__PURE__ */ u(
                      CountdownTimer,
                      {
                        endDate,
                        endTime,
                        showDays: false,
                        style: {
                          fontSize: "32px",
                          fontWeight: "bold",
                          color: buttonColor,
                          fontFamily: "monospace"
                        }
                      }
                    )
                  ] }),
                  config.showStockCounter && config.stockCount !== void 0 && /* @__PURE__ */ u(
                    "div",
                    {
                      "data-testid": "stock-counter",
                      style: {
                        backgroundColor: `${buttonColor}15`,
                        color: buttonColor,
                        padding: "12px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "24px",
                        display: "inline-block"
                      },
                      children: [
                        "\u{1F525} Only ",
                        config.stockCount,
                        " left in stock!"
                      ]
                    }
                  ),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      "data-testid": "cta-button",
                      onClick: handleCtaClick,
                      style: {
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                        border: "none",
                        padding: "16px 48px",
                        borderRadius: "8px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        width: "100%",
                        maxWidth: "300px",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.25)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                      },
                      children: config.ctaText
                    }
                  )
                ] })
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ u("style", { children: `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      ` })
    ] });
  };

  // extensions/storefront-src/bundles/flash-sale-modal.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["flash-sale"] = FlashSaleModal;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] FlashSale modal registered for: flash-sale");
    }
  })();
})();
//# sourceMappingURL=flash-sale-modal.js.map
