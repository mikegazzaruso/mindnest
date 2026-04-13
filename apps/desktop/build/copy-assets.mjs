#!/usr/bin/env node
// Copy Next.js static and public assets into the standalone output dir
// after `next build`. Cross-platform (used by both macOS and Windows CI).
import { existsSync, rmSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const STANDALONE = join(REPO_ROOT, "apps/web/.next/standalone/apps/web");

const COPIES = [
  {
    from: join(REPO_ROOT, "apps/web/.next/static"),
    to: join(STANDALONE, ".next/static"),
    label: ".next/static",
  },
  {
    from: join(REPO_ROOT, "apps/web/public"),
    to: join(STANDALONE, "public"),
    label: "public",
  },
];

for (const { from, to, label } of COPIES) {
  if (!existsSync(from)) {
    console.warn(`[copy-assets] source missing, skipping: ${from}`);
    continue;
  }
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  console.log(`✓ ${label}`);
}
