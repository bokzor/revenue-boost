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

  // extensions/storefront-src/auto-generated/components/sales/types.ts
  var DEFAULT_COUNTDOWN_TIMER_CONFIG = {
    position: "top",
    message: "Flash Sale Ends In:",
    showDays: true,
    showStockCounter: false,
    stockCount: 15,
    stockMessage: "Only {count} left in stock!",
    offerType: "discount",
    offerDetails: "20% OFF",
    showCodeInBanner: true,
    ctaText: "Shop Now",
    ctaUrl: "/collections/sale",
    dismissible: true,
    hideOnExpiry: true,
    expiryMessage: "Offer Ended",
    backgroundColor: "#FF6B6B",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#FF6B6B",
    colorScheme: "urgency"
  };
  var COLOR_SCHEMES = {
    urgency: {
      backgroundColor: "#FF6B6B",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#FF6B6B"
    },
    "limited-time": {
      backgroundColor: "#6C5CE7",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#6C5CE7"
    },
    "flash-sale": {
      backgroundColor: "#FFA500",
      textColor: "#1A1A1A",
      buttonColor: "#1A1A1A",
      buttonTextColor: "#FFA500"
    },
    custom: {
      backgroundColor: "#FF6B6B",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#FF6B6B"
    }
  };

  // extensions/storefront-src/auto-generated/components/sales/CountdownTimerBanner.tsx
  var CountdownTimerBanner = ({
    config,
    onClose,
    onCtaClick,
    onExpire,
    previewMode = false
  }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const finalConfig = __spreadValues(__spreadValues({}, DEFAULT_COUNTDOWN_TIMER_CONFIG), config);
    const colors = finalConfig.colorScheme === "custom" ? {
      backgroundColor: finalConfig.backgroundColor || "#FF6B6B",
      textColor: finalConfig.textColor || "#FFFFFF",
      buttonColor: finalConfig.buttonColor || "#FFFFFF",
      buttonTextColor: finalConfig.buttonTextColor || "#FF6B6B"
    } : COLOR_SCHEMES[finalConfig.colorScheme];
    const handleClose = () => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    };
    const handleExpire = () => {
      setIsExpired(true);
      if (finalConfig.hideOnExpiry) {
        setTimeout(() => {
          setIsVisible(false);
        }, 2e3);
      }
      if (onExpire) {
        onExpire();
      }
    };
    const handleCtaClick = () => {
      if (onCtaClick) {
        onCtaClick();
      }
      if (finalConfig.ctaUrl) {
        if (finalConfig.ctaUrl.startsWith("http")) {
          window.open(finalConfig.ctaUrl, "_blank");
        } else {
          window.location.href = finalConfig.ctaUrl;
        }
      }
    };
    if (!isVisible) {
      return null;
    }
    const bannerStyle = previewMode ? {
      // Preview mode: relative positioning for inline display
      position: "relative",
      width: "100%",
      minHeight: "60px",
      background: colors.backgroundColor,
      color: colors.textColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      padding: "12px 20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      flexWrap: "wrap"
    } : __spreadProps(__spreadValues({
      // Live mode: fixed positioning
      position: "fixed"
    }, finalConfig.position === "top" ? { top: 0 } : { bottom: 0 }), {
      left: 0,
      right: 0,
      minHeight: "60px",
      background: colors.backgroundColor,
      color: colors.textColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      padding: "12px 20px",
      zIndex: 999997,
      boxShadow: finalConfig.position === "top" ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "0 -2px 8px rgba(0, 0, 0, 0.15)",
      flexWrap: "wrap"
    });
    const timerStyle = {
      fontSize: "24px",
      fontWeight: "bold",
      fontFamily: "monospace",
      letterSpacing: "1px"
    };
    const buttonStyle = {
      padding: "10px 24px",
      fontSize: "14px",
      fontWeight: "bold",
      color: colors.buttonTextColor,
      backgroundColor: colors.buttonColor,
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      whiteSpace: "nowrap"
    };
    const closeButtonStyle = {
      position: "absolute",
      top: "8px",
      right: "8px",
      background: "transparent",
      border: "none",
      color: colors.textColor,
      fontSize: "24px",
      cursor: "pointer",
      padding: "4px 8px",
      opacity: 0.7,
      lineHeight: "1"
    };
    return /* @__PURE__ */ u(Fragment, { children: [
      /* @__PURE__ */ u("div", { className: "countdown-timer-banner", style: bannerStyle, children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap"
            },
            children: isExpired ? /* @__PURE__ */ u("span", { style: { fontSize: "16px", fontWeight: "600" }, children: finalConfig.expiryMessage || "Offer Ended" }) : /* @__PURE__ */ u(Fragment, { children: [
              /* @__PURE__ */ u(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    fontSize: "16px",
                    fontWeight: "600"
                  },
                  children: [
                    /* @__PURE__ */ u("span", { style: { marginRight: "8px" }, children: "\u26A1" }),
                    finalConfig.message
                  ]
                }
              ),
              finalConfig.offerDetails && /* @__PURE__ */ u(
                "div",
                {
                  style: {
                    background: colors.buttonColor,
                    color: colors.buttonTextColor,
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "bold"
                  },
                  children: finalConfig.offerDetails
                }
              ),
              finalConfig.offerType === "discount" && finalConfig.discountCode && finalConfig.showCodeInBanner && /* @__PURE__ */ u(
                "div",
                {
                  style: {
                    background: "rgba(255,255,255,0.2)",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "bold"
                  },
                  children: [
                    "Code: ",
                    finalConfig.discountCode
                  ]
                }
              )
            ] })
          }
        ),
        !isExpired && /* @__PURE__ */ u(
          CountdownTimer,
          {
            endDate: finalConfig.endDate,
            endTime: finalConfig.endTime,
            timezone: finalConfig.timezone,
            showDays: finalConfig.showDays,
            onExpire: handleExpire,
            style: timerStyle
          }
        ),
        !isExpired && finalConfig.showStockCounter && finalConfig.stockCount && finalConfig.stockCount > 0 && /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "14px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            },
            children: [
              /* @__PURE__ */ u("span", { style: { fontSize: "12px" }, children: "\u{1F525}" }),
              (finalConfig.stockMessage || "Only {count} left in stock!").replace("{count}", finalConfig.stockCount.toString())
            ]
          }
        ),
        !isExpired && /* @__PURE__ */ u(
          "button",
          {
            onClick: handleCtaClick,
            style: buttonStyle,
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            },
            children: finalConfig.ctaText
          }
        ),
        finalConfig.dismissible && /* @__PURE__ */ u(
          "button",
          {
            onClick: handleClose,
            style: closeButtonStyle,
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = "1";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.opacity = "0.7";
            },
            "aria-label": "Close banner",
            children: "\xD7"
          }
        )
      ] }),
      /* @__PURE__ */ u("style", { children: `
        .countdown-timer-banner {
          animation: ${finalConfig.position === "top" ? "slideDown" : "slideUp"} 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .countdown-timer {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .countdown-timer-banner {
            flex-direction: column;
            gap: 12px !important;
            padding: 16px 20px !important;
            min-height: 80px !important;
            text-align: center;
          }

          .countdown-timer-banner > div:first-child {
            justify-content: center;
            gap: 8px !important;
          }

          .countdown-timer-banner > div:first-child > div {
            font-size: 14px !important;
          }

          .countdown-timer {
            font-size: 20px !important;
          }

          .countdown-timer-banner button {
            width: 100%;
            max-width: 200px;
          }
        }
      ` })
    ] });
  };

  // extensions/storefront-src/bundles/countdown-timer-banner.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["countdown"] = CountdownTimerBanner;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] CountdownTimer registered for: countdown");
    }
  })();
})();
//# sourceMappingURL=countdown-timer-banner.js.map
