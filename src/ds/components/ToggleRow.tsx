"use client";

import { Toggle } from "./Toggle";

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** A row whose trailing control is a Toggle. */
export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <div data-ds="toggle-row" className="flex h-[46px] items-center gap-2">
      <span className="text-[13px] text-ink">{label}</span>
      <span className="ml-auto">
        <Toggle label={label} checked={checked} onChange={onChange} />
      </span>
    </div>
  );
}
