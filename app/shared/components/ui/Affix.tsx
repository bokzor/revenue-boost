/**
 * Affix Component (Stub)
 * 
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should provide sticky/affix behavior.
 * 
 * Expected features:
 * - Sticky positioning
 * - Scroll-based affixing
 * - Offset controls
 * - Responsive behavior
 * - Boundary detection
 */

import React, { ReactNode, useEffect, useMemo, useState } from "react";

export interface AffixProps {
  children: ReactNode;
  offsetTop?: number;
  offsetBottom?: number;
  target?: () => HTMLElement | Window;
  onChange?: (affixed: boolean) => void;
  disableBelowWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Affix: React.FC<AffixProps> = ({
  children,
  offsetTop = 0,
  offsetBottom,
  className,
  style,
  disableBelowWidth,
}) => {
  // Simple responsive disable: if viewport width is below threshold, render without sticky
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!disableBelowWidth) {
      setEnabled(true);
      return;
    }
    const check = () => setEnabled(window.innerWidth >= disableBelowWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [disableBelowWidth]);

  const affixStyle: React.CSSProperties = useMemo(
    () =>
      enabled
        ? {
            position: "sticky",
            top: offsetTop,
            bottom: offsetBottom,
            zIndex: 100,
            ...style,
          }
        : { ...style },
    [enabled, offsetTop, offsetBottom, style],
  );

  return (
    <div className={className} style={affixStyle}>
      {children}
    </div>
  );
};

export default Affix;

