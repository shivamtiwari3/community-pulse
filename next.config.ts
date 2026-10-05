import type { NextConfig } from "next";

// Set PAGES_BASE_PATH=/community-pulse when building for GitHub Pages (see .github/workflows/pages.yml).
// Left unset, the app is served from "/" (e.g. `npm run dev`).
const basePath = (process.env.PAGES_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
