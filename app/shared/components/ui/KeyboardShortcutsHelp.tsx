/**
 * KeyboardShortcutsHelp Component (Stub)
 * 
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should display keyboard shortcuts help modal.
 * 
 * Expected features:
 * - Modal display of keyboard shortcuts
 * - Categorized shortcuts
 * - Search functionality
 * - Platform-specific shortcuts (Mac/Windows)
 */

import React from "react";

export interface KeyboardShortcut {
  key: string;
  description: string;
  category?: string;
}

export interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: "Cmd/Ctrl + S", description: "Save changes", category: "General" },
  { key: "Cmd/Ctrl + Z", description: "Undo", category: "General" },
  { key: "Cmd/Ctrl + Shift + Z", description: "Redo", category: "General" },
  { key: "Esc", description: "Close modal/dialog", category: "Navigation" },
  { key: "Cmd/Ctrl + K", description: "Open command palette", category: "Navigation" },
  { key: "?", description: "Show keyboard shortcuts", category: "Help" },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}) => {
  if (!open) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category || "Other")));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>

        <h2 style={{ margin: "0 0 24px 0", fontSize: "24px", fontWeight: "600" }}>
          Keyboard Shortcuts
        </h2>

        {categories.map((category) => (
          <div key={category} style={{ marginBottom: "24px" }}>
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              {category}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {shortcuts
                .filter((s) => (s.category || "Other") === category)
                .map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "4px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#374151" }}>
                      {shortcut.description}
                    </span>
                    <kbd
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        color: "#1F2937",
                      }}
                    >
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>
          </div>
        ))}

        <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "16px", textAlign: "center" }}>
          TODO: Add search functionality and platform detection
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;

