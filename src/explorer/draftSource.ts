"use client";

import { templates, textFor } from "./blocks";
import type { Draft } from "./drafts";
import { components } from "./registry";

// Turns a draft into the source of a screen component, for the code view.
// Each block writes out its template's JSX with the text as edited.

const ICONS = new Set(["PanelIcon", "UploadIcon"]);

const isNbk = (slug: string) => components[slug]?.file.startsWith("node_modules/@nbk/");

const indent = (code: string, by: number) =>
  code
    .split("\n")
    .map((line) => (line ? " ".repeat(by) + line : line))
    .join("\n");

/** `My card screen` → `MyCardScreen`, always a valid component name. */
export function componentName(title: string) {
  const name = title
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return /^[A-Z]/.test(name) ? name : `Screen${name}`;
}

export function draftSource(draft: Draft) {
  const blocks = draft.blocks.filter((b) => templates[b.slug]);
  const slugs = blocks.map((b) => b.slug);
  const ds = new Set(slugs.filter((s) => !isNbk(s)).flatMap((s) => templates[s].uses));
  // NBK and the design system both have a Button, so alias whichever clashes.
  const nbk = new Map(
    slugs.filter(isNbk).map((s) => {
      const name = components[s].name;
      return [s, { name, local: ds.has(name) ? `Nbk${name}` : name }];
    }),
  );

  const icons = [...ds].filter((n) => ICONS.has(n)).sort();
  const lines = [
    ...(icons.length ? [`import { ${icons.join(", ")} } from "@/ds/icons";`] : []),
    ...[...ds].filter((n) => !ICONS.has(n)).map((n) => `import { ${n} } from "@/ds/components/${n}";`),
  ];
  const nbkNames = [...new Map([...nbk.values()].map((n) => [n.local, n])).values()];
  if (nbkNames.length) {
    const specs = nbkNames.map((n) => (n.local === n.name ? n.name : `${n.name} as ${n.local}`));
    lines.push(`import { ${specs.join(", ")} } from "@nbk/ui";`);
  }

  const body = blocks
    .map((b) => {
      const local = nbk.get(b.slug)?.local ?? components[b.slug].name;
      const jsx = templates[b.slug].jsx(textFor(b.slug, b.text), local);
      return `<div className="py-1.5">\n${indent(jsx, 2)}\n</div>`;
    })
    .join("\n");

  const name = componentName(draft.title);
  return `// Generated from the “${draft.title}” draft in the component explorer.
// Callbacks are stubs: wire them up to state and navigation.
${lines.join("\n")}${lines.length ? "\n\n" : ""}export function ${name}() {
  return (
    <div className="px-3 pb-10 pt-3">
${body ? indent(body, 6) : "      {/* Add components in the explorer's Build mode. */}"}
    </div>
  );
}
`;
}
