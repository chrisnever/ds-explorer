import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { NextConfig } from "next";

// `npm run build:sites` exports a static build for sites.metalab.com,
// which serves the site under /<namespace>/<site-name>/.
const basePath = process.env.SITES_BASE_PATH;

// @nbk/ui and @nbk/tokens are linked from a local nbk-components checkout
// (see package.json). Turbopack only reads files inside its root, so widen it
// to the folder that holds both repos.
const nbkUi = realpathSync("node_modules/@nbk/ui");
const root = commonAncestor(process.cwd(), nbkUi);

// react-native-svg comes from @nbk/ui's own install. Its entry pulls in the
// native (Fabric) build, and resolveExtensions doesn't reach inside packages to
// pick its `.web.js` files, so alias straight to the web elements (Svg, Path…).
// That skips the package's xml/css helpers, which @nbk/ui doesn't use.
// Turbopack aliases are project-relative, hence the leading "./".
const svgWeb = `./${path.relative(
  process.cwd(),
  path.join(
    path.dirname(createRequire(path.join(nbkUi, "package.json")).resolve("react-native-svg/package.json")),
    "lib/module/elements.web.js",
  ),
)}`;

// React Native components render through react-native-web. `react-native` is
// installed only for its types; every import of it resolves to the web build,
// via a thin wrapper that lets the explorer own the colour scheme. The wrapper
// loads this project's copy of react-native-web, so linked packages don't pull
// in their own and split the stylesheet in two.
const reactNativeWeb: NextConfig = {
  turbopack: {
    root,
    resolveAlias: { "react-native": "./src/explorer/react-native.ts", "react-native-svg": svgWeb },
    rules: {
      "*.stories.{tsx,ts,jsx,js}": { loaders: [path.resolve("loaders/csf-export-order.js")] },
      // Metro turns an imported image into an asset source; react-native-web's
      // Image takes a plain URL instead, so NBK's images load as one rather
      // than as Next's image objects. The explorer's own images are untouched.
      "*.{png,jpg,jpeg,gif,webp}": { condition: { path: /nbk-components\/packages\// }, type: "asset" },
    },
    // `.web.*` files win over their native counterparts, as in Expo and Metro.
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  outputFileTracingRoot: root,
  // Many RN libraries read the Metro-provided `__DEV__` global.
  compiler: { define: { __DEV__: String(process.env.NODE_ENV !== "production") } },
  // RN packages that ship untranspiled source (TS, JSX or Flow).
  transpilePackages: ["@nbk/ui", "@nbk/tokens"],
};

const nextConfig: NextConfig = basePath
  ? { ...reactNativeWeb, output: "export", basePath, trailingSlash: true }
  : reactNativeWeb;

export default nextConfig;

function commonAncestor(a: string, b: string) {
  const as = a.split(path.sep);
  const bs = b.split(path.sep);
  let i = 0;
  while (i < as.length && as[i] === bs[i]) i++;
  return as.slice(0, i).join(path.sep) || path.sep;
}
