"use client";

import type { ComponentType, ReactNode } from "react";
import { View } from "react-native";
import * as NbkListStories from "@nbk/ui/src/List/List.stories";
import * as NbkListItemStories from "@nbk/ui/src/List/ListItem.stories";
import { components } from "./registry";
import { storiesFrom, type Story } from "./stories";

// Stories for the linked @nbk/ui components, keyed by registry slug. Adding a
// component is one import of its stories file plus a line here.
export const componentStories: Record<string, Story[]> = {
  "nbk-list": storiesFrom(NbkListStories),
  "nbk-list-item": storiesFrom(NbkListItemStories),
};

/** A component's default demo: its first story, else its hand-written demo. */
export function demoFor(slug: string): ComponentType | undefined {
  return componentStories[slug]?.[0]?.Render ?? componentDemos[slug];
}

/** Tags a React Native story so the inspect overlay can find it. */
function Tagged({ slug, children }: { slug: string; children: ReactNode }) {
  return <View dataSet={{ ds: slug }}>{children}</View>;
}

/** The NBK library's "screen": every story of every component, stacked. */
function NbkGallery() {
  return (
    <div className="flex flex-col gap-10 px-5 pb-24 pt-14">
      {Object.entries(componentStories).map(([slug, stories]) => (
        <section key={slug}>
          <h2 className="mb-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">{components[slug].name}</h2>
          <div className="flex flex-col gap-5">
            {stories.map(({ id, name, Render }) => (
              <div key={id}>
                <p className="mb-2 text-[12px] font-medium text-ink-3">{name}</p>
                <Tagged slug={slug}>
                  <Render />
                </Tagged>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export const screenRenderers: Record<string, ComponentType> = {
  nbk: NbkGallery,
};

/**
 * A coded screen as draft blocks, top to bottom, for building on a copy of it.
 * Undefined for screens that can't be expressed as blocks.
 */
export function screenBlocks(screen: string): { slug: string; story: string }[] | undefined {
  if (screen !== "nbk") return undefined;
  return Object.entries(componentStories).flatMap(([slug, stories]) => stories.map((s) => ({ slug, story: s.id })));
}

// Isolated, interactive demos for the component view. No local DS components
// are imported in this version, so there are none.
export const componentDemos: Record<string, ComponentType> = {};
