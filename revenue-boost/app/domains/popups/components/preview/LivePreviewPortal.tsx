import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "~/domains/popups/components/design/PopupDesignEditorV2.module.css";

/**
 * LivePreviewPortal
 *
 * Renders children into document.body using a fixed-position container so the
 * preview remains visible while the page scrolls. It is visible on desktop and
 * hidden on small screens (handled via CSS in PopupDesignEditorV2.module.css).
 */
export const LivePreviewPortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.fixedPreviewPortal}
      aria-live="polite"
      aria-label="Live preview"
    >
      {children}
    </div>,
    document.body as Element,
  );
};
