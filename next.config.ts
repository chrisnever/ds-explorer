import { realpathSync } from "node:fs";
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

// React Native components render through react-native-web. `react-native` is
// installed only for its types; every import of it resolves to the web build,
// via a thin wrapper that lets the explorer own the colour scheme. The wrapper
// loads this project's copy of react-native-web, so linked packages don't pull
// in their own and split the stylesheet in two.
const reactNativeWeb: NextConfig = {
  turbopack: {
    root,
    resolveAlias: { "react-native": "./src/explorer/react-native.ts" },
    rules: {
      "*.stories.{tsx,ts,jsx,js}": { loaders: [path.resolve("loaders/csf-export-order.js")] },
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
