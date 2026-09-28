"use client";

import { useState, type ComponentType } from "react";
import { ExternalIcon, PanelIcon, UploadIcon } from "@/ds/icons";
import { AccountDetails } from "@/ds/screens/AccountDetails";
import { Activity } from "@/ds/screens/Activity";
import { SendMoney } from "@/ds/screens/SendMoney";
import { ActionRow } from "@/ds/components/ActionRow";
import { AmountDisplay } from "@/ds/components/AmountDisplay";
import { Avatar } from "@/ds/components/Avatar";
import { Button } from "@/ds/components/Button";
import { CopyRow } from "@/ds/components/CopyRow";
import { Footnote } from "@/ds/components/Footnote";
import { FrostOverlay } from "@/ds/components/FrostOverlay";
import { Keypad, type KeypadKey } from "@/ds/components/Keypad";
import { RowGroup } from "@/ds/components/RowGroup";
import { SectionLabel } from "@/ds/components/SectionLabel";
import { SegmentedControl } from "@/ds/components/SegmentedControl";
import { SheetHeader } from "@/ds/components/SheetHeader";
import { Toggle } from "@/ds/components/Toggle";
import { ToggleRow } from "@/ds/components/ToggleRow";
import { TransactionRow } from "@/ds/components/TransactionRow";
import { WalletCard } from "@/ds/components/WalletCard";

export const screenRenderers: Record<string, ComponentType> = {
  "account-details": AccountDetails,
  "send-money": SendMoney,
  activity: Activity,
};

// Isolated, interactive demos for the component view.
export const componentDemos: Record<string, ComponentType> = {
  "sheet-header": function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <SheetHeader
        title={open ? "Hide card details" : "View card details"}
        meta="9112"
        onTitlePress={() => setOpen((o) => !o)}
        action={{ icon: <PanelIcon />, label: "Open wallet" }}
      />
    );
  },
  "wallet-card": function Demo() {
    const [revealed, setRevealed] = useState(true);
    const [locked, setLocked] = useState(false);
    return (
      <div className="flex flex-col gap-5 py-3">
        <WalletCard
          holder="Avery Chen"
          number="5599 1234 5678 9112"
          expiry="10/29"
          cvc="123"
          revealed={revealed}
          locked={locked}
          onPress={() => setRevealed((r) => !r)}
        />
        <RowGroup tone="sunken">
          <ToggleRow label="Revealed" checked={revealed} onChange={setRevealed} />
          <ToggleRow label="Locked" checked={locked} onChange={setLocked} />
        </RowGroup>
      </div>
    );
  },
  "frost-overlay": function Demo() {
    const [frozen, setFrozen] = useState(true);
    return (
      <div className="flex flex-col gap-5 py-3">
        <div className="relative aspect-[1.586] overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#1d1f22,#07080a)]">
          <FrostOverlay frozen={frozen} radius={0.04} />
        </div>
        <RowGroup tone="sunken">
          <ToggleRow label="Frozen" checked={frozen} onChange={setFrozen} />
        </RowGroup>
      </div>
    );
  },
  "section-label": () => (
    <>
      <SectionLabel onInfo={() => {}}>Direct deposit</SectionLabel>
      <SectionLabel>Yesterday</SectionLabel>
    </>
  ),
  "row-group": () => (
    <div className="flex flex-col gap-3">
      <RowGroup>
        <CopyRow label="Institution number" value="703" />
        <CopyRow label="Transit / branch number" value="0001" />
      </RowGroup>
      <RowGroup tone="sunken">
        <ActionRow label="What is a virtual card" icon={<ExternalIcon size={14} />} />
      </RowGroup>
    </div>
  ),
  "copy-row": () => (
    <RowGroup>
      <CopyRow label="Institution number" value="703" />
      <CopyRow label="Account number" value="2045 1187" secret />
    </RowGroup>
  ),
  "action-row": () => (
    <RowGroup>
      <ActionRow label="Direct deposit details" value="Void cheque" icon={<UploadIcon size={15} />} />
      <ActionRow label="What is a virtual card" icon={<ExternalIcon size={14} />} />
    </RowGroup>
  ),
  toggle: function Demo() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="flex justify-center gap-4 py-6">
        <Toggle label="On" checked={a} onChange={setA} />
        <Toggle label="Off" checked={b} onChange={setB} />
      </div>
    );
  },
  "toggle-row": function Demo() {
    const [on, setOn] = useState(false);
    return (
      <RowGroup tone="sunken">
        <ToggleRow label="Lock your virtual card" checked={on} onChange={setOn} />
      </RowGroup>
    );
  },
  footnote: () => (
    <Footnote>
      Your virtual card has a different number than your physical card. This helps keep your
      information secure.
    </Footnote>
  ),
  avatar: () => (
    <div className="flex justify-center gap-3 py-6">
      {["Jordan Price", "Sam Okafor", "Priya Nair", "Avery Chen"].map((n) => (
        <Avatar key={n} name={n} size={44} />
      ))}
    </div>
  ),
  "amount-display": function Demo() {
    const [v, setV] = useState("128.5");
    const [shake, setShake] = useState(0);
    return (
      <div>
        <AmountDisplay value={v} caption="Tap to add a digit" shakeKey={shake} />
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => setV((x) => (x.length < 7 ? x + "5" : x))}>
            Add digit
          </Button>
          <Button variant="secondary" onPress={() => setShake((s) => s + 1)}>
            Reject
          </Button>
        </div>
      </div>
    );
  },
  "segmented-control": function Demo() {
    const [v, setV] = useState<"all" | "in" | "out">("all");
    return (
      <div className="py-6">
        <SegmentedControl
          options={[
            { value: "all", label: "All" },
            { value: "in", label: "Money in" },
            { value: "out", label: "Money out" },
          ]}
          value={v}
          onChange={setV}
        />
      </div>
    );
  },
  keypad: function Demo() {
    const [last, setLast] = useState<KeypadKey | null>(null);
    return (
      <div>
        <p className="h-8 text-center text-[13px] text-ink-3">{last ? `Pressed ${last}` : "Press a key"}</p>
        <Keypad onKey={setLast} />
      </div>
    );
  },
  button: () => (
    <div className="flex flex-col gap-2 py-3">
      <Button>Review transfer</Button>
      <Button variant="secondary">Cancel</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
  "transaction-row": () => (
    <RowGroup>
      <TransactionRow name="Northwind Payroll" detail="Direct deposit" amount={2840.12} />
      <TransactionRow name="Harbour Grocers" detail="Card · 9112" amount={-84.9} />
    </RowGroup>
  ),
};
