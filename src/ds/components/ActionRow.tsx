"use client";

import type { ReactNode } from "react";

type ActionRowProps = {
  label: string;
  /** Emphasised text on the trailing edge, e.g. "Void cheque". */
  value?: string;
  icon?: ReactNode;
  onPress?: () => void;
};

/** A whole-row button that leads somewhere else. */
export function ActionRow({ label, value, icon, onPress }: ActionRowProps) {
  return (
    <button
      data-ds="action-row"
      type="button"
      onClick={onPress}
      className="flex h-[46px] w-full items-center gap-2 text-left transition-opacity active:opacity-50"
    >
      <span className="text-[13px] text-ink-2">{label}</span>
      {value && <span className="ml-auto text-[13px] font-medium text-ink">{value}</span>}
      {icon && <span className={value ? "text-ink" : "ml-auto text-ink"}>{icon}</span>}
    </button>
  );
}
