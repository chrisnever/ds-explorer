"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { screenRenderers } from "./renderers";
import { components, screens } from "./registry";
import { useShell } from "./Shell";

gsap.registerPlugin(useGSAP);

const THUMB_SCALE = 0.56;

export function ExplorerHome() {
  const { navigate } = useShell();
  const root = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".intro > *", { y: 16, opacity: 0, stagger: 0.07, duration: 0.6 })
        .from(".screen-card", { y: 48, opacity: 0, filter: "blur(8px)", stagger: 0.09, duration: 0.8 }, 0.1)
        .from(".chip", { y: 10, opacity: 0, stagger: 0.015, duration: 0.4 }, 0.45);
    },
    { scope: root },
  );

  const hover = contextSafe((el: HTMLElement, on: boolean) => {
    gsap.to(el.querySelector(".thumb"), { y: on ? -8 : 0, duration: 0.5, ease: "power3.out" });
    gsap.to(el.querySelector(".thumb-shadow"), { opacity: on ? 1 : 0, duration: 0.5 });
  });

  return (
    <div ref={root} className="mx-auto max-w-[1080px] px-4 pb-24 pt-[108px]">
      <div className="intro mb-12 max-w-[520px]">
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em]">
          Components, in context.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--bar-muted)]">
          Open a screen to use it live, flip to its code, or inspect any piece of it and drill into the
          component on its own.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-6 gap-y-12">
        {screens.map((s) => {
          const Screen = screenRenderers[s.slug];
          return (
            <div
              key={s.slug}
              role="link"
              tabIndex={0}
              aria-label={s.title}
              onClick={() => navigate(`/${s.slug}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/${s.slug}`)}
              onPointerEnter={(e) => hover(e.currentTarget, true)}
              onPointerLeave={(e) => hover(e.currentTarget, false)}
              className="screen-card group flex cursor-pointer flex-col items-center text-left outline-none"
            >
              <div className="thumb relative" style={{ width: 390 * THUMB_SCALE, height: 720 * THUMB_SCALE }}>
                <div className="thumb-shadow absolute inset-0 rounded-[26px] opacity-0 shadow-[0_40px_60px_-30px_rgba(0,0,0,0.35)]" />
                <div className="absolute inset-0 overflow-hidden rounded-[26px] bg-surface shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_16px_40px_-24px_rgba(0,0,0,0.25)]">
                  <div
                    inert
                    className="pointer-events-none h-[720px] w-[390px] origin-top-left [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
                    style={{ transform: `scale(${THUMB_SCALE})` }}
                  >
                    <Screen />
                  </div>
                </div>
              </div>
              <div className="mt-5 w-full px-1" style={{ maxWidth: 390 * THUMB_SCALE }}>
                <div className="text-[14px] font-semibold">{s.title}</div>
                <div className="mt-0.5 text-[12.5px] text-[var(--bar-muted)]">
                  {s.components.length} components
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-20">
        <h2 className="mb-4 text-[13px] font-medium text-[var(--bar-muted)]">All components</h2>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(components).map((c) => {
            const home = screens.find((s) => s.components.includes(c.slug));
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => home && navigate(`/${home.slug}/${c.slug}`)}
                className="chip rounded-full bg-[var(--bar-bg)] px-3 py-1.5 font-mono text-[12px] shadow-[0_0_0_1px_var(--bar-ring)] transition-transform hover:-translate-y-0.5"
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
