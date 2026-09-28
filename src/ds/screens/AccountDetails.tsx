"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExternalIcon, PanelIcon, UploadIcon } from "../icons";
import { ActionRow } from "../components/ActionRow";
import { CopyRow } from "../components/CopyRow";
import { Footnote } from "../components/Footnote";
import { RowGroup } from "../components/RowGroup";
import { SectionLabel } from "../components/SectionLabel";
import { SheetHeader } from "../components/SheetHeader";
import { ToggleRow } from "../components/ToggleRow";
import { WalletCard } from "../components/WalletCard";

gsap.registerPlugin(useGSAP);

export function AccountDetails() {
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Card controls unfold beneath the card as it flips over.
  useGSAP(
    () => {
      const d = mounted.current ? 1 : 0;
      mounted.current = true;
      gsap.to(".card-controls", {
        height: revealed ? "auto" : 0,
        opacity: revealed ? 1 : 0,
        duration: 0.6 * d,
        delay: revealed ? 0.2 * d : 0,
        ease: "power3.inOut",
      });
      if (revealed) {
        gsap.from(".card-controls > *", {
          y: 14,
          opacity: 0,
          stagger: 0.06,
          duration: 0.5 * d,
          delay: 0.35 * d,
          ease: "power3.out",
        });
      }
    },
    { scope: root, dependencies: [revealed], revertOnUpdate: false },
  );

  const toggle = () => setRevealed((r) => !r);

  return (
    <div ref={root} className="px-3 pb-10 pt-3">
      <SheetHeader
        title={revealed ? "Hide card details" : "View card details"}
        meta="9112"
        onTitlePress={toggle}
        action={{ icon: <PanelIcon />, label: "Open wallet" }}
      />

      <div className="pb-1 pt-5">
        <WalletCard
          holder="Avery Chen"
          number="5599 1234 5678 9112"
          expiry="10/29"
          cvc="123"
          revealed={revealed}
          locked={locked}
          onPress={toggle}
        />
      </div>

      <div className="card-controls h-0 overflow-hidden opacity-0">
        <div className="pt-4">
          <RowGroup tone="sunken">
            <ToggleRow label="Lock your virtual card" checked={locked} onChange={setLocked} />
            <ActionRow label="What is a virtual card" icon={<ExternalIcon size={14} />} />
          </RowGroup>
        </div>
        <Footnote>
          Your virtual card has a different number than your physical card. This helps keep your
          information secure.
        </Footnote>
      </div>

      <SectionLabel onInfo={() => {}}>Direct deposit</SectionLabel>
      <RowGroup>
        <CopyRow label="Institution number" value="703" />
        <CopyRow label="Transit / branch number" value="0001" />
        <CopyRow label="Account number" value="2045 1187" secret />
      </RowGroup>

      <div className="pt-2">
        <RowGroup>
          <ActionRow label="Direct deposit details" value="Void cheque" icon={<UploadIcon size={15} />} />
        </RowGroup>
      </div>

      <SectionLabel onInfo={() => {}}>Wire details</SectionLabel>
      <RowGroup>
        <CopyRow label="Beneficiary name" value="Avery Chen" />
        <CopyRow label="SWIFT / BIC" value="NRTHCATT" />
        <CopyRow label="Account number" value="2045 1187" secret />
      </RowGroup>
    </div>
  );
}
