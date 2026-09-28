"use client";

/** Small centred helper copy that explains the group above it. */
export function Footnote({ children }: { children: string }) {
  return (
    <p
      data-ds="footnote"
      className="mx-auto max-w-[290px] px-4 pt-2.5 text-center text-[11.5px] leading-[1.45] text-ink-3"
    >
      {children}
    </p>
  );
}
