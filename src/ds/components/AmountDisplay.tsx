"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type AmountDisplayProps = {
  /** Raw typed value, e.g. "120.5". Empty renders as 0. */
  value: string;
  currency?: string;
  caption?: string;
  /** Increment to trigger the rejection shake. */
  shakeKey?: number;
};

/**
 * Big entry amount. Each new digit springs up from below and the whole
 * figure scales down as it gets longer so it never wraps.
 */
export function AmountDisplay({ value, currency = "$", caption, shakeKey = 0 }: AmountDisplayProps) {
  const root = useRef<HTMLDivElement>(null);
  const prev = useRef(value);
  const chars = (value || "0").split("");
  const scale = Math.min(1, 6 / Math.max(chars.length, 1));

  useGSAP(
    () => {
      const grew = value.length > prev.current.length;
      prev.current = value;
      gsap.to(".figure", { scale, duration: 0.35, ease: "power3.out" });
      if (grew) {
        gsap.fromTo(
          ".char:last-child",
          { yPercent: 60, opacity: 0, scale: 0.6 },
          { yPercent: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)" },
        );
      }
    },
    { scope: root, dependencies: [value], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      if (!shakeKey) return;
      gsap.fromTo(
        ".figure",
        { x: 0 },
        { keyframes: { x: [0, -10, 9, -6, 4, -2, 0] }, duration: 0.45, ease: "power1.out" },
      );
    },
    { scope: root, dependencies: [shakeKey], revertOnUpdate: false },
  );

  return (
    <div data-ds="amount-display" ref={root} className="flex flex-col items-center py-6">
      <div className="figure flex items-start text-ink" style={{ transform: `scale(${scale})` }}>
        <span className="mr-1 mt-2 text-[28px] font-medium text-ink-3">{currency}</span>
        <span className="flex text-[64px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          {chars.map((c, i) => (
            <span key={`${i}-${c}`} className="char inline-block">
              {c}
            </span>
          ))}
        </span>
      </div>
      {caption && <span className="mt-3 text-[13px] text-ink-3">{caption}</span>}
    </div>
  );
}
