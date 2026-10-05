// Base path the app is served under ("" locally, "/community-pulse" on GitHub Pages).
// Inlined at build time from next.config.ts.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Prefix an absolute path to a file in /public with the base path.
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
