"use client";

import { useState, type ComponentType } from "react";
import { PanelIcon, UploadIcon } from "@/ds/icons";
import { ActionRow } from "@/ds/components/ActionRow";
import { AmountDisplay } from "@/ds/components/AmountDisplay";
import { Avatar } from "@/ds/components/Avatar";
import { Button } from "@/ds/components/Button";
import { CopyRow } from "@/ds/components/CopyRow";
import { Footnote } from "@/ds/components/Footnote";
import { FrostOverlay } from "@/ds/components/FrostOverlay";
import { Keypad } from "@/ds/components/Keypad";
import { RowGroup } from "@/ds/components/RowGroup";
import { SectionLabel } from "@/ds/components/SectionLabel";
import { SegmentedControl } from "@/ds/components/SegmentedControl";
import { SheetHeader } from "@/ds/components/SheetHeader";
import { Toggle } from "@/ds/components/Toggle";
import { ToggleRow } from "@/ds/components/ToggleRow";
import { TransactionRow } from "@/ds/components/TransactionRow";
import { WalletCard } from "@/ds/components/WalletCard";
import { componentStories } from "./renderers";
import { components } from "./registry";
import { StoryArgs } from "./stories";

// How each component appears when placed on a draft screen: which of its
// text can be edited, how it renders with that text, and the JSX it writes
// out for the code view. Rendering and code share the same values, so edits
// in build mode show up in the generated source too.

export type Text = Record<string, string>;
export type TextField = { key: string; label: string; multiline?: boolean };

export type Template = {
  fields: TextField[];
  defaults: Text;
  Render: ComponentType<{ text: Text }>;
  /** JSX for the code view; `local` names the component where imports alias it. */
  jsx: (text: Text, local: string) => string;
  /** Names to import from the design system. */
  uses: string[];
};

/** A JSX attribute holding a string, quoted only when that's valid JSX. */
export function attr(key: string, value: string) {
  return /["\\\n]/.test(value) ? `${key}={${JSON.stringify(value)}}` : `${key}="${value}"`;
}

/** JSX children text, as an expression when it holds characters JSX reserves. */
const child = (value: string) => (/[{}<>\n]/.test(value) ? `{${JSON.stringify(value)}}` : value);

const field = (key: string, label: string, multiline?: boolean): TextField => ({ key, label, multiline });

const ds: Record<string, Template> = {
  "sheet-header": {
    fields: [field("title", "Title"), field("meta", "Meta")],
    defaults: { title: "View card details", meta: "9112" },
    Render: ({ text }) => (
      <SheetHeader title={text.title} meta={text.meta || undefined} action={{ icon: <PanelIcon />, label: "Open wallet" }} />
    ),
    jsx: (t) =>
      `<SheetHeader ${attr("title", t.title)}${t.meta ? ` ${attr("meta", t.meta)}` : ""} action={{ icon: <PanelIcon />, label: "Open wallet" }} />`,
    uses: ["SheetHeader", "PanelIcon"],
  },
  "wallet-card": {
    fields: [field("holder", "Card holder"), field("number", "Card number"), field("expiry", "Expiry"), field("cvc", "CVC")],
    defaults: { holder: "Avery Chen", number: "5599 1234 5678 9112", expiry: "10/29", cvc: "123" },
    Render: function Card({ text }) {
      const [revealed, setRevealed] = useState(true);
      return (
        <WalletCard
          holder={text.holder}
          number={text.number}
          expiry={text.expiry}
          cvc={text.cvc}
          revealed={revealed}
          onPress={() => setRevealed((r) => !r)}
        />
      );
    },
    jsx: (t) =>
      `<WalletCard\n  ${[attr("holder", t.holder), attr("number", t.number), attr("expiry", t.expiry), attr("cvc", t.cvc)].join("\n  ")}\n  revealed\n  onPress={() => {}}\n/>`,
    uses: ["WalletCard"],
  },
  "frost-overlay": {
    fields: [],
    defaults: {},
    Render: function Frost() {
      const [frozen, setFrozen] = useState(true);
      return (
        <button
          type="button"
          aria-label={frozen ? "Thaw" : "Freeze"}
          onClick={() => setFrozen((f) => !f)}
          className="relative block aspect-[1.586] w-full overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#1d1f22,#07080a)]"
        >
          <FrostOverlay frozen={frozen} />
        </button>
      );
    },
    jsx: () => `<div className="relative aspect-[1.586] overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#1d1f22,#07080a)]">
  <FrostOverlay frozen />
</div>`,
    uses: ["FrostOverlay"],
  },
  "section-label": {
    fields: [field("label", "Label")],
    defaults: { label: "Direct deposit" },
    Render: ({ text }) => <SectionLabel onInfo={() => {}}>{text.label}</SectionLabel>,
    jsx: (t) => `<SectionLabel onInfo={() => {}}>${child(t.label)}</SectionLabel>`,
    uses: ["SectionLabel"],
  },
  "row-group": {
    fields: [field("label1", "First label"), field("value1", "First value"), field("label2", "Second label"), field("value2", "Second value")],
    defaults: { label1: "Institution number", value1: "703", label2: "Transit / branch number", value2: "0001" },
    Render: ({ text }) => (
      <RowGroup>
        <CopyRow label={text.label1} value={text.value1} />
        <CopyRow label={text.label2} value={text.value2} />
      </RowGroup>
    ),
    jsx: (t) => `<RowGroup>
  <CopyRow ${attr("label", t.label1)} ${attr("value", t.value1)} />
  <CopyRow ${attr("label", t.label2)} ${attr("value", t.value2)} />
</RowGroup>`,
    uses: ["RowGroup", "CopyRow"],
  },
  "copy-row": {
    fields: [field("label", "Label"), field("value", "Value")],
    defaults: { label: "Account number", value: "2045 1187" },
    Render: ({ text }) => (
      <RowGroup>
        <CopyRow label={text.label} value={text.value} />
      </RowGroup>
    ),
    jsx: (t) => `<RowGroup>
  <CopyRow ${attr("label", t.label)} ${attr("value", t.value)} />
</RowGroup>`,
    uses: ["RowGroup", "CopyRow"],
  },
  "action-row": {
    fields: [field("label", "Label"), field("value", "Value")],
    defaults: { label: "Direct deposit details", value: "Void cheque" },
    Render: ({ text }) => (
      <RowGroup>
        <ActionRow label={text.label} value={text.value || undefined} icon={<UploadIcon size={15} />} />
      </RowGroup>
    ),
    jsx: (t) => `<RowGroup>
  <ActionRow ${attr("label", t.label)}${t.value ? ` ${attr("value", t.value)}` : ""} icon={<UploadIcon size={15} />} />
</RowGroup>`,
    uses: ["RowGroup", "ActionRow", "UploadIcon"],
  },
  toggle: {
    fields: [field("label", "Accessible label")],
    defaults: { label: "Notifications" },
    Render: function Switch({ text }) {
      const [on, setOn] = useState(true);
      return (
        <div className="flex justify-center py-3">
          <Toggle label={text.label} checked={on} onChange={setOn} />
        </div>
      );
    },
    jsx: (t) => `<Toggle ${attr("label", t.label)} checked onChange={() => {}} />`,
    uses: ["Toggle"],
  },
  "toggle-row": {
    fields: [field("label", "Label")],
    defaults: { label: "Lock your virtual card" },
    Render: function Row({ text }) {
      const [on, setOn] = useState(false);
      return (
        <RowGroup tone="sunken">
          <ToggleRow label={text.label} checked={on} onChange={setOn} />
        </RowGroup>
      );
    },
    jsx: (t) => `<RowGroup tone="sunken">
  <ToggleRow ${attr("label", t.label)} checked={false} onChange={() => {}} />
</RowGroup>`,
    uses: ["RowGroup", "ToggleRow"],
  },
  footnote: {
    fields: [field("text", "Text", true)],
    defaults: {
      text: "Your virtual card has a different number than your physical card. This helps keep your information secure.",
    },
    Render: ({ text }) => <Footnote>{text.text}</Footnote>,
    jsx: (t) => `<Footnote>\n  ${child(t.text)}\n</Footnote>`,
    uses: ["Footnote"],
  },
  avatar: {
    fields: [field("name", "Name")],
    defaults: { name: "Jordan Price" },
    Render: ({ text }) => (
      <div className="flex justify-center py-3">
        <Avatar name={text.name} size={44} />
      </div>
    ),
    jsx: (t) => `<Avatar ${attr("name", t.name)} size={44} />`,
    uses: ["Avatar"],
  },
  "amount-display": {
    fields: [field("value", "Amount"), field("caption", "Caption")],
    defaults: { value: "128.5", caption: "Arrives in seconds" },
    Render: ({ text }) => <AmountDisplay value={text.value} caption={text.caption || undefined} />,
    jsx: (t) => `<AmountDisplay ${attr("value", t.value)}${t.caption ? ` ${attr("caption", t.caption)}` : ""} />`,
    uses: ["AmountDisplay"],
  },
  "segmented-control": {
    fields: [field("a", "First option"), field("b", "Second option"), field("c", "Third option")],
    defaults: { a: "All", b: "Money in", c: "Money out" },
    Render: function Segments({ text }) {
      const [value, setValue] = useState<"a" | "b" | "c">("a");
      return (
        <SegmentedControl
          options={[
            { value: "a", label: text.a },
            { value: "b", label: text.b },
            { value: "c", label: text.c },
          ]}
          value={value}
          onChange={setValue}
        />
      );
    },
    jsx: (t) => `<SegmentedControl
  options={[
    { value: "a", label: ${JSON.stringify(t.a)} },
    { value: "b", label: ${JSON.stringify(t.b)} },
    { value: "c", label: ${JSON.stringify(t.c)} },
  ]}
  value="a"
  onChange={() => {}}
/>`,
    uses: ["SegmentedControl"],
  },
  keypad: {
    fields: [],
    defaults: {},
    Render: () => <Keypad onKey={() => {}} />,
    jsx: () => `<Keypad onKey={() => {}} />`,
    uses: ["Keypad"],
  },
  button: {
    fields: [field("label", "Label")],
    defaults: { label: "Review transfer" },
    Render: ({ text }) => <Button>{text.label}</Button>,
    jsx: (t) => `<Button>${child(t.label)}</Button>`,
    uses: ["Button"],
  },
  "transaction-row": {
    fields: [field("name", "Name"), field("detail", "Detail"), field("amount", "Amount")],
    defaults: { name: "Northwind Payroll", detail: "Direct deposit", amount: "2840.12" },
    Render: ({ text }) => (
      <RowGroup>
        <TransactionRow name={text.name} detail={text.detail} amount={toNumber(text.amount)} />
      </RowGroup>
    ),
    jsx: (t) => `<RowGroup>
  <TransactionRow ${attr("name", t.name)} ${attr("detail", t.detail)} amount={${toNumber(t.amount)}} />
</RowGroup>`,
    uses: ["RowGroup", "TransactionRow"],
  },
};

function toNumber(s: string) {
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** `labelText` → `Label text`, for NBK story args. */
const humanize = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/** NBK components: their first story, with its string args editable. */
function nbk(slug: string): Template | undefined {
  const story = componentStories[slug]?.[0];
  if (!story) return undefined;
  const strings = Object.entries(story.args).filter(([, v]) => typeof v === "string") as [string, string][];
  const { Render: StoryRender } = story;
  return {
    fields: strings.map(([k]) => field(k, humanize(k))),
    defaults: Object.fromEntries(strings),
    Render: ({ text }) => (
      <StoryArgs.Provider value={text}>
        <StoryRender />
      </StoryArgs.Provider>
    ),
    jsx: (text, local) => {
      const args = { ...story.args, ...text };
      const attrs = Object.entries(args).flatMap(([k, v]) => {
        if (v === undefined || v === false) return [];
        if (v === true) return [k];
        if (typeof v === "string") return [attr(k, v)];
        if (typeof v === "function") return [`${k}={() => {}}`];
        return [`${k}={${JSON.stringify(v)}}`];
      });
      return `<${[local, ...attrs].join(" ")} />`;
    },
    uses: [],
  };
}

export const templates: Record<string, Template> = Object.fromEntries(
  Object.keys(components).flatMap((slug) => {
    const t = ds[slug] ?? nbk(slug);
    return t ? [[slug, t]] : [];
  }),
);

/** A block's text: its edits over the template's defaults. */
export const textFor = (slug: string, edits?: Text): Text => ({ ...templates[slug]?.defaults, ...edits });
