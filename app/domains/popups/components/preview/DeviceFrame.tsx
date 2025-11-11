/**
 * DeviceFrame Component
 *
 * Renders a device frame (mobile or desktop) around preview content.
 * Provides realistic context for how the popup will appear to users.
 */

import React from "react";

export interface DeviceFrameProps {
  device: "mobile" | "tablet" | "desktop";
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  device,
  children,
}) => {
  if (device === "mobile") {
    return (
      <div
        style={{
          width: "375px",
          height: "667px",
          border: "12px solid #1A1A1A",
          borderRadius: "36px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Status Bar */}
        <div
          style={{
            height: "44px",
            backgroundColor: "#F6F6F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
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

        {/* Content Area - Creates positioning context for popups */}
        <div
          style={{
            height: "calc(100% - 44px)",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Simulated page content */}
          <div
            style={{
              padding: "0", // Remove padding to let backdrop fill container
              minHeight: "100%",
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {children}
          </div>
        </div>
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
        {/* Status Bar */}
        <div
          style={{
            height: "44px",
            backgroundColor: "#F6F6F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
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

        {/* Content Area */}
        <div
          style={{
            height: "calc(100% - 44px)",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Simulated page content */}
          <div
            style={{
              padding: "0", // Remove padding to let backdrop fill container
              minHeight: "100%",
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop frame
  return (
    <div
      style={{
        width: "100%",
        minWidth: "600px", // Ensure minimum readable width
        maxWidth: "100%", // Take full available width
        margin: "0 auto",
        border: "1px solid #E1E3E5",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        display: "flex", // Use flexbox to ensure full width content
        flexDirection: "column",
        height: "100%", // Take full height when container allows
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
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#FF5F57",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#FFBD2E",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#28CA42",
            }}
          />
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
          🔒 example-store.myshopify.com
        </div>

        {/* Menu Icon */}
        <div
          style={{
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          ⋮
        </div>
      </div>

      {/* Content Area - Creates positioning context for popups */}
      <div
        style={{
          flex: 1, // Take remaining height after browser chrome
          minHeight: "500px",
          backgroundColor: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Simulated page content */}
        <div
          style={{
            padding: "0", // Remove padding to let backdrop fill container
            minHeight: "100%",
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
