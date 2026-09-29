"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { removeComment, timeAgo, type ElementComment } from "./comments";
import { CloseIcon } from "./icons";
import type { Story } from "./stories";

gsap.registerPlugin(useGSAP);

/** Right-hand list of a component's comments while in comment mode. */
export function CommentsPanel({
  comments,
  numbers,
  stories,
  storyId,
  activeId,
  onActivate,
  onSelectStory,
  onClose,
}: {
  comments: ElementComment[];
  numbers: Map<string, number>;
  stories?: Story[];
  storyId?: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  onSelectStory: (id: string) => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(root.current, { x: 24, opacity: 0, filter: "blur(6px)", duration: 0.45, ease: "power3.out" });
    },
    { scope: root },
  );

  // Clicking a pin brings its comment into view.
  useEffect(() => {
    if (!activeId) return;
    root.current?.querySelector(`[data-comment="${activeId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const storyName = (id?: string) => stories?.find((s) => s.id === id)?.name;

  return (
    <aside
      ref={root}
      aria-label="Comments"
      className="absolute bottom-4 right-4 top-[78px] z-30 flex w-[340px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[18px] bg-[var(--bar-bg)] shadow-[0_0_0_1px_var(--bar-ring),0_24px_60px_-24px_rgba(0,0,0,0.25)]"
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--bar-ring)] pl-4 pr-1.5">
        <h2 className="text-[13.5px] font-semibold">Comments</h2>
        <span className="text-[12.5px] text-[var(--bar-muted)]">{comments.length}</span>
        <button
          type="button"
          aria-label="Close comments"
          title="Close  ·  Esc"
          onClick={onClose}
          className="ml-auto grid size-8 place-items-center rounded-[9px] text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
        >
          <CloseIcon />
        </button>
      </header>

      {comments.length === 0 ? (
        <p className="m-auto max-w-[220px] text-center text-[13px] leading-relaxed text-[var(--bar-muted)]">
          Click anything in the component to leave a comment on it.
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {comments.map((c) => {
            const story = storyName(c.storyId);
            const elsewhere = c.storyId !== storyId;
            return (
              <li
                key={c.id}
                data-comment={c.id}
                onPointerEnter={() => onActivate(c.id)}
                onPointerLeave={() => onActivate(null)}
                onClick={() => {
                  if (elsewhere && c.storyId) onSelectStory(c.storyId);
                  onActivate(c.id);
                }}
                className={`group relative cursor-pointer rounded-[12px] px-3 py-2.5 transition-colors ${
                  c.id === activeId ? "bg-[var(--bar-thumb)]" : "hover:bg-[var(--bar-thumb)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-[20px] shrink-0 place-items-center rounded-full bg-[#3b6cff] text-[10.5px] font-semibold text-white">
                    {numbers.get(c.id)}
                  </span>
                  <span className="truncate text-[13px] font-semibold">{c.author}</span>
                  <span className="shrink-0 text-[12px] text-[var(--bar-muted)]">{timeAgo(c.createdAt)}</span>
                  <button
                    type="button"
                    aria-label="Delete comment"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComment(c.id);
                    }}
                    className="ml-auto shrink-0 rounded-[7px] px-1.5 py-0.5 text-[11.5px] text-[var(--bar-muted)] opacity-0 transition-opacity hover:text-[var(--bar-fg)] focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-snug">{c.body}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-[var(--bar-muted)]">
                  <span className="truncate">{c.label}</span>
                  {story && <span className={elsewhere ? "text-[#3b6cff]" : undefined}>· {story}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
