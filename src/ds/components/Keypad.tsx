"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BackspaceIcon } from "../icons";

gsap.registerPlugin(useGSAP);

export type KeypadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "back";

const KEYS: KeypadKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/** Numeric entry pad. Keys dip and flash a soft disc on press. */
export function Keypad({ onKey }: { onKey: (key: KeypadKey) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: root });

  const press = contextSafe((el: HTMLElement) => {
    const disc = el.querySelector(".disc");
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
    gsap.fromTo(disc, { scale: 0.5, opacity: 1 }, { scale: 1.15, opacity: 0, duration: 0.5, ease: "power2.out" });
  });

  return (
    <div data-ds="keypad" ref={root} className="grid grid-cols-3 gap-y-1 px-2">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          aria-label={k === "back" ? "Delete" : k}
          onPointerDown={(e) => press(e.currentTarget)}
          onClick={() => onKey(k)}
          className="relative grid h-[56px] place-items-center text-[26px] font-medium text-ink"
        >
          <span className="disc pointer-events-none absolute size-14 rounded-full bg-black/[0.07] opacity-0" />
          {k === "back" ? <BackspaceIcon size={24} strokeWidth={1.3} /> : k}
        </button>
      ))}
    </div>
  );
}
