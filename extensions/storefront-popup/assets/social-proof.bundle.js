"use strict";
(() => {
  // global-preact:global-preact:react
  if (typeof window === "undefined" || !window.RevenueBoostPreact) {
    throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
  }
  var { h, Component, Fragment, render, createPortal, createContext } = window.RevenueBoostPreact;
  var { useState, useEffect, useCallback, useRef, useMemo, useContext, useDebugValue } = window.RevenueBoostPreact.hooks;

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

  // app/domains/storefront/notifications/social-proof/SocialProofNotification.tsx
  var SocialProofNotificationComponent = ({ notification, config, onDismiss, onClick }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const colors = {
      background: config.notificationBackgroundColor || config.backgroundColor || "#FFFFFF",
      text: config.textColor || "#1F2937",
      primary: config.customerNameColor || config.accentColor || config.textColor || "#111827",
      secondary: "#F3F4F6",
      success: config.accentColor || "#16A34A",
      warning: "#F59E0B",
      border: "#E5E7EB"
    };
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
          return { ...base, bottom: "20px", left: "20px" };
        case "bottom-right":
          return { ...base, bottom: "20px", right: "20px" };
        case "top-left":
          return { ...base, top: "20px", left: "20px" };
        case "top-right":
          return { ...base, top: "20px", right: "20px" };
        default:
          return { ...base, bottom: "20px", left: "20px" };
      }
    };
    const renderPurchaseNotification = (notif) => /* @__PURE__ */ jsxs("div", { className: "notification-content", children: [
      config.showIcons && /* @__PURE__ */ jsx("div", { className: "notification-icon", children: "\u{1F6CD}\uFE0F" }),
      /* @__PURE__ */ jsxs("div", { className: "notification-body", children: [
        /* @__PURE__ */ jsxs("p", { className: "notification-text", children: [
          /* @__PURE__ */ jsx("strong", { style: { color: colors.primary }, children: notif.customerName }),
          config.showCustomerLocation !== false && notif.location && /* @__PURE__ */ jsxs(Fragment2, { children: [
            " ",
            /* @__PURE__ */ jsxs("span", { style: { color: colors.text, opacity: 0.8 }, children: [
              "from ",
              notif.location
            ] })
          ] }),
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { style: { color: colors.text, opacity: 0.7 }, children: "just purchased:" }),
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("strong", { style: { color: colors.text }, children: notif.productName })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "notification-meta", style: { color: colors.text }, children: [
          /* @__PURE__ */ jsx("span", { children: notif.timeAgo }),
          config.showVerifiedBadge && notif.verified && /* @__PURE__ */ jsxs(
            "span",
            {
              className: "verified-badge",
              style: { background: colors.success, color: "#FFFFFF" },
              children: [
                /* @__PURE__ */ jsx("span", { children: "\u2713" }),
                " Verified"
              ]
            }
          )
        ] })
      ] }),
      notif.productImage && /* @__PURE__ */ jsx(
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
    const renderVisitorNotification = (notif) => {
      const contextText = notif.context;
      const isLowStock = /left in stock!$/i.test(contextText);
      if (isLowStock) {
        return /* @__PURE__ */ jsxs("div", { className: "notification-content", children: [
          config.showIcons && /* @__PURE__ */ jsx("div", { className: "notification-icon", children: "\u26A0\uFE0F" }),
          /* @__PURE__ */ jsx("div", { className: "notification-body", children: /* @__PURE__ */ jsx("p", { className: "notification-text", children: /* @__PURE__ */ jsx("strong", { style: { color: colors.warning }, children: notif.count === 1 ? "Only 1 left in stock!" : `Only ${notif.count} left in stock!` }) }) })
        ] });
      }
      return /* @__PURE__ */ jsxs("div", { className: "notification-content", children: [
        config.showIcons && /* @__PURE__ */ jsx("div", { className: "notification-icon", children: "\u{1F465}" }),
        /* @__PURE__ */ jsxs("div", { className: "notification-body", children: [
          /* @__PURE__ */ jsxs("p", { className: "notification-text", children: [
            /* @__PURE__ */ jsxs("strong", { style: { color: colors.primary }, children: [
              notif.count,
              " ",
              notif.count === 1 ? "person" : "people"
            ] }),
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { style: { color: colors.text, opacity: 0.8 }, children: contextText })
          ] }),
          notif.trending && /* @__PURE__ */ jsx("div", { className: "notification-meta", children: /* @__PURE__ */ jsxs(
            "span",
            {
              className: "trending-indicator",
              style: { color: colors.warning },
              children: [
                /* @__PURE__ */ jsx("span", { children: "\u{1F525}" }),
                " Trending"
              ]
            }
          ) })
        ] })
      ] });
    };
    const renderReviewNotification = (notif) => {
      const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          style: {
            color: i < rating ? "#FBBF24" : colors.border
          },
          children: "\u2605"
        },
        i
      ));
      return /* @__PURE__ */ jsxs("div", { className: "notification-content", children: [
        config.showIcons && /* @__PURE__ */ jsx("div", { className: "notification-icon", children: "\u2B50" }),
        /* @__PURE__ */ jsxs("div", { className: "notification-body", children: [
          /* @__PURE__ */ jsxs("p", { className: "notification-text", children: [
            /* @__PURE__ */ jsx("span", { className: "star-rating", children: renderStars(notif.rating) }),
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("strong", { style: { color: colors.primary }, children: notif.rating.toFixed(1) }),
            " ",
            /* @__PURE__ */ jsxs("span", { style: { color: colors.text, opacity: 0.8 }, children: [
              "from ",
              notif.reviewCount.toLocaleString(),
              " reviews"
            ] })
          ] }),
          notif.recentReview && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "review-quote",
              style: {
                background: colors.secondary,
                borderLeft: `3px solid ${colors.primary}`
              },
              children: [
                /* @__PURE__ */ jsxs("p", { className: "review-text", children: [
                  '"',
                  notif.recentReview.text,
                  '"'
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "review-author", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "\u2014 ",
                    notif.recentReview.author
                  ] }),
                  config.showVerifiedBadge && notif.recentReview.verified && /* @__PURE__ */ jsxs(
                    "span",
                    {
                      className: "verified-badge",
                      style: { background: colors.success, color: "#FFFFFF" },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "\u2713" }),
                        " Verified"
                      ]
                    }
                  )
                ] })
              ]
            }
          )
        ] })
      ] });
    };
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
      if (isExiting) return "social-proof-exit";
      if (isVisible) return "social-proof-enter";
      return "";
    };
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `social-proof-notification ${getAnimationClass()}`,
          style: {
            ...getPositionStyles(),
            width: "320px",
            minWidth: "280px",
            maxWidth: "calc(100vw - 40px)",
            background: colors.background,
            color: colors.text,
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)",
            padding: "16px",
            paddingRight: "40px",
            cursor: onClick ? "pointer" : "default",
            border: `1px solid ${colors.border}`,
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out"
          },
          onClick: handleClick,
          children: [
            renderNotificationContent(),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  handleDismiss();
                },
                style: {
                  position: "absolute",
                  top: "0px",
                  right: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  opacity: 0.5,
                  fontSize: "16px",
                  lineHeight: "1",
                  color: colors.text
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
      /* @__PURE__ */ jsx("style", { children: `
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

        .social-proof-notification:hover {
          transform: translateY(-2px);
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

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notification-icon {
          flex-shrink: 0;
          font-size: 24px;
          line-height: 1;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification-meta {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.7;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .trending-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .star-rating {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .review-quote {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .review-text {
          font-style: italic;
          font-size: 13px;
          line-height: 1.4;
          margin: 0 0 6px 0;
        }

        .review-author {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .social-proof-notification {
            width: calc(100vw - 40px) !important;
            font-size: 13px;
          }

          .notification-text {
            font-size: 13px;
          }

          .notification-meta {
            font-size: 11px;
          }

          .notification-icon {
            font-size: 20px;
          }
        }
      ` })
    ] });
  };

  // app/domains/storefront/notifications/social-proof/types.ts
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

  // app/domains/storefront/notifications/social-proof/SocialProofPopup.tsx
  var SocialProofPopup = ({
    campaignId,
    config: customConfig,
    notifications: providedNotifications,
    onNotificationShow,
    onNotificationClick,
    onNotificationDismiss
  }) => {
    const config = useMemo(
      () => ({
        ...DEFAULT_SOCIAL_PROOF_CONFIG,
        ...customConfig
      }),
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
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        if (!data) throw lastError || new Error("Failed to fetch notifications");
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
    useEffect(() => {
      if (providedNotifications) {
        return;
      }
      const pollingInterval = setInterval(() => {
        console.log("[SocialProofPopup] Polling for new notifications...");
        fetchNotifications();
      }, 6e4);
      return () => clearInterval(pollingInterval);
    }, [providedNotifications, fetchNotifications]);
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
        `[SocialProofPopup] Rotation timer: isLoading=${isLoading}, notifications=${notifications.length}, currentNotification=${currentNotification?.id}`
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
        `[SocialProofPopup] Returning null: isLoading=${isLoading}, currentNotification=${currentNotification?.id}`
      );
      return null;
    }
    console.log(
      `[SocialProofPopup] Rendering notification:`,
      currentNotification.id
    );
    return /* @__PURE__ */ jsx(
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
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // extensions/storefront-src/bundles/social-proof.ts
  (function register() {
    const g = window;
    g.RevenueBoostComponents = g.RevenueBoostComponents || {};
    g.RevenueBoostComponents["SOCIAL_PROOF"] = SocialProofPopup;
    if (typeof g.console?.debug === "function") {
      console.debug("[Revenue Boost] Social Proof popup registered");
    }
  })();
})();
//# sourceMappingURL=social-proof.bundle.js.map
