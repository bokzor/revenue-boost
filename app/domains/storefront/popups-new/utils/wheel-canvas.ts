/**
 * Canvas Rendering Utilities
 *
 * Separates canvas rendering logic from React component logic.
 * Used by SpinToWinPopup and ScratchCardPopup.
 */

import type { Prize } from "../types";

export interface WheelRenderOptions {
  wheelSize: number;
  rotation: number;
  accentColor: string;
  wheelBorderColor: string;
  wheelBorderWidth: number;
  hasSpun: boolean;
  wonPrize: Prize | null;
  /** @deprecated No longer used - wheel now uses clean design by default */
  enableEnhancedStyle?: boolean;
}

/**
 * Utility functions for color manipulation
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c + (255 * percent) / 100)));
  const r = adjust(rgb.r);
  const g = adjust(rgb.g);
  const b = adjust(rgb.b);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/**
 * Wheel Renderer for Spin-to-Win popup
 * Clean, modern design with subtle gradients - colors are the primary differentiator
 */
export class WheelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  render(segments: Prize[], options: WheelRenderOptions) {
    if (!this.ctx || segments.length === 0) return;

    const {
      wheelSize,
      rotation,
      accentColor,
      wheelBorderColor,
      wheelBorderWidth,
      hasSpun,
      wonPrize,
      enableEnhancedStyle: _enableEnhancedStyle = true,
    } = options;
    const ctx = this.ctx;

    // Set up canvas with device pixel ratio
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = wheelSize * dpr;
    this.canvas.height = wheelSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    // Clean design: no outer ring, just padding for the border
    const padding = Math.max(wheelBorderWidth + 2, 8);
    const radiusPx = wheelSize / 2 - padding;
    const segmentAngleRad = (2 * Math.PI) / Math.max(1, segments.length);
    const rotationRad = (rotation * Math.PI) / 180;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    // Draw segments with subtle gradients
    segments.forEach((segment, index) => {
      const baseAngle = index * segmentAngleRad - Math.PI / 2;
      const startAngle = rotationRad + baseAngle;
      const endAngle = startAngle + segmentAngleRad;
      const baseColor = segment.color || accentColor;
      const isWinningSegment = hasSpun && wonPrize !== null && segment.id === wonPrize.id;

      // Draw segment with subtle gradient fill
      this.drawCleanSegment(
        ctx,
        centerX,
        centerY,
        radiusPx,
        startAngle,
        endAngle,
        baseColor,
        !!isWinningSegment
      );

      // Draw thin separator line between segments
      this.drawSimpleSeparator(ctx, centerX, centerY, radiusPx, startAngle);

      // Draw text
      this.drawSegmentText(
        ctx,
        segment.label || "",
        centerX,
        centerY,
        startAngle,
        segmentAngleRad,
        radiusPx,
        wheelSize,
        baseColor
      );
    });

    // Draw clean outer border
    this.drawCleanBorder(ctx, centerX, centerY, radiusPx, wheelBorderColor, wheelBorderWidth);

    // Draw simple center circle
    this.drawCleanCenter(ctx, centerX, centerY, wheelSize * 0.12, accentColor);

    // Draw subtle winning highlight if applicable
    if (hasSpun && wonPrize) {
      const winningIndex = segments.findIndex((s) => s.id === wonPrize.id);
      if (winningIndex !== -1) {
        const baseAngle = winningIndex * segmentAngleRad - Math.PI / 2;
        const startAngle = rotationRad + baseAngle;
        const endAngle = startAngle + segmentAngleRad;
        this.drawSubtleWinHighlight(
          ctx,
          centerX,
          centerY,
          radiusPx,
          startAngle,
          endAngle,
          accentColor
        );
      }
    }
  }

  /**
   * Draw segment with subtle radial gradient for depth (clean style)
   */
  private drawCleanSegment(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    baseColor: string,
    _isWinning: boolean
  ) {
    // Create subtle radial gradient for slight depth
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

    const lighterColor = adjustBrightness(baseColor, 10);
    const darkerColor = adjustBrightness(baseColor, -8);

    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.6, baseColor);
    gradient.addColorStop(1, darkerColor);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * Draw simple thin separator line between segments
   */
  private drawSimpleSeparator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number
  ) {
    const x2 = centerX + Math.cos(angle) * radius;
    const y2 = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  /**
   * Draw clean outer border
   */
  private drawCleanBorder(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    borderColor: string,
    borderWidth: number
  ) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }

  /**
   * Draw simple center circle
   */
  private drawCleanCenter(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    accentColor: string
  ) {
    // Fill center with accent color
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    // Add subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Draw subtle highlight on winning segment (uses accent color instead of gold)
   */
  private drawSubtleWinHighlight(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    accentColor: string
  ) {
    ctx.save();

    // Parse accent color for highlight
    const rgb = hexToRgb(accentColor);
    const highlightColor = rgb
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
      : "rgba(255, 255, 255, 0.2)";

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();

    // Simple overlay highlight
    ctx.fillStyle = highlightColor;
    ctx.fill();

    ctx.restore();
  }

  private drawSegmentText(
    ctx: CanvasRenderingContext2D,
    label: string,
    centerX: number,
    centerY: number,
    startAngle: number,
    segmentAngleRad: number,
    radiusPx: number,
    wheelSize: number,
    segmentColor?: string
  ) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + segmentAngleRad / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Auto-calculate text color based on segment background
    const textColor = segmentColor && getLuminance(segmentColor) > 0.5 ? "#1a1a1a" : "#ffffff";
    ctx.fillStyle = textColor;

    const maxTextWidth = radiusPx * 0.55;
    const textDistance = radiusPx * 0.62;
    let fontSize = Math.max(10, wheelSize / 24);
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

    let textWidth = ctx.measureText(label).width;
    if (textWidth > maxTextWidth) {
      fontSize = (fontSize * maxTextWidth) / textWidth;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      textWidth = ctx.measureText(label).width;
    }

    // Enhanced text shadow for better readability
    ctx.shadowColor = textColor === "#ffffff" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Handle multi-line text
    const words = label.split(" ");
    if (words.length > 1 && textWidth > maxTextWidth * 0.85) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      ctx.fillText(line1, textDistance, -fontSize * 0.55);
      ctx.fillText(line2, textDistance, fontSize * 0.55);
    } else {
      ctx.fillText(label, textDistance, 0);
    }

    ctx.restore();
  }
}
