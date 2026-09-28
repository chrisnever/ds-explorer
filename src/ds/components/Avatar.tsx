"use client";

import type { ReactNode } from "react";

const TINTS = [
  ["#ffe3d3", "#9a4a1e"],
  ["#dcebff", "#23518f"],
  ["#e3f5dc", "#2f6b22"],
  ["#f1e1ff", "#6a3491"],
  ["#fff1c9", "#8a6400"],
  ["#e0f4f4", "#1e6b6b"],
] as const;

function tintFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

type AvatarProps = {
  name: string;
  size?: number;
  /** Small circular badge on the bottom-right, e.g. a direction arrow. */
  badge?: ReactNode;
};

/** Initials on a tint derived from the name, so a person keeps their colour. */
export function Avatar({ name, size = 40, badge }: AvatarProps) {
  const [bg, fg] = tintFor(name);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      data-ds="avatar"
      className="relative inline-grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initials}
      {badge && (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-ink text-white ring-2 ring-surface">
          {badge}
        </span>
      )}
    </span>
  );
}
