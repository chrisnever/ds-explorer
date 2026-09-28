"use client";

import { InfoIcon } from "../icons";

type SectionLabelProps = {
  children: string;
  /** Shows a trailing info affordance. */
  onInfo?: () => void;
};

/** Muted heading that sits above a RowGroup. */
export function SectionLabel({ children, onInfo }: SectionLabelProps) {
  return (
    <div
      data-ds="section-label"
      className="flex items-center justify-between px-4 pb-2 pt-5"
    >
      <h3 className="text-[13px] font-medium text-ink-2">{children}</h3>
      {onInfo && (
        <button
          type="button"
          aria-label={`About ${children.toLowerCase()}`}
          onClick={onInfo}
          className="-mr-1 grid size-6 place-items-center rounded-full text-ink hover:bg-black/5"
        >
          <InfoIcon size={15} />
        </button>
      )}
    </div>
  );
}
