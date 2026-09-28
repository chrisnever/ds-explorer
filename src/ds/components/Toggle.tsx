"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

/**
 * Switch with a knob that stretches while it travels, then settles.
 */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  const root = useRef<HTMLButtonElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const instant = first.current;
      first.current = false;
      const d = instant ? 0 : 1;
      gsap.to(root.current, {
        backgroundColor: checked ? "#34c759" : "rgba(0,0,0,0.09)",
        duration: 0.25 * d,
      });
      gsap
        .timeline()
        .to(".knob", { width: 24, duration: 0.12 * d, ease: "power2.out" })
        .to(".knob", { x: checked ? 16 : 0, duration: 0.32 * d, ease: "back.out(1.6)" }, 0)
        .to(".knob", { width: 20, duration: 0.2 * d, ease: "power2.out" }, 0.14 * d);
    },
    { scope: root, dependencies: [checked], revertOnUpdate: false },
  );

  return (
    <button
      data-ds="toggle"
      ref={root}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-10 shrink-0 rounded-full bg-black/[0.09] p-0.5"
    >
      <span
        className="knob block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.04)]"
        style={checked ? { transform: "translateX(16px)" } : undefined}
      />
    </button>
  );
}
