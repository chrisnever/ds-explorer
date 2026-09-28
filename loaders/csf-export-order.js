// Appends Storybook's `__namedExportsOrder` to stories files, as Storybook's
// own compiler does. Module namespace objects list exports alphabetically,
// so without it stories would lose the order they're written in.
module.exports = function csfExportOrder(source) {
  if (source.includes("__namedExportsOrder")) return source;
  const names = [...source.matchAll(/^export\s+(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  if (!names.length) return source;
  return `${source}\nexport const __namedExportsOrder = ${JSON.stringify(names)};\n`;
};
