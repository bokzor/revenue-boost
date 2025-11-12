"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo } = window.RevenueBoostPreact.hooks;

  // global-preact:global-preact:react-dom
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var render2 = window.RevenueBoostPreact.render;
  var createPortal2 = window.RevenueBoostPreact.createPortal;
  var global_preact_react_dom_default = { render: window.RevenueBoostPreact.render, createPortal: window.RevenueBoostPreact.createPortal };

  // global-preact:global-preact:preact/jsx-runtime
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var options = window.RevenueBoostPreact.options || {};
  var h2 = window.RevenueBoostPreact.h;
  var vnodeId = 0;
  function jsx(type, props, key, isStaticChildren, __source, __self) {
    if (!props) props = {};
    let normalizedProps = props;
    let ref;
    if ("ref" in props) {
      normalizedProps = {};
      for (let i in props) {
        if (i === "ref") ref = props[i];
        else normalizedProps[i] = props[i];
      }
    }
    const vnode = {
      type,
      props: normalizedProps,
      key: key !== void 0 ? key : null,
      ref: ref !== void 0 ? ref : null,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __c: null,
      constructor: void 0,
      __v: --vnodeId,
      __i: -1,
      __u: 0,
      __source,
      __self
    };
    if (typeof type === "function" && (ref = type.defaultProps)) {
      for (let i in ref) {
        if (normalizedProps[i] === void 0) {
          normalizedProps[i] = ref[i];
        }
      }
    }
    if (options.vnode) options.vnode(vnode);
    return vnode;
  }
  var jsxs = jsx;
  var Fragment2 = window.RevenueBoostPreact.Fragment;

  // app/domains/storefront/notifications/BannerPopup.tsx
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
    const content = /* @__PURE__ */ jsx("div", { style: bannerStyle, children: /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
      /* @__PURE__ */ jsxs("div", { style: contentStyle, children: [
        config.imageUrl && /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsxs("div", { style: textContentStyle, children: [
          /* @__PURE__ */ jsx("h4", { style: titleStyle, children: config.title }),
          /* @__PURE__ */ jsx("p", { style: descriptionStyle, children: config.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: actionsStyle, children: [
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
    return createPortal2(content, document.body);
  };

  // extensions/storefront-src/bundles/countdown-timer.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["COUNTDOWN_TIMER"] = BannerPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Countdown Timer popup registered");
    }
  })();
})();
//# sourceMappingURL=countdown-timer.bundle.js.map
