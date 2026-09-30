"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CloseIcon } from "./icons";

gsap.registerPlugin(useGSAP);

/**
 * Side panel width plus its gap from the edge; a stage beside the panel
 * shifts away by half of it so it stays centred in the space the panel leaves.
 */
export const BUILD_PANEL_SPACE = 312;

/** The build mode side panel: a draft's palette, a screen's copies, a component's args. */
export function BuildPanel({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(root.current, { x: -24, opacity: 0, filter: "blur(6px)", duration: 0.45, ease: "power3.out" });
    },
    { scope: root },
  );

  return (
    <aside
      ref={root}
      aria-label="Build"
      className="absolute bottom-4 left-4 top-[78px] z-30 flex w-[296px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[18px] bg-[var(--bar-bg)] shadow-[0_0_0_1px_var(--bar-ring),0_24px_60px_-24px_rgba(0,0,0,0.25)]"
    >
      {children}
    </aside>
  );
}

export function ClosePanelButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close build panel"
      title="Close  ·  Esc"
      onClick={onClose}
      className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
    >
      <CloseIcon />
    </button>
  );
}
