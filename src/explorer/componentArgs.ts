"use client";

import { useSyncExternalStore } from "react";
import type { Args } from "./blocks";

// Args edited in build mode on a component's own page, per story. Stored in
// this browser's localStorage, like drafts and comments.

const KEY = "ds-explorer:component-args";
const EMPTY: Record<string, Args> = {};

let cache: Record<string, Args> | null = null;
const listeners = new Set<() => void>();

const keyFor = (slug: string, storyId: string) => `${slug}:${storyId}`;

function read(): Record<string, Args> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Args>;
  } catch {
    cache = {};
  }
  return cache;
}

/** False when the browser refused to store them (usually a full quota, from large images). */
function write(next: Record<string, Args>) {
  cache = next;
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
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

/** The edits saved for one story of a component, if any. */
export function useComponentArgs(slug: string, storyId: string | undefined): Args | undefined {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return storyId ? all[keyFor(slug, storyId)] : undefined;
}

/** Saves a story's edits, or clears them with `undefined`. */
export function setComponentArgs(slug: string, storyId: string, args: Args | undefined) {
  const next = { ...read() };
  if (args) next[keyFor(slug, storyId)] = args;
  else delete next[keyFor(slug, storyId)];
  return write(next);
}
