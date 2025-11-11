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

  // extensions/storefront-src/auto-generated/components/social-proof/SocialProofNotification.tsx
  var SocialProofNotificationComponent = ({ notification, config, onDismiss, onClick }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const handleDismiss = useCallback(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 300);
    }, [onDismiss]);
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
      const timer = setTimeout(() => {
        handleDismiss();
      }, config.displayDuration * 1e3);
      return () => clearTimeout(timer);
    }, [config.displayDuration, handleDismiss]);
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };
    const getPositionStyles = () => {
      const base = {
        position: "fixed",
        zIndex: 999998
      };
      switch (config.position) {
        case "bottom-left":
          return __spreadProps(__spreadValues({}, base), { bottom: "20px", left: "20px" });
        case "bottom-right":
          return __spreadProps(__spreadValues({}, base), { bottom: "20px", right: "20px" });
        case "top-left":
          return __spreadProps(__spreadValues({}, base), { top: "20px", left: "20px" });
        case "top-right":
          return __spreadProps(__spreadValues({}, base), { top: "20px", right: "20px" });
        default:
          return __spreadProps(__spreadValues({}, base), { bottom: "20px", left: "20px" });
      }
    };
    const renderPurchaseNotification = (notif) => /* @__PURE__ */ u(Fragment, { children: [
      config.showIcons && /* @__PURE__ */ u("span", { style: { fontSize: "20px", marginRight: "8px" }, children: "\u{1F6CD}\uFE0F" }),
      /* @__PURE__ */ u("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "4px",
              color: config.customerNameColor || config.textColor
            },
            children: [
              notif.customerName,
              " from ",
              notif.location
            ]
          }
        ),
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "13px",
              opacity: 0.8,
              marginBottom: "2px",
              color: config.actionTextColor || config.textColor
            },
            children: "just purchased:"
          }
        ),
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "13px",
              fontWeight: "500",
              color: config.productNameColor || config.textColor
            },
            children: notif.productName
          }
        ),
        /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "12px",
              opacity: 0.6,
              marginTop: "4px",
              color: config.timestampColor || config.textColor
            },
            children: [
              notif.timeAgo,
              config.showVerifiedBadge && notif.verified && /* @__PURE__ */ u("span", { style: { marginLeft: "6px", color: config.accentColor }, children: "\u2713" })
            ]
          }
        )
      ] }),
      notif.productImage && /* @__PURE__ */ u(
        "img",
        {
          src: notif.productImage,
          alt: notif.productName,
          style: {
            width: "48px",
            height: "48px",
            borderRadius: "6px",
            objectFit: "cover",
            marginLeft: "12px"
          }
        }
      )
    ] });
    const renderVisitorNotification = (notif) => /* @__PURE__ */ u(Fragment, { children: [
      config.showIcons && /* @__PURE__ */ u("span", { style: { fontSize: "20px", marginRight: "8px" }, children: "\u{1F465}" }),
      /* @__PURE__ */ u("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: { fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
            children: [
              notif.count,
              " ",
              notif.count === 1 ? "person" : "people"
            ]
          }
        ),
        /* @__PURE__ */ u("div", { style: { fontSize: "13px", opacity: 0.8 }, children: notif.context }),
        notif.trending && /* @__PURE__ */ u(
          "div",
          {
            style: {
              fontSize: "12px",
              marginTop: "4px",
              color: config.accentColor,
              fontWeight: "500"
            },
            children: "\u{1F525} Trending"
          }
        )
      ] })
    ] });
    const renderReviewNotification = (notif) => /* @__PURE__ */ u(Fragment, { children: [
      config.showIcons && /* @__PURE__ */ u("span", { style: { fontSize: "20px", marginRight: "8px" }, children: "\u2B50" }),
      /* @__PURE__ */ u("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: { fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
            children: [
              notif.rating.toFixed(1),
              " from ",
              notif.reviewCount.toLocaleString(),
              " ",
              "reviews"
            ]
          }
        ),
        notif.recentReview && /* @__PURE__ */ u(Fragment, { children: [
          /* @__PURE__ */ u(
            "div",
            {
              style: {
                fontSize: "13px",
                opacity: 0.8,
                fontStyle: "italic",
                marginBottom: "2px"
              },
              children: [
                '"',
                notif.recentReview.text,
                '"'
              ]
            }
          ),
          /* @__PURE__ */ u("div", { style: { fontSize: "12px", opacity: 0.6 }, children: [
            "- ",
            notif.recentReview.author,
            config.showVerifiedBadge && notif.recentReview.verified && /* @__PURE__ */ u("span", { style: { marginLeft: "4px", color: config.accentColor }, children: "\u2713" })
          ] })
        ] })
      ] })
    ] });
    const renderNotificationContent = () => {
      switch (notification.type) {
        case "purchase":
          return renderPurchaseNotification(notification);
        case "visitor":
          return renderVisitorNotification(notification);
        case "review":
          return renderReviewNotification(notification);
        default:
          return null;
      }
    };
    const getAnimationClass = () => {
      if (isExiting)
        return "social-proof-exit";
      if (isVisible)
        return "social-proof-enter";
      return "";
    };
    return /* @__PURE__ */ u(Fragment, { children: [
      /* @__PURE__ */ u(
        "div",
        {
          className: `social-proof-notification ${getAnimationClass()}`,
          style: __spreadProps(__spreadValues({}, getPositionStyles()), {
            width: "320px",
            maxWidth: "calc(100vw - 40px)",
            backgroundColor: config.notificationBackgroundColor || config.backgroundColor,
            color: config.textColor,
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s ease"
          }),
          onClick: handleClick,
          onMouseEnter: (e) => {
            if (onClick) {
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
          },
          children: [
            renderNotificationContent(),
            /* @__PURE__ */ u(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  handleDismiss();
                },
                style: {
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  opacity: 0.5,
                  fontSize: "16px",
                  lineHeight: "1",
                  color: config.textColor
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.opacity = "1";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.opacity = "0.5";
                },
                "aria-label": "Dismiss notification",
                children: "\xD7"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u("style", { children: `
        .social-proof-notification {
          /* Start invisible and off-screen, will be animated in */
          opacity: 0;
          transform: translateX(-100%);
          /* Ensure it's not hidden by default */
          visibility: visible;
        }

        .social-proof-notification.social-proof-enter {
          animation: slideInLeft 0.3s ease-out forwards;
        }

        .social-proof-notification.social-proof-exit {
          animation: fadeOut 0.3s ease-out forwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
            visibility: visible;
          }
          to {
            opacity: 1;
            transform: translateX(0);
            visibility: visible;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            visibility: visible;
          }
          to {
            opacity: 0;
            visibility: visible;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .social-proof-notification {
            width: calc(100vw - 40px) !important;
            font-size: 13px;
          }
        }
      ` })
    ] });
  };

  // extensions/storefront-src/auto-generated/components/social-proof/types.ts
  var DEFAULT_SOCIAL_PROOF_CONFIG = {
    // Notification Types
    enablePurchaseNotifications: true,
    enableVisitorNotifications: true,
    enableReviewNotifications: true,
    // Display Settings
    position: "bottom-left",
    displayDuration: 5,
    rotationInterval: 8,
    maxNotificationsPerSession: 5,
    // Data Settings
    purchaseLookbackHours: 48,
    minVisitorCount: 5,
    minReviewRating: 4,
    // Privacy Settings
    anonymizeCustomerNames: true,
    showCustomerLocation: true,
    // Design Settings
    backgroundColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#10B981",
    showIcons: true,
    showVerifiedBadge: true,
    // Enhanced color properties
    notificationBackgroundColor: "#F9FAFB",
    timestampColor: "#6B7280",
    actionTextColor: "#059669",
    customerNameColor: "#1F2937",
    productNameColor: "#3B82F6"
  };

  // extensions/storefront-src/auto-generated/components/social-proof/SocialProofPopup.tsx
  var SocialProofPopup = ({
    campaignId,
    config: customConfig,
    notifications: providedNotifications,
    onNotificationShow,
    onNotificationClick,
    onNotificationDismiss
  }) => {
    const config = useMemo(
      () => __spreadValues(__spreadValues({}, DEFAULT_SOCIAL_PROOF_CONFIG), customConfig),
      [customConfig]
    );
    const [notifications, setNotifications] = useState(
      []
    );
    const [currentNotification, setCurrentNotification] = useState(null);
    const [notificationQueue, setNotificationQueue] = useState([]);
    const [displayCount, setDisplayCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const fetchNotifications = useCallback(async () => {
      try {
        setIsLoading(true);
        const proxyBase = "/apps/split-pop";
        const tryUrls = [
          `${proxyBase}/api/social-proof/${campaignId}`,
          `/api/social-proof/${campaignId}`
        ];
        let data = null;
        let lastError = null;
        for (const url of tryUrls) {
          try {
            console.log(`[SocialProofPopup] Attempting to fetch from ${url}`);
            const res = await fetch(url);
            if (!res.ok)
              throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            console.log(
              `[SocialProofPopup] Successfully fetched from ${url}`,
              data
            );
            break;
          } catch (e) {
            console.log(`[SocialProofPopup] Failed to fetch from ${url}:`, e);
            lastError = e;
            continue;
          }
        }
        if (!data)
          throw lastError || new Error("Failed to fetch notifications");
        if (data.success && data.notifications && data.notifications.length > 0) {
          console.log(
            `[SocialProofPopup] Using API notifications:`,
            data.notifications.length
          );
          setNotifications(data.notifications);
          setNotificationQueue(data.notifications);
        } else {
          console.log(`[SocialProofPopup] API returned empty, using mock data`);
          const mockNotifications = generateMockNotifications(config);
          setNotifications(mockNotifications);
          setNotificationQueue(mockNotifications);
        }
      } catch (error) {
        console.warn(
          "[SocialProofPopup] Failed to fetch notifications, using mock data:",
          error
        );
        const mockNotifications = generateMockNotifications(config);
        console.log(
          `[SocialProofPopup] Generated mock notifications:`,
          mockNotifications.length
        );
        setNotifications(mockNotifications);
        setNotificationQueue(mockNotifications);
      } finally {
        setIsLoading(false);
      }
    }, [campaignId, config]);
    useEffect(() => {
      if (providedNotifications) {
        setNotifications(providedNotifications);
        setNotificationQueue(providedNotifications);
        setIsLoading(false);
      } else {
        fetchNotifications();
      }
    }, [campaignId, providedNotifications, fetchNotifications]);
    const showNextNotification = useCallback(() => {
      if (displayCount >= config.maxNotificationsPerSession) {
        return;
      }
      if (notificationQueue.length > 0) {
        const [next, ...rest] = notificationQueue;
        setCurrentNotification(next);
        setNotificationQueue(rest);
        setDisplayCount((prev) => prev + 1);
        if (onNotificationShow) {
          onNotificationShow(next);
        }
        if (rest.length === 0 && notifications.length > 0) {
          setNotificationQueue(notifications);
        }
      }
    }, [
      notificationQueue,
      notifications,
      displayCount,
      config.maxNotificationsPerSession,
      onNotificationShow
    ]);
    useEffect(() => {
      console.log(
        `[SocialProofPopup] Rotation timer: isLoading=${isLoading}, notifications=${notifications.length}, currentNotification=${currentNotification == null ? void 0 : currentNotification.id}`
      );
      if (isLoading || notifications.length === 0) {
        console.log(
          `[SocialProofPopup] Skipping rotation: isLoading=${isLoading}, no notifications`
        );
        return;
      }
      if (!currentNotification && displayCount === 0) {
        console.log(`[SocialProofPopup] Showing first notification`);
        showNextNotification();
      }
      const interval = setInterval(() => {
        showNextNotification();
      }, config.rotationInterval * 1e3);
      return () => clearInterval(interval);
    }, [
      isLoading,
      notifications,
      currentNotification,
      displayCount,
      config.rotationInterval,
      showNextNotification
    ]);
    const handleDismiss = () => {
      if (currentNotification && onNotificationDismiss) {
        onNotificationDismiss(currentNotification);
      }
      setCurrentNotification(null);
    };
    const handleClick = () => {
      if (currentNotification && onNotificationClick) {
        onNotificationClick(currentNotification);
      }
    };
    if (isLoading || !currentNotification) {
      console.log(
        `[SocialProofPopup] Returning null: isLoading=${isLoading}, currentNotification=${currentNotification == null ? void 0 : currentNotification.id}`
      );
      return null;
    }
    console.log(
      `[SocialProofPopup] Rendering notification:`,
      currentNotification.id
    );
    return /* @__PURE__ */ u(
      SocialProofNotificationComponent,
      {
        notification: currentNotification,
        config,
        onDismiss: handleDismiss,
        onClick: handleClick
      }
    );
  };
  function generateMockNotifications(config) {
    const notifications = [];
    if (config.enablePurchaseNotifications) {
      const purchases = [
        {
          id: "purchase-1",
          type: "purchase",
          customerName: "John D.",
          location: "New York, NY",
          productName: "Classic T-Shirt",
          timeAgo: "2 minutes ago",
          verified: true,
          timestamp: Date.now() - 12e4
        },
        {
          id: "purchase-2",
          type: "purchase",
          customerName: "Sarah M.",
          location: "Los Angeles, CA",
          productName: "Denim Jeans",
          timeAgo: "5 minutes ago",
          verified: true,
          timestamp: Date.now() - 3e5
        },
        {
          id: "purchase-3",
          type: "purchase",
          customerName: "Mike R.",
          location: "Chicago, IL",
          productName: "Sneakers",
          timeAgo: "12 minutes ago",
          verified: true,
          timestamp: Date.now() - 72e4
        }
      ];
      notifications.push(...purchases);
    }
    if (config.enableVisitorNotifications) {
      const visitors = [
        {
          id: "visitor-1",
          type: "visitor",
          count: 23,
          context: "viewing this product",
          trending: true,
          timestamp: Date.now()
        },
        {
          id: "visitor-2",
          type: "visitor",
          count: 47,
          context: "shopping now",
          trending: false,
          timestamp: Date.now()
        }
      ];
      notifications.push(...visitors);
    }
    if (config.enableReviewNotifications) {
      const reviews = [
        {
          id: "review-1",
          type: "review",
          rating: 4.8,
          reviewCount: 1234,
          recentReview: {
            text: "Love this product! Great quality.",
            author: "Emily K.",
            verified: true
          },
          timestamp: Date.now()
        },
        {
          id: "review-2",
          type: "review",
          rating: 4.9,
          reviewCount: 856,
          recentReview: {
            text: "Exceeded my expectations!",
            author: "David L.",
            verified: true
          },
          timestamp: Date.now()
        }
      ];
      notifications.push(...reviews);
    }
    return shuffleArray(notifications);
  }
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i2 = shuffled.length - 1; i2 > 0; i2--) {
      const j = Math.floor(Math.random() * (i2 + 1));
      [shuffled[i2], shuffled[j]] = [shuffled[j], shuffled[i2]];
    }
    return shuffled;
  }

  // extensions/storefront-src/bundles/social-proof-popup.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["social-proof"] = SocialProofPopup;
    g.SplitPopComponents["social-proof-notification"] = SocialProofPopup;
    if (g.console && g.console.debug) {
      console.debug("[Split-Pop] SocialProof popup registered for: social-proof, social-proof-notification");
    }
  })();
})();
//# sourceMappingURL=social-proof-popup.js.map
