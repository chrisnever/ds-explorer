"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CheckIcon, DownloadIcon, DuplicateIcon } from "./icons";

gsap.registerPlugin(useGSAP);

export type CodeFile = { name: string; path: string; code: string; html: string };

export function CodePanel({ files }: { files: CodeFile[] }) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // Draft screens can drop files while this panel stays mounted.
  const file = files[Math.min(index, files.length - 1)];

  useGSAP(
    () => {
      gsap.fromTo(
        ".code-body",
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );
      root.current?.querySelector(".code-scroll")?.scrollTo({ top: 0 });
    },
    { scope: root, dependencies: [index], revertOnUpdate: false },
  );

  useGSAP(
    () => {
      if (copied) gsap.fromTo(".copy-check", { scale: 0.3, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.4, ease: "back.out(2.5)" });
    },
    { scope: root, dependencies: [copied], revertOnUpdate: false },
  );

  const copy = () => {
    navigator.clipboard?.writeText(file.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([file.code], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={root}
      className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[#0e0e0e] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2">
        <div className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => setIndex(i)}
              title={f.path}
              className={`shrink-0 rounded-[9px] px-2.5 py-1.5 font-mono text-[12px] transition-colors ${
                i === index ? "bg-white/[0.08] text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 gap-1">
          <IconButton label={`Download ${file.name}`} onClick={download}>
            <DownloadIcon />
          </IconButton>
          <IconButton label={copied ? "Copied" : "Copy code"} onClick={copy}>
            {copied ? <CheckIcon className="copy-check text-[#5ee08a]" /> : <DuplicateIcon />}
          </IconButton>
        </div>
      </div>
      <div className="code-scroll min-h-0 flex-1 overflow-auto">
        <div className="code-body code" dangerouslySetInnerHTML={{ __html: file.html }} />
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-[9px] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  );
}
