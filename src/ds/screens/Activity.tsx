"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PanelIcon } from "../icons";
import { RowGroup } from "../components/RowGroup";
import { SectionLabel } from "../components/SectionLabel";
import { SegmentedControl } from "../components/SegmentedControl";
import { SheetHeader } from "../components/SheetHeader";
import { TransactionRow } from "../components/TransactionRow";

gsap.registerPlugin(useGSAP);

const FILTERS = [
  { value: "all", label: "All" },
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

const DAYS = [
  {
    label: "Today",
    items: [
      { name: "Blue Bottle Coffee", detail: "Card · 9112", amount: -6.25 },
      { name: "Jordan Price", detail: "Transfer received", amount: 48 },
      { name: "Metro Transit", detail: "Card · 9112", amount: -3.35 },
    ],
  },
  {
    label: "Yesterday",
    items: [
      { name: "Northwind Payroll", detail: "Direct deposit", amount: 2840.12 },
      { name: "Harbour Grocers", detail: "Card · 9112", amount: -84.9 },
      { name: "Sam Okafor", detail: "Transfer sent", amount: -120 },
    ],
  },
  {
    label: "Sep 22",
    items: [
      { name: "Lumen Energy", detail: "Pre-authorized debit", amount: -96.4 },
      { name: "Priya Nair", detail: "Transfer received", amount: 35 },
    ],
  },
];

export function Activity() {
  const [filter, setFilter] = useState<Filter>("all");
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".day", { y: 16, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" });
    },
    { scope: root, dependencies: [filter] },
  );

  const days = DAYS.map((d) => ({
    ...d,
    items: d.items.filter((i) => filter === "all" || (filter === "in" ? i.amount > 0 : i.amount < 0)),
  })).filter((d) => d.items.length);

  return (
    <div ref={root} className="px-3 pb-10 pt-3">
      <SheetHeader title="Activity" meta="9112" action={{ icon: <PanelIcon />, label: "Statements" }} />

      <div className="px-1 pb-1 pt-4">
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {days.map((day) => (
        <section key={`${filter}-${day.label}`} className="day">
          <SectionLabel>{day.label}</SectionLabel>
          <RowGroup>
            {day.items.map((t) => (
              <TransactionRow key={t.name} {...t} />
            ))}
          </RowGroup>
        </section>
      ))}
    </div>
  );
}
