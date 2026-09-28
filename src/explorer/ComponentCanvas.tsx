"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";
import gsap from "gsap";
import { demoFor } from "./renderers";
import { components, screens } from "./registry";

const TILE_W = 320;
const TILE_H = 240;
// Component previews render at the component stage's inner width, scaled down.
const STAGE_WIDTH = 366;
const COMPONENT_SCALE = 0.7;
// Clears the floating top bar on first load; after that the canvas is endless.
const START_Y = 78;
const DRAG_THRESHOLD = 4;
// Momentum left after each 60fps frame once a drag is let go.
const FRICTION = 0.94;

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Where the canvas was left, so drilling into a tile and coming back returns
// to the same spot. Module scope survives client-side navigation.
let lastOffset = { x: 0, y: START_Y };

/**
 * An endless, pannable plane of component tiles. The components are laid out
 * as one block that repeats in every direction. Only enough tiles to cover the
 * viewport are rendered; as the plane moves, tiles that leave one edge wrap to
 * the opposite one. The pool is a whole number of blocks wide and tall, so a
 * tile shows the same component wherever it wraps to and never remounts.
 */
export function ComponentCanvas({ onOpen }: { onOpen: (slug: string, tile: HTMLElement) => void }) {
  const items = useMemo(() => Object.values(components), []);
  const cols = Math.ceil(Math.sqrt(items.length * 2));
  const rows = Math.ceil(items.length / cols);

  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const offset = useRef({ ...lastOffset });
  const velocity = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);
  const [pool, setPool] = useState({ cols, rows });

  // Size the pool to cover the viewport plus one tile, in whole blocks.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () =>
      setPool({
        cols: cols * Math.ceil((el.clientWidth / TILE_W + 1) / cols),
        rows: rows * Math.ceil((el.clientHeight / TILE_H + 1) / rows),
      });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows]);

  const width = pool.cols * TILE_W;
  const height = pool.rows * TILE_H;

  const place = () => {
    const { x, y } = offset.current;
    cells.current.forEach((cell, i) => {
      if (!cell) return;
      const cx = mod((i % pool.cols) * TILE_W + x + TILE_W, width) - TILE_W;
      const cy = mod(Math.floor(i / pool.cols) * TILE_H + y + TILE_H, height) - TILE_H;
      cell.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    });
  };
  const placeRef = useRef(place);
  useLayoutEffect(() => {
    placeRef.current = place;
    place();
  });

  // Momentum after a drag, applied on GSAP's ticker alongside everything else.
  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      const v = velocity.current;
      if (Math.abs(v.x) < 0.05 && Math.abs(v.y) < 0.05) return;
      const frames = deltaMs / (1000 / 60);
      offset.current.x += v.x * frames;
      offset.current.y += v.y * frames;
      const decay = FRICTION ** frames;
      v.x *= decay;
      v.y *= decay;
      placeRef.current();
    };
    gsap.ticker.add(tick);
    const current = offset.current;
    return () => {
      gsap.ticker.remove(tick);
      gsap.killTweensOf(current);
      lastOffset = { x: current.x, y: current.y };
    };
  }, []);

  const panBy = (dx: number, dy: number, animate = false) => {
    gsap.killTweensOf(offset.current);
    velocity.current = { x: 0, y: 0 };
    const to = { x: offset.current.x + dx, y: offset.current.y + dy };
    if (animate) {
      gsap.to(offset.current, { ...to, duration: 0.5, ease: "power3.out", onUpdate: () => placeRef.current() });
    } else {
      Object.assign(offset.current, to);
      placeRef.current();
    }
  };

  // Wheel and trackpad scrolling pan both ways. Listening natively so the
  // default (page scroll, swipe-to-go-back) can be cancelled.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      // Shift+wheel on a mouse scrolls sideways, as it does everywhere else.
      const [dx, dy] = e.shiftKey && !e.deltaX ? [e.deltaY, 0] : [e.deltaX, e.deltaY];
      panBy(-dx * unit, -dy * unit);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = { ArrowLeft: [TILE_W, 0], ArrowRight: [-TILE_W, 0], ArrowUp: [0, TILE_H], ArrowDown: [0, -TILE_H] }[e.key];
      if (!step) return;
      e.preventDefault();
      panBy(step[0], step[1], true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const drag = useRef<{ id: number; x: number; y: number; t: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    gsap.killTweensOf(offset.current);
    velocity.current = { x: 0, y: 0 };
    dragged.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      // Past the threshold it's a pan, not a click on the tile underneath.
      d.moved = dragged.current = true;
      root.current?.setPointerCapture(e.pointerId);
    }
    const frames = Math.max(e.timeStamp - d.t, 1) / (1000 / 60);
    velocity.current = { x: dx / frames, y: dy / frames };
    Object.assign(d, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    offset.current.x += dx;
    offset.current.y += dy;
    placeRef.current();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    // A pause before letting go means no fling.
    if (!d.moved || e.timeStamp - d.t > 80) velocity.current = { x: 0, y: 0 };
  };

  // Tabbing to a tile that's off screen pans it into view.
  const reveal = (tile: HTMLElement) => {
    const el = root.current;
    if (!el) return;
    const r = tile.getBoundingClientRect();
    const view = el.getBoundingClientRect();
    const top = view.top + START_Y;
    const dx = r.left < view.left ? view.left - r.left : r.right > view.right ? view.right - r.right : 0;
    const dy = r.top < top ? top - r.top : r.bottom > view.bottom ? view.bottom - r.bottom : 0;
    if (dx || dy) panBy(dx, dy, true);
  };

  return (
    <div
      ref={root}
      className="relative h-dvh cursor-grab touch-none select-none overflow-clip bg-surface active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {Array.from({ length: pool.cols * pool.rows }, (_, i) => {
        const col = i % pool.cols;
        const row = Math.floor(i / pool.cols);
        const c = items[((row % rows) * cols + (col % cols)) % items.length];
        // Only the first copy of each component is in the tab order and
        // accessibility tree; the repeats are decoration.
        const isOriginal = col < cols && row < rows && row * cols + col < items.length;
        return (
          <div
            key={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: TILE_W, height: TILE_H }}
          >
            <Tile
              slug={c.slug}
              Demo={demoFor(c.slug)}
              name={c.name}
              original={isOriginal}
              onOpen={(el) => !dragged.current && onOpen(c.slug, el)}
              onFocus={reveal}
            />
          </div>
        );
      })}
    </div>
  );
}

function Tile({
  slug,
  Demo,
  name,
  original,
  onOpen,
  onFocus,
}: {
  slug: string;
  Demo: ComponentType | undefined;
  name: string;
  original: boolean;
  onOpen: (el: HTMLElement) => void;
  onFocus: (el: HTMLElement) => void;
}) {
  const usedIn = screens.filter((s) => s.components.includes(slug)).map((s) => s.title);
  return (
    <div
      role="link"
      tabIndex={original ? 0 : -1}
      aria-hidden={!original || undefined}
      aria-label={name}
      onClick={(e) => onOpen(e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(e.currentTarget)}
      onFocus={(e) => onFocus(e.currentTarget)}
      className="card group relative size-full overflow-hidden bg-surface shadow-[inset_-1px_-1px_0_0_rgba(0,0,0,0.07)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--bar-fg)]"
    >
      {/* Fades demos taller than the tile out at its edges. */}
      <div className="absolute inset-0 grid place-items-center transition-transform duration-500 ease-out [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)] group-hover:scale-[1.03] group-focus-visible:scale-[1.03]">
        <div
          inert
          className="pointer-events-none shrink-0"
          style={{ width: STAGE_WIDTH, transform: `scale(${COMPONENT_SCALE})` }}
        >
          {Demo && <Demo />}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-px left-0 right-px translate-y-1 bg-linear-to-t from-surface via-surface/90 to-transparent px-4 pb-3.5 pt-10 opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
        <div className="font-mono text-[13px] font-medium text-ink">{`<${name} />`}</div>
        <div className="mt-0.5 truncate text-[12px] text-ink-2">{usedIn.join(", ")}</div>
      </div>
    </div>
  );
}
