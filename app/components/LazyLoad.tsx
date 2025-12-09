/**
 * LazyLoad Component
 *
 * A reusable wrapper that defers rendering children until they're visible
 * in the viewport. Shows a customizable loader/skeleton until initialized.
 *
 * Uses Intersection Observer for efficient viewport detection.
 */

import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { Spinner } from "@shopify/polaris";

export interface LazyLoadProps {
  /** Content to render when visible */
  children: ReactNode;

  /** Custom loader to show while waiting (defaults to Polaris Spinner) */
  loader?: ReactNode;

  /** Height of the placeholder (prevents layout shift) */
  height?: number | string;

  /** Width of the placeholder */
  width?: number | string;

  /** Root margin for Intersection Observer (load before visible) */
  rootMargin?: string;

  /** Threshold for visibility (0-1) */
  threshold?: number;

  /** Only trigger once (default: true) */
  triggerOnce?: boolean;

  /** Additional className for container */
  className?: string;

  /** Additional styles for container */
  style?: CSSProperties;

  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean) => void;
}

/**
 * LazyLoad - Defers rendering until element is in viewport
 *
 * @example
 * <LazyLoad height={200}>
 *   <ExpensiveComponent />
 * </LazyLoad>
 *
 * @example With custom loader
 * <LazyLoad height={150} loader={<SkeletonBodyText lines={3} />}>
 *   <HeavyPreview />
 * </LazyLoad>
 */
export function LazyLoad({
  children,
  loader,
  height = "auto",
  width = "100%",
  rootMargin = "100px",
  threshold = 0,
  triggerOnce = true,
  className,
  style,
  onVisibilityChange,
}: LazyLoadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // If already triggered and triggerOnce, skip
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;

          if (visible) {
            setIsVisible(true);
            setHasTriggered(true);
            onVisibilityChange?.(true);

            if (triggerOnce) {
              observer.disconnect();
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            onVisibilityChange?.(false);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, hasTriggered, onVisibilityChange]);

  const containerStyle: CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width,
    ...style,
  };

  const loaderContainerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  };

  const defaultLoader = (
    <div style={loaderContainerStyle}>
      <Spinner size="small" />
    </div>
  );

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      {isVisible ? children : (loader ?? defaultLoader)}
    </div>
  );
}

export default LazyLoad;
