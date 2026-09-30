"use client";

import { createContext, useContext, type ComponentType, type ReactNode } from "react";

// A small reader for Storybook's Component Story Format (CSF): the default
// export describes the component, every other export is one story. Covers
// args, argTypes, render functions and decorators, which is what the NBK
// stories use.

type Args = Record<string, unknown>;
type Context = { args: Args; name: string };
type Render = (args: Args, context: Context) => ReactNode;
type Decorator = (Story: ComponentType, context: Context) => ReactNode;

/** Args to lay over a story's own, e.g. text edited on a draft screen. */
export const StoryArgs = createContext<Args | null>(null);

/** The parts of a Storybook argType the explorer reads to pick a control. */
export type ArgType = {
  control?: false | string | { type?: string };
  options?: readonly unknown[];
  table?: { type?: { summary?: string } };
};

type Annotations = { args?: Args; argTypes?: Record<string, ArgType>; render?: Render; decorators?: Decorator[] };
type Meta = Annotations & {
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- stories target arbitrary props
  component?: ComponentType<any>;
  includeStories?: string[];
  excludeStories?: string[];
};
type StoryExport = (Annotations & { name?: string }) | (Render & Annotations & { storyName?: string });

export type StoryModule = { default: Meta } & Record<string, unknown>;
/** `args` are the story's merged props, for generating usage code. */
export type Story = { id: string; name: string; args: Args; argTypes: Record<string, ArgType>; Render: ComponentType };

/**
 * Turns one stories file into renderable stories, in source order. The order
 * comes from `__namedExportsOrder`, which loaders/csf-export-order.js adds.
 */
export function storiesFrom(mod: StoryModule): Story[] {
  const meta = mod.default;
  const keys =
    (mod.__namedExportsOrder as string[] | undefined) ??
    Object.keys(mod).filter((key) => key !== "default" && key !== "__namedExportsOrder");
  return keys
    .filter((key) => !meta.includeStories || meta.includeStories.includes(key))
    .filter((key) => !meta.excludeStories?.includes(key))
    .map((key) => {
      const story = mod[key] as StoryExport;
      const isFn = typeof story === "function";
      const name = (isFn ? story.storyName : story.name) ?? startCase(key);
      const args = { ...meta.args, ...story.args };
      const argTypes = { ...meta.argTypes, ...story.argTypes };
      const render: Render =
        (isFn ? story : story.render) ??
        meta.render ??
        ((a) => {
          if (!meta.component) throw new Error(`${meta.title ?? key}: story has no component or render`);
          const Component = meta.component;
          return <Component {...a} />;
        });
      const context = { args, name };
      // Story decorators wrap first, then the file-wide ones around those.
      const decorators = [...(story.decorators ?? []), ...(meta.decorators ?? [])];
      const Render = decorators.reduce<ComponentType>(
        (Inner, decorate) =>
          function Decorated() {
            return <>{decorate(Inner, context)}</>;
          },
        function Base() {
          const overrides = useContext(StoryArgs);
          const merged = overrides ? { ...args, ...overrides } : args;
          return <>{render(merged, { ...context, args: merged })}</>;
        },
      );
      return { id: key, name, args, argTypes, Render };
    });
}

/** `PrimaryLarge` → `Primary Large`, the way Storybook labels exports. */
function startCase(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}
