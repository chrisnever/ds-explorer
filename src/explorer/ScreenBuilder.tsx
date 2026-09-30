"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArgsEditor } from "./ArgsEditor";
import { argsFor, diffArgs, templateFor, type Args, type Template } from "./blocks";
import { BUILD_PANEL_SPACE, BuildPanel, ClosePanelButton } from "./BuildPanel";
import type { CodeFile } from "./CodePanel";
import { CommentLayer } from "./CommentLayer";
import { CommentsPanel } from "./CommentsPanel";
import { addComment, useComments } from "./comments";
import { componentName, draftSource } from "./draftSource";
import { deleteDraft, draftHref, newBlock, updateDraft, useDraft, type Block, type Draft } from "./drafts";
import { highlightTsx, plainHtml } from "./highlight";
import { BackIcon, CloseIcon, GripIcon } from "./icons";
import { InspectOverlay } from "./InspectOverlay";
import { components, screens, type ComponentMeta } from "./registry";
import { componentStories } from "./renderers";
import { useShell } from "./Shell";
import { setDrillFrom } from "./transition";
import { Viewer } from "./Viewer";

gsap.registerPlugin(useGSAP);

// What a drag carries: a component from the palette, or a block being moved.
const COMPONENT_MIME = "application/x-ds-component";
const BLOCK_MIME = "application/x-ds-block";

// Palette previews render at the phone's content width, scaled down.
const STAGE_WIDTH = 366;
const PREVIEW_SCALE = 0.6;
// The comments panel's width plus its gap from the edge; the phone shifts away
// by half of it (or of the build panel) to stay centred in the space left.
const COMMENTS_SPACE = 356;

/** A composed screen, read-only: used for home page thumbnails. */
export function DraftScreen({ blocks }: { blocks: Block[] }) {
  return (
    <div className="px-5 pb-10 pt-3">
      {blocks.map((b) => {
        const template = templateFor(b.slug, b.story);
        return (
          <div key={b.id} className="py-1.5">
            {template && <template.Render args={argsFor(template, b.args)} />}
          </div>
        );
      })}
    </div>
  );
}

/** The `/draft?id=…` route: loads the draft named in the URL. */
export function ScreenBuilder({ sources }: { sources: CodeFile[] }) {
  const id = useSearchParams().get("id");
  const draft = useDraft(id);
  const { navigate, setPageCrumb } = useShell();
  const title = draft?.title;

  // Drafts aren't in the registry, so name this page in the breadcrumbs here.
  useEffect(() => {
    if (!id || title === undefined) return;
    setPageCrumb({ label: title, href: draftHref(id) });
  }, [id, title, setPageCrumb]);
  useEffect(() => () => setPageCrumb(null), [setPageCrumb]);

  if (!draft) {
    return (
      <div className="grid h-dvh place-items-center px-4 text-center">
        <div>
          <p className="text-[15px] font-semibold">This screen doesn’t exist</p>
          <p className="mt-1 text-[13px] text-[var(--bar-muted)]">It may have been deleted, or made in another browser.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 rounded-full bg-[var(--bar-bg)] px-3 py-1.5 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--bar-ring)]"
          >
            Back to screens
          </button>
        </div>
      </div>
    );
  }
  return <DraftView draft={draft} sources={sources} />;
}

/** A draft in the same viewer as the coded screens, with its generated source as the code. */
function DraftView({ draft, sources }: { draft: Draft; sources: CodeFile[] }) {
  const { mode } = useShell();
  const code = useMemo(() => draftSource(draft), [draft]);
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null);

  // Highlight once the code is actually shown; plain text stands in until then.
  useEffect(() => {
    if (mode !== "code") return;
    let live = true;
    highlightTsx(code).then((html) => live && setHighlighted({ code, html }));
    return () => {
      live = false;
    };
  }, [code, mode]);

  const files = useMemo(() => {
    const name = `${componentName(draft.title)}.tsx`;
    const html = highlighted?.code === code ? highlighted.html : plainHtml(code);
    const used = new Set(draft.blocks.map((b) => components[b.slug]?.file));
    const shown = sources.filter((f) => used.has(f.path));
    // Both libraries have a Button.tsx, so tell clashing tabs apart by package.
    const clash = (f: CodeFile) => shown.some((o) => o !== f && o.name === f.name);
    const label = (f: CodeFile) => (clash(f) && f.path.startsWith("node_modules/@nbk/") ? { ...f, name: `@nbk/ui · ${f.name}` } : f);
    return [{ name, path: name, code, html }, ...shown.map(label)];
  }, [draft, code, highlighted, sources]);

  return <Viewer files={files} stage={<DraftStage draft={draft} />} />;
}

function DraftStage({ draft }: { draft: Draft }) {
  const { mode, setMode, navigate } = useShell();
  const building = mode === "build";
  const commenting = mode === "comment";
  const shift = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  // Where a drop would land, as an index into the blocks; null while nothing
  // droppable is over the phone.
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  // The block whose args the panel is editing, and which of its fields to
  // focus: `n` bumps so clicking the same text again refocuses it.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ key: string; n: number } | null>(null);
  const deleting = useRef(false);
  const { blocks } = draft;
  const selected = building ? blocks.find((b) => b.id === selectedId) : undefined;

  const commentSlug = `draft:${draft.id}`;
  const comments = useComments(commentSlug);
  const numbers = useMemo(() => new Map(comments.map((c, i) => [c.id, i + 1])), [comments]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useGSAP(
    () => {
      const wide = window.innerWidth >= 1024;
      const x = !wide ? 0 : building ? BUILD_PANEL_SPACE / 2 : commenting ? -COMMENTS_SPACE / 2 : 0;
      gsap.to(shift.current, { x, duration: 0.55, ease: "power3.inOut" });
    },
    { dependencies: [building, commenting], revertOnUpdate: false },
  );

  // Deleting navigates away first; the draft goes once this page has unmounted
  // so it doesn't flash "doesn't exist" on the way out.
  useEffect(() => {
    const id = draft.id;
    return () => {
      if (deleting.current) deleteDraft(id);
    };
  }, [draft.id]);

  const setBlocks = (next: Block[]) => updateDraft(draft.id, { blocks: next });

  const insert = (slug: string, at = blocks.length) => {
    setBlocks([...blocks.slice(0, at), newBlock(slug), ...blocks.slice(at)]);
  };

  const move = (id: string, at: number) => {
    const from = blocks.findIndex((b) => b.id === id);
    if (from === -1) return;
    const next = blocks.filter((b) => b.id !== id);
    next.splice(at > from ? at - 1 : at, 0, blocks[from]);
    setBlocks(next);
  };

  const remove = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));

  const setArgs = (id: string, args: Args | undefined) =>
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, args } : b)));

  // A different story brings its own args, so edits made to the old one go.
  const setStory = (id: string, story: string) =>
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, story, args: undefined } : b)));

  const select = (id: string, key?: string) => {
    setSelectedId(id);
    if (key) setFocus((f) => ({ key, n: (f?.n ?? 0) + 1 }));
  };

  const accepts = (e: React.DragEvent) =>
    building && (e.dataTransfer.types.includes(COMPONENT_MIME) || e.dataTransfer.types.includes(BLOCK_MIME));

  /** Insertion index for a pointer at `y`: before the first block whose middle is below it. */
  const indexAt = (y: number) => {
    const els = content.current?.querySelectorAll<HTMLElement>("[data-block]") ?? [];
    const i = Array.from(els).findIndex((el) => {
      const r = el.getBoundingClientRect();
      return y < r.top + r.height / 2;
    });
    return i === -1 ? blocks.length : i;
  };

  const onDragOver = (e: React.DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(BLOCK_MIME) ? "move" : "copy";
    const at = indexAt(e.clientY);
    if (at !== dropAt) setDropAt(at);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null);
  };

  const onDrop = (e: React.DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    const at = dropAt ?? indexAt(e.clientY);
    setDropAt(null);
    setMovingId(null);
    const slug = e.dataTransfer.getData(COMPONENT_MIME);
    const id = e.dataTransfer.getData(BLOCK_MIME);
    if (slug && components[slug]) insert(slug, at);
    else if (id) move(id, at);
  };

  const onDelete = () => {
    if (!window.confirm(`Delete “${draft.title}”? This can’t be undone.`)) return;
    deleting.current = true;
    navigate("/");
  };

  // Drafts aren't a home for components, so inspecting one opens it on the
  // first screen that uses it.
  const drillInto = (slug: string, rect: DOMRect) => {
    const home = screens.find((s) => s.components.includes(slug));
    if (!home) return;
    setDrillFrom({ slug, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });
    navigate(`/${home.slug}/${slug}`);
  };

  return (
    <>
      <div ref={shift} className="flex w-full flex-col items-center">
        <div className="stage relative h-[min(812px,calc(100dvh-110px))] w-[390px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[44px] bg-screen shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_40px_80px_-30px_rgba(0,0,0,0.25),0_12px_24px_-12px_rgba(0,0,0,0.1)]">
          <div
            ref={scroller}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            // Clicking the screen around the blocks lets go of the selection.
            onClick={(e) => building && !(e.target as Element).closest("[data-block]") && setSelectedId(null)}
            className="flex h-full flex-col overflow-y-auto overscroll-contain px-5 pb-10 pt-3 [scrollbar-width:none]"
          >
            {blocks.length === 0 ? (
              <EmptyState building={building} over={dropAt !== null} onBuild={() => setMode("build")} />
            ) : (
              <div ref={content}>
                {blocks.map((b, i) => (
                  <BlockFrame
                    key={b.id}
                    block={b}
                    template={templateFor(b.slug, b.story)}
                    editable={building}
                    selected={selected?.id === b.id}
                    onSelect={(key) => select(b.id, key)}
                    dropBefore={dropAt === i}
                    moving={movingId === b.id}
                    onMoveStart={() => setMovingId(b.id)}
                    onMoveEnd={() => {
                      setMovingId(null);
                      setDropAt(null);
                    }}
                    onRemove={() => remove(b.id)}
                  />
                ))}
                {dropAt === blocks.length && <DropLine />}
              </div>
            )}
          </div>
          {mode === "inspect" && <InspectOverlay scroller={scroller} onSelect={drillInto} />}
          {commenting && (
            // The layer covers the phone, so pass its wheel on to the screen underneath.
            <div onWheel={(e) => scroller.current?.scrollBy({ top: e.deltaY })}>
              <CommentLayer
                content={content}
                comments={comments}
                numbers={numbers}
                activeId={activeId}
                onActivate={setActiveId}
                onPost={(c) => addComment({ ...c, slug: commentSlug })}
              />
            </div>
          )}
        </div>
      </div>
      {building && (
        <Palette
          selected={selected}
          focus={focus}
          onArgs={(args) => selected && setArgs(selected.id, args)}
          onStory={(story) => selected && setStory(selected.id, story)}
          onDeselect={() => setSelectedId(null)}
          title={draft.title}
          onRename={(title) => updateDraft(draft.id, { title })}
          onAdd={(slug) => insert(slug)}
          onDelete={onDelete}
          onClose={() => setMode("preview")}
        />
      )}
      {commenting && (
        <CommentsPanel
          comments={comments}
          numbers={numbers}
          activeId={activeId}
          onActivate={setActiveId}
          onSelectStory={() => {}}
          onClose={() => setMode("preview")}
        />
      )}
    </>
  );
}

function EmptyState({ building, over, onBuild }: { building: boolean; over: boolean; onBuild: () => void }) {
  return (
    <div
      className={`grid flex-1 place-items-center rounded-[32px] border-[1.5px] border-dashed text-center transition-colors ${
        over ? "border-accent bg-accent/5" : building ? "border-ink-3/40" : "border-transparent"
      }`}
    >
      <div className="px-8">
        {building ? (
          <>
            <p className="text-[14px] font-semibold text-ink">Drag components here</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              Drop them from the panel to build up the screen, top to bottom. Clicking one adds it to the end.
            </p>
          </>
        ) : (
          <>
            <p className="text-[14px] font-semibold text-ink">This screen is empty</p>
            <button
              type="button"
              onClick={onBuild}
              className="mt-3 rounded-full bg-panel px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-70"
            >
              Start building
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Zero-height insertion marker, so showing it never shifts the blocks under the pointer. */
function DropLine() {
  return (
    <div aria-hidden className="relative h-0">
      <div className="absolute inset-x-1 -top-px h-0.5 rounded-full bg-accent" />
    </div>
  );
}

function BlockFrame({
  block,
  template,
  editable,
  selected,
  onSelect,
  dropBefore,
  moving,
  onMoveStart,
  onMoveEnd,
  onRemove,
}: {
  block: Block;
  template: Template | undefined;
  /**
   * In build mode: shows the move handle and remove button on hover, and
   * clicking the component selects it for editing instead of pressing it.
   */
  editable: boolean;
  selected: boolean;
  /** `key` is the text field under the click, if it landed on one. */
  onSelect: (key?: string) => void;
  dropBefore: boolean;
  moving: boolean;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onRemove: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const meta = components[block.slug];
  const args = argsFor(template, block.args);
  const Render = template?.Render;

  // The innermost element whose whole text is one of the text fields' values.
  const fieldAt = (target: Element) => {
    const texts = template?.fields.filter((f) => f.kind === "text" || f.kind === "multiline") ?? [];
    for (let el: Element | null = target; el && el !== body.current; el = el.parentElement) {
      const shown = el.textContent?.trim();
      const hit = shown && texts.find((f) => String(args[f.key] ?? "").trim() === shown);
      if (hit) return hit.key;
    }
  };

  // Capture-phase handlers, so the component's own presses never see them.
  const swallow = (e: React.SyntheticEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      {dropBefore && <DropLine />}
      <div
        ref={frame}
        data-block={block.id}
        // Lets inspect mode find components that don't tag themselves.
        data-ds={block.slug}
        className={`group relative py-1.5 transition-opacity ${moving ? "opacity-40" : ""}`}
      >
        {/* One slot for the chrome, so toggling it never remounts the component below. */}
        {editable && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 rounded-[14px] transition-opacity ${
                selected
                  ? "shadow-[0_0_0_1.5px_var(--color-accent),0_0_0_5px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]"
                  : "opacity-0 shadow-[0_0_0_1.5px_var(--color-ink-3)] group-focus-within:opacity-100 group-hover:opacity-100"
              }`}
            />
            {/* Only the handle drags, so buttons and toggles inside the component keep working. */}
            <div
              className={`absolute right-1.5 top-0 z-10 flex -translate-y-1/3 items-center gap-0.5 rounded-[9px] bg-[var(--bar-bg)] p-0.5 shadow-[0_0_0_1px_var(--bar-ring),0_4px_12px_-4px_rgba(0,0,0,0.2)] transition-opacity ${
                selected ? "" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              }`}
            >
              <button
                type="button"
                aria-label={`Edit ${meta?.name ?? block.slug}`}
                aria-pressed={selected}
                title="Edit"
                onClick={() => onSelect()}
                className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
              >{`<${meta?.name ?? block.slug} />`}</button>
              <span
                draggable
                role="button"
                aria-label={`Move ${meta?.name ?? block.slug}`}
                title="Drag to move"
                onDragStart={(e) => {
                  e.dataTransfer.setData(BLOCK_MIME, block.id);
                  e.dataTransfer.effectAllowed = "move";
                  if (frame.current) e.dataTransfer.setDragImage(frame.current, frame.current.offsetWidth - 40, 12);
                  onMoveStart();
                }}
                onDragEnd={onMoveEnd}
                className="grid size-6 cursor-grab place-items-center rounded-md text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)] active:cursor-grabbing"
              >
                <GripIcon />
              </span>
              <button
                type="button"
                aria-label={`Remove ${meta?.name ?? block.slug}`}
                title="Remove"
                onClick={onRemove}
                className="grid size-6 place-items-center rounded-md text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          </>
        )}
        <div
          ref={body}
          onPointerDownCapture={swallow}
          onClickCapture={(e) => {
            if (!editable) return;
            swallow(e);
            onSelect(fieldAt(e.target as Element));
          }}
          className={editable ? "cursor-text" : undefined}
        >
          {Render ? (
            <Render args={args} />
          ) : (
            <p className="py-4 text-center text-[12px] text-ink-3">Missing component “{block.slug}”</p>
          )}
        </div>
      </div>
    </>
  );
}

function Palette({
  selected,
  focus,
  onArgs,
  onStory,
  onDeselect,
  title,
  onRename,
  onAdd,
  onDelete,
  onClose,
}: {
  selected: Block | undefined;
  focus: { key: string; n: number } | null;
  onArgs: (args: Args | undefined) => void;
  onStory: (story: string) => void;
  onDeselect: () => void;
  title: string;
  onRename: (title: string) => void;
  onAdd: (slug: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState(title);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = Object.values(components).filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
    const isNbk = (c: ComponentMeta) => c.file.startsWith("node_modules/@nbk/");
    return [
      { label: "Design system", items: shown.filter((c) => !isNbk(c)) },
      { label: "NBK", items: shown.filter(isNbk) },
    ].filter((g) => g.items.length > 0);
  }, [query]);

  const commitName = () => {
    const next = name.trim();
    if (next && next !== title) onRename(next);
    else setName(title);
  };

  return (
    <BuildPanel>
      {selected ? (
        <BlockEditor
          key={selected.id}
          block={selected}
          focus={focus}
          onArgs={onArgs}
          onStory={onStory}
          onBack={onDeselect}
          onClose={onClose}
        />
      ) : (
        <>
          <header className="shrink-0 border-b border-[var(--bar-ring)] p-3">
            <div className="flex items-center gap-1">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Screen name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                      setName(title);
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full rounded-lg bg-transparent px-2 py-1 text-[14px] font-semibold outline-none hover:bg-[var(--bar-thumb)] focus:bg-[var(--bar-thumb)]"
                />
              </label>
              <ClosePanelButton onClose={onClose} />
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components"
              aria-label="Search components"
              className="mt-2 w-full rounded-lg bg-[var(--bar-thumb)] px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-[var(--bar-muted)]"
            />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {groups.length === 0 && (
              <p className="px-1 py-6 text-center text-[12.5px] text-[var(--bar-muted)]">No components match “{query}”</p>
            )}
            {groups.map((g) => (
              <section key={g.label} className="mb-4 last:mb-0">
                <h3 className="mb-2 px-1 text-[11.5px] font-medium text-[var(--bar-muted)]">{g.label}</h3>
                <div className="flex flex-col gap-2">
                  {g.items.map((c) => (
                    <PaletteTile key={c.slug} meta={c} template={templateFor(c.slug)} onAdd={() => onAdd(c.slug)} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="shrink-0 border-t border-[var(--bar-ring)] p-2">
            <button
              type="button"
              onClick={onDelete}
              className="w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--bar-muted)] transition-colors hover:bg-[var(--bar-thumb)] hover:text-[#c9352b]"
            >
              Delete screen
            </button>
          </footer>
        </>
      )}
    </BuildPanel>
  );
}

/** The panel while a block is selected: its story and args, as fields. */
function BlockEditor({
  block,
  focus,
  onArgs,
  onStory,
  onBack,
  onClose,
}: {
  block: Block;
  focus: { key: string; n: number } | null;
  onArgs: (args: Args | undefined) => void;
  onStory: (story: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const template = templateFor(block.slug, block.story);
  const args = argsFor(template, block.args);
  const fields = template?.fields ?? [];
  const stories = componentStories[block.slug] ?? [];

  return (
    <>
      <header className="flex h-[58px] shrink-0 items-center gap-1 border-b border-[var(--bar-ring)] px-2">
        <button
          type="button"
          aria-label="Back to components"
          title="Back to components"
          onClick={onBack}
          className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[var(--bar-muted)] hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
        >
          <BackIcon />
        </button>
        <h2 className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium">{`<${components[block.slug]?.name ?? block.slug} />`}</h2>
        <ClosePanelButton onClose={onClose} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {stories.length > 1 && (
          <label className="mb-4 flex flex-col gap-1">
            <span className="px-1 text-[11.5px] font-medium text-[var(--bar-muted)]">Story</span>
            <select
              value={template?.story?.id}
              onChange={(e) => onStory(e.target.value)}
              className="w-full rounded-lg bg-[var(--bar-thumb)] px-2.5 py-1.5 text-[13px] outline-none ring-[var(--bar-fg)] focus:ring-[1.5px]"
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {fields.length === 0 ? (
          <p className="px-1 py-6 text-center text-[12.5px] leading-relaxed text-[var(--bar-muted)]">
            This component has nothing to edit.
          </p>
        ) : (
          <>
            <p className="mb-3 px-1 text-[12px] leading-relaxed text-[var(--bar-muted)]">
              Click text on the screen to jump to it here.
            </p>
            <ArgsEditor
              fields={fields}
              values={args}
              focus={focus}
              onEscape={onBack}
              onChange={(key, value) => onArgs(diffArgs(template, { ...block.args, [key]: value }))}
            />
          </>
        )}
      </div>

      {block.args && (
        <footer className="shrink-0 border-t border-[var(--bar-ring)] p-2">
          <button
            type="button"
            onClick={() => onArgs(undefined)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--bar-muted)] transition-colors hover:bg-[var(--bar-thumb)] hover:text-[var(--bar-fg)]"
          >
            Reset to the story’s defaults
          </button>
        </footer>
      )}
    </>
  );
}

function PaletteTile({ meta, template, onAdd }: { meta: ComponentMeta; template: Template | undefined; onAdd: () => void }) {
  return (
    // Not a <button>: the preview inside holds the component's own buttons.
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(COMPONENT_MIME, meta.slug);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onAdd}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onAdd();
      }}
      title={`${meta.description}\nDrag onto the screen, or click to add it at the end.`}
      className="group block w-full cursor-grab overflow-hidden rounded-[12px] bg-surface text-left shadow-[0_0_0_1px_var(--bar-ring)] transition-shadow hover:shadow-[0_0_0_1.5px_var(--bar-fg)] active:cursor-grabbing"
    >
      <div className="relative h-[92px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]">
        {/* Wider than the tile before scaling, so centre it by hand rather than with grid. */}
        <div
          inert
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ width: STAGE_WIDTH, transform: `translate(-50%, -50%) scale(${PREVIEW_SCALE})` }}
        >
          {template && <template.Render args={argsFor(template)} />}
        </div>
      </div>
      <div className="border-t border-[var(--bar-ring)] bg-[var(--bar-bg)] px-2.5 py-1.5 font-mono text-[11.5px]">{meta.name}</div>
    </div>
  );
}
