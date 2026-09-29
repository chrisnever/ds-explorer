"use client";

import { useMemo, useSyncExternalStore } from "react";

// Element-level review comments. Stored in this browser's localStorage for
// now: swap `read`/`write`/`subscribe` for a shared backend so a client and
// the team see the same threads.

export type ElementComment = {
  id: string;
  /** Registry slug of the component the comment is on. */
  slug: string;
  /** Story the component was showing, for components with stories. */
  storyId?: string;
  /** Child indices from the component's stage root down to the element. */
  path: number[];
  /** Where on the element the pin sits, as fractions of its width and height. */
  x: number;
  y: number;
  /** Human description of the element, e.g. `button “Done”`. */
  label: string;
  body: string;
  author: string;
  createdAt: number;
};

const KEY = "ds-explorer:comments";
const AUTHOR_KEY = "ds-explorer:author";
const EMPTY: ElementComment[] = [];

let cache: ElementComment[] | null = null;
const listeners = new Set<() => void>();

function read(): ElementComment[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as ElementComment[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: ElementComment[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the comments for this session at least.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Other tabs writing comments show up here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** A component's comments, oldest first. */
export function useComments(slug: string) {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return useMemo(() => all.filter((c) => c.slug === slug).sort((a, b) => a.createdAt - b.createdAt), [all, slug]);
}

export function addComment(comment: Omit<ElementComment, "id" | "createdAt">) {
  write([...read(), { ...comment, id: crypto.randomUUID(), createdAt: Date.now() }]);
}

export function removeComment(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function getAuthor() {
  try {
    return localStorage.getItem(AUTHOR_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAuthor(name: string) {
  try {
    localStorage.setItem(AUTHOR_KEY, name);
  } catch {}
}

/** Child-index path from `root` to `el`, or null if `el` isn't inside it. */
export function pathTo(root: Element, el: Element): number[] | null {
  const path: number[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.children, node));
    node = parent;
  }
  return node === root ? path : null;
}

/** The element at `path` under `root`, if the component still has one there. */
export function resolvePath(root: Element, path: number[]): Element | null {
  let node: Element | undefined = root;
  for (const i of path) {
    node = node?.children[i];
    if (!node) return null;
  }
  return node ?? null;
}

/** Short description of an element for the comment list. */
export function describe(el: Element): string {
  const kind =
    el.getAttribute("role") ??
    (el.className && typeof el.className === "string" && el.className.includes("css-text") ? "text" : null) ??
    el.tagName.toLowerCase();
  const text = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) return kind;
  return `${kind} “${text.length > 32 ? `${text.slice(0, 31)}…` : text}”`;
}

/** `just now`, `5m`, `3h`, `2d`, then a date. */
export function timeAgo(at: number, now = Date.now()) {
  const s = Math.round((now - at) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`;
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
