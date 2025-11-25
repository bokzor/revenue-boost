/**
 * AnimationControlPanel Component (Stub)
 *
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should provide animation controls for popups.
 *
 * Expected features:
 * - Entrance animation controls
 * - Exit animation controls
 * - Hover effects
 * - Attention-grabbing animations
 * - Animation preview
 * - Duration and easing controls
 */

import React from "react";

export interface AnimationConfig {
  animation: string;
  duration: number;
  easing: string;
  delay?: number;
}

export interface AnimationSettings {
  entrance: AnimationConfig;
  exit: AnimationConfig;
  hover?: AnimationConfig & { enabled: boolean };
  attention?: AnimationConfig & { enabled: boolean; interval?: number };
}

export interface AnimationControlPanelProps {
  settings: AnimationSettings;
  onSettingsChange: (settings: AnimationSettings) => void;
  previewElement?: HTMLElement | null;
  onPreview?: (type: "entrance" | "exit" | "hover" | "attention") => void;
}

export const AnimationControlPanel: React.FC<AnimationControlPanelProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#F9FAFB",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>
        Animation Controls
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="entranceAnimation"
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Entrance Animation
        </label>
        <select
          id="entranceAnimation"
          value={settings.entrance.animation}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              entrance: { ...settings.entrance, animation: e.target.value },
            })
          }
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="fadeIn">Fade In</option>
          <option value="slideInUp">Slide In Up</option>
          <option value="slideInDown">Slide In Down</option>
          <option value="zoomIn">Zoom In</option>
          <option value="bounceIn">Bounce In</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="exitAnimation"
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Exit Animation
        </label>
        <select
          id="exitAnimation"
          value={settings.exit.animation}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              exit: { ...settings.exit, animation: e.target.value },
            })
          }
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="fadeOut">Fade Out</option>
          <option value="slideOutUp">Slide Out Up</option>
          <option value="slideOutDown">Slide Out Down</option>
          <option value="zoomOut">Zoom Out</option>
          <option value="bounceOut">Bounce Out</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="animationDuration"
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Duration (ms)
        </label>
        <input
          id="animationDuration"
          type="number"
          value={settings.entrance.duration}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              entrance: { ...settings.entrance, duration: parseInt(e.target.value) },
            })
          }
          min="100"
          max="2000"
          step="100"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </div>

      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "16px" }}>
        TODO: Implement full animation control functionality with live preview
      </p>
    </div>
  );
};

export default AnimationControlPanel;
