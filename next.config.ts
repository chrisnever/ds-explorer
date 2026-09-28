import type { NextConfig } from "next";

// `npm run build:sites` exports a static build for sites.metalab.com,
// which serves the site under /<namespace>/<site-name>/.
const basePath = process.env.SITES_BASE_PATH;

const nextConfig: NextConfig = basePath
  ? { output: "export", basePath, trailingSlash: true }
  : {};

export default nextConfig;
