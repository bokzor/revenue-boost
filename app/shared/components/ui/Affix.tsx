import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface AffixProps {
  children: React.ReactNode;
  /**
   * Pixels from the top of the viewport OR name of CSS variable that resolves to px value
   * Defaults to reading --app-sticky-top, falling back to 20.
   */
  offsetTop?: number;
  offsetVar?: string; // e.g., "--app-sticky-top"
  /** Disable affix under this viewport width (e.g., mobile). Default: 768 */
  disableBelowWidth?: number;
  zIndex?: number;
  /** Enable verbose console logging for diagnostics (default off) */
  debug?: boolean;
  /** Optional className for the container */
  className?: string;
}

/**
 * Affix
 *
 * Keeps content in natural flow initially, then pins it under the TopBar while scrolling,
 * and stops at the bottom of its container. Unlike CSS sticky, this works even when
 * ancestors have overflow or transforms.
 */
export function Affix({
  children,
  offsetTop,
  offsetVar = "--app-sticky-top",
  disableBelowWidth = 768,
  zIndex = 3,
  debug,
  className,
}: AffixProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<EventTarget | null>(null);

  // Track last mode to reduce noisy logs
  const lastModeRef = useRef<"static" | "fixed" | "absolute" | "disabled" | null>(null);

  // Store props in refs to avoid recreating measure callback
  const disableBelowWidthRef = useRef(disableBelowWidth);
  const zIndexRef = useRef(zIndex);

  // Update refs when props change
  useEffect(() => {
    disableBelowWidthRef.current = disableBelowWidth;
    zIndexRef.current = zIndex;
  }, [disableBelowWidth, zIndex]);

  const isDebug = useCallback((): boolean => {
    if (typeof debug === "boolean") return debug;
    if (typeof window === "undefined") return false;
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("affixDebug") === "1") return true;
      if ((window as unknown as { SPLITPOP_DEBUG?: boolean }).SPLITPOP_DEBUG) return true;
      const ls = window.localStorage.getItem("affixDebug");
      return ls === "1" || ls === "true";
    } catch {
      return false;
    }
  }, [debug]);

  const dbg = (...args: unknown[]) => {
    if (!isDebug()) return;
    // Prefix for easier filtering
    // eslint-disable-next-line no-console
    console.log("[Affix]", ...args);
  };

  const dispatchEvent = (detail: unknown) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent("splitpop:affix", { detail }));
    } catch {
      /* noop */
    }
  };

  const readOffsetTop = useCallback((): number => {
    if (typeof offsetTop === "number") return Math.max(0, offsetTop);
    const css = getComputedStyle(document.documentElement as Element).getPropertyValue(offsetVar);
    const parsed = parseInt(css || "", 10);
    const val = Number.isFinite(parsed) ? parsed : 20;
    return Math.max(0, val);
  }, [offsetTop, offsetVar]);

  const getScrollParent = (node: HTMLElement | null): EventTarget => {
    if (!node) return window;
    let el: HTMLElement | null = node.parentElement;
    while (el && el !== document.body) {
      const style = getComputedStyle(el as Element);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      if (["auto", "scroll"].includes(overflowY) || ["auto", "scroll"].includes(overflow)) {
        return el;
      }
      el = el.parentElement;
    }
    // Polaris main scroller fallback
    const polarisMain = document.querySelector(".Polaris-Frame__Main") as HTMLElement | null;
    return polarisMain || window;
  };

  const measure = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const placeholder = placeholderRef.current;
    if (!container || !content || !placeholder) return;

    const vw = window.innerWidth;
    const disableWidth = disableBelowWidthRef.current ?? 0;
    const zIdx = zIndexRef.current;

    if (vw < disableWidth) {
      // Disable on small screens
      placeholder.style.height = "0px";
      content.style.position = "static";
      content.style.top = "";
      content.style.left = "";
      content.style.right = "";
      content.style.width = "";
      content.style.zIndex = "";
      const mode = "disabled";
      if (lastModeRef.current !== mode) {
        lastModeRef.current = mode;
        console.info("[Affix:mode]", mode, {
          vw,
          disableBelowWidth: disableWidth,
        });
        dispatchEvent({
          type: "mode",
          mode,
          vw,
          disableBelowWidth: disableWidth,
        });
      }
      return;
    }

    const topOffset = readOffsetTop();

    const containerRect = container.getBoundingClientRect();

    // Determine boundary element (the column that bounds the affix)
    const getBoundaryEl = (node: HTMLElement | null): HTMLElement | null => {
      if (!node) return null;
      let el: HTMLElement | null = node.parentElement;
      while (el && el !== document.body) {
        if (el.hasAttribute("data-affix-boundary")) return el;
        if (el.classList.contains("Polaris-Layout__Section")) return el;
        el = el.parentElement;
      }
      return node.parentElement;
    };

    const boundary = getBoundaryEl(container);
    const boundaryRect = boundary?.getBoundingClientRect() || containerRect;
    const boundaryHeight = boundary?.offsetHeight || container.offsetHeight;

    const contentHeight = content.offsetHeight;

    // Detect an inner scrollable region (opt-in) to allow affixing even when content is taller
    const innerScrollable = content.querySelector("[data-affix-scrollable]") as HTMLElement | null;

    // Compute the effective height we need to keep visible while affixed
    const viewportAvail = Math.max(0, window.innerHeight - topOffset - 8);
    const effectiveHeight = Math.max(0, Math.min(contentHeight, viewportAvail));

    // If content is strictly taller than its boundary and there's no inner scrollable, don't affix.
    if (contentHeight > boundaryHeight && !innerScrollable) {
      placeholder.style.height = "0px";
      content.style.position = "static";
      content.style.top = "";
      content.style.left = "";
      content.style.right = "";
      content.style.width = "";
      content.style.zIndex = "";
      const mode = "static";
      if (lastModeRef.current !== mode) {
        lastModeRef.current = mode;
        console.info("[Affix:mode]", mode, {
          reason: "content>boundary",
          contentHeight,
          boundaryHeight,
        });
        dispatchEvent({
          type: "mode",
          mode,
          reason: "content>boundary",
          contentHeight,
          boundaryHeight,
        });
      }
      return;
    }

    // Natural flow before reaching the offset
    if (containerRect.top >= topOffset) {
      placeholder.style.height = "0px";
      content.style.position = "static";
      content.style.top = "";
      content.style.left = "";
      content.style.right = "";
      content.style.width = "";
      content.style.zIndex = "";
      const mode = "static";
      if (lastModeRef.current !== mode) {
        lastModeRef.current = mode;
        console.info("[Affix:mode]", mode, {
          reason: "above-offset",
          containerTop: containerRect.top,
          topOffset,
        });
        dispatchEvent({
          type: "mode",
          mode,
          reason: "above-offset",
          containerTop: containerRect.top,
          topOffset,
        });
      }
      return;
    }

    // Bottom boundary: when the boundary's bottom is above the desired bottom of the affixed content
    // Add a small epsilon so we don't prematurely switch to absolute due to rounding/layout jitter
    const EPSILON = 16; // px tolerance
    // Compute where the absolute top would be relative to the container (without clamping)
    const rawAbsoluteTop = boundaryRect.bottom - containerRect.top - effectiveHeight;
    // Compute where the element would sit inside the container to align its top with the viewport topOffset
    const topWithinContainer = Math.max(0, -containerRect.top + topOffset);
    // Only switch to absolute when:
    // 1) The boundary bottom is above the desired affixed bottom (with tolerance), AND
    // 2) We have enough space to place the element at topWithinContainer without crossing the boundary
    if (boundaryRect.bottom < topOffset + effectiveHeight - EPSILON) {
      if (rawAbsoluteTop >= topWithinContainer) {
        // Place absolutely inside the container so that while the container scrolls, the element remains aligned with the viewport top
        const absoluteTop = topWithinContainer;
        // Preserve original layout height while absolutely positioned
        placeholder.style.height = `${contentHeight}px`;
        content.style.position = "absolute";
        content.style.top = `${absoluteTop}px`;
        content.style.left = "0px";
        content.style.right = "0px";
        content.style.width = "auto";
        content.style.zIndex = zIdx != null ? `${zIdx}` : "";
        const mode = "absolute";
        if (lastModeRef.current !== mode) {
          lastModeRef.current = mode;
          console.info("[Affix:mode]", mode, {
            absoluteTop,
            rawAbsoluteTop,
            topWithinContainer,
            boundaryBottom: boundaryRect.bottom,
            contentHeight,
            effectiveHeight,
            viewportAvail,
            epsilon: EPSILON,
          });
          dispatchEvent({
            type: "mode",
            mode,
            absoluteTop,
            rawAbsoluteTop,
            topWithinContainer,
            boundaryBottom: boundaryRect.bottom,
            contentHeight,
            effectiveHeight,
            viewportAvail,
            epsilon: EPSILON,
          });
        }
        return;
      }
      // Not enough space yet to safely place absolute without hiding; defer and remain fixed
      // fall through to fixed mode below
    }

    // Otherwise, fix to viewport under the TopBar
    placeholder.style.height = `${contentHeight}px`;
    content.style.position = "fixed";
    content.style.top = `${topOffset}px`;
    content.style.left = `${containerRect.left}px`;
    content.style.width = `${containerRect.width}px`;
    content.style.right = "";
    content.style.zIndex = zIdx != null ? `${zIdx}` : "";
    const mode = "fixed";
    if (lastModeRef.current !== mode) {
      lastModeRef.current = mode;
      console.info("[Affix:mode]", mode, {
        topOffset,
        left: containerRect.left,
        width: containerRect.width,
        effectiveHeight,
        viewportAvail,
      });
      dispatchEvent({
        type: "mode",
        mode,
        topOffset,
        left: containerRect.left,
        width: containerRect.width,
        effectiveHeight,
        viewportAvail,
      });
    }
  }, [readOffsetTop]);

  useLayoutEffect(() => {
    // On first mount, log environment
    const parent = getScrollParent(containerRef.current);
    scrollParentRef.current = parent;
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const off = typeof window !== "undefined" ? readOffsetTop() : (offsetTop ?? 20);
    // Always emit a one-time info log so users see something even if debug flags are off
    // eslint-disable-next-line no-console
    console.info("[Affix:init]", {
      scrollParent:
        parent === window
          ? "window"
          : (parent as HTMLElement)?.className || (parent as HTMLElement)?.id || "element",
      viewportWidth: vw,
      offsetTop: off,
      disableBelowWidth,
    });
    dbg("mount", {
      scrollParent:
        parent === window
          ? "window"
          : (parent as HTMLElement)?.className || (parent as HTMLElement)?.id || "element",
    });
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let raf = 0;

    // Throttled scroll logger so users can see activity while scrolling
    let lastLog = 0;
    const LOG_INTERVAL = 250; // ms
    const logScroll = (source: string) => {
      if (!isDebug()) return;
      const now = Date.now();
      if (now - lastLog < LOG_INTERVAL) return;
      lastLog = now;
      try {
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        // eslint-disable-next-line no-console
        console.log("[Affix:scroll]", {
          source,
          top: rect?.top,
          bottom: rect?.bottom,
          vw: typeof window !== "undefined" ? window.innerWidth : 0,
        });
      } catch {
        /* noop */
      }
    };

    const onWindowScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
        logScroll("window");
      });
    };

    const onParentScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
        logScroll("parent");
      });
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
        if (isDebug()) {
          // eslint-disable-next-line no-console
          console.log("[Affix:resize]");
        }
      });
    };

    const parent = scrollParentRef.current || getScrollParent(containerRef.current);
    scrollParentRef.current = parent;

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    window.addEventListener("resize", onResize);
    if (parent && parent !== window && parent instanceof HTMLElement) {
      parent.addEventListener("scroll", onParentScroll, {
        passive: true,
      });
    }

    // One-time listener attachment log
    // eslint-disable-next-line no-console
    console.info("[Affix:listener] attached", {
      window: true,
      parent:
        parent === window
          ? "window"
          : (parent as HTMLElement)?.className || (parent as HTMLElement)?.id || "element",
    });

    // Resize observers to react to layout changes
    const ro = new ResizeObserver(onResize);
    if (containerRef.current) ro.observe(containerRef.current as Element);
    if (contentRef.current) ro.observe(contentRef.current as Element);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onWindowScroll);
      window.removeEventListener("resize", onResize);
      if (
        scrollParentRef.current &&
        scrollParentRef.current !== window &&
        scrollParentRef.current instanceof HTMLElement
      ) {
        scrollParentRef.current.removeEventListener("scroll", onParentScroll);
      }
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure]);

  return (
    <div ref={containerRef} style={{ position: "relative" }} className={className}>
      <div ref={placeholderRef} aria-hidden="true" />
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

export default Affix;
