"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ContactlessIcon, LockIcon } from "../icons";
import { FrostOverlay } from "./FrostOverlay";

gsap.registerPlugin(useGSAP);

type WalletCardProps = {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
  /** Flips to the back and grows to full width, exposing the details. */
  revealed?: boolean;
  /** Freezes the card over from the edges in and blurs the details. */
  locked?: boolean;
  onPress?: () => void;
};

/**
 * The physical/virtual card. Front shows the brand mark; the back shows
 * the card details. Flip and width grow run as one GSAP timeline so the
 * card appears to turn over as it slides forward.
 */
export function WalletCard({
  holder,
  number,
  expiry,
  cvc,
  revealed = false,
  locked = false,
  onPress,
}: WalletCardProps) {
  const root = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const lockMounted = useRef(false);

  useGSAP(
    () => {
      const d = mounted.current ? 1 : 0;
      mounted.current = true;
      gsap
        .timeline({ defaults: { duration: 0.8 * d, ease: "power3.inOut" } })
        .to(root.current, { width: revealed ? "100%" : "64%" }, 0)
        .to(".flipper", { rotateY: revealed ? 180 : 0 }, 0)
        .to(".lift", { y: -10, scale: 1.03, duration: 0.4 * d, ease: "power2.out" }, 0)
        .to(".lift", { y: 0, scale: 1, duration: 0.45 * d, ease: "power2.inOut" }, 0.4 * d);
    },
    { scope: root, dependencies: [revealed], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      const d = lockMounted.current ? 1 : 0;
      lockMounted.current = true;
      gsap.to(".details", {
        filter: locked ? "blur(1.2px)" : "blur(0px)",
        opacity: locked ? 0.7 : 1,
        duration: 1.4 * d,
        delay: locked ? 0.5 * d : 0,
      });
      gsap.to(".lock-badge", {
        scale: locked ? 1 : 0.6,
        opacity: locked ? 1 : 0,
        duration: 0.45 * d,
        delay: locked ? 1.2 * d : 0,
        ease: locked ? "back.out(2)" : "power2.in",
      });
    },
    { scope: root, dependencies: [locked], revertOnUpdate: false },
  );

  return (
    <button
      data-ds="wallet-card"
      ref={root}
      type="button"
      onClick={onPress}
      aria-label={revealed ? "Hide card details" : "View card details"}
      className="mx-auto block w-[64%] [container-type:inline-size] [perspective:1400px]"
    >
      <div className="lift">
        <div className="flipper relative aspect-[1.586] w-full [transform-style:preserve-3d]">
          {/* Front */}
          <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[5.5cqw] bg-[radial-gradient(120%_90%_at_30%_10%,#2b2b2b,#0b0b0b_60%)] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)] [backface-visibility:hidden]">
            <span className="select-none bg-[linear-gradient(140deg,#e2c690_0%,#9c7a41_38%,#e8cf98_55%,#806030_80%)] bg-clip-text font-serif text-[52cqw] leading-none text-transparent">
              N
            </span>
          </div>

          {/* Back */}
          <div className="absolute inset-0 overflow-hidden rounded-[4cqw] bg-[linear-gradient(160deg,#1d1f22,#07080a)] text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.07)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="absolute inset-x-0 top-0 h-[18%] bg-black" />
            <div className="details absolute inset-0 flex flex-col justify-end p-[5cqw] text-left">
              <ContactlessIcon className="absolute left-[5cqw] top-[40%] size-[6cqw] text-white/40" />
              <span className="text-[2.6cqw] font-semibold uppercase tracking-[0.12em] text-white/55">
                {holder}
              </span>
              <div className="mt-[1cqw] flex items-end gap-[4cqw] whitespace-nowrap tabular-nums">
                <span className="mr-auto text-[5cqw] font-semibold tracking-[0.02em]">{number}</span>
                <Field label="Exp" value={expiry} />
                <Field label="CVC" value={cvc} />
              </div>
            </div>
            <FrostOverlay frozen={locked} radius={0.04} />
            <span className="lock-badge absolute z-10 right-[4cqw] top-[24%] grid size-[8cqw] place-items-center rounded-full bg-white/15 opacity-0 backdrop-blur-sm">
              <LockIcon className="size-[4cqw]" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-[2.3cqw] font-semibold uppercase tracking-[0.1em] text-white/55">
        {label}
      </span>
      <span className="text-[5cqw] font-semibold">{value}</span>
    </span>
  );
}
