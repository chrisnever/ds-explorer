"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArgsEditor } from "./ArgsEditor";
import { argsFor, diffArgs, templateFor, type Args } from "./blocks";
import { BUILD_PANEL_SPACE, BuildPanel, ClosePanelButton } from "./BuildPanel";
import { CodePanel, type CodeFile } from "./CodePanel";
import { CommentLayer } from "./CommentLayer";
import { CommentsPanel } from "./CommentsPanel";
import { addComment, useComments } from "./comments";
import { setComponentArgs, useComponentArgs } from "./componentArgs";
import { createDraft, draftHref, newBlock, useDrafts } from "./drafts";
import { InspectOverlay } from "./InspectOverlay";
import { componentDemos, componentStories, screenBlocks, screenRenderers } from "./renderers";
import { components, screenBySlug, screens } from "./registry";
import { useShell } from "./Shell";
import { StoryArgs } from "./stories";
import { setDrillFrom, takeDrillFrom } from "./transition";

gsap.registerPlugin(useGSAP);

type ViewerProps = { files: CodeFile[] } & (
  | { screen: string; component?: string; stage?: undefined }
  /** A page outside the registry, such as a draft, brings its own preview. */
  | { stage: ReactNode; screen?: undefined; component?: undefined }
);

/**
 * One route's stage: a live preview and its source, stacked. Switching
 * modes cross-blurs between the two while the shell fades to dark.
 */
export function Viewer({ files, screen, component, stage }: ViewerProps) {
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
        {screen === undefined ? (
          stage
        ) : component ? (
          <ComponentStage screen={screen} slug={component} />
        ) : (
          <ScreenStage screen={screen}>
            <Phone scroller={scroller} screen={screen}>
              {mode === "inspect" && <InspectOverlay scroller={scroller} onSelect={drillInto} />}
            </Phone>
          </ScreenStage>
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
    <div className="stage relative h-[min(812px,calc(100dvh-110px))] w-[390px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[44px] bg-screen shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_40px_80px_-30px_rgba(0,0,0,0.25),0_12px_24px_-12px_rgba(0,0,0,0.1)]">
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

/** A coded screen, with build mode's offer to work on a draft copy of it. */
function ScreenStage({ screen, children }: { screen: string; children: ReactNode }) {
  const { mode, setMode, navigate } = useShell();
  const building = mode === "build";
  const shift = useRef<HTMLDivElement>(null);
  const meta = screenBySlug(screen);
  const blocks = screenBlocks(screen);
  const copies = useDrafts().filter((d) => d.source === screen);

  useGSAP(
    () => {
      const room = building && window.innerWidth >= 1024;
      gsap.to(shift.current, { x: room ? BUILD_PANEL_SPACE / 2 : 0, duration: 0.55, ease: "power3.inOut" });
    },
    { dependencies: [building], revertOnUpdate: false },
  );

  const copy = () => {
    if (!blocks) return;
    const draft = createDraft({
      title: `${meta?.title ?? "Screen"} copy${copies.length ? ` ${copies.length + 1}` : ""}`,
      blocks: blocks.map((b) => newBlock(b.slug, b.story)),
      source: screen,
    });
    navigate(draftHref(draft.id), { mode: "build" });
  };

  return (
    <>
      <div ref={shift} className="flex w-full flex-col items-center">
        {children}
      </div>
      {building && blocks && (
        <BuildPanel>
          <header className="flex h-[58px] shrink-0 items-center gap-1 border-b border-[var(--bar-ring)] pl-4 pr-2">
            <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold">Build on a copy</h2>
            <ClosePanelButton onClose={() => setMode("preview")} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="px-1 text-[12.5px] leading-relaxed text-[var(--bar-muted)]">
              {meta?.title ?? "This screen"} is coded, so it stays as it is. Make an editable copy to add, move and
              edit its components. Copies are saved in this browser.
            </p>
            <button
              type="button"
              onClick={copy}
              className="mt-3 w-full rounded-lg bg-[var(--bar-fg)] px-3 py-2 text-[12.5px] font-medium text-[var(--bar-bg)] transition-opacity hover:opacity-85"
            >
              Make an editable copy
            </button>
            {copies.length > 0 && (
              <section className="mt-5">
                <h3 className="mb-1.5 px-1 text-[11.5px] font-medium text-[var(--bar-muted)]">Your copies</h3>
                <div className="flex flex-col">
                  {copies.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => navigate(draftHref(d.id), { mode: "build" })}
                      className="rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--bar-thumb)]"
                    >
                      {d.title}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </BuildPanel>
      )}
    </>
  );
}

function ComponentStage({ screen, slug }: { screen: string; slug: string }) {
  const { navigate, mode, setMode } = useShell();
  const stories = componentStories[slug];
  const [storyId, setStoryId] = useState(stories?.[0]?.id);
  const Demo = stories?.find((s) => s.id === storyId)?.Render ?? componentDemos[slug];
  const meta = components[slug];
  const usedIn = screens.filter((s) => s.components.includes(slug));
  const current = screenBySlug(screen);

  const commenting = mode === "comment";
  const building = mode === "build";
  const template = templateFor(slug, storyId);
  const edits = useComponentArgs(slug, storyId ?? "");
  const comments = useComments(slug);
  const numbers = useMemo(() => new Map(comments.map((c, i) => [c.id, i + 1])), [comments]);
  const onStory = useMemo(() => comments.filter((c) => c.storyId === storyId), [comments, storyId]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const shift = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wide = window.innerWidth >= 1024;
      const x = !wide ? 0 : commenting ? -PANEL_SPACE / 2 : building ? BUILD_PANEL_SPACE / 2 : 0;
      gsap.to(shift.current, { x, duration: 0.55, ease: "power3.inOut" });
    },
    { dependencies: [commenting, building], revertOnUpdate: false },
  );

  return (
    <>
      <div ref={shift} className="flex w-full flex-col items-center">
        <div className="stage relative w-[390px] max-w-[calc(100vw-32px)] rounded-[32px] bg-screen p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_40px_80px_-30px_rgba(0,0,0,0.25),0_12px_24px_-12px_rgba(0,0,0,0.1)]">
          <span className="stage-chrome pointer-events-none absolute -top-6 left-4 font-mono text-[11px] text-[var(--bar-muted)]">
            {`<${meta.name} />`}
          </span>
          <div ref={content}>
            {/* Edits made in build mode, over the story's own args. */}
            <StoryArgs.Provider value={edits ?? null}>
              <Demo />
            </StoryArgs.Provider>
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
      {building && (
        <ComponentArgsPanel
          name={meta.name}
          storyName={stories?.find((s) => s.id === storyId)?.name}
          template={template}
          edits={edits}
          onEdits={(next) => (storyId ? setComponentArgs(slug, storyId, next) : undefined)}
          onClose={() => setMode("preview")}
        />
      )}
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

/** Build mode on a component's page: the current story's args, as fields. */
function ComponentArgsPanel({
  name,
  storyName,
  template,
  edits,
  onEdits,
  onClose,
}: {
  name: string;
  storyName: string | undefined;
  template: ReturnType<typeof templateFor>;
  edits: Args | undefined;
  /** False when the browser couldn't store them. */
  onEdits: (edits: Args | undefined) => boolean | undefined;
  onClose: () => void;
}) {
  const [full, setFull] = useState(false);
  const fields = template?.fields ?? [];
  const save = (next: Args | undefined) => setFull(onEdits(next) === false);

  return (
    <BuildPanel>
      <header className="flex h-[58px] shrink-0 items-center gap-1 border-b border-[var(--bar-ring)] pl-4 pr-2">
        <h2 className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium">{`<${name} />`}</h2>
        <ClosePanelButton onClose={onClose} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {fields.length === 0 ? (
          <p className="px-1 py-6 text-center text-[12.5px] leading-relaxed text-[var(--bar-muted)]">
            This component has nothing to edit.
          </p>
        ) : (
          <>
            <p className="mb-3 px-1 text-[12px] leading-relaxed text-[var(--bar-muted)]">
              {storyName ? `Editing the ${storyName} story. ` : ""}Changes are saved in this browser.
            </p>
            <ArgsEditor
              fields={fields}
              values={argsFor(template, edits)}
              onChange={(key, value) => save(diffArgs(template, { ...edits, [key]: value }))}
            />
            {full && (
              <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-[#c9352b]">
                This browser’s storage is full, so the last change won’t survive a reload. Try a smaller image.
              </p>
            )}
          </>
        )}
      </div>
      {edits && (
        <footer className="shrink-0 border-t border-[var(--bar-ring)] p-2">
          <button
            type="button"
            onClick={() => save(undefined)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--bar-muted)] transition-colors hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
          >
            Reset to the story’s defaults
          </button>
        </footer>
      )}
    </BuildPanel>
  );
}
