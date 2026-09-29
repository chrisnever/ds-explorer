"use client";

import { Fragment, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Crumb } from "./registry";
import { BackIcon, CodeIcon, CommentIcon, InspectIcon, InteractIcon } from "./icons";
import { useShell, type Browse, type Mode } from "./Shell";

gsap.registerPlugin(useGSAP);

const MODES: { mode: Mode; label: string; key: string; Icon: typeof CodeIcon }[] = [
  { mode: "preview", label: "Interact", key: "1", Icon: InteractIcon },
  { mode: "inspect", label: "Inspect components", key: "2", Icon: InspectIcon },
  { mode: "code", label: "View code", key: "3", Icon: CodeIcon },
];

const BROWSE: { value: Browse; label: string }[] = [
  { value: "screens", label: "Screens" },
  { value: "components", label: "Components" },
];

type TopBarProps = { crumbs: Crumb[]; mode: Mode; showModes: boolean; showComment: boolean; showBrowse: boolean };

export function TopBar({ crumbs, mode, showModes, showComment, showBrowse }: TopBarProps) {
  const { setMode, browse, setBrowse, navigate } = useShell();
  const root = useRef<HTMLElement>(null);
  const trail = crumbs.map((c) => c.label).join("/");
  const back = crumbs.at(-2);

  // Newest crumb slides in; the back chevron appears once there's somewhere to go.
  useGSAP(
    () => {
      gsap.fromTo(
        ".crumb-current",
        { opacity: 0, x: 10, filter: "blur(4px)" },
        { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" },
      );
      gsap.to(".back", {
        width: back ? 28 : 0,
        marginRight: back ? 4 : 0,
        opacity: back ? 1 : 0,
        duration: 0.4,
        ease: "power3.inOut",
      });
    },
    { scope: root, dependencies: [trail], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      gsap.to(".modes", {
        autoAlpha: showModes ? 1 : 0,
        scale: showModes ? 1 : 0.9,
        duration: 0.35,
        ease: showModes ? "back.out(2)" : "power2.in",
      });
    },
    { scope: root, dependencies: [showModes], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      const active = root.current?.querySelector<HTMLElement>(`[data-mode="${mode}"]`);
      if (active) gsap.to(".mode-thumb", { x: active.offsetLeft, duration: 0.4, ease: "power3.out" });
    },
    { scope: root, dependencies: [mode, showComment], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      gsap.to(".browse", {
        autoAlpha: showBrowse ? 1 : 0,
        scale: showBrowse ? 1 : 0.9,
        duration: 0.35,
        ease: showBrowse ? "back.out(2)" : "power2.in",
      });
    },
    { scope: root, dependencies: [showBrowse], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      const active = root.current?.querySelector<HTMLElement>(`[data-browse="${browse}"]`);
      if (active) {
        gsap.to(".browse-thumb", {
          x: active.offsetLeft,
          width: active.offsetWidth,
          duration: 0.4,
          ease: "power3.out",
        });
      }
    },
    { scope: root, dependencies: [browse], revertOnUpdate: false },
  );

  return (
    <header
      ref={root}
      className="fixed inset-x-0 top-4 z-50 mx-auto flex h-[46px] w-[calc(100%-32px)] max-w-[720px] items-center rounded-[14px] bg-[var(--bar-bg)] pl-2 pr-1.5 shadow-[0_0_0_1px_var(--bar-ring),0_10px_30px_-12px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        aria-label={back ? `Back to ${back.label}` : undefined}
        tabIndex={back ? 0 : -1}
        onClick={() => back && navigate(back.href)}
        className="back grid h-7 w-0 shrink-0 place-items-center overflow-hidden rounded-lg text-[var(--bar-fg)] opacity-0 hover:bg-[var(--bar-thumb)]"
      >
        <BackIcon />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 pl-1 text-[13px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={c.href}>
              {i > 0 && <span className="text-[var(--bar-muted)] opacity-60">/</span>}
              {last ? (
                <span aria-current="page" className="crumb-current truncate font-semibold">
                  {c.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(c.href)}
                  className="shrink-0 truncate text-[var(--bar-muted)] transition-colors hover:text-[var(--bar-fg)]"
                >
                  {c.label}
                </button>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="relative ml-auto flex shrink-0 justify-end">
        <div
          role="group"
          aria-label="Browse by"
          className="browse invisible absolute right-0 top-0 flex gap-0.5 opacity-0"
        >
          <span className="browse-thumb absolute left-0 top-0 h-8 rounded-[9px] bg-[var(--bar-thumb)]" />
          {BROWSE.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              data-browse={value}
              aria-pressed={browse === value}
              onClick={() => setBrowse(value)}
              className={`relative h-8 rounded-[9px] px-3 text-[13px] font-medium transition-colors ${
                browse === value ? "text-[var(--bar-fg)]" : "text-[var(--bar-muted)] hover:text-[var(--bar-fg)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="modes invisible relative flex shrink-0 gap-0.5 opacity-0">
          <span className="mode-thumb absolute left-0 top-0 size-8 rounded-[9px] bg-[var(--bar-thumb)]" />
          {MODES.map(({ mode: m, label, key, Icon }) => (
            <button
              key={m}
              type="button"
              data-mode={m}
              aria-label={label}
              aria-pressed={mode === m}
              title={`${label}  ·  ${key}`}
              onClick={() => setMode(m === mode && m !== "preview" ? "preview" : m)}
              className={`relative grid size-8 place-items-center rounded-[9px] transition-colors ${
                mode === m ? "text-[var(--bar-fg)]" : "text-[var(--bar-muted)] hover:text-[var(--bar-fg)]"
              }`}
            >
              <Icon />
            </button>
          ))}
          {showComment && (
            <>
              <span aria-hidden className="mx-1 my-1.5 w-px bg-[var(--bar-ring)]" />
              <button
                type="button"
                data-mode="comment"
                aria-label="Comments"
                aria-pressed={mode === "comment"}
                title="Comments  ·  4"
                onClick={() => setMode(mode === "comment" ? "preview" : "comment")}
                className={`relative grid size-8 place-items-center rounded-[9px] transition-colors ${
                  mode === "comment" ? "text-[var(--bar-fg)]" : "text-[var(--bar-muted)] hover:text-[var(--bar-fg)]"
                }`}
              >
                <CommentIcon />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
