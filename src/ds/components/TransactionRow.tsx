"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon } from "../icons";
import { Avatar } from "./Avatar";

type TransactionRowProps = {
  name: string;
  detail: string;
  /** Signed amount in dollars. Positive is money in. */
  amount: number;
};

const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

/** One line of account activity. Incoming money is tinted green. */
export function TransactionRow({ name, detail, amount }: TransactionRowProps) {
  const incoming = amount > 0;
  return (
    <div data-ds="transaction-row" className="flex h-[62px] items-center gap-3">
      <Avatar
        name={name}
        size={38}
        badge={incoming ? <ArrowDownLeftIcon size={10} strokeWidth={2} /> : <ArrowUpRightIcon size={10} strokeWidth={2} />}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-medium text-ink">{name}</span>
        <span className="truncate text-[12px] text-ink-3">{detail}</span>
      </span>
      <span
        className={`ml-auto text-[14px] font-semibold tabular-nums ${incoming ? "text-[#1f9d49]" : "text-ink"}`}
      >
        {incoming ? "+" : "−"}
        {fmt.format(Math.abs(amount))}
      </span>
    </div>
  );
}
