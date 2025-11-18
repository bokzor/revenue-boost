"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal, createContext } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo, useContext, useDebugValue } = window.RevenueBoostPreact.hooks;

  // app/domains/storefront/popups-new/utils.ts
  function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

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

  // app/domains/storefront/popups-new/FreeShippingPopup.tsx
  var FreeShippingPopup = ({
    config,
    isVisible,
    onClose,
    cartTotal: propCartTotal,
    onSubmit,
    issueDiscount
  }) => {
    const [cartTotal, setCartTotal] = useState(propCartTotal ?? config.currentCartTotal ?? 0);
    const threshold = config.threshold;
    const barPosition = config.barPosition || "top";
    const nearMissThreshold = config.nearMissThreshold ?? 10;
    const currency = config.currency || "$";
    const dismissible = config.dismissible ?? true;
    const celebrateOnUnlock = config.celebrateOnUnlock ?? true;
    const showIcon = config.showIcon ?? true;
    const animationDuration = config.animationDuration ?? 500;
    const discount = config.discount;
    const requireEmailToClaim = config.requireEmailToClaim ?? false;
    const claimButtonLabel = config.claimButtonLabel || "Claim discount";
    const claimEmailPlaceholder = config.claimEmailPlaceholder || "Enter your email";
    const claimSuccessMessage = config.claimSuccessMessage;
    const claimErrorMessage = config.claimErrorMessage;
    const [internalDismissed, setInternalDismissed] = useState(false);
    const [celebrating, setCelebrating] = useState(false);
    const [isEntering, setIsEntering] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [claimEmail, setClaimEmail] = useState("");
    const [claimError, setClaimError] = useState(null);
    const [isClaiming, setIsClaiming] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);
    const [claimedDiscountCode, setClaimedDiscountCode] = useState(void 0);
    const prevUnlockedRef = useRef(false);
    const hasIssuedDiscountRef = useRef(false);
    const currencyCodeRef = useRef(void 0);
    const bannerRef = useRef(null);
    const remaining = Math.max(0, threshold - cartTotal);
    const progress = Math.min(1, Math.max(0, cartTotal / threshold));
    const state = cartTotal === 0 ? "empty" : remaining === 0 ? "unlocked" : remaining <= nearMissThreshold ? "near-miss" : "progress";
    const barSize = config.size || "medium";
    const barPadding = barSize === "small" ? "0.75rem 1.25rem" : barSize === "large" ? "1rem 2rem" : "0.875rem 1.5rem";
    const messageFontSize = barSize === "small" ? "0.875rem" : barSize === "large" ? "1rem" : "0.9375rem";
    const iconFontSize = barSize === "small" ? "1.125rem" : barSize === "large" ? "1.375rem" : "1.25rem";
    const handleClose = () => {
      if (!dismissible) return;
      setIsExiting(true);
      setTimeout(() => {
        setInternalDismissed(true);
        onClose();
        setIsExiting(false);
      }, 300);
    };
    const formatCurrency = (value) => {
      const code = currencyCodeRef.current;
      if (code && /^[A-Z]{3}$/.test(code)) {
        try {
          return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value);
        } catch {
        }
      }
      return `${currency}${value.toFixed(2)}`;
    };
    useEffect(() => {
      if (isVisible && !internalDismissed) {
        setIsEntering(true);
        const timer = setTimeout(() => setIsEntering(false), 300);
        return () => clearTimeout(timer);
      }
    }, [isVisible, internalDismissed]);
    useEffect(() => {
      if (!isVisible || internalDismissed || config.previewMode) return;
      const updateBodyPadding = () => {
        if (!bannerRef.current) return;
        const height = bannerRef.current.offsetHeight;
        if (barPosition === "top") {
          document.body.style.paddingTop = `${height}px`;
        } else {
          document.body.style.paddingBottom = `${height}px`;
        }
      };
      const timer = setTimeout(updateBodyPadding, 350);
      return () => {
        clearTimeout(timer);
        document.body.style.paddingTop = "";
        document.body.style.paddingBottom = "";
      };
    }, [isVisible, internalDismissed, barPosition, config.previewMode]);
    useEffect(() => {
      try {
        const w = window;
        const iso = w?.REVENUE_BOOST_CONFIG?.currency;
        if (typeof iso === "string") {
          currencyCodeRef.current = iso;
        }
      } catch {
      }
    }, []);
    useEffect(() => {
      if (!isVisible) return;
      const refresh = async () => {
        try {
          const res = await fetch("/cart.js", { credentials: "same-origin" });
          const cart = await res.json();
          const cents = typeof cart?.subtotal_price === "number" ? cart.subtotal_price : Number(cart?.items_subtotal_price || 0) - Number(cart?.total_discount || 0);
          const value = Number.isFinite(cents) ? Math.max(0, cents / 100) : 0;
          setCartTotal(value);
        } catch {
        }
      };
      const debouncedRefresh = debounce(refresh, 300);
      const eventNames = ["cart:update", "cart:change", "cart:updated", "theme:cart:update", "cart:item-added", "cart:add"];
      eventNames.forEach((name) => document.addEventListener(name, debouncedRefresh));
      if (!config?.previewMode) {
        void refresh();
      }
      const w = window;
      let originalFetch = null;
      if (!w.__RB_FETCH_INTERCEPTED) {
        try {
          originalFetch = window.fetch.bind(window);
          window.fetch = (async (...args) => {
            const [url, opts] = args;
            const urlStr = typeof url === "string" ? url : url?.toString?.();
            const method = opts?.method ? String(opts.method).toUpperCase() : "GET";
            const isCartMutation = !!urlStr && urlStr.includes("/cart") && method !== "GET";
            const response = await originalFetch(...args);
            if (isCartMutation) debouncedRefresh();
            return response;
          });
          w.__RB_FETCH_INTERCEPTED = true;
        } catch {
        }
      }
      return () => {
        eventNames.forEach((name) => document.removeEventListener(name, debouncedRefresh));
        try {
          if (originalFetch) {
            window.fetch = originalFetch;
            w.__RB_FETCH_INTERCEPTED = false;
          }
        } catch (error) {
          console.error("[FreeShippingPopup] Failed to restore fetch:", error);
        }
      };
    }, [isVisible]);
    useEffect(() => {
      if (config?.previewMode) {
        const next = typeof propCartTotal === "number" ? propCartTotal : typeof config.currentCartTotal === "number" ? config.currentCartTotal : void 0;
        if (typeof next === "number") setCartTotal(next);
      }
    }, [propCartTotal, config.currentCartTotal, config]);
    const getMessage = () => {
      const remainingFormatted = formatCurrency(remaining);
      switch (state) {
        case "empty":
          return config.emptyMessage || "Add items to unlock free shipping";
        case "unlocked":
          return config.unlockedMessage || "You've unlocked free shipping! \u{1F389}";
        case "near-miss":
          return (config.nearMissMessage || "Only {remaining} to go!").replace("{remaining}", remainingFormatted);
        case "progress":
        default:
          return (config.progressMessage || "You're {remaining} away from free shipping").replace("{remaining}", remainingFormatted);
      }
    };
    const handleClaimSubmit = async (e) => {
      e.preventDefault();
      const email = claimEmail.trim();
      if (!email) {
        setClaimError("Please enter your email");
        return;
      }
      setIsClaiming(true);
      setClaimError(null);
      try {
        if (onSubmit) {
          const code = await onSubmit({ email });
          if (code) setClaimedDiscountCode(code);
          setHasClaimed(true);
          console.log("[FreeShippingPopup] Discount claim successful", {
            email,
            hasCode: Boolean(code)
          });
        } else {
          setHasClaimed(true);
          console.log("[FreeShippingPopup] Claim completed without onSubmit handler");
        }
      } catch (error) {
        console.error("[FreeShippingPopup] Claim submission error:", error);
        setClaimError(claimErrorMessage || "Something went wrong. Please try again.");
      } finally {
        setIsClaiming(false);
      }
    };
    useEffect(() => {
      const isUnlocked = state === "unlocked";
      const wasLocked = prevUnlockedRef.current === false;
      if (isUnlocked && wasLocked) {
        console.log("[FreeShippingPopup] Free shipping unlocked", {
          threshold,
          cartTotal,
          deliveryMode: discount?.deliveryMode
        });
        if (discount?.deliveryMode === "auto_apply_only") {
          console.log("[FreeShippingPopup] Auto-apply mode active for free shipping", {
            threshold,
            cartTotal
          });
        }
        if (!requireEmailToClaim && discount && typeof issueDiscount === "function" && !hasIssuedDiscountRef.current) {
          hasIssuedDiscountRef.current = true;
          const cartSubtotalCents = Math.round(cartTotal * 100);
          (async () => {
            try {
              const result = await issueDiscount({ cartSubtotalCents });
              if (result?.code) {
                setClaimedDiscountCode(result.code);
                console.log("[FreeShippingPopup] Discount code issued for free shipping", {
                  code: result.code
                });
              } else if (result && !result.code) {
                console.log("[FreeShippingPopup] Discount issued without code (possible auto-apply only mode)");
              }
            } catch (err) {
              console.error("[FreeShippingPopup] Failed to issue discount code:", err);
            }
          })();
        }
      }
      if (isUnlocked && wasLocked && celebrateOnUnlock) {
        setCelebrating(true);
        const timer = setTimeout(() => setCelebrating(false), 1e3);
        return () => clearTimeout(timer);
      }
      prevUnlockedRef.current = isUnlocked;
    }, [state, celebrateOnUnlock, threshold, cartTotal, discount, issueDiscount, requireEmailToClaim]);
    if ((!isVisible || internalDismissed) && !isExiting) {
      return null;
    }
    const getProgressColor = () => {
      if (state === "unlocked") return config.accentColor || "#10B981";
      if (state === "near-miss") return "#F59E0B";
      return config.accentColor || "#3B82F6";
    };
    const getIcon = () => {
      if (!showIcon) return null;
      switch (state) {
        case "unlocked":
          return "\u2713";
        case "near-miss":
          return "\u26A1";
        default:
          return "\u{1F69A}";
      }
    };
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("style", { children: `
        .free-shipping-bar {
          position: fixed;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: ${config.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          container-type: inline-size;
          container-name: free-shipping;
        }

        /* Rotating celebratory border shown only while celebrating */
        @property --rb-border-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .free-shipping-bar::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          border: 2px solid transparent;
          background:
            linear-gradient(${config.backgroundColor || "#ffffff"}, ${config.backgroundColor || "#ffffff"}) padding-box,
            conic-gradient(
              from var(--rb-border-angle),
              ${config.accentColor || "#3B82F6"},
              #22c55e,
              #facc15,
              ${config.accentColor || "#3B82F6"}
            ) border-box;
          opacity: 0;
          pointer-events: none;
        }

        .free-shipping-bar.celebrating::before {
          opacity: 1;
          animation: rotating-border 0.7s linear forwards;
        }

        @keyframes rotating-border {
          to {
            --rb-border-angle: 360deg;
            opacity: 0;
          }
        }


        .free-shipping-bar[data-position="top"] {
          top: 0;
        }

        .free-shipping-bar[data-position="bottom"] {
          bottom: 0;
        }

        /* Only animate slide-in on initial mount */
        .free-shipping-bar.entering[data-position="top"] {
          animation: slideInFromTop 0.3s ease-out forwards;
        }

        .free-shipping-bar.entering[data-position="bottom"] {
          animation: slideInFromBottom 0.3s ease-out forwards;
        }

        .free-shipping-bar.exiting[data-position="top"] {
          animation: slideOutToTop 0.3s ease-in forwards;
        }

        .free-shipping-bar.exiting[data-position="bottom"] {
          animation: slideOutToBottom 0.3s ease-in forwards;
        }

        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideOutToTop {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-100%);
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideOutToBottom {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }

        .free-shipping-bar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: ${barPadding};
          position: relative;
          overflow: hidden;
        }

        .free-shipping-bar.celebrating {
          /* Start bounce shortly after the rotating border animation */
          animation: celebrate-bar 0.6s ease-in-out 0.35s;
        }

        @keyframes celebrate-bar {
          0% {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          40% {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
          }
          100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }

        .free-shipping-bar-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          z-index: 1;
        }

        .free-shipping-bar-icon {
          font-size: ${iconFontSize};
          line-height: 1;
          flex-shrink: 0;
        }

        .free-shipping-bar-text {
          font-size: ${messageFontSize};
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
        }

        .free-shipping-bar-discount-text {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0.25rem 0 0;
        }

        .free-shipping-bar-discount-code {
          font-weight: 600;
        }

        .free-shipping-bar-claim-container {
          margin-top: 0.25rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          justify-content: flex-end;
        }

        .free-shipping-bar-claim-input {
          min-width: 160px;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          font-size: 0.875rem;
        }

        .free-shipping-bar-claim-button {
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .free-shipping-bar-claim-error {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #b91c1c;
        }

        .free-shipping-bar-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
          z-index: 1;
          flex-shrink: 0;
        }

        .free-shipping-bar-close:hover {
          opacity: 1;
        }

        .free-shipping-bar-close:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          opacity: 1;
        }

        .free-shipping-bar-dismiss {
          margin-left: 0.75rem;
          padding: 0;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-decoration: underline;
          font-size: 0.8125rem;
          white-space: nowrap;
          opacity: 0.9;
          transition: opacity 0.15s ease-out;
        }

        .free-shipping-bar-dismiss:hover {
          opacity: 1;
        }

        .free-shipping-bar-dismiss:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        .free-shipping-bar-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--shipping-bar-progress-bg);
          transition: width ${animationDuration}ms ease-out;
          z-index: 0;
          transform-origin: left center;
        }

        /* When unlocked, play a subtle progress "finish" animation before the bar bounces */
        .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
          animation: ${celebrating ? "celebrate-progress 0.45s ease-out forwards" : "none"};
        }

        @keyframes celebrate-progress {
          0% {
            transform: scaleX(0.96);
            opacity: 0.18;
          }
          70% {
            transform: scaleX(1.03);
            opacity: 0.22;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .free-shipping-bar,
          .free-shipping-bar-progress {
            transition: none;
          }

          .free-shipping-bar.celebrating,
          .free-shipping-bar.celebrating::before {
            animation: none !important;
            opacity: 0;
          }

          .free-shipping-bar.entering[data-position="top"],
          .free-shipping-bar.entering[data-position="bottom"],
          .free-shipping-bar.celebrating {
            animation: none !important;
          }

          .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
            animation: none;
          }
        }

        /* Container query for preview/device-based responsiveness */
        @container free-shipping (max-width: 640px) {
          .free-shipping-bar-content {
            padding: 0.75rem 1rem;
            gap: 0.75rem;
          }

          .free-shipping-bar-text {
            font-size: 0.875rem;
          }

          .free-shipping-bar-icon {
            font-size: 1.125rem;
          }
        }

      ` }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: bannerRef,
          className: `free-shipping-bar ${isEntering ? "entering" : ""} ${isExiting ? "exiting" : ""} ${celebrating ? "celebrating" : ""}`,
          "data-position": barPosition,
          "data-state": state,
          role: "region",
          "aria-live": "polite",
          "aria-atomic": "true",
          style: {
            position: config?.previewMode ? "absolute" : void 0,
            background: config.backgroundColor || "#ffffff",
            color: config.textColor || "#111827",
            ["--shipping-bar-progress-bg"]: getProgressColor()
          },
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "free-shipping-bar-progress",
                style: {
                  width: `${progress * 100}%`,
                  opacity: state === "empty" ? 0 : state === "unlocked" ? 0.2 : 0.15
                }
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "free-shipping-bar-content", children: [
              /* @__PURE__ */ jsxs("div", { className: "free-shipping-bar-message", children: [
                showIcon && /* @__PURE__ */ jsx("span", { className: "free-shipping-bar-icon", "aria-hidden": "true", children: getIcon() }),
                /* @__PURE__ */ jsx("p", { className: "free-shipping-bar-text", children: getMessage() }),
                state === "unlocked" && requireEmailToClaim && !hasClaimed && /* @__PURE__ */ jsxs("div", { className: "free-shipping-bar-claim-container", children: [
                  !showClaimForm && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "free-shipping-bar-claim-button",
                      onClick: () => setShowClaimForm(true),
                      style: { background: config.buttonColor || "#111827", color: config.buttonTextColor || "#ffffff" },
                      children: claimButtonLabel
                    }
                  ),
                  showClaimForm && /* @__PURE__ */ jsxs("form", { className: "free-shipping-bar-claim-container", onSubmit: handleClaimSubmit, children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "email",
                        className: "free-shipping-bar-claim-input",
                        value: claimEmail,
                        onChange: (e) => setClaimEmail(e.target.value),
                        placeholder: claimEmailPlaceholder
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "submit",
                        className: "free-shipping-bar-claim-button",
                        disabled: isClaiming,
                        style: { background: config.buttonColor || "#111827", color: config.buttonTextColor || "#ffffff" },
                        children: isClaiming ? "Claiming..." : claimButtonLabel
                      }
                    )
                  ] }),
                  claimError && /* @__PURE__ */ jsx("p", { className: "free-shipping-bar-claim-error", children: claimError })
                ] }),
                state === "unlocked" && discount && (!requireEmailToClaim || hasClaimed) && (discount.deliveryMode === "auto_apply_only" ? /* @__PURE__ */ jsx("p", { className: "free-shipping-bar-discount-text", children: "Free shipping will be applied automatically at checkout." }) : claimedDiscountCode || discount.code ? /* @__PURE__ */ jsx("p", { className: "free-shipping-bar-discount-text", children: /* @__PURE__ */ jsxs(Fragment2, { children: [
                  "Use code ",
                  /* @__PURE__ */ jsx("span", { className: "free-shipping-bar-discount-code", children: claimedDiscountCode || discount.code }),
                  " at checkout."
                ] }) }) : null),
                state === "unlocked" && hasClaimed && claimSuccessMessage && /* @__PURE__ */ jsx("p", { className: "free-shipping-bar-discount-text", children: claimSuccessMessage }),
                dismissible && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "free-shipping-bar-dismiss",
                    onClick: handleClose,
                    children: config.dismissLabel || "No thanks"
                  }
                )
              ] }),
              dismissible && /* @__PURE__ */ jsx(
                "button",
                {
                  className: "free-shipping-bar-close",
                  onClick: handleClose,
                  "aria-label": "Dismiss shipping bar",
                  style: { color: config.textColor || "#111827" },
                  children: /* @__PURE__ */ jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M15 5L5 15M5 5L15 15",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      strokeLinecap: "round",
                      strokeLinejoin: "round"
                    }
                  ) })
                }
              )
            ] })
          ]
        }
      )
    ] });
  };

  // extensions/storefront-src/bundles/free-shipping.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["FREE_SHIPPING"] = FreeShippingPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Free Shipping popup registered");
    }
  })();
})();
//# sourceMappingURL=free-shipping.bundle.js.map
