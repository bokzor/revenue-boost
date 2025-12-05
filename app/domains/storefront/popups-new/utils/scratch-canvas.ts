/**
 * Scratch Card Canvas Rendering Utilities
 *
 * Separates canvas rendering logic from React component logic.
 * Used by ScratchCardPopup for scratch card interactions.
 */

import type { Prize } from "../types";

// ============================================
// Types and Interfaces
// ============================================

export interface ScratchCardRenderOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor: string;
  buttonColor?: string;
  overlayColor?: string;
  instruction?: string;
  enableMetallic?: boolean;
}

export interface ScratchBrushOptions {
  radius: number;
  irregularity?: number;
  points?: number;
}

// ============================================
// Color Utilities
// ============================================

/**
 * Adjust color brightness by a percentage
 */
export function adjustBrightness(hex: string, percent: number): string {
  if (hex.startsWith("rgb")) return hex;

  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round((255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round((255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round((255 * percent) / 100)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ============================================
// Overlay Drawing Functions
// ============================================

/**
 * Draw noise texture for realistic scratch surface
 */
function drawNoiseTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw holographic rainbow pattern with sparkles
 */
function drawHolographicPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string
) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.globalCompositeOperation = "overlay";

  // Create diagonal holographic stripes
  const stripeWidth = 30;
  const colors = [
    "rgba(255, 0, 128, 0.3)",
    "rgba(0, 255, 255, 0.3)",
    "rgba(255, 255, 0, 0.3)",
    "rgba(128, 0, 255, 0.3)",
    accentColor + "40",
  ];

  for (let i = -height; i < width + height; i += stripeWidth) {
    const colorIndex = Math.floor(Math.abs(i / stripeWidth)) % colors.length;
    ctx.fillStyle = colors[colorIndex];
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeWidth / 2, 0);
    ctx.lineTo(i + stripeWidth / 2 + height, height);
    ctx.lineTo(i + height, height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Add sparkle dots
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;

    const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    sparkleGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    sparkleGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    sparkleGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = sparkleGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw ornate corner decorations
 */
function drawCornerDecorations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string
) {
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;

  const cornerSize = 25;
  const offset = 8;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(offset, offset + cornerSize);
  ctx.lineTo(offset, offset);
  ctx.lineTo(offset + cornerSize, offset);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - offset - cornerSize, offset);
  ctx.lineTo(width - offset, offset);
  ctx.lineTo(width - offset, offset + cornerSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(offset, height - offset - cornerSize);
  ctx.lineTo(offset, height - offset);
  ctx.lineTo(offset + cornerSize, height - offset);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - offset - cornerSize, height - offset);
  ctx.lineTo(width - offset, height - offset);
  ctx.lineTo(width - offset, height - offset - cornerSize);
  ctx.stroke();

  // Add decorative dots at corners
  ctx.fillStyle = accentColor;
  const dotSize = 3;
  ctx.beginPath();
  ctx.arc(offset + 3, offset + 3, dotSize, 0, Math.PI * 2);
  ctx.arc(width - offset - 3, offset + 3, dotSize, 0, Math.PI * 2);
  ctx.arc(offset + 3, height - offset - 3, dotSize, 0, Math.PI * 2);
  ctx.arc(width - offset - 3, height - offset - 3, dotSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw dashed border for ticket authenticity
 */
function drawDashedBorder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  const inset = 4;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  ctx.restore();
}

/**
 * Draw scratch instruction with coin icon
 */
function drawScratchInstruction(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  instruction: string
) {
  ctx.save();

  // Draw coin icon
  const coinX = width / 2 - 80;
  const coinY = height / 2;
  const coinRadius = 14;

  // Coin gradient
  const coinGradient = ctx.createRadialGradient(coinX - 3, coinY - 3, 0, coinX, coinY, coinRadius);
  coinGradient.addColorStop(0, "#FFE066");
  coinGradient.addColorStop(0.5, "#FFD700");
  coinGradient.addColorStop(1, "#B8860B");

  ctx.fillStyle = coinGradient;
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  // Coin border
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dollar sign on coin
  ctx.fillStyle = "#8B6914";
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", coinX, coinY);

  // Instruction text with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(instruction, width / 2 + 10, height / 2);

  ctx.restore();
}

/**
 * Draw ticket serial number for authenticity
 */
function drawSerialNumber(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Generate pseudo-random serial
  const serial = `#${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  ctx.fillText(serial, width - 12, height - 8);

  ctx.restore();
}

/**
 * Draw enhanced metallic foil overlay with holographic pattern
 */
function drawMetallicOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
  instruction: string,
  accentColor: string
) {
  // Create metallic gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, adjustBrightness(baseColor, 15));
  gradient.addColorStop(0.2, adjustBrightness(baseColor, 30));
  gradient.addColorStop(0.4, baseColor);
  gradient.addColorStop(0.5, adjustBrightness(baseColor, 40));
  gradient.addColorStop(0.6, baseColor);
  gradient.addColorStop(0.8, adjustBrightness(baseColor, 25));
  gradient.addColorStop(1, adjustBrightness(baseColor, 10));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add noise texture for realistic scratch surface
  drawNoiseTexture(ctx, width, height, 0.03);

  // Add holographic rainbow pattern
  drawHolographicPattern(ctx, width, height, accentColor);

  // Draw decorative corner elements
  drawCornerDecorations(ctx, width, height, accentColor);

  // Draw dashed border
  drawDashedBorder(ctx, width, height);

  // Draw instruction with icon
  drawScratchInstruction(ctx, width, height, instruction);

  // Draw ticket serial number
  drawSerialNumber(ctx, width, height);
}

// ============================================
// ScratchCardRenderer Class
// ============================================

/**
 * Scratch Card Renderer
 *
 * Handles all canvas rendering for scratch card popups:
 * - Prize layer (background gradient + prize text)
 * - Overlay layer (metallic, image, or basic)
 * - Scratch interaction (irregular brush strokes)
 * - Scratch percentage calculation
 */
export class ScratchCardRenderer {
  private overlayCanvas: HTMLCanvasElement;
  private prizeCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D | null;
  private prizeCtx: CanvasRenderingContext2D | null;
  private width: number;
  private height: number;

  constructor(
    overlayCanvas: HTMLCanvasElement,
    prizeCanvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    this.overlayCanvas = overlayCanvas;
    this.prizeCanvas = prizeCanvas;
    this.width = width;
    this.height = height;

    // Use willReadFrequently for better performance with getImageData
    this.overlayCtx = overlayCanvas.getContext("2d", { willReadFrequently: true });
    this.prizeCtx = prizeCanvas.getContext("2d");
  }

  /**
   * Render the prize layer (bottom layer showing the prize)
   */
  renderPrizeLayer(prize: Prize | null, options: ScratchCardRenderOptions) {
    if (!this.prizeCtx) return;

    const ctx = this.prizeCtx;
    const { width, height, backgroundColor, textColor, accentColor, buttonColor } = options;

    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Draw background (gradient or solid color)
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, accentColor || buttonColor || "#4f46e5");
      gradient.addColorStop(1, buttonColor || accentColor || "#ec4899");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw prize label or loading spinner
    if (prize) {
      ctx.fillStyle = textColor || "#ffffff";
      ctx.font = "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(prize.label, width / 2, height / 2);
    } else {
      this.drawLoadingSpinner(ctx, width, height);
    }
  }

  /**
   * Draw a loading spinner when prize is not yet determined
   */
  private drawLoadingSpinner(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.translate(width / 2, height / 2);

    const spinnerRadius = 30;
    const lineWidth = 4;
    const numSegments = 8;

    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      const opacity = (i + 1) / numSegments;

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * (spinnerRadius - lineWidth),
        Math.sin(angle) * (spinnerRadius - lineWidth)
      );
      ctx.lineTo(Math.cos(angle) * spinnerRadius, Math.sin(angle) * spinnerRadius);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Render the scratch overlay layer (top layer to be scratched)
   */
  renderOverlayLayer(options: ScratchCardRenderOptions, overlayImage?: HTMLImageElement | null) {
    if (!this.overlayCtx) return;

    const ctx = this.overlayCtx;
    const {
      width,
      height,
      overlayColor = "#C0C0C0",
      accentColor,
      buttonColor,
      instruction = "Scratch to reveal!",
      enableMetallic = true,
    } = options;

    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    const effectiveAccentColor = accentColor || buttonColor || "#FFD700";

    // Priority: 1. Custom overlay image, 2. Metallic effect, 3. Basic solid color
    if (overlayImage) {
      this.renderImageOverlay(ctx, overlayImage, width, height, instruction);
    } else if (enableMetallic) {
      drawMetallicOverlay(ctx, width, height, overlayColor, instruction, effectiveAccentColor);
    } else {
      this.renderBasicOverlay(ctx, width, height, overlayColor, instruction, effectiveAccentColor);
    }

    // Set composite operation for erasing (scratching)
    ctx.globalCompositeOperation = "destination-out";
  }

  /**
   * Render overlay with custom image
   */
  private renderImageOverlay(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
    instruction: string
  ) {
    // Draw custom overlay image (covers entire scratch area)
    ctx.drawImage(image, 0, 0, width, height);

    // Add instruction text on top of the image
    ctx.save();
    const textY = height / 2;
    ctx.font = "600 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    const textMetrics = ctx.measureText(instruction);
    const textWidth = textMetrics.width || 200;
    const padding = 16;

    // Semi-transparent background for the text
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(
      (width - textWidth) / 2 - padding,
      textY - 18,
      textWidth + padding * 2,
      36,
      8
    );
    ctx.fill();

    // Draw the instruction text
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(instruction, width / 2, textY);
    ctx.restore();
  }

  /**
   * Render basic overlay (fallback when metallic is disabled)
   */
  private renderBasicOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    overlayColor: string,
    instruction: string,
    accentColor: string
  ) {
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(instruction, width / 2, height / 2);

    // Add sparkles
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Perform a scratch at the given coordinates
   */
  scratch(x: number, y: number, options: ScratchBrushOptions = { radius: 25 }) {
    if (!this.overlayCtx) return;

    const ctx = this.overlayCtx;
    const { radius, irregularity = 0.3, points = 8 } = options;

    // Set composite operation to erase mode
    ctx.globalCompositeOperation = "destination-out";

    // Use irregular brush shape for more realistic scratch
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radiusVariation = radius * (1 + (Math.random() - 0.5) * irregularity);
      const px = x + Math.cos(angle) * radiusVariation;
      const py = y + Math.sin(angle) * radiusVariation;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Calculate the percentage of the overlay that has been scratched
   */
  calculateScratchPercentage(): number {
    if (!this.overlayCtx) return 0;

    const imageData = this.overlayCtx.getImageData(0, 0, this.width, this.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    return (transparentPixels / (this.width * this.height)) * 100;
  }

  /**
   * Update canvas dimensions
   */
  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

