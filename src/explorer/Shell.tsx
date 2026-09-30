"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { crumbsFor, type Crumb } from "./registry";
import { screenBlocks } from "./renderers";
import { TopBar } from "./TopBar";

gsap.registerPlugin(useGSAP);

export type Mode = "preview" | "inspect" | "code" | "comment" | "build";

/** How the home page groups things: by screen, or one card per component. */
export type Browse = "screens" | "components";

type ShellContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  browse: Browse;
  setBrowse: (browse: Browse) => void;
  /** Animates the current page out, then pushes the route, arriving in `mode` if given. */
  navigate: (href: string, options?: { mode?: Mode }) => void;
  /** Names a page the registry doesn't know, such as a draft, in the breadcrumbs. */
  setPageCrumb: (crumb: Crumb | null) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <Shell>");
  return ctx;
}

const TRANSIENT = new Set<Mode>(["inspect", "comment", "build"]);

const THEMES = {
  light: {
    "--shell-bg": "#e9e9e7",
    "--bar-bg": "#ffffff",
    "--bar-fg": "#141414",
    "--bar-muted": "#8f8f8c",
    "--bar-ring": "rgba(0,0,0,0.05)",
    "--bar-thumb": "rgba(0,0,0,0.06)",
  },
  dark: {
    "--shell-bg": "#000000",
    "--bar-bg": "#121212",
    "--bar-fg": "#f1f1f1",
    "--bar-muted": "#6f6f6f",
    "--bar-ring": "rgba(255,255,255,0.07)",
    "--bar-thumb": "rgba(255,255,255,0.1)",
  },
} as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Inspect, comment and build are transient tools and drop back to preview
  // on navigation; code view sticks so you can walk the breadcrumbs while
  // reading source. Every draft shares one pathname, so this follows each
  // route change rather than remembering the path a mode was chosen on.
  const [mode, setMode] = useState<Mode>("preview");
  const [modePath, setModePath] = useState(pathname);
  const [arrivalMode, setArrivalMode] = useState<Mode | null>(null);
  if (modePath !== pathname) {
    setModePath(pathname);
    setMode(arrivalMode ?? (TRANSIENT.has(mode) ? "preview" : mode));
    setArrivalMode(null);
  }
  // Lives here rather than on the home page so it survives drilling in and back out.
  const [browse, setBrowse] = useState<Browse>("screens");
  const root = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [pageCrumb, setPageCrumbState] = useState<{ crumb: Crumb; path: string } | null>(null);
  const setPageCrumb = useCallback(
    (crumb: Crumb | null) => setPageCrumbState(crumb && { crumb, path: pathname }),
    [pathname],
  );
  const extra = pageCrumb?.path === pathname ? pageCrumb.crumb : null;
  const crumbs = extra ? [...crumbsFor("/"), extra] : crumbsFor(pathname);
  const isRoot = crumbs.length === 1;
  // Composed screens, which can be built on as well as viewed.
  const isDraft = pathname === "/draft";
  const isComponent = crumbs.length === 3;
  const isScreen = crumbs.length === 2 && !isDraft;
  // Comments are on individual components and drafts, not the coded screens.
  const canComment = isComponent || isDraft;
  // Drafts build in place, components edit their story's args, and a coded
  // screen builds on a draft copy when it can be expressed as blocks.
  const canBuild = isDraft || isComponent || (isScreen && !!screenBlocks(pathname.split("/")[1]));

  useEffect(() => {
    leaving.current = false;
  }, [pathname]);

  const effectiveMode: Mode =
    isRoot || (mode === "comment" && !canComment) || (mode === "build" && !canBuild) ? "preview" : mode;

  useGSAP(
    () => {
      const dark = effectiveMode === "code";
      gsap.to(root.current, { ...THEMES[dark ? "dark" : "light"], duration: 0.6, ease: "power2.inOut" });
    },
    { dependencies: [effectiveMode], revertOnUpdate: false },
  );

  const navigate = useCallback(
    (href: string, options?: { mode?: Mode }) => {
      if (leaving.current || href === pathname) return;
      leaving.current = true;
      setArrivalMode(options?.mode ?? null);
      router.prefetch(href);
      gsap.to(page.current, {
        opacity: 0,
        y: -6,
        filter: "blur(8px)",
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => router.push(href),
      });
    },
    [pathname, router],
  );

  // Reset the page wrapper once the new route has rendered into it.
  useGSAP(() => {
    gsap.set(page.current, { opacity: 1, y: 0, filter: "none" });
  }, [pathname]);

  const up = crumbs.at(-2)?.href;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Escape") {
        // Close the comment or build panel before leaving the page.
        if (effectiveMode === "comment" || effectiveMode === "build") return setMode("preview");
        if (up) navigate(up);
      }
      if (isRoot) return;
      if (e.key === "1") setMode("preview");
      if (e.key === "2") setMode(mode === "inspect" ? "preview" : "inspect");
      if (e.key === "3") setMode(mode === "code" ? "preview" : "code");
      if (e.key === "4" && canComment) setMode(mode === "comment" ? "preview" : "comment");
      if (e.key === "5" && canBuild) setMode(mode === "build" ? "preview" : "build");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [up, isRoot, canBuild, canComment, navigate, mode, effectiveMode]);

  return (
    <ShellContext.Provider value={{ mode: effectiveMode, setMode, browse, setBrowse, navigate, setPageCrumb }}>
      <div
        ref={root}
        style={THEMES.light as React.CSSProperties}
        className="min-h-dvh bg-[var(--shell-bg)] text-[var(--bar-fg)]"
      >
        <TopBar
          crumbs={crumbs}
          mode={effectiveMode}
          showModes={!isRoot}
          showComment={canComment}
          showBuild={canBuild}
          showBrowse={isRoot}
        />
        <div ref={page} key={pathname}>
          {children}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
