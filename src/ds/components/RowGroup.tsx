"use client";

import type { ReactNode } from "react";

type RowGroupProps = {
  children: ReactNode;
  /** "raised" is the white inset card, "sunken" is the quieter grey well. */
  tone?: "raised" | "sunken";
};

/**
 * Rounded container for list rows. Rows are separated by hairlines
 * that start at the row's text inset, iOS style.
 */
export function RowGroup({ children, tone = "raised" }: RowGroupProps) {
  return (
    <div
      data-ds="row-group"
      className={[
        "overflow-hidden rounded-[18px] px-4",
        "[&>*+*]:border-t [&>*+*]:border-line",
        tone === "raised"
          ? "bg-panel shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
          : "bg-black/[0.035]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
