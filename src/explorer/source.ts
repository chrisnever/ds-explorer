import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHighlighter, type Highlighter } from "shiki";

export type SourceFile = { name: string; path: string; code: string; html: string };

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ["vesper"], langs: ["tsx"] });
  return highlighter;
}

/** Reads DS source files from disk and highlights them for the code view. */
export async function loadSources(files: string[]): Promise<SourceFile[]> {
  const hl = await getHighlighter();
  return Promise.all(
    [...new Set(files)].map(async (file) => {
      const code = await readFile(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8");
      return {
        name: path.basename(file),
        path: file,
        code,
        html: hl.codeToHtml(code, { lang: "tsx", theme: "vesper" }),
      };
    }),
  );
}
