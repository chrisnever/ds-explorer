"use client";

import { useState } from "react";
import { CloseIcon } from "../icons";
import { AmountDisplay } from "../components/AmountDisplay";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Keypad, type KeypadKey } from "../components/Keypad";
import { SegmentedControl } from "../components/SegmentedControl";
import { SheetHeader } from "../components/SheetHeader";

const SPEEDS = [
  { value: "instant", label: "Instant" },
  { value: "standard", label: "1–2 days" },
] as const;

const LIMIT = 10_000;

export function SendMoney() {
  const [amount, setAmount] = useState("");
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["value"]>("instant");
  const [shake, setShake] = useState(0);

  const onKey = (key: KeypadKey) => {
    if (key === "back") return setAmount((a) => a.slice(0, -1));
    const next = amount === "0" && key !== "." ? key : amount + key;
    const [, decimals = ""] = next.split(".");
    const invalid =
      (key === "." && amount.includes(".")) || decimals.length > 2 || Number(next) > LIMIT;
    if (invalid) return setShake((s) => s + 1);
    setAmount(next === "." ? "0." : next);
  };

  const value = Number(amount || 0);

  return (
    <div className="flex min-h-full flex-col px-3 pb-6 pt-3">
      <SheetHeader
        title="Send to Jordan"
        leading={<Avatar name="Jordan Price" size={24} />}
        action={{ icon: <CloseIcon />, label: "Close" }}
      />

      <AmountDisplay
        value={amount}
        caption={speed === "instant" ? "Arrives in seconds · $1.50 fee" : "Arrives by Friday · Free"}
        shakeKey={shake}
      />

      <div className="px-6">
        <SegmentedControl options={SPEEDS} value={speed} onChange={setSpeed} />
      </div>

      <div className="mt-auto pt-6">
        <Keypad onKey={onKey} />
        <div className="px-2 pt-4">
          <Button disabled={value === 0}>Review transfer</Button>
        </div>
      </div>
    </div>
  );
}
