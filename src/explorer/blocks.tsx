"use client";

import type { ComponentType } from "react";
import { componentStories } from "./renderers";
import { components } from "./registry";
import { StoryArgs, type ArgType, type Story } from "./stories";

// How each component appears when placed on a draft screen or edited on its
// own page: which of its story's args can be edited and with what control,
// how it renders with them, and the JSX it writes out for the code view.
// Rendering and code share the same values, so edits in build mode show up in
// the generated source too.

export type ArgValue = string | boolean;
export type Args = Record<string, ArgValue>;

export type Field =
  | { key: string; label: string; kind: "text" | "multiline" | "boolean" | "image" }
  | { key: string; label: string; kind: "select"; options: string[] };

export type Template = {
  /** The story the template renders, when the component has stories. */
  story?: Story;
  fields: Field[];
  defaults: Args;
  Render: ComponentType<{ args: Args }>;
  /** JSX for the code view; `local` names the component where imports alias it. */
  jsx: (args: Args, local: string) => string;
  /** Names to import from the design system. */
  uses: string[];
};

/** A JSX attribute holding a string, quoted only when that's valid JSX. */
export function attr(key: string, value: string) {
  return /["\\\n]/.test(value) ? `${key}={${JSON.stringify(value)}}` : `${key}="${value}"`;
}

// Templates for components in src/ds, keyed by registry slug. Empty in this
// version: no DS components are imported.
const ds: Record<string, Template> = {};

/** `labelText` → `Label text`, for NBK story args. */
const humanize = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const controlType = (t: ArgType | undefined) => (typeof t?.control === "object" ? t.control.type : t?.control);

/**
 * The control an arg gets, from its argType where the story declares one and
 * its value otherwise. Images are strings (URLs) that the argType's docs type
 * names as an image source, since Storybook has no image control of its own.
 * Args with no editable form (functions, objects) get none.
 */
function fieldFor(key: string, value: unknown, t: ArgType | undefined): Field | undefined {
  if (t?.control === false) return undefined;
  const label = humanize(key);
  const control = controlType(t);
  if (/image/i.test(t?.table?.type?.summary ?? "")) return { key, label, kind: "image" };
  if ((control === "select" || control === "radio" || control === "inline-radio") && t?.options?.length) {
    return { key, label, kind: "select", options: t.options.map(String) };
  }
  if (control === "boolean" || typeof value === "boolean") return { key, label, kind: "boolean" };
  if (typeof value === "string" || control === "text") return { key, label, kind: "text" };
}

/** Editable fields for a story: its args in order, then argTypes it doesn't set. */
function fieldsFor(story: Story): Field[] {
  const keys = [...new Set([...Object.keys(story.args), ...Object.keys(story.argTypes)])];
  return keys.flatMap((k) => fieldFor(k, story.args[k], story.argTypes[k]) ?? []);
}

const defaultFor = (field: Field, value: unknown): ArgValue =>
  field.kind === "boolean" ? value === true : typeof value === "string" ? value : "";

/** NBK components: one of their stories, with its args editable. */
function nbk(story: Story): Template {
  const fields = fieldsFor(story);
  const defaults = Object.fromEntries(fields.map((f) => [f.key, defaultFor(f, story.args[f.key])]));
  const images = new Set(fields.filter((f) => f.kind === "image").map((f) => f.key));
  const { Render: StoryRender } = story;
  return {
    story,
    fields,
    defaults,
    Render: ({ args }) => (
      <StoryArgs.Provider value={args}>
        <StoryRender />
      </StoryArgs.Provider>
    ),
    jsx: (args, local) => {
      const merged = { ...story.args, ...args };
      const attrs = Object.entries(merged).flatMap(([k, v]) => {
        if (v === undefined || v === false || v === "") return [];
        if (images.has(k) && typeof v === "string") {
          // An uploaded image is a data URL too long to print; stand in a file.
          return [v.startsWith("data:") ? `${k}={require("./${k}.png")}` : `${k}={{ uri: ${JSON.stringify(v)} }}`];
        }
        if (v === true) return [k];
        if (typeof v === "string") return [attr(k, v)];
        if (typeof v === "function") return [`${k}={() => {}}`];
        return [`${k}={${JSON.stringify(v)}}`];
      });
      return `<${[local, ...attrs].join(" ")} />`;
    },
    uses: [],
  };
}

const cache = new Map<string, Template | null>();

/** The template for a component, rendering `storyId` or else its first story. */
export function templateFor(slug: string, storyId?: string): Template | undefined {
  if (ds[slug]) return ds[slug];
  const stories = componentStories[slug];
  const story = stories?.find((s) => s.id === storyId) ?? stories?.[0];
  if (!components[slug] || !story) return undefined;
  const key = `${slug}:${story.id}`;
  if (!cache.has(key)) cache.set(key, nbk(story));
  return cache.get(key) ?? undefined;
}

/** A block's args: its edits over the template's defaults. */
export const argsFor = (template: Template | undefined, edits?: Args): Args => ({ ...template?.defaults, ...edits });

/** Edits reduced to what differs from the defaults, so a reset field follows them again. */
export function diffArgs(template: Template | undefined, next: Args): Args | undefined {
  const kept = Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== template?.defaults[k]));
  return Object.keys(kept).length ? kept : undefined;
}
