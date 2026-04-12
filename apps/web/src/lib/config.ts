import { resolve } from "node:path";

export function getDataDir(): string {
  if (process.env.MINDNEST_DATA_DIR) {
    return resolve(process.env.MINDNEST_DATA_DIR);
  }
  return resolve(process.cwd(), "../../data");
}

export function getDataPaths() {
  const base = getDataDir();
  // Wiki is persisted in the user-visible NestBrain/Library/Knowledge folder
  // when running inside the Electron app. Fall back to $DATA_DIR/wiki for
  // the web/dev mode where no NestBrain layout exists.
  const wikiPath = process.env.MINDNEST_WIKI_DIR
    ? resolve(process.env.MINDNEST_WIKI_DIR)
    : resolve(base, "wiki");
  return {
    rawPath: resolve(base, "raw"),
    wikiPath,
  };
}
