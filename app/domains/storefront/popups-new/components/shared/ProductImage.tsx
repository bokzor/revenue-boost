/**
 * ProductImage Component
 *
 * A product image component with skeleton loader, fade-in animation,
 * and error handling. Designed for upsell popups where smooth image
 * loading enhances the user experience.
 *
 * Features:
 * - Skeleton placeholder with shimmer animation while loading
 * - Smooth fade-in when image loads
 * - Error fallback with retry capability
 * - Respects prefers-reduced-motion
 * - Supports priority loading (no lazy load for hero images)
 */

import React, { useState, useEffect, useCallback } from "react";
import "./animations.css";

export interface ProductImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the image element */
  imageClassName?: string;
  /** Aspect ratio for the skeleton placeholder */
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  /** Whether this is a priority image (disables lazy loading) */
  priority?: boolean;
  /** Custom width for the container */
  width?: string | number;
  /** Custom height for the container */
  height?: string | number;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Custom fallback content when image fails */
  fallback?: React.ReactNode;
  /** Background color for skeleton (CSS color value) */
  skeletonColor?: string;
}

const aspectRatioStyles: Record<string, React.CSSProperties> = {
  square: { paddingBottom: "100%" },
  portrait: { paddingBottom: "133%" },
  landscape: { paddingBottom: "75%" },
  auto: {},
};

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = "",
  imageClassName = "",
  aspectRatio = "square",
  priority = false,
  width,
  height,
  onLoad,
  onError,
  fallback,
  skeletonColor,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(src);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    // Add cache-busting query param to force reload
    const separator = src.includes("?") ? "&" : "?";
    setImageSrc(`${src}${separator}_retry=${Date.now()}`);
  }, [src]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    width: width ?? "100%",
    height: height ?? (aspectRatio === "auto" ? "auto" : undefined),
    ...aspectRatioStyles[aspectRatio],
  };

  const skeletonStyle: React.CSSProperties = {
    position: aspectRatio === "auto" ? "relative" : "absolute",
    inset: aspectRatio === "auto" ? undefined : 0,
    width: "100%",
    height: aspectRatio === "auto" ? (height ?? "100px") : "100%",
    background: skeletonColor
      ? skeletonColor
      : "linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite linear",
    borderRadius: "inherit",
  };

  const imageStyle: React.CSSProperties = {
    position: aspectRatio === "auto" ? "relative" : "absolute",
    inset: aspectRatio === "auto" ? undefined : 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: isLoaded ? 1 : 0,
    transition: "opacity 0.3s ease-in-out",
  };

  const errorStyle: React.CSSProperties = {
    position: aspectRatio === "auto" ? "relative" : "absolute",
    inset: aspectRatio === "auto" ? undefined : 0,
    width: "100%",
    height: aspectRatio === "auto" ? (height ?? "100px") : "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "8px",
    background: "#f5f5f5",
    color: "#888",
    fontSize: "12px",
    borderRadius: "inherit",
  };

  if (hasError) {
    return (
      <div className={`product-image product-image--error ${className}`} style={containerStyle}>
        {fallback ?? (
          <div style={errorStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <button
              onClick={handleRetry}
              style={{ padding: "4px 8px", fontSize: "11px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", background: "#fff" }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`product-image ${className}`} style={containerStyle}>
      {/* Skeleton placeholder */}
      {!isLoaded && <div className="product-image__skeleton" style={skeletonStyle} aria-hidden="true" />}
      {/* Actual image */}
      <img
        src={imageSrc}
        alt={alt}
        className={`product-image__img ${imageClassName}`}
        style={imageStyle}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default ProductImage;

