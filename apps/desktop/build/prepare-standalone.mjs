#!/usr/bin/env node
// After `next build` with output: standalone, Next.js traces imports and
// copies only the files it detected. For native-binding packages (e.g.
// onnxruntime-node, pdfjs-dist, sharp, pdf-parse) this misses sibling assets
// like .dylib, .so, worker files, etc. We fix two things:
//
// 1) Create top-level symlinks in standalone/node_modules/<pkg> → real pnpm
//    store location, so Node's resolver can find externalized packages.
// 2) Replace the (partial) NFT-copied package directories inside
//    standalone/node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg> with
//    symlinks to the real pnpm package dirs, so dlopen of .node files can
//    find their sibling .dylib/.so files.
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  readdirSync,
  statSync,
  readFileSync,
  lstatSync,
  chmodSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const STANDALONE_ROOT = join(REPO_ROOT, "apps/web/.next/standalone/node_modules");
const APPS_WEB_ROOT = join(REPO_ROOT, "apps/web");
const REAL_STORE = join(REPO_ROOT, "node_modules/.pnpm");
const STANDALONE_STORE = join(STANDALONE_ROOT, ".pnpm");

if (!existsSync(STANDALONE_ROOT)) {
  console.error("Standalone node_modules not found at:", STANDALONE_ROOT);
  process.exit(1);
}

// Top-level packages we want resolvable by Node require from standalone
const TOP_LEVEL_PACKAGES = [
  "pdf-parse",
  "pdfjs-dist",
  "@huggingface/transformers",
  "onnxruntime-node",
  "onnxruntime-common",
  "sharp",
];

// Packages with native binaries that need full pnpm store dir replacement
// Format: { nameInStore: "onnxruntime-node@1.24.3", nameInNm: "onnxruntime-node" }
const NATIVE_PACKAGES_TO_REPLACE = [];

// Discover which .pnpm entries exist in the standalone copy and target them
if (existsSync(STANDALONE_STORE)) {
  for (const entry of readdirSync(STANDALONE_STORE)) {
    // Match packages that commonly ship native bins
    if (
      entry.startsWith("onnxruntime-node@") ||
      entry.startsWith("onnxruntime-web@") ||
      entry.startsWith("pdfjs-dist@") ||
      entry.startsWith("sharp@") ||
      entry.startsWith("@img+sharp-") ||
      entry.startsWith("pdf-parse@")
    ) {
      // Determine the actual package name inside .pnpm/<entry>/node_modules/
      const nmDir = join(STANDALONE_STORE, entry, "node_modules");
      if (!existsSync(nmDir)) continue;
      for (const subEntry of readdirSync(nmDir)) {
        if (subEntry.startsWith("@")) {
          // scoped: go one deeper
          const scopedDir = join(nmDir, subEntry);
          try {
            for (const sub2 of readdirSync(scopedDir)) {
              NATIVE_PACKAGES_TO_REPLACE.push({
                storeDir: entry,
                pkgName: `${subEntry}/${sub2}`,
              });
            }
          } catch { /* ignore */ }
        } else if (!subEntry.startsWith(".")) {
          NATIVE_PACKAGES_TO_REPLACE.push({
            storeDir: entry,
            pkgName: subEntry,
          });
        }
      }
    }
  }
}

function forceRemove(p) {
  try {
    const st = lstatSync(p);
    if (st.isSymbolicLink() || st.isFile()) {
      rmSync(p, { force: true });
    } else {
      rmSync(p, { recursive: true, force: true });
    }
  } catch { /* already gone */ }
}

function makeSymlink(linkPath, target) {
  // Ensure parent dir exists
  mkdirSync(dirname(linkPath), { recursive: true });
  forceRemove(linkPath);
  symlinkSync(target, linkPath, "dir");
}

// === Step 1: replace NFT-copied native package dirs with symlinks to real pnpm store ===
let replaced = 0;
for (const { storeDir, pkgName } of NATIVE_PACKAGES_TO_REPLACE) {
  const standalonePkgPath = join(STANDALONE_STORE, storeDir, "node_modules", pkgName);
  const realPkgPath = join(REAL_STORE, storeDir, "node_modules", pkgName);
  if (!existsSync(realPkgPath)) {
    console.warn(`[warn] real package missing: ${realPkgPath}`);
    continue;
  }
  makeSymlink(standalonePkgPath, realPkgPath);
  console.log(`✓ replaced .pnpm/${storeDir}/node_modules/${pkgName}`);
  replaced++;
}

// === Step 2: create top-level symlinks for externalized packages ===
const require = createRequire(join(APPS_WEB_ROOT, "package.json"));

function packageRoot(pkg) {
  const searchPaths = [APPS_WEB_ROOT, join(REPO_ROOT, "packages/core"), REPO_ROOT];
  try {
    const pkgJson = require.resolve(`${pkg}/package.json`, { paths: searchPaths });
    return dirname(pkgJson);
  } catch { /* fall through */ }
  try {
    const entry = require.resolve(pkg, { paths: searchPaths });
    let dir = dirname(entry);
    while (dir !== "/" && dir.length > 1) {
      const pj = join(dir, "package.json");
      if (existsSync(pj)) {
        try {
          const content = JSON.parse(readFileSync(pj, "utf-8"));
          if (content.name === pkg) return dir;
        } catch { /* ignore */ }
      }
      dir = dirname(dir);
    }
  } catch (err) {
    console.warn(`[warn] cannot resolve ${pkg}:`, err.message);
  }
  return null;
}

for (const pkg of TOP_LEVEL_PACKAGES) {
  const root = packageRoot(pkg);
  if (!root) continue;
  const linkPath = join(STANDALONE_ROOT, pkg);
  makeSymlink(linkPath, root);
  console.log(`✓ node_modules/${pkg} → ${root}`);
}

// === Step 3: ensure node-pty spawn-helper is executable ===
// pnpm strips the +x bit during extraction, which causes posix_spawnp to fail
// at runtime when node-pty tries to launch the shell.
const nodePtyPrebuilds = join(
  REPO_ROOT,
  "node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/prebuilds",
);
if (existsSync(nodePtyPrebuilds)) {
  for (const platDir of readdirSync(nodePtyPrebuilds)) {
    const helper = join(nodePtyPrebuilds, platDir, "spawn-helper");
    if (existsSync(helper)) {
      try {
        chmodSync(helper, 0o755);
        console.log(`✓ chmod +x ${platDir}/spawn-helper`);
      } catch (err) {
        console.warn(`[warn] chmod spawn-helper failed: ${err.message}`);
      }
    }
  }
}

console.log(
  `\nStandalone modules prepared: ${replaced} native packages replaced, top-level symlinks in place.`,
);
