"use client";

import type { HighlighterCore } from "shiki/core";

// Drafts are composed in the browser, so their generated source is
// highlighted here rather than on the server like the DS files. Only the
// TSX grammar and the code view's theme are loaded, on first use.

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter() {
  highlighter ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")]).then(
    ([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
      createHighlighterCore({
        themes: [import("shiki/themes/vesper.mjs")],
        langs: [import("shiki/langs/tsx.mjs")],
        engine: createJavaScriptRegexEngine(),
      }),
  );
  return highlighter;
}

export async function highlightTsx(code: string) {
  return (await getHighlighter()).codeToHtml(code, { lang: "tsx", theme: "vesper" });
}

/** Unhighlighted stand-in with the same line structure, shown while shiki loads. */
export function plainHtml(code: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = code.split("\n").map((l) => `<span class="line">${escape(l)}</span>`);
  return `<pre class="shiki" style="color:#fff"><code>${lines.join("\n")}</code></pre>`;
}
