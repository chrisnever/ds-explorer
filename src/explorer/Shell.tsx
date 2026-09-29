"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { crumbsFor } from "./registry";
import { TopBar } from "./TopBar";

gsap.registerPlugin(useGSAP);

export type Mode = "preview" | "inspect" | "code" | "comment";

/** How the home page groups things: by screen, or one card per component. */
export type Browse = "screens" | "components";

type ShellContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  browse: Browse;
  setBrowse: (browse: Browse) => void;
  /** Animates the current page out, then pushes the route. */
  navigate: (href: string) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <Shell>");
  return ctx;
}

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
  // Mode remembers the route it was chosen on. Inspect and comment are
  // transient tools and drop back to preview on navigation; code view sticks
  // so you can walk the breadcrumbs while reading source.
  const [chosen, setChosen] = useState<{ mode: Mode; path: string }>({ mode: "preview", path: pathname });
  // Lives here rather than on the home page so it survives drilling in and back out.
  const [browse, setBrowse] = useState<Browse>("screens");
  const root = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const crumbs = crumbsFor(pathname);
  const isRoot = crumbs.length === 1;
  // Comments are on individual components, not whole screens.
  const isComponent = crumbs.length === 3;

  useEffect(() => {
    leaving.current = false;
  }, [pathname]);

  const transient = chosen.mode === "inspect" || chosen.mode === "comment";
  const mode: Mode = transient && chosen.path !== pathname ? "preview" : chosen.mode;
  const effectiveMode: Mode = isRoot || (mode === "comment" && !isComponent) ? "preview" : mode;
  const setMode = useCallback((m: Mode) => setChosen({ mode: m, path: pathname }), [pathname]);

  useGSAP(
    () => {
      const dark = effectiveMode === "code";
      gsap.to(root.current, { ...THEMES[dark ? "dark" : "light"], duration: 0.6, ease: "power2.inOut" });
    },
    { dependencies: [effectiveMode], revertOnUpdate: false },
  );

  const navigate = useCallback(
    (href: string) => {
      if (leaving.current || href === pathname) return;
      leaving.current = true;
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
        // Leave comment mode before leaving the component.
        if (effectiveMode === "comment") return setMode("preview");
        if (up) navigate(up);
      }
      if (isRoot) return;
      if (e.key === "1") setMode("preview");
      if (e.key === "2") setMode(mode === "inspect" ? "preview" : "inspect");
      if (e.key === "3") setMode(mode === "code" ? "preview" : "code");
      if (e.key === "4" && isComponent) setMode(mode === "comment" ? "preview" : "comment");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [up, isRoot, isComponent, navigate, mode, effectiveMode, setMode]);

  return (
    <ShellContext.Provider value={{ mode: effectiveMode, setMode, browse, setBrowse, navigate }}>
      <div
        ref={root}
        style={THEMES.light as React.CSSProperties}
        className="min-h-dvh bg-[var(--shell-bg)] text-[var(--bar-fg)]"
      >
        <TopBar
          crumbs={crumbs}
          mode={effectiveMode}
          showModes={!isRoot}
          showComment={isComponent}
          showBrowse={isRoot}
        />
        <div ref={page} key={pathname}>
          {children}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
