"use client";

import { useSyncExternalStore } from "react";
import type { Args } from "./blocks";

// Screens people compose in the builder from registry components. Stored in
// this browser's localStorage, like comments: swap `read`/`write`/`subscribe`
// for a shared backend to share layouts with the team.

export type Block = {
  id: string;
  /** Registry slug of the component this block renders. */
  slug: string;
  /** The component's story to render; its first when unset. */
  story?: string;
  /** Args edited in build mode, by template field; the rest keep their defaults. */
  args?: Args;
};

export type Draft = {
  id: string;
  title: string;
  /** Top to bottom. */
  blocks: Block[];
  /** Slug of the coded screen this draft was copied from, if any. */
  source?: string;
  createdAt: number;
  updatedAt: number;
};

const KEY = "ds-explorer:drafts";
const EMPTY: Draft[] = [];

let cache: Draft[] | null = null;
const listeners = new Set<() => void>();

// Blocks saved before build mode edited more than text kept it under `text`.
type Stored = Omit<Draft, "blocks"> & { blocks: (Block & { text?: Args })[] };
const migrate = (d: Stored): Draft => ({
  ...d,
  blocks: d.blocks.map(({ text, ...b }) => (text && !b.args ? { ...b, args: text } : b)),
});

function read(): Draft[] {
  if (cache) return cache;
  try {
    cache = (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Stored[]).map(migrate);
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Draft[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the layouts for this session at least.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Edits from other tabs show up here too.
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

/** Every draft, oldest first. */
export function useDrafts() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useDraft(id: string | null) {
  return useDrafts().find((d) => d.id === id);
}

export const draftHref = (id: string) => `/draft?id=${id}`;

export function createDraft(init?: Partial<Pick<Draft, "title" | "blocks" | "source">>): Draft {
  const now = Date.now();
  const all = read();
  const draft: Draft = {
    id: crypto.randomUUID(),
    title: `Untitled screen ${all.length + 1}`,
    blocks: [],
    ...init,
    createdAt: now,
    updatedAt: now,
  };
  write([...all, draft]);
  return draft;
}

export function updateDraft(id: string, patch: Partial<Pick<Draft, "title" | "blocks">>) {
  write(read().map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
}

export function deleteDraft(id: string) {
  write(read().filter((d) => d.id !== id));
}

export const newBlock = (slug: string, story?: string): Block => ({ id: crypto.randomUUID(), slug, story });
