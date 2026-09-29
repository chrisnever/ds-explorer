"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { describe, getAuthor, pathTo, resolvePath, setAuthor, type ElementComment } from "./comments";

type Draft = { path: number[]; x: number; y: number; label: string };
type Box = { left: number; top: number; width: number; height: number };
type Point = { left: number; top: number };

export type NewComment = Draft & { body: string; author: string };

const ACCENT = "#3b6cff";
const COMPOSER_WIDTH = 264;

/**
 * Sits over the component stage in comment mode. Hovering outlines the
 * element under the pointer; clicking drops a pin there and opens a composer.
 * Existing comments on the current story show as numbered pins.
 */
export function CommentLayer({
  content,
  comments,
  numbers,
  activeId,
  onActivate,
  onPost,
}: {
  /** The element the component renders into; comment paths start here. */
  content: RefObject<HTMLElement | null>;
  comments: ElementComment[];
  numbers: Map<string, number>;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  onPost: (comment: NewComment) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const hovered = useRef<Element | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState(getAuthor);
  const [needsName] = useState(() => !getAuthor());
  const [layout, setLayout] = useState<{
    hover: Box | null;
    active: Box | null;
    pins: Record<string, Point | null>;
    draft: Point | null;
    width: number;
  }>({ hover: null, active: null, pins: {}, draft: null, width: 0 });

  // Components animate and reflow, so follow their elements every frame and
  // only re-render when something actually moved.
  useEffect(() => {
    let last = "";
    const tick = () => {
      const layer = root.current?.getBoundingClientRect();
      const base = content.current;
      if (!layer || !base) return;
      const boxOf = (el: Element | null): Box | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left - layer.left, top: r.top - layer.top, width: r.width, height: r.height };
      };
      const pointOf = (path: number[], x: number, y: number): Point | null => {
        const box = boxOf(resolvePath(base, path));
        return box && { left: box.left + box.width * x, top: box.top + box.height * y };
      };
      const active = comments.find((c) => c.id === activeId);
      const next = {
        hover: boxOf(hovered.current),
        active: active ? boxOf(resolvePath(base, active.path)) : null,
        pins: Object.fromEntries(comments.map((c) => [c.id, pointOf(c.path, c.x, c.y)])),
        draft: draft && pointOf(draft.path, draft.x, draft.y),
        width: layer.width,
      };
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setLayout(next);
      }
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [content, comments, activeId, draft]);

  const hitTest = (x: number, y: number) => {
    const layer = root.current;
    const base = content.current;
    if (!layer || !base) return;
    const under = document.elementsFromPoint(x, y).find((el) => !layer.contains(el) && base.contains(el) && el !== base);
    // Comment on an icon, not the individual paths inside it.
    hovered.current = under?.closest("svg") ?? under ?? null;
  };

  const place = (e: React.MouseEvent) => {
    const el = hovered.current;
    const base = content.current;
    if (!el || !base) return;
    // Don't throw away a half-written comment on a stray click.
    if (body.trim()) return;
    const path = pathTo(base, el);
    if (!path) return;
    const r = el.getBoundingClientRect();
    setDraft({
      path,
      x: r.width ? (e.clientX - r.left) / r.width : 0.5,
      y: r.height ? (e.clientY - r.top) / r.height : 0.5,
      label: describe(el),
    });
    onActivate(null);
  };

  const cancel = () => {
    setDraft(null);
    setBody("");
  };

  const post = () => {
    const author = name.trim() || "Anonymous";
    if (!draft || !body.trim()) return;
    setAuthor(author);
    onPost({ ...draft, body: body.trim(), author });
    cancel();
  };

  // Open the composer away from the nearer edge.
  const flip = layout.draft ? layout.draft.left > layout.width / 2 : false;

  return (
    <div
      ref={root}
      className="absolute inset-0 z-20 cursor-crosshair"
      onPointerMove={(e) => hitTest(e.clientX, e.clientY)}
      onPointerLeave={() => (hovered.current = null)}
      onClick={place}
    >
      {layout.hover && !draft && <Outline box={layout.hover} />}
      {layout.active && <Outline box={layout.active} strong />}

      {comments.map((c) => {
        const at = layout.pins[c.id];
        if (!at) return null;
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            aria-label={`Comment ${numbers.get(c.id)} by ${c.author}`}
            onClick={(e) => {
              e.stopPropagation();
              onActivate(active ? null : c.id);
            }}
            className={`absolute grid size-[22px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[11px] font-semibold text-white shadow-[0_0_0_2px_#fff,0_4px_10px_rgba(0,0,0,0.25)] transition-transform ${
              active ? "scale-125" : "hover:scale-110"
            }`}
            style={{ left: at.left, top: at.top, background: ACCENT }}
          >
            {numbers.get(c.id)}
          </button>
        );
      })}

      {draft && layout.draft && (
        <>
          <span
            className="pointer-events-none absolute size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff,0_0_0_6px_rgba(59,108,255,0.25)]"
            style={{ left: layout.draft.left, top: layout.draft.top, background: ACCENT }}
          />
          <form
            onClick={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
            className="absolute z-10 flex cursor-auto flex-col gap-2 rounded-[14px] bg-[var(--bar-bg)] p-2.5 text-left shadow-[0_0_0_1px_var(--bar-ring),0_18px_40px_-12px_rgba(0,0,0,0.3)]"
            style={{
              width: COMPOSER_WIDTH,
              top: layout.draft.top - 10,
              left: flip ? layout.draft.left - COMPOSER_WIDTH - 14 : layout.draft.left + 14,
            }}
          >
            <span className="truncate px-1 font-mono text-[11px] text-[var(--bar-muted)]">{draft.label}</span>
            {needsName && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                className="rounded-[9px] bg-[var(--bar-thumb)] px-2.5 py-1.5 text-[13px] outline-none placeholder:text-[var(--bar-muted)]"
              />
            )}
            <textarea
              autoFocus
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post();
              }}
              placeholder="Leave a comment"
              aria-label="Comment"
              className="resize-none rounded-[9px] bg-[var(--bar-thumb)] px-2.5 py-2 text-[13px] leading-snug outline-none placeholder:text-[var(--bar-muted)]"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={cancel}
                className="rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--bar-muted)] hover:text-[var(--bar-fg)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!body.trim()}
                className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: ACCENT }}
              >
                Post
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function Outline({ box, strong }: { box: Box; strong?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-[6px] ${
        strong
          ? "bg-[rgba(59,108,255,0.08)] shadow-[0_0_0_1.5px_#3b6cff,0_0_0_5px_rgba(59,108,255,0.14)]"
          : "shadow-[0_0_0_1.5px_#3b6cff]"
      }`}
      style={{ left: box.left - 2, top: box.top - 2, width: box.width + 4, height: box.height + 4 }}
    />
  );
}
