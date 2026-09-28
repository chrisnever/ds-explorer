"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "../icons";

gsap.registerPlugin(useGSAP);

type CopyRowProps = {
  label: string;
  value: string;
  /** Masks the value until the eye toggle next to the label is pressed. */
  secret?: boolean;
};

/**
 * Label / value pair with a copy button. The icon swaps to a check
 * for 1.5s on copy. Secret values are masked until revealed.
 */
export function CopyRow({ label, value, secret = false }: CopyRowProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const { contextSafe } = useGSAP({ scope: root });

  // Icon swap: the outgoing icon shrinks away, the incoming one pops in.
  useGSAP(
    () => {
      gsap.fromTo(
        copied ? ".icon-check" : ".icon-copy",
        { scale: 0.4, opacity: 0, rotate: copied ? -30 : 0 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.35, ease: "back.out(2.2)" },
      );
    },
    { scope: root, dependencies: [copied], revertOnUpdate: false },
  );

  const toggleReveal = contextSafe(() => {
    gsap.to(".value", {
      opacity: 0,
      y: -4,
      filter: "blur(3px)",
      duration: 0.14,
      ease: "power2.in",
      onComplete: () => {
        setRevealed((r) => !r);
        gsap.fromTo(
          ".value",
          { opacity: 0, y: 4, filter: "blur(3px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.24, ease: "power2.out" },
        );
      },
    });
  });

  return (
    <div data-ds="copy-row" ref={root} className="flex h-[46px] items-center gap-2">
      <span className="text-[13px] text-ink-2">{label}</span>
      {secret && (
        <button
          type="button"
          aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          onClick={toggleReveal}
          className="grid size-5 place-items-center text-ink-3 hover:text-ink"
        >
          {revealed ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
        </button>
      )}
      <span className="value ml-auto text-[13.5px] font-semibold tabular-nums tracking-[0.01em] text-ink">
        {revealed ? value : "•".repeat(Math.max(value.length, 10))}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy ${label}`}
        className="-mr-1 grid size-7 place-items-center rounded-lg text-ink hover:bg-black/5"
      >
        {copied ? (
          <CheckIcon className="icon-check text-accent" size={15} />
        ) : (
          <CopyIcon className="icon-copy" size={15} />
        )}
      </button>
    </div>
  );
}
