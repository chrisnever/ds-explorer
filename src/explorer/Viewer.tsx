"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CodePanel, type CodeFile } from "./CodePanel";
import { CommentLayer } from "./CommentLayer";
import { CommentsPanel } from "./CommentsPanel";
import { addComment, useComments } from "./comments";
import { InspectOverlay } from "./InspectOverlay";
import { componentDemos, componentStories, screenRenderers } from "./renderers";
import { components, screenBySlug, screens } from "./registry";
import { useShell } from "./Shell";
import { setDrillFrom, takeDrillFrom } from "./transition";

gsap.registerPlugin(useGSAP);

type ViewerProps = { files: CodeFile[]; screen: string; component?: string };

/**
 * One route's stage: a live preview and its source, stacked. Switching
 * modes cross-blurs between the two while the shell fades to dark.
 */
export function Viewer({ files, screen, component }: ViewerProps) {
  const { mode, navigate, setMode } = useShell();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const showCode = mode === "code";

  const entrance = (codeFirst: boolean) => {
    if (codeFirst) {
      gsap.fromTo(
        ".code-layer",
        { autoAlpha: 0, y: 20, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" },
      );
      return;
    }
    const drill = component ? takeDrillFrom(component) : null;
    const stage = root.current?.querySelector<HTMLElement>(".stage");
    if (drill && stage) {
      // Grow the component's stage out of the spot it occupied on the screen.
      const to = stage.getBoundingClientRect();
      const from = drill.rect;
      gsap
        .timeline({ defaults: { ease: "power3.inOut" } })
        .from(stage, {
          x: from.x + from.width / 2 - (to.x + to.width / 2),
          y: from.y + from.height / 2 - (to.y + to.height / 2),
          scale: from.width / to.width,
          duration: 0.75,
        })
        .from(".stage-chrome", { opacity: 0, duration: 0.5 }, 0.15)
        .from(".stage-meta > *", { y: 12, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 0.4);
      return;
    }
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .from(".stage", { y: 40, scale: 0.97, opacity: 0, filter: "blur(10px)", duration: 0.8 })
      .from(".stage-meta > *", { y: 12, opacity: 0, stagger: 0.06, duration: 0.5 }, 0.3);
  };

  useGSAP(
    () => {
      const preview = ".preview-layer";
      const code = ".code-layer";
      if (first.current) {
        first.current = false;
        if (showCode) gsap.set(preview, { autoAlpha: 0 });
        entrance(showCode);
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      if (showCode) {
        tl.to(preview, { autoAlpha: 0, scale: 0.94, filter: "blur(14px)", duration: 0.5 }, 0).fromTo(
          code,
          { autoAlpha: 0, y: 24, scale: 0.98, filter: "blur(12px)" },
          { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" },
          0.15,
        );
      } else {
        tl.to(code, { autoAlpha: 0, y: 16, filter: "blur(12px)", duration: 0.4 }, 0).fromTo(
          preview,
          { autoAlpha: 0, scale: 1.04, filter: "blur(14px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.65, ease: "power3.out" },
          0.1,
        );
      }
    },
    { scope: root, dependencies: [showCode], revertOnUpdate: false },
  );


  const drillInto = (slug: string, rect: DOMRect) => {
    setDrillFrom({ slug, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });
    setMode("preview");
    navigate(`/${screen}/${slug}`);
  };

  return (
    <div ref={root} className="relative h-dvh overflow-hidden">
      <div className="preview-layer absolute inset-0 flex flex-col items-center justify-center pb-4 pt-[78px]">
        {component ? (
          <ComponentStage screen={screen} slug={component} />
        ) : (
          <Phone scroller={scroller} screen={screen}>
            {mode === "inspect" && <InspectOverlay scroller={scroller} onSelect={drillInto} />}
          </Phone>
        )}
      </div>

      <div className="code-layer invisible absolute opacity-0 inset-x-0 bottom-4 top-[78px] mx-auto w-[calc(100%-32px)] max-w-[1080px]">
        <CodePanel files={files} />
      </div>
    </div>
  );
}

function Phone({
  screen,
  scroller,
  children,
}: {
  screen: string;
  scroller: React.RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}) {
  const Screen = screenRenderers[screen];
  return (
    <div className="stage relative h-[min(812px,calc(100dvh-110px))] w-[390px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[44px] bg-surface shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_40px_80px_-30px_rgba(0,0,0,0.25),0_12px_24px_-12px_rgba(0,0,0,0.1)]">
      <div
        ref={scroller}
        className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,black_calc(100%-72px),transparent)]"
      >
        <Screen />
      </div>
      {children}
    </div>
  );
}

// Comment panel width plus its gap from the edge; the stage shifts left by
// half of it so it stays centred in the space the panel leaves.
const PANEL_SPACE = 356;

function ComponentStage({ screen, slug }: { screen: string; slug: string }) {
  const { navigate, mode, setMode } = useShell();
  const stories = componentStories[slug];
  const [storyId, setStoryId] = useState(stories?.[0]?.id);
  const Demo = stories?.find((s) => s.id === storyId)?.Render ?? componentDemos[slug];
  const meta = components[slug];
  const usedIn = screens.filter((s) => s.components.includes(slug));
  const current = screenBySlug(screen);

  const commenting = mode === "comment";
  const comments = useComments(slug);
  const numbers = useMemo(() => new Map(comments.map((c, i) => [c.id, i + 1])), [comments]);
  const onStory = useMemo(() => comments.filter((c) => c.storyId === storyId), [comments, storyId]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const shift = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const room = commenting && window.innerWidth >= 1024;
      gsap.to(shift.current, { x: room ? -PANEL_SPACE / 2 : 0, duration: 0.55, ease: "power3.inOut" });
    },
    { dependencies: [commenting], revertOnUpdate: false },
  );

  return (
    <>
      <div ref={shift} className="flex w-full flex-col items-center">
        <div className="stage relative w-[390px] max-w-[calc(100vw-32px)] rounded-[32px] bg-surface p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_40px_80px_-30px_rgba(0,0,0,0.25),0_12px_24px_-12px_rgba(0,0,0,0.1)]">
          <span className="stage-chrome pointer-events-none absolute -top-6 left-4 font-mono text-[11px] text-[var(--bar-muted)]">
            {`<${meta.name} />`}
          </span>
          <div ref={content}>
            <Demo />
          </div>
          {commenting && (
            <CommentLayer
              content={content}
              comments={onStory}
              numbers={numbers}
              activeId={activeId}
              onActivate={setActiveId}
              onPost={(c) => addComment({ ...c, slug, storyId })}
            />
          )}
        </div>

        <div className="stage-meta mt-8 flex max-w-[390px] flex-col items-center gap-3 px-4 text-center">
          {stories && (
            <div role="group" aria-label="Stories" className="flex flex-wrap justify-center gap-1.5 text-[12px]">
              {stories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === storyId}
                  onClick={() => setStoryId(s.id)}
                  className="rounded-full bg-[var(--bar-bg)] px-2.5 py-1 font-medium shadow-[0_0_0_1px_var(--bar-ring)] transition-opacity hover:opacity-70 aria-pressed:opacity-100 aria-pressed:shadow-[0_0_0_1.5px_var(--bar-fg)]"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <p className="text-[13.5px] leading-relaxed text-[var(--bar-muted)]">{meta.description}</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[12px]">
            <span className="text-[var(--bar-muted)]">Used in</span>
            {usedIn.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => navigate(`/${s.slug}/${slug}`)}
                disabled={s.slug === current?.slug}
                className="rounded-full bg-[var(--bar-bg)] px-2.5 py-1 font-medium shadow-[0_0_0_1px_var(--bar-ring)] transition-opacity hover:opacity-70 disabled:opacity-100 disabled:shadow-[0_0_0_1.5px_var(--bar-fg)]"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>
      {commenting && (
        <CommentsPanel
          comments={comments}
          numbers={numbers}
          stories={stories}
          storyId={storyId}
          activeId={activeId}
          onActivate={setActiveId}
          onSelectStory={setStoryId}
          onClose={() => setMode("preview")}
        />
      )}
    </>
  );
}
