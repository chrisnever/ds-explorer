"use client";

import { useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { components } from "./registry";

gsap.registerPlugin(useGSAP);

type Target = { slug: string; el: HTMLElement };

/**
 * Sits over the phone screen in inspect mode. It swallows pointer input so
 * the screen doesn't react, hit-tests what's underneath for the innermost
 * `[data-ds]` element, and outlines it. Clicking drills into that component.
 */
export function InspectOverlay({
  scroller,
  onSelect,
}: {
  scroller: RefObject<HTMLElement | null>;
  onSelect: (slug: string, rect: DOMRect) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useGSAP(
    () => {
      gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.from(".hint", { y: 8, opacity: 0, duration: 0.4, delay: 0.1, ease: "power3.out" });
    },
    { scope: root },
  );

  const hitTest = (x: number, y: number) => {
    last.current = { x, y };
    const overlay = root.current;
    if (!overlay) return;
    const under = document
      .elementsFromPoint(x, y)
      .find((el) => !overlay.contains(el) && scroller.current?.contains(el));
    const el = under?.closest<HTMLElement>("[data-ds]");
    const slug = el?.dataset.ds;
    if (!el || !slug || !components[slug]) return setTarget(null);
    if (el !== target?.el) setTarget({ slug, el });
    place(el);
  };

  const place = (el: HTMLElement) => {
    const overlay = root.current;
    if (!overlay) return;
    const o = overlay.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    gsap.to(overlay.querySelector(".box"), {
      x: r.left - o.left - 3,
      y: r.top - o.top - 3,
      width: r.width + 6,
      height: r.height + 6,
      opacity: 1,
      duration: 0.22,
      ease: "power3.out",
    });
  };

  return (
    <div
      ref={root}
      className="absolute inset-0 z-20 cursor-crosshair"
      onPointerMove={(e) => hitTest(e.clientX, e.clientY)}
      onPointerLeave={() => {
        setTarget(null);
        gsap.to(root.current!.querySelector(".box"), { opacity: 0, duration: 0.2 });
      }}
      onWheel={(e) => {
        scroller.current?.scrollBy({ top: e.deltaY });
        requestAnimationFrame(() => last.current && hitTest(last.current.x, last.current.y));
      }}
      onClick={() => target && onSelect(target.slug, target.el.getBoundingClientRect())}
    >
      <div className="absolute inset-0 bg-[rgba(40,90,255,0.035)]" />
      <div className="box pointer-events-none absolute left-0 top-0 rounded-[12px] opacity-0 shadow-[0_0_0_1.5px_#3b6cff,0_0_0_5px_rgba(59,108,255,0.14)]">
        {target && (
          <span className="absolute -top-[26px] left-0 whitespace-nowrap rounded-[7px] bg-[#3b6cff] px-2 py-[3px] font-mono text-[11px] font-medium text-white">
            {components[target.slug].name}
          </span>
        )}
      </div>
      <p className="hint pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-max rounded-full bg-black/75 px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur">
        Click a component to open it
      </p>
    </div>
  );
}
