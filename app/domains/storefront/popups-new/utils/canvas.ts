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
  /** Optional: Enable enhanced casino-style rendering */
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
 * Enhanced with casino-style visuals: gradients, decorative rings, metallic effects
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
      enableEnhancedStyle = true,
    } = options;
    const ctx = this.ctx;

    // Set up canvas with device pixel ratio
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = wheelSize * dpr;
    this.canvas.height = wheelSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const outerRingWidth = enableEnhancedStyle ? wheelSize * 0.06 : 0;
    const radiusPx = wheelSize / 2 - 10 - outerRingWidth;
    const segmentAngleRad = (2 * Math.PI) / Math.max(1, segments.length);
    const rotationRad = (rotation * Math.PI) / 180;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    if (enableEnhancedStyle) {
      // Draw outer decorative ring with tick marks (casino style)
      this.drawOuterRing(ctx, centerX, centerY, radiusPx, outerRingWidth, segments.length, wheelBorderColor, rotationRad);
    }

    // Draw segments with gradients
    segments.forEach((segment, index) => {
      const baseAngle = index * segmentAngleRad - Math.PI / 2;
      const startAngle = rotationRad + baseAngle;
      const endAngle = startAngle + segmentAngleRad;
      const baseColor = segment.color || accentColor;
      const isWinningSegment = hasSpun && wonPrize !== null && segment.id === wonPrize.id;

      if (enableEnhancedStyle) {
        // Draw segment with gradient fill
        this.drawGradientSegment(ctx, centerX, centerY, radiusPx, startAngle, endAngle, baseColor, !!isWinningSegment);

        // Draw metallic segment separator
        this.drawMetallicSeparator(ctx, centerX, centerY, radiusPx, startAngle, wheelBorderWidth);
      } else {
        // Draw basic segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radiusPx, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();

        // Draw border
        const borderColor = isWinningSegment ? "#FFD700" : wheelBorderColor;
        const borderWidth = isWinningSegment ? wheelBorderWidth + 2 : wheelBorderWidth;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
      }

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

    if (enableEnhancedStyle) {
      // Draw inner decorative ring around center
      this.drawInnerRing(ctx, centerX, centerY, wheelSize * 0.15, accentColor);

      // Draw winning segment highlight glow
      if (hasSpun && wonPrize) {
        const winningIndex = segments.findIndex((s) => s.id === wonPrize.id);
        if (winningIndex !== -1) {
          const baseAngle = winningIndex * segmentAngleRad - Math.PI / 2;
          const startAngle = rotationRad + baseAngle;
          const endAngle = startAngle + segmentAngleRad;
          this.drawWinningGlow(ctx, centerX, centerY, radiusPx, startAngle, endAngle);
        }
      }
    }
  }

  /**
   * Draw outer decorative ring with tick marks (casino style)
   */
  private drawOuterRing(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerRadius: number,
    ringWidth: number,
    segmentCount: number,
    borderColor: string,
    rotationRad: number
  ) {
    const outerRadius = innerRadius + ringWidth;

    // Create metallic gradient for outer ring
    const ringGradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    );
    ringGradient.addColorStop(0, "#2a2a2a");
    ringGradient.addColorStop(0.3, "#4a4a4a");
    ringGradient.addColorStop(0.5, "#6a6a6a");
    ringGradient.addColorStop(0.7, "#4a4a4a");
    ringGradient.addColorStop(1, "#1a1a1a");

    // Draw ring background
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = ringGradient;
    ctx.fill();

    // Draw tick marks for each segment
    const tickCount = segmentCount * 2; // Double the ticks for visual density
    for (let i = 0; i < tickCount; i++) {
      const angle = rotationRad + (i * Math.PI * 2) / tickCount - Math.PI / 2;
      const isMainTick = i % 2 === 0;
      const tickInner = isMainTick ? innerRadius + ringWidth * 0.2 : innerRadius + ringWidth * 0.4;
      const tickOuter = innerRadius + ringWidth * 0.85;

      const x1 = centerX + Math.cos(angle) * tickInner;
      const y1 = centerY + Math.sin(angle) * tickInner;
      const x2 = centerX + Math.cos(angle) * tickOuter;
      const y2 = centerY + Math.sin(angle) * tickOuter;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMainTick ? "#FFD700" : "#888888";
      ctx.lineWidth = isMainTick ? 3 : 1.5;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Draw outer ring border with golden accent
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Draw segment with radial gradient for depth
   */
  private drawGradientSegment(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    baseColor: string,
    isWinning: boolean
  ) {
    // Create radial gradient for depth effect
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    const lighterColor = adjustBrightness(baseColor, 25);
    const darkerColor = adjustBrightness(baseColor, -15);

    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, darkerColor);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add subtle inner shadow for depth
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();

    // Shadow gradient from center
    const shadowGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.7,
      centerX, centerY, radius
    );
    shadowGradient.addColorStop(0, "rgba(0,0,0,0)");
    shadowGradient.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = shadowGradient;
    ctx.fill();
    ctx.restore();

    // Add highlight for winning segment
    if (isWinning) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      const highlightGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      highlightGradient.addColorStop(0, "rgba(255,215,0,0.3)");
      highlightGradient.addColorStop(0.5, "rgba(255,215,0,0.15)");
      highlightGradient.addColorStop(1, "rgba(255,215,0,0.05)");
      ctx.fillStyle = highlightGradient;
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draw metallic separator line between segments
   */
  private drawMetallicSeparator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    baseWidth: number
  ) {
    const x1 = centerX;
    const y1 = centerY;
    const x2 = centerX + Math.cos(angle) * radius;
    const y2 = centerY + Math.sin(angle) * radius;

    // Draw shadow first
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = baseWidth + 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw metallic highlight
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    // Create linear gradient along the separator for metallic effect
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, "#888888");
    gradient.addColorStop(0.3, "#CCCCCC");
    gradient.addColorStop(0.5, "#FFFFFF");
    gradient.addColorStop(0.7, "#CCCCCC");
    gradient.addColorStop(1, "#888888");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = baseWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  /**
   * Draw inner decorative ring around center button area
   */
  private drawInnerRing(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    accentColor: string
  ) {
    const innerRadius = radius * 0.85;

    // Create metallic gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, "#4a4a4a");
    gradient.addColorStop(0.3, "#6a6a6a");
    gradient.addColorStop(0.5, "#888888");
    gradient.addColorStop(0.7, "#6a6a6a");
    gradient.addColorStop(1, "#3a3a3a");

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add golden highlight
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Draw glowing effect on winning segment
   */
  private drawWinningGlow(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) {
    ctx.save();

    // Create pulsing glow effect
    const midAngle = (startAngle + endAngle) / 2;
    const glowX = centerX + Math.cos(midAngle) * (radius * 0.5);
    const glowY = centerY + Math.sin(midAngle) * (radius * 0.5);

    const glowGradient = ctx.createRadialGradient(
      glowX, glowY, 0,
      glowX, glowY, radius * 0.6
    );
    glowGradient.addColorStop(0, "rgba(255,215,0,0.4)");
    glowGradient.addColorStop(0.5, "rgba(255,215,0,0.15)");
    glowGradient.addColorStop(1, "rgba(255,215,0,0)");

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

export interface ScratchCardRenderOptions {
  cardWidth: number;
  cardHeight: number;
  overlayColor: string;
  instruction: string;
  accentColor: string;
  prizeLabel?: string;
  prizeTextColor?: string;
  backgroundColor?: string;
}

/**
 * Scratch Card Renderer for Scratch Card popup
 */
export class ScratchCardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private isScratching = false;
  private scratchedPixels = 0;
  private totalPixels = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
  }

  initializeOverlay(options: ScratchCardRenderOptions) {
    if (!this.ctx) return;

    const { cardWidth, cardHeight, overlayColor, instruction, accentColor: _accentColor } = options;
    const ctx = this.ctx;

    // Set canvas size
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = cardWidth * dpr;
    this.canvas.height = cardHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw overlay
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Draw instruction text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(instruction, cardWidth / 2, cardHeight / 2);

    // Calculate total pixels for percentage
    this.totalPixels = cardWidth * cardHeight;
  }

  scratch(x: number, y: number, radius: number = 30) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  calculateScratchPercentage(): number {
    if (!this.ctx) return 0;

    const { width, height } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    return (transparentPixels / (width * height)) * 100;
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setScratching(scratching: boolean) {
    this.isScratching = scratching;
  }

  getIsScratching(): boolean {
    return this.isScratching;
  }
}
