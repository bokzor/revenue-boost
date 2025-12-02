/**
 * ScratchCardCanvas Component
 *
 * Standalone canvas component for scratch card interaction.
 * This component is used by ScratchCardPopup within LeadCaptureLayout.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { Prize } from "../types";
import { prefersReducedMotion } from "../utils";
import { DiscountCodeDisplay } from "./shared";

export interface ScratchCardCanvasProps {
  width?: number;
  height?: number;
  threshold?: number;
  brushRadius?: number;
  prize: Prize | null;
  onReveal?: () => void;
  onScratchStart?: () => void;
  onScratchProgress?: (percentage: number) => void;
  overlayColor?: string;
  overlayImage?: string;
  accentColor?: string;
  prizeBackgroundColor?: string;
  prizeTextColor?: string;
  instruction?: string;
  enableMetallic?: boolean;
  enableSound?: boolean;
  enableHaptic?: boolean;
  enableParticles?: boolean;
  isRevealed?: boolean;
  onCopyCode?: () => void;
  codeCopied?: boolean;
  showCodeOverlay?: boolean;
  borderRadius?: number;
}

interface ScratchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
}

// Color helpers
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  } else {
    s = 0;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustBrightness(hex: string, percent: number): string {
  const hsl = hexToHSL(hex);
  hsl.l = Math.max(0, Math.min(100, hsl.l + percent));
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Canvas drawing helpers
function drawNoiseTexture(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * opacity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawHolographicPattern(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD", accent];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(i * (w / 6), 0, w / 6, h);
  }
  ctx.restore();
}

function drawCornerDecorations(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  const cs = 20;
  [[0, cs, 0, 0, cs, 0], [w - cs, 0, w, 0, w, cs], [w, h - cs, w, h, w - cs, h], [cs, h, 0, h, 0, h - cs]]
    .forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();
    });
  ctx.restore();
}

function drawDashedBorder(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  ctx.save();
  ctx.setLineDash([8, 4]);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.restore();
}

function drawMetallicOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, inst: string, accent: string) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1].forEach((stop, i) => {
    const offsets = [15, 30, 0, 40, 0, 25, 10];
    gradient.addColorStop(stop, adjustBrightness(base, offsets[i]));
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  drawNoiseTexture(ctx, w, h, 0.03);
  drawHolographicPattern(ctx, w, h, accent);
  drawCornerDecorations(ctx, w, h, accent);
  drawDashedBorder(ctx, w, h, accent);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(inst, w / 2, h / 2);
  ctx.shadowColor = "transparent";
  ctx.font = "14px system-ui, sans-serif";
  ctx.globalAlpha = 0.7;
  ctx.fillText("Scratch here!", w / 2, h / 2 + 28);
  ctx.restore();
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ScratchCardCanvas: React.FC<ScratchCardCanvasProps> = ({
  width = 384,
  height = 216,
  threshold = 50,
  brushRadius = 20,
  prize,
  onReveal,
  onScratchStart,
  onScratchProgress,
  overlayColor = "#C0C0C0",
  overlayImage,
  accentColor = "#FFD700",
  prizeBackgroundColor = "#1F2937",
  prizeTextColor = "#FFFFFF",
  instruction = "Scratch to reveal!",
  enableMetallic = true,
  enableSound = true,
  enableHaptic = true,
  enableParticles = true,
  isRevealed: externalRevealed,
  onCopyCode,
  codeCopied = false,
  showCodeOverlay = false,
  borderRadius = 12,
}) => {
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [particles, setParticles] = useState<ScratchParticle[]>([]);
  const [isNearThreshold, setIsNearThreshold] = useState(false);
  const [overlayImageLoaded, setOverlayImageLoaded] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScratchTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const overlayImageLoadedRef = useRef(false);

  const revealed = externalRevealed ?? isRevealed;

  // Load overlay image
  useEffect(() => {
    if (!overlayImage || overlayImageLoadedRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { setOverlayImageLoaded(img); overlayImageLoadedRef.current = true; };
    img.onerror = () => { overlayImageLoadedRef.current = true; };
    img.src = overlayImage;
    return () => { img.onload = null; img.onerror = null; };
  }, [overlayImage]);

  // Sound
  const playScratchSound = useCallback(() => {
    if (!enableSound || prefersReducedMotion()) return;
    const now = Date.now();
    if (now - lastScratchTimeRef.current < 50) return;
    lastScratchTimeRef.current = now;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch { /* Audio not supported */ }
  }, [enableSound]);

  // Haptic
  const triggerHaptic = useCallback(() => {
    if (!enableHaptic || prefersReducedMotion()) return;
    if ("vibrate" in navigator) navigator.vibrate(10);
  }, [enableHaptic]);

  // Particles
  const createParticle = useCallback((x: number, y: number): ScratchParticle => ({
    x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2,
    size: 2 + Math.random() * 4, opacity: 0.8,
    color: Math.random() > 0.5 ? overlayColor : accentColor, life: 1,
  }), [overlayColor, accentColor]);

  const updateParticles = useCallback(() => {
    setParticles(prev => prev.map(p => ({
      ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1,
      life: p.life - 0.02, opacity: p.life * 0.8,
    })).filter(p => p.life > 0));
  }, []);

  useEffect(() => {
    if (!enableParticles || particles.length === 0) return;
    const animate = () => { updateParticles(); animationFrameRef.current = requestAnimationFrame(animate); };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [enableParticles, particles.length, updateParticles]);

  // Scratch percentage calculation
  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, width, height);
    let transparent = 0;
    const total = imageData.data.length / 4;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    return (transparent / total) * 100;
  }, [width, height]);

  // Scratch logic
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    if (enableParticles && Math.random() > 0.7) setParticles(prev => [...prev, createParticle(x, y)]);
    playScratchSound();
    triggerHaptic();
    const percentage = calculateScratchPercentage();
    setScratchPercentage(percentage);
    onScratchProgress?.(percentage);
    if (percentage >= threshold * 0.8 && !isNearThreshold) setIsNearThreshold(true);
    if (percentage >= threshold && !revealed) { setIsRevealed(true); onReveal?.(); }
  }, [revealed, brushRadius, enableParticles, createParticle, playScratchSound, triggerHaptic, calculateScratchPercentage, onScratchProgress, threshold, isNearThreshold, onReveal]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width, scaleY = height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, [width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDrawingRef.current = true; setIsScratching(true); onScratchStart?.();
    const pos = getPos(e); scratch(pos.x, pos.y);
  }, [getPos, scratch, onScratchStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const pos = getPos(e); scratch(pos.x, pos.y);
  }, [getPos, scratch]);

  const handleMouseUp = useCallback(() => { isDrawingRef.current = false; setIsScratching(false); }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); isDrawingRef.current = true; setIsScratching(true); onScratchStart?.();
    const pos = getPos(e); scratch(pos.x, pos.y);
  }, [getPos, scratch, onScratchStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const pos = getPos(e); scratch(pos.x, pos.y);
  }, [getPos, scratch]);

  const handleTouchEnd = useCallback(() => { isDrawingRef.current = false; setIsScratching(false); }, []);

  // Canvas initialization
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current, prizeCanvas = prizeCanvasRef.current;
    if (!canvas || !prizeCanvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const prizeCtx = prizeCanvas.getContext("2d");
    if (!ctx || !prizeCtx) return;

    // Draw prize layer
    prizeCtx.fillStyle = prizeBackgroundColor;
    prizeCtx.fillRect(0, 0, width, height);
    prizeCtx.fillStyle = prizeTextColor;
    prizeCtx.font = "bold 32px system-ui, sans-serif";
    prizeCtx.textAlign = "center";
    prizeCtx.textBaseline = "middle";
    if (prize) {
      prizeCtx.fillText(prize.label || "You Won!", width / 2, height / 2 - 20);
      if (prize.discountCode) {
        prizeCtx.font = "bold 24px system-ui, sans-serif";
        prizeCtx.fillText(prize.discountCode, width / 2, height / 2 + 20);
      }
    } else {
      prizeCtx.fillText("Loading...", width / 2, height / 2);
    }

    // Draw overlay
    ctx.globalCompositeOperation = "source-over";
    if (overlayImageLoaded) {
      ctx.drawImage(overlayImageLoaded, 0, 0, width, height);
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.roundRect(width / 2 - 100, height / 2 - 18, 200, 36, 8); ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
      ctx.fillText(instruction, width / 2, height / 2);
      ctx.restore();
    } else if (enableMetallic) {
      drawMetallicOverlay(ctx, width, height, overlayColor, instruction, accentColor);
    } else {
      ctx.fillStyle = overlayColor; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF"; ctx.font = "600 22px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(instruction, width / 2, height / 2);
    }
    ctx.globalCompositeOperation = "destination-out";
  }, [width, height, prize, overlayImageLoaded, overlayColor, accentColor, prizeBackgroundColor, prizeTextColor, instruction, enableMetallic]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  return (
    <div
      className={`scratch-card-canvas-container ${revealed ? "revealed" : ""} ${isNearThreshold ? "near-threshold" : ""} ${isScratching ? "scratching" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        margin: "0 auto",
        borderRadius,
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      }}
    >
      <canvas ref={prizeCanvasRef} width={width} height={height}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }} />
      <canvas ref={canvasRef} width={width} height={height}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: isScratching ? "grabbing" : "grab", touchAction: "none", zIndex: 2 }} />
      {enableParticles && particles.length > 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
          {particles.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${(p.x / width) * 100}%`,
              top: `${(p.y / height) * 100}%`,
              width: p.size, height: p.size,
              backgroundColor: p.color, opacity: p.opacity,
              borderRadius: "50%", transform: "translate(-50%,-50%)",
              boxShadow: `0 0 ${p.size}px ${p.color}`,
            }} />
          ))}
        </div>
      )}
      {!revealed && scratchPercentage > 5 && (
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, zIndex: 4 }}>
          <div style={{ height: "100%", width: `${Math.min(100, (scratchPercentage / threshold) * 100)}%`, backgroundColor: accentColor, borderRadius: 2, transition: "width 0.2s" }} />
        </div>
      )}
      {revealed && prize?.discountCode && showCodeOverlay && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 6 }}>
          <DiscountCodeDisplay code={prize.discountCode} onCopy={onCopyCode} copied={codeCopied} label="🎉 Your Code:" variant="dashed" size="md"
            accentColor="#ffffff" textColor="#ffffff" backgroundColor="rgba(255,255,255,0.2)"
            style={{ backdropFilter: "blur(10px)", border: "2px dashed rgba(255,255,255,0.5)" }} />
        </div>
      )}
      <style>{`
        .scratch-card-canvas-container.revealed { animation: reveal-pulse 0.5s ease-out; }
        @keyframes reveal-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        .scratch-card-canvas-container.near-threshold { animation: threshold-glow 1s ease-in-out infinite; }
        @keyframes threshold-glow { 0%,100% { box-shadow: 0 10px 40px rgba(0,0,0,0.2); } 50% { box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 20px ${accentColor}40; } }
      `}</style>
    </div>
  );
};

export default ScratchCardCanvas;
