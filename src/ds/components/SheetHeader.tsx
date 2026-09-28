"use client";

import type { ReactNode } from "react";

type SheetHeaderProps = {
  title: string;
  /** Muted trailing detail, e.g. the last four digits of a card. */
  meta?: string;
  /** Leading brand mark. Defaults to the network dots. */
  leading?: ReactNode;
  /** Icon-only action on the right edge. */
  action?: { icon: ReactNode; label: string; onPress?: () => void };
  onTitlePress?: () => void;
};

/**
 * Top row of a drawer or sheet. The title is pressable so it can double
 * as the primary toggle (e.g. "View card details" / "Hide card details").
 */
export function SheetHeader({
  title,
  meta,
  leading = <NetworkMark />,
  action,
  onTitlePress,
}: SheetHeaderProps) {
  return (
    <header data-ds="sheet-header" className="flex h-11 items-center gap-2 px-1">
      {leading}
      <button
        type="button"
        onClick={onTitlePress}
        className="flex min-w-0 items-baseline gap-1.5 text-left active:opacity-60"
      >
        <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </span>
        {meta && (
          <span className="shrink-0 text-[13px] tabular-nums text-ink-3">
            <span className="mr-0.5 tracking-[-0.1em]">••</span> {meta}
          </span>
        )}
      </button>
      {action && (
        <button
          type="button"
          aria-label={action.label}
          onClick={action.onPress}
          className="ml-auto grid size-9 place-items-center rounded-[11px] bg-black/[0.05] text-ink transition-colors hover:bg-black/[0.08] active:scale-95"
        >
          {action.icon}
        </button>
      )}
    </header>
  );
}

function NetworkMark() {
  return (
    <span aria-hidden className="relative mr-0.5 flex h-3 w-[18px] shrink-0">
      <span className="absolute left-0 size-3 rounded-full bg-[#eb3b24]" />
      <span className="absolute left-[6px] size-3 rounded-full bg-[#f7a21b] mix-blend-multiply" />
    </span>
  );
}
