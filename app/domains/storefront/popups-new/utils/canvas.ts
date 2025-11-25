/**
 * Canvas Rendering Utilities
 * 
 * Separates canvas rendering logic from React component logic.
 * Used by SpinToWinPopup and ScratchCardPopup.
 */

import type { Prize } from '../types';

export interface WheelRenderOptions {
  wheelSize: number;
  rotation: number;
  accentColor: string;
  wheelBorderColor: string;
  wheelBorderWidth: number;
  hasSpun: boolean;
  wonPrize: Prize | null;
}

/**
 * Wheel Renderer for Spin-to-Win popup
 */
export class WheelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }
  
  render(segments: Prize[], options: WheelRenderOptions) {
    if (!this.ctx || segments.length === 0) return;
    
    const { wheelSize, rotation, accentColor, wheelBorderColor, wheelBorderWidth, hasSpun, wonPrize } = options;
    const ctx = this.ctx;
    
    // Set up canvas with device pixel ratio
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = wheelSize * dpr;
    this.canvas.height = wheelSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radiusPx = wheelSize / 2 - 10;
    const segmentAngleRad = (2 * Math.PI) / Math.max(1, segments.length);
    const rotationRad = (rotation * Math.PI) / 180;
    
    ctx.clearRect(0, 0, wheelSize, wheelSize);
    
    // Draw segments
    segments.forEach((segment, index) => {
      const baseAngle = index * segmentAngleRad - Math.PI / 2;
      const startAngle = rotationRad + baseAngle;
      const endAngle = startAngle + segmentAngleRad;
      const baseColor = segment.color || accentColor;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radiusPx, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();
      
      // Draw border
      const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
      const borderColor = isWinningSegment ? '#FFD700' : wheelBorderColor;
      const borderWidth = isWinningSegment ? wheelBorderWidth + 2 : wheelBorderWidth;
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
      
      // Draw text
      this.drawSegmentText(ctx, segment.label || '', centerX, centerY, startAngle, segmentAngleRad, radiusPx, wheelSize);
    });
  }
  
  private drawSegmentText(
    ctx: CanvasRenderingContext2D,
    label: string,
    centerX: number,
    centerY: number,
    startAngle: number,
    segmentAngleRad: number,
    radiusPx: number,
    wheelSize: number
  ) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + segmentAngleRad / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    
    const maxTextWidth = radiusPx * 0.6;
    const textDistance = radiusPx * 0.65;
    let fontSize = Math.max(10, wheelSize / 25);
    ctx.font = `bold ${fontSize}px sans-serif`;
    
    let textWidth = ctx.measureText(label).width;
    if (textWidth > maxTextWidth) {
      fontSize = (fontSize * maxTextWidth) / textWidth;
      ctx.font = `bold ${fontSize}px sans-serif`;
      textWidth = ctx.measureText(label).width;
    }
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // Handle multi-line text
    const words = label.split(' ');
    if (words.length > 1 && textWidth > maxTextWidth * 0.9) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      ctx.fillText(line1, textDistance, -fontSize * 0.5);
      ctx.fillText(line2, textDistance, fontSize * 0.5);
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
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
  }

  initializeOverlay(options: ScratchCardRenderOptions) {
    if (!this.ctx) return;

    const { cardWidth, cardHeight, overlayColor, instruction, accentColor } = options;
    const ctx = this.ctx;

    // Set canvas size
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = cardWidth * dpr;
    this.canvas.height = cardHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw overlay
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Draw instruction text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(instruction, cardWidth / 2, cardHeight / 2);

    // Calculate total pixels for percentage
    this.totalPixels = cardWidth * cardHeight;
  }

  scratch(x: number, y: number, radius: number = 30) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
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

