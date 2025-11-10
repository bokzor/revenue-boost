/**
 * SpinToWinPopup Component
 *
 * Lightweight, accessible spinning wheel popup that works in admin preview and storefront.
 * - SVG wheel with N slices
 * - Weighted outcome selection using config.prizes[].probability (falls back to even weights)
 * - Optional email capture before spin
 * - Motion-safe: respects prefers-reduced-motion
 * - Copy-to-clipboard for discount codes
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BasePopup, type PopupConfig } from "./BasePopup";
import type { LotteryTemplateConfig } from "~/lib/template-configs";

export interface SpinToWinConfig extends PopupConfig {
  templateType?: string;
  headline?: string;
  subheadline?: string;
  emailRequired?: boolean;
  emailPlaceholder?: string;
  spinButtonText?: string;
  successMessage?: string;
  failureMessage?: string; // Message to show when landing on "Try Again" or losing prize
  discountEnabled?: boolean;
  discountCode?: string;
  discountPercentage?: number;
  discountValue?: number;
  discountType?: "percentage" | "fixed" | "free_shipping";
  valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  deliveryMode?:
    | "show_code"
    | "send_email"
    | "show_code_fallback"
    | "show_in_popup_authorized_only";
  prizes?:
    | Array<{
        id?: string;
        label: string;
        probability?: number;
        discountCode?: string;
        discountPercentage?: number;
        discountValue?: number;
        discountType?: "percentage" | "fixed" | "free_shipping";
        valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
      }>
    | string[];
  wheelColors?: string[] | string; // Support both array and comma-separated string
  spinDuration?: number; // ms
}

export interface SpinToWinPopupProps {
  config: SpinToWinConfig;
  isVisible: boolean;
  onClose: () => void;
  campaignId?: string;
  renderInline?: boolean;
  onSpinComplete?: (data: {
    email?: string;
    prizeLabel: string;
    discountCode?: string;
  }) => Promise<void>;
}

export const SpinToWinPopup: React.FC<SpinToWinPopupProps> = ({
  config,
  isVisible,
  onClose,
  campaignId,
  renderInline = false,
  onSpinComplete,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [spun, setSpun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outcomeIndex, setOutcomeIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [localDiscountCode, setLocalDiscountCode] = useState<
    string | undefined
  >(undefined);
  const wheelRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const isEmailValid = useMemo(() => {
    if (!config.emailRequired) return true;
    return validateEmail(email);
  }, [config.emailRequired, email]);

  // Normalize prizes to objects
  const prizes = useMemo(() => {
    console.log("[SpinToWinPopup] Prizes config received:", {
      hasPrizes: !!config.prizes,
      isArray: Array.isArray(config.prizes),
      length: config.prizes?.length,
      prizesJSON: JSON.stringify(config.prizes),
      configKeys: Object.keys(config),
    });

    // Prizes should be provided from contentConfig, but provide minimal fallback for debugging
    if (
      !config.prizes ||
      !Array.isArray(config.prizes) ||
      config.prizes.length === 0
    ) {
      console.warn(
        "[SpinToWinPopup] No prizes provided in config! Using minimal fallback for debugging.",
      );
      console.warn("[SpinToWinPopup] Config keys:", Object.keys(config));
      console.warn("[SpinToWinPopup] Config.prizes:", config.prizes);

      // Minimal fallback to prevent component crash
      const fallback = [
        {
          id: "fallback",
          label: "Debug Prize",
          probability: 1,
          discountCode: "DEBUG10",
          discountPercentage: 10,
        },
      ];
      return fallback.map((p, idx) => ({
        id: p.id || String(idx),
        label: p.label || `Prize ${idx + 1}`,
        probability: 1,
        discountCode: p.discountCode,
        discountPercentage: p.discountPercentage,
      }));
    }

    // Type guard for prize objects
    type PrizeItem = string | {
      id?: string;
      label?: string;
      probability?: number;
      discountCode?: string;
      discountPercentage?: number;
    };

    const rawArr = (config.prizes || []) as PrizeItem[];

    console.log("[SpinToWinPopup] Using prizes from config:", {
      prizesCount: rawArr.length,
      firstPrize: rawArr[0],
    });
    const list: Array<{
      id: string;
      label: string;
      probability: number;
      discountCode?: string;
      discountPercentage?: number;
    }> = rawArr.map((p, idx: number) => {
      if (typeof p === "string") {
        return { id: String(idx), label: p, probability: 1 };
      }
      return {
        id: p.id || String(idx),
        label: p.label || `Prize ${idx + 1}`,
        probability: typeof p.probability === "number" ? p.probability : 1,
        discountCode: p.discountCode,
        discountPercentage: p.discountPercentage,
      };
    });
    // Avoid zero-sum
    const total =
      list.reduce((sum, p) => sum + (p.probability || 0), 0) ||
      list.length ||
      1;
    // Normalize to sum
    return list.map((p) => ({
      ...p,
      probability: (p.probability || 1) / total,
    }));
  }, [config.prizes]);

  // Derived values that depend on outcomeIndex and prizes
  // IMPORTANT: Declared early to avoid temporal dead zone issues in bundled code
  // Force rebuild: 2025-01-02 23:20
  const currentPrize = outcomeIndex != null ? prizes[outcomeIndex] : null;

  // A prize is a "winning" prize if it has an actual discount (code or percentage)
  // This is clean and unambiguous - no string parsing needed
  const isWinningPrize = useMemo(() => {
    if (!currentPrize) return false;

    // Has a discount code? → Winner
    if (currentPrize.discountCode) return true;

    // Has a discount percentage? → Winner
    if (currentPrize.discountPercentage && currentPrize.discountPercentage > 0)
      return true;

    // Has a discount value? → Winner
    const prizeWithValue = currentPrize as { discountValue?: number };
    if (prizeWithValue.discountValue && prizeWithValue.discountValue > 0)
      return true;

    // No discount data? → Losing prize (e.g., "Try Again")
    return false;
  }, [currentPrize]);

  // Determine the effective discount code for this prize
  const configWithCode = config as { discountCode?: string };
  const effectiveDiscountCode = (currentPrize?.discountCode ||
    localDiscountCode ||
    configWithCode.discountCode) as string | undefined;

  const sliceCount = Math.max(prizes.length, 1);
  const sliceAngle = 360 / sliceCount;

  const wheelColors = useMemo(() => {
    const defaults = [
      "#FF6B6B",
      "#FFD166",
      "#06D6A0",
      "#118AB2",
      "#8338EC",
      "#EF476F",
    ];

    // Handle both array and comma-separated string formats
    let src: string[] = defaults;
    if (config.wheelColors) {
      if (Array.isArray(config.wheelColors) && config.wheelColors.length > 0) {
        src = config.wheelColors;
      } else if (
        typeof config.wheelColors === "string" &&
        config.wheelColors.trim()
      ) {
        // Parse comma-separated string (backward compatibility)
        src = config.wheelColors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }
    }

    // Repeat to match slice count
    const arr: string[] = [];
    for (let i = 0; i < sliceCount; i++) arr.push(src[i % src.length]);
    return arr;
  }, [config.wheelColors, sliceCount]);

  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      // reset state when hidden, but preserve spin result if user has already spun
      setSpinning(false);
      // Don't reset spun state - let user see the result even if popup visibility changes
      // setSpun(false);
      // Don't reset outcome - preserve the result
      // setOutcomeIndex(null);
      setRotation(0);
      setCopied(false);
      setError("");
      setIsSubmitting(false);
      // Don't reset discount code if user has already won
      // setLocalDiscountCode(undefined);
      // Don't reset email if user has already entered it
      // setEmail("");
    } else {
      // view event when shown
      try {
        document.dispatchEvent(
          new CustomEvent("splitpop:spin2win:view", {
            detail: { campaignId },
          }),
        );
      } catch {
        // Ignore event dispatch errors
      }
    }
  }, [isVisible, campaignId]);

  // Simple canvas confetti burst (no external deps)
  const launchConfetti = () => {
    const container = celebrationRef.current;
    if (!container) return;
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    container.appendChild(canvas);

    const colors = [
      "#FFD166",
      "#06D6A0",
      "#118AB2",
      "#EF476F",
      "#FFA500",
      "#9B5DE5",
    ];
    const count = 80;
    const particles = Array.from({ length: count }).map(() => ({
      x: rect.width / 2,
      y: 0,
      r: 4 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 3,
      gravity: 0.1 + Math.random() * 0.15,
      life: 60 + Math.random() * 30,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
    }));

    let frame = 0;
    const anim = () => {
      frame++;
      ctx.clearRect(0, 0, rect.width, rect.height);
      particles.forEach((p) => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      });
      if (frame < 90) {
        requestAnimationFrame(anim);
      } else {
        container.removeChild(canvas);
      }
    };
    requestAnimationFrame(anim);
  };

  // After spin completes, celebrate and focus copy button (only for winning prizes)
  useEffect(() => {
    if (spun && isWinningPrize) {
      if (!prefersReducedMotion) {
        try {
          launchConfetti();
        } catch {
          // Ignore confetti errors
        }
      }
      // focus copy button if visible
      const t = setTimeout(() => {
        copyBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [spun, isWinningPrize, prefersReducedMotion]);

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  const pickWeightedIndex = (): number => {
    // prizes probabilities are normalized to sum 1
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < prizes.length; i++) {
      acc += prizes[i].probability;
      if (r <= acc) return i;
    }
    return prizes.length - 1;
  };

  const handleSpin = async () => {
    setError("");

    // Decide the outcome first so we can send prize metadata to backend
    const index = pickWeightedIndex();
    const prize = prizes[index];

    if (config.emailRequired) {
      if (!email || !validateEmail(email)) {
        setError("Please enter a valid email");
        return;
      }
      // Submit lead via app proxy before allowing spin
      if (!campaignId) {
        console.warn(
          "[SpinToWinPopup] Missing campaignId; proceeding without API call",
        );
      } else {
        try {
          setIsSubmitting(true);
          const sessionId =
            typeof window !== "undefined"
              ? window.sessionStorage?.getItem("split_pop_session_id") ||
                `session-${Date.now()}`
              : `session-${Date.now()}`;
          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.setItem("split_pop_session_id", sessionId);
            } catch {
              // Ignore sessionStorage errors
            }
          }
          const resp = await fetch("/apps/split-pop/commerce/leads/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              campaignId,
              consent: true,
              sessionId,
              pageUrl:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
              referrer:
                typeof window !== "undefined" ? document.referrer : undefined,
              metadata: {
                prize: {
                  id: prize.id,
                  label: prize.label,
                  // New discount type fields
                  discountType: (prize as { discountType?: string }).discountType,
                  discountValue: (prize as { discountValue?: number }).discountValue,
                  // Legacy fields for backward compatibility
                  discountCode: prize.discountCode,
                  discountPercentage: prize.discountPercentage,
                },
              },
            }),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err?.error || "Subscription failed");
          }
          const result = await resp.json();
          if (result?.discountCode) {
            setLocalDiscountCode(result.discountCode);
          }
        } catch (e) {
          console.error("[SpinToWinPopup] Lead subscribe failed", e);
          setError("Failed to subscribe. Please try again.");
          setIsSubmitting(false);
          return;
        } finally {
          setIsSubmitting(false);
        }
      }
    }
    if (spinning || spun) return;

    document.dispatchEvent(
      new CustomEvent("splitpop:spin2win:spin", {
        detail: { campaignId, emailProvided: !!email },
      }),
    );

    const configWithDuration = config as { spinDuration?: number };
    const spinDurationMs =
      typeof configWithDuration.spinDuration === "number"
        ? configWithDuration.spinDuration
        : 4500;
    const baseRotations = 4; // full spins before stopping

    // IMPORTANT: Wheel slices are rendered starting at -90° (top of wheel)
    // Slice 0 starts at -90°, Slice 1 at -90° + sliceAngle, etc.
    // The pointer is at the top (0° in screen coordinates, which is -90° in wheel coordinates)
    // To land on a slice, we need to rotate the wheel so that slice's center aligns with the pointer

    // Calculate the center angle of the target slice (in wheel coordinates, starting from -90°)
    const sliceCenterAngle = -90 + (index + 0.5) * sliceAngle;

    // Add slight randomness within the slice (±25% of slice width)
    const offsetWithinSlice = (Math.random() - 0.5) * sliceAngle * 0.5;

    // Calculate how much to rotate the wheel to align this slice with the pointer at top
    // We need to rotate CLOCKWISE (negative direction) to bring the slice to the top
    // The target rotation is the negative of the slice's angle
    const targetAngle = -sliceCenterAngle - offsetWithinSlice;

    // Normalize to 0-360 range and add base rotations for visual effect
    const normalizedTarget = ((targetAngle % 360) + 360) % 360;
    const finalRotation = baseRotations * 360 + normalizedTarget;

    console.log("[SpinToWin] 🎯 Spin calculation:", {
      index,
      sliceAngle,
      sliceCenterAngle,
      offsetWithinSlice,
      targetAngle,
      normalizedTarget,
      finalRotation,
      prizeLabel: prize.label,
    });

    setOutcomeIndex(index);

    if (prefersReducedMotion) {
      setRotation(finalRotation % 360);
      setSpun(true);
      if (onSpinComplete) {
        await onSpinComplete({
          email: config.emailRequired ? email : undefined,
          prizeLabel: prize.label,
          discountCode: localDiscountCode || prize.discountCode,
        });
      }
      document.dispatchEvent(
        new CustomEvent("splitpop:spin2win:win", {
          detail: {
            campaignId,
            prize: { id: prize.id, label: prize.label },
            code: localDiscountCode || prize.discountCode,
          },
        }),
      );
      document.dispatchEvent(
        new CustomEvent("splitpop:spin2win:win", {
          detail: {
            campaignId,
            prize: { id: prize.id, label: prize.label },
            code: localDiscountCode || prize.discountCode,
          },
        }),
      );
      return;
    }

    setSpinning(true);
    // Trigger CSS transition
    requestAnimationFrame(() => {
      setRotation(finalRotation);
    });

    // End of animation
    window.setTimeout(async () => {
      setSpinning(false);
      setSpun(true);
      if (onSpinComplete) {
        await onSpinComplete({
          email: config.emailRequired ? email : undefined,
          prizeLabel: prize.label,
          discountCode: localDiscountCode || prize.discountCode,
        });
      }
    }, spinDurationMs + 50);
  };

  const handleCopy = async () => {
    if (!effectiveDiscountCode) return;
    try {
      await navigator.clipboard.writeText(effectiveDiscountCode);
      setCopied(true);
      setCopyError(null);
      document.dispatchEvent(
        new CustomEvent("splitpop:spin2win:copy", {
          detail: { campaignId, code: effectiveDiscountCode },
        }),
      );
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopyError("Unable to copy. Long-press to copy manually.");
    }
  };

  const handleApply = async () => {
    if (!effectiveDiscountCode) return;
    await handleCopy();
    try {
      // If merchant provided a return path, prefer it
      const configWithReturn = config as { applyReturnTo?: string };
      const returnTo = configWithReturn.applyReturnTo || "/";
      const href = `/discount/${encodeURIComponent(effectiveDiscountCode)}?return_to=${encodeURIComponent(returnTo)}`;
      document.dispatchEvent(
        new CustomEvent("splitpop:spin2win:apply", {
          detail: { campaignId, code: effectiveDiscountCode, returnTo },
        }),
      );
      if (typeof window !== "undefined") window.location.href = href;
    } catch {
      // Ignore navigation errors
    }
  };

  // Render SVG wheel slices
  const renderWheelSVG = () => {
    const size = 320; // base size; SVG scales via viewBox
    const radius = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;

    const paths = [] as JSX.Element[];
    for (let i = 0; i < sliceCount; i++) {
      const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      const isWin = spun && outcomeIndex === i;
      const transform = isWin
        ? `translate(${cx}, ${cy}) scale(1.03) translate(-${cx}, -${cy})`
        : undefined;
      paths.push(
        <path
          key={i}
          d={d}
          fill={wheelColors[i]}
          stroke={isWin ? "#FFD700" : "#ffffff"}
          strokeWidth={isWin ? 3 : 2}
          style={
            isWin
              ? { filter: "drop-shadow(0 0 6px rgba(255,215,0,0.9))" }
              : undefined
          }
          transform={transform}
          className={isWin ? "spw-win-slice" : undefined}
          aria-current={isWin ? "true" : undefined}
        />,
      );
    }

    const labels = prizes.map((p, i) => {
      const angle = (i + 0.5) * sliceAngle - 90; // center of slice
      const rad = angle * (Math.PI / 180);
      const lx = cx + radius * 0.6 * Math.cos(rad);
      const ly = cy + radius * 0.6 * Math.sin(rad);
      return (
        <text
          key={`label-${i}`}
          x={lx}
          y={ly}
          fill="#fff"
          fontSize="12"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ pointerEvents: "none" }}
        >
          {p.label}
        </text>
      );
    });

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Spin wheel"
      >
        <g>
          {paths}
          {labels}
        </g>
        <title>Fortune wheel</title>
      </svg>
    );
  };

  const wheelStyle: React.CSSProperties = {
    // In preview mode, use fixed size to avoid viewport-based sizing issues
    // In storefront, use responsive sizing with viewport units
    width: config.previewMode ? "280px" : "min(80vw, 320px)",
    height: config.previewMode ? "280px" : "min(80vw, 320px)",
    borderRadius: "50%",
    willChange: "transform",
    transition: spinning
      ? `transform ${(typeof config.spinDuration === "number" ? config.spinDuration : 4500) / 1000}s cubic-bezier(0.15, 0.85, 0.3, 1)`
      : undefined,
    transform: `rotate(${rotation}deg)`,
  };

  // Disable overlay click when showing winning prize with discount code
  // Allow overlay click for losing prizes (Try Again)
  const popupConfig = {
    ...config,
    closeOnOverlayClick: !(spun && isWinningPrize && !!effectiveDiscountCode),
    showCloseButton: config.showCloseButton !== false,
  };

  return (
    <BasePopup
      config={popupConfig}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}}
      renderInline={renderInline}
    >
      {/* Component-scoped styles for animations and a11y helpers */}
      <style>
        {`
          /* Spin-to-win specific */
          .spw-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
          @keyframes spw-glow { 0%, 100% { filter: drop-shadow(0 0 2px rgba(255,215,0,0.5)); } 50% { filter: drop-shadow(0 0 10px rgba(255,215,0,0.95)); } }
          .spw-win-slice { animation: spw-glow 1.4s ease-in-out infinite; }
          @keyframes spw-pointer-pulse { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.1); } 100% { transform: translateX(-50%) scale(1); } }
        `}
      </style>
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎰</div>
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: config.textColor || "#1A1A1A",
            }}
          >
            {config.headline || "Spin to Win!"}
          </h2>
          {config.subheadline && (
            <p
              style={{ margin: "8px 0 0 0", color: config.textColor || "#666" }}
            >
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Discount code banner above the wheel */}
        {spun && effectiveDiscountCode && (
          <div
            role="group"
            aria-label="Your discount code"
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
              margin: "0 0 12px 0",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.06)",
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
              aria-live="polite"
            >
              {effectiveDiscountCode}
            </div>
            <button
              ref={copyBtnRef}
              onClick={handleCopy}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: config.buttonColor || "#007BFF",
                color: config.buttonTextColor || "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
              aria-label="Copy discount code to clipboard"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* Email before spin */}
        {config.emailRequired && !spun && (
          <div style={{ margin: "0 0 16px 0" }}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !spinning &&
                  !isSubmitting &&
                  isEmailValid
                ) {
                  handleSpin();
                }
              }}
              placeholder={config.emailPlaceholder || "your@email.com"}
              required
              aria-label="Email address"
              aria-describedby={error ? "spw-email-error" : undefined}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #E5E7EB",
                borderRadius: 6,
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
            {error && (
              <div
                id="spw-email-error"
                role="alert"
                style={{ color: "#EF4444", fontSize: 14, marginTop: 8 }}
              >
                {error}
              </div>
            )}
            <div style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
              By entering your email, you agree to receive occasional marketing
              emails.
            </div>
          </div>
        )}

        {/* Wheel area (kept visible after spin for clarity) */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 16,
          }}
          aria-live="polite"
        >
          {/* Pointer */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
              animation:
                spun && !prefersReducedMotion
                  ? "spw-pointer-pulse 1.2s ease-in-out infinite"
                  : undefined,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: `20px solid ${config.buttonColor || "#007BFF"}`,
              }}
            />
          </div>

          {/* Celebration overlay */}
          <div
            ref={celebrationRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 3,
            }}
          />

          <div ref={wheelRef} style={wheelStyle}>
            {renderWheelSVG()}
          </div>
        </div>

        {/* Spin Button */}
        {!spun && (
          <button
            onClick={handleSpin}
            disabled={spinning || isSubmitting || !isEmailValid}
            style={{
              padding: "12px 24px",
              minHeight: 44,
              backgroundColor: config.buttonColor || "#007BFF",
              color: config.buttonTextColor || "#FFFFFF",
              border: "none",
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              cursor:
                spinning || isSubmitting || !isEmailValid
                  ? "not-allowed"
                  : "pointer",
              width: "100%",
              maxWidth: 320,
              opacity: !isEmailValid ? 0.7 : 1,
            }}
            aria-disabled={spinning || isSubmitting || !isEmailValid}
            aria-label={
              spinning
                ? "Spinning"
                : isSubmitting
                  ? "Submitting"
                  : !isEmailValid
                    ? "Enter a valid email to enable spin"
                    : "Spin the wheel"
            }
          >
            {isSubmitting
              ? "Submitting..."
              : spinning
                ? "Spinning..."
                : config.spinButtonText || "Spin Now"}
          </button>
        )}

        {/* Result text */}
        {spun && currentPrize && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isWinningPrize
                ? config.successMessage || "Congratulations! 🎉"
                : config.failureMessage || "Better luck next time!"}
            </div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>
              {currentPrize.label}
            </div>
            {/* Optional expiry display when available (only for winning prizes) */}
            {isWinningPrize &&
              (() => {
                const prizeWithExpiry = currentPrize as {
                  expiresAt?: string | Date;
                  validUntil?: string | Date;
                  expiry?: string | Date
                };
                const raw =
                  prizeWithExpiry.expiresAt ||
                  prizeWithExpiry.validUntil ||
                  prizeWithExpiry.expiry;
                if (!raw) return null;
                const d = new Date(raw);
                if (isNaN(d.getTime())) return null;
                return (
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    Expires on {d.toLocaleDateString()} at{" "}
                    {d.toLocaleTimeString()}
                  </div>
                );
              })()}
            {/* Code actions if code exists below (banner is above wheel) - only for winning prizes */}
            {isWinningPrize && effectiveDiscountCode && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "10px 14px",
                    minHeight: 44,
                    borderRadius: 8,
                    border: "none",
                    background: config.buttonColor || "#007BFF",
                    color: config.buttonTextColor || "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  aria-label="Copy discount code to clipboard"
                >
                  {copied ? "✓ Copied" : "Copy Code"}
                </button>
                <button
                  onClick={handleApply}
                  style={{
                    padding: "10px 14px",
                    minHeight: 44,
                    borderRadius: 8,
                    border: "none",
                    background: "#10B981",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  aria-label="Apply discount and continue shopping"
                >
                  Apply & Shop
                </button>
              </div>
            )}
            {copyError && (
              <div
                role="alert"
                style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}
              >
                {copyError}
              </div>
            )}
          </div>
        )}

        {/* Live region for screen readers */}
        <div
          className="spw-visually-hidden"
          role="status"
          aria-live="assertive"
        >
          {spun && currentPrize
            ? isWinningPrize
              ? `You won ${currentPrize.label}! ${effectiveDiscountCode ? `Your code is ${effectiveDiscountCode}.` : ""}`
              : `${currentPrize.label}. Try spinning again next time!`
            : "Spin the wheel for a chance to win."}
        </div>
      </div>
    </BasePopup>
  );
};

export default SpinToWinPopup;
