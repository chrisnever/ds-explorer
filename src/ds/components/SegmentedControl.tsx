"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Pill switcher with a thumb that glides to the active option. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useGSAP(
    () => {
      const active = root.current?.querySelector<HTMLElement>(`[data-value="${value}"]`);
      if (!active) return;
      gsap.to(".thumb", {
        x: active.offsetLeft,
        width: active.offsetWidth,
        duration: mounted.current ? 0.45 : 0,
        ease: "power3.out",
      });
      mounted.current = true;
    },
    { scope: root, dependencies: [value], revertOnUpdate: false },
  );

  return (
    <div
      data-ds="segmented-control"
      ref={root}
      role="tablist"
      className="relative flex rounded-[12px] bg-black/[0.05] p-[3px]"
    >
      <span className="thumb absolute left-0 top-[3px] h-[calc(100%-6px)] rounded-[9px] bg-panel shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.08)]" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          data-value={o.value}
          onClick={() => onChange(o.value)}
          className={`relative flex-1 rounded-[9px] py-[7px] text-[13px] font-medium transition-colors ${
            o.value === value ? "text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
