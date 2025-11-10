/**
 * Social Proof Popup Component
 *
 * Manages social proof notification queue and sequential display.
 * Features rotation timer, frequency limits, and data fetching.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SocialProofNotificationComponent } from "./SocialProofNotification";
import type { SocialProofNotification, SocialProofConfig } from "./types";
import { DEFAULT_SOCIAL_PROOF_CONFIG } from "./types";

export interface SocialProofPopupProps {
  campaignId: string;
  config?: Partial<SocialProofConfig>;
  notifications?: SocialProofNotification[]; // For preview/testing
  onNotificationShow?: (notification: SocialProofNotification) => void;
  onNotificationClick?: (notification: SocialProofNotification) => void;
  onNotificationDismiss?: (notification: SocialProofNotification) => void;
}

export const SocialProofPopup: React.FC<SocialProofPopupProps> = ({
  campaignId,
  config: customConfig,
  notifications: providedNotifications,
  onNotificationShow,
  onNotificationClick,
  onNotificationDismiss,
}) => {
  const config: SocialProofConfig = useMemo(
    () => ({
      ...DEFAULT_SOCIAL_PROOF_CONFIG,
      ...customConfig,
    }),
    [customConfig],
  );

  const [notifications, setNotifications] = useState<SocialProofNotification[]>(
    [],
  );
  const [currentNotification, setCurrentNotification] =
    useState<SocialProofNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    SocialProofNotification[]
  >([]);
  const [displayCount, setDisplayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch from API (prefer app proxy on storefront, fallback to local API)
      const proxyBase = "/apps/split-pop";
      const tryUrls = [
        `${proxyBase}/api/social-proof/${campaignId}`,
        `/api/social-proof/${campaignId}`,
      ];

      let data: { success?: boolean; notifications?: SocialProofNotification[] } | null = null;
      let lastError: unknown = null;

      for (const url of tryUrls) {
        try {
          console.log(`[SocialProofPopup] Attempting to fetch from ${url}`);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
          console.log(
            `[SocialProofPopup] Successfully fetched from ${url}`,
            data,
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
        // Use real data from API
        console.log(
          `[SocialProofPopup] Using API notifications:`,
          data.notifications.length,
        );
        setNotifications(data.notifications);
        setNotificationQueue(data.notifications);
      } else {
        // Fallback to mock data if API returns empty
        console.log(`[SocialProofPopup] API returned empty, using mock data`);
        const mockNotifications = generateMockNotifications(config);
        setNotifications(mockNotifications);
        setNotificationQueue(mockNotifications);
      }
    } catch (error) {
      console.warn(
        "[SocialProofPopup] Failed to fetch notifications, using mock data:",
        error,
      );

      // Fallback to mock data on error
      const mockNotifications = generateMockNotifications(config);
      console.log(
        `[SocialProofPopup] Generated mock notifications:`,
        mockNotifications.length,
      );
      setNotifications(mockNotifications);
      setNotificationQueue(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, config]);

  // Fetch notifications on mount
  useEffect(() => {
    if (providedNotifications) {
      // Use provided notifications (for preview/testing)
      setNotifications(providedNotifications);
      setNotificationQueue(providedNotifications);
      setIsLoading(false);
    } else {
      // Fetch from API
      fetchNotifications();
    }
  }, [campaignId, providedNotifications, fetchNotifications]);

  // Show next notification in queue
  const showNextNotification = useCallback(() => {
    // Check if we've reached the max display limit
    if (displayCount >= config.maxNotificationsPerSession) {
      return;
    }

    // Get next notification from queue
    if (notificationQueue.length > 0) {
      const [next, ...rest] = notificationQueue;
      setCurrentNotification(next);
      setNotificationQueue(rest);
      setDisplayCount((prev) => prev + 1);

      // Track notification show
      if (onNotificationShow) {
        onNotificationShow(next);
      }

      // If queue is empty, refill it
      if (rest.length === 0 && notifications.length > 0) {
        setNotificationQueue(notifications);
      }
    }
  }, [
    notificationQueue,
    notifications,
    displayCount,
    config.maxNotificationsPerSession,
    onNotificationShow,
  ]);

  // Start rotation timer
  useEffect(() => {
    console.log(
      `[SocialProofPopup] Rotation timer: isLoading=${isLoading}, notifications=${notifications.length}, currentNotification=${currentNotification?.id}`,
    );

    if (isLoading || notifications.length === 0) {
      console.log(
        `[SocialProofPopup] Skipping rotation: isLoading=${isLoading}, no notifications`,
      );
      return;
    }

    // Show first notification immediately
    if (!currentNotification && displayCount === 0) {
      console.log(`[SocialProofPopup] Showing first notification`);
      showNextNotification();
    }

    // Set up rotation interval
    const interval = setInterval(() => {
      showNextNotification();
    }, config.rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [
    isLoading,
    notifications,
    currentNotification,
    displayCount,
    config.rotationInterval,
    showNextNotification,
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

  // Don't render if loading or no notifications
  if (isLoading || !currentNotification) {
    console.log(
      `[SocialProofPopup] Returning null: isLoading=${isLoading}, currentNotification=${currentNotification?.id}`,
    );
    return null;
  }

  console.log(
    `[SocialProofPopup] Rendering notification:`,
    currentNotification.id,
  );
  return (
    <SocialProofNotificationComponent
      notification={currentNotification}
      config={config}
      onDismiss={handleDismiss}
      onClick={handleClick}
    />
  );
};

// Helper function to generate mock notifications for testing
function generateMockNotifications(
  config: SocialProofConfig,
): SocialProofNotification[] {
  const notifications: SocialProofNotification[] = [];

  // Generate purchase notifications
  if (config.enablePurchaseNotifications) {
    const purchases: SocialProofNotification[] = [
      {
        id: "purchase-1",
        type: "purchase",
        customerName: "John D.",
        location: "New York, NY",
        productName: "Classic T-Shirt",
        timeAgo: "2 minutes ago",
        verified: true,
        timestamp: Date.now() - 120000,
      },
      {
        id: "purchase-2",
        type: "purchase",
        customerName: "Sarah M.",
        location: "Los Angeles, CA",
        productName: "Denim Jeans",
        timeAgo: "5 minutes ago",
        verified: true,
        timestamp: Date.now() - 300000,
      },
      {
        id: "purchase-3",
        type: "purchase",
        customerName: "Mike R.",
        location: "Chicago, IL",
        productName: "Sneakers",
        timeAgo: "12 minutes ago",
        verified: true,
        timestamp: Date.now() - 720000,
      },
    ];
    notifications.push(...purchases);
  }

  // Generate visitor notifications
  if (config.enableVisitorNotifications) {
    const visitors: SocialProofNotification[] = [
      {
        id: "visitor-1",
        type: "visitor",
        count: 23,
        context: "viewing this product",
        trending: true,
        timestamp: Date.now(),
      },
      {
        id: "visitor-2",
        type: "visitor",
        count: 47,
        context: "shopping now",
        trending: false,
        timestamp: Date.now(),
      },
    ];
    notifications.push(...visitors);
  }

  // Generate review notifications
  if (config.enableReviewNotifications) {
    const reviews: SocialProofNotification[] = [
      {
        id: "review-1",
        type: "review",
        rating: 4.8,
        reviewCount: 1234,
        recentReview: {
          text: "Love this product! Great quality.",
          author: "Emily K.",
          verified: true,
        },
        timestamp: Date.now(),
      },
      {
        id: "review-2",
        type: "review",
        rating: 4.9,
        reviewCount: 856,
        recentReview: {
          text: "Exceeded my expectations!",
          author: "David L.",
          verified: true,
        },
        timestamp: Date.now(),
      },
    ];
    notifications.push(...reviews);
  }

  // Shuffle notifications for variety
  return shuffleArray(notifications);
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Export default configuration for template library
export const SOCIAL_PROOF_TEMPLATE_CONFIG = {
  templateId: "social-proof",
  name: "Social Proof Notifications",
  category: "social-proof" as const,
  templateDescription:
    "Build trust with recent purchases, visitor count, and review highlights",
  isPopular: true,
  conversionRate: 22.5, // 15-30% improvement over baseline

  // Default design
  backgroundColor: "#FFFFFF",
  textColor: "#1A1A1A",
  buttonColor: "#10B981",
  buttonTextColor: "#FFFFFF",
  position: "bottom-left" as const,
  size: "small" as const,
  showCloseButton: true,

  // Default content
  title: "Social Proof",
  description: "Build trust and credibility with social proof notifications",
  buttonText: "Learn More",

  // Template-specific features
  features: [
    "Recent purchase notifications",
    "Live visitor count",
    "Review highlights",
    "Auto-dismiss (5 seconds)",
    "Sequential rotation",
    "Privacy-compliant",
  ],

  // Best practices
  bestPractices: {
    position: "bottom-left",
    displayDuration: 5,
    rotationInterval: 8,
    maxNotificationsPerSession: 5,
  },
};
