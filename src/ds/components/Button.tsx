"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onPress?: () => void;
};

/** Full-width pill button with a springy press. */
export function Button({ children, variant = "primary", disabled, onPress }: ButtonProps) {
  const root = useRef<HTMLButtonElement>(null);
  const { contextSafe } = useGSAP({ scope: root });

  const down = contextSafe((el: HTMLElement) => gsap.to(el, { scale: 0.97, duration: 0.12 }));
  const up = contextSafe((el: HTMLElement) =>
    gsap.to(el, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }),
  );

  return (
    <button
      data-ds="button"
      ref={root}
      type="button"
      disabled={disabled}
      onPointerDown={(e) => down(e.currentTarget)}
      onPointerUp={(e) => up(e.currentTarget)}
      onPointerLeave={(e) => up(e.currentTarget)}
      onClick={onPress}
      className={[
        "h-[52px] w-full rounded-full text-[15px] font-semibold transition-[background-color,color,opacity]",
        variant === "primary"
          ? "bg-ink text-white disabled:bg-black/10 disabled:text-ink-3"
          : "bg-black/[0.05] text-ink disabled:opacity-40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
