/**
 * DeviceFrame Component (Shared)
 *
 * Renders a device frame (mobile, tablet, or desktop) around preview content.
 * Provides realistic context for how the popup will appear to users.
 *
 * This is a shared component that can be used by:
 * - Admin preview panels (Shopify admin)
 * - Marketing website (template showcases)
 * - Any other context that needs device-framed popups
 */

import React from "react";

export interface DeviceFrameProps {
  device: "mobile" | "tablet" | "desktop";
  children: React.ReactNode;
  /** Optional custom address bar URL */
  addressBarUrl?: string;
}

const StatusBar: React.FC<{ padding?: string }> = ({ padding = "0 20px" }) => (
  <div
    style={{
      height: "44px",
      backgroundColor: "#F6F6F7",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding,
      fontSize: "12px",
      fontWeight: 500,
      color: "#1A1A1A",
      borderBottom: "1px solid #E1E3E5",
    }}
  >
    <span>9:41</span>
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <span>📶</span>
      <span>📡</span>
      <span>🔋</span>
    </div>
  </div>
);

const ContentArea: React.FC<{ children: React.ReactNode; minHeight?: string }> = ({
  children,
  minHeight,
}) => (
  <div
    style={{
      height: minHeight ? undefined : "calc(100% - 44px)",
      flex: minHeight ? 1 : undefined,
      minHeight,
      overflow: "hidden",
      position: "relative",
      backgroundColor: "#FFFFFF",
    }}
  >
    <div
      style={{
        padding: "0",
        minHeight: "100%",
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  </div>
);

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  device,
  children,
  addressBarUrl = "example-store.myshopify.com",
}) => {
  if (device === "mobile") {
    return (
      <div
        style={{
          width: "390px",
          height: "844px",
          border: "12px solid #1A1A1A",
          borderRadius: "44px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <StatusBar />
        <ContentArea>{children}</ContentArea>
      </div>
    );
  }

  if (device === "tablet") {
    return (
      <div
        style={{
          width: "768px",
          height: "800px",
          border: "12px solid #1A1A1A",
          borderRadius: "24px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <StatusBar />
        <ContentArea>{children}</ContentArea>
      </div>
    );
  }

  // Desktop frame
  return (
    <div
      style={{
        width: "100%",
        minWidth: "600px",
        maxWidth: "100%",
        margin: "0 auto",
        border: "1px solid #E1E3E5",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: "500px",
      }}
    >
      {/* Browser Chrome */}
      <div
        style={{
          height: "40px",
          backgroundColor: "#F6F6F7",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "8px",
          borderBottom: "1px solid #E1E3E5",
        }}
      >
        {/* Traffic Lights */}
        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F57" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#28CA42" }} />
        </div>
        {/* Address Bar */}
        <div
          style={{
            flex: 1,
            height: "28px",
            backgroundColor: "#FFFFFF",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            fontSize: "13px",
            color: "#5C5F62",
            border: "1px solid #E1E3E5",
          }}
        >
          🔒 {addressBarUrl}
        </div>
        <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⋮</div>
      </div>
      <ContentArea minHeight="500px">{children}</ContentArea>
    </div>
  );
};

