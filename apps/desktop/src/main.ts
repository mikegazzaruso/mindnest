import {
  app,
  BrowserWindow,
  shell,
  Menu,
  ipcMain,
  dialog,
  utilityProcess,
  UtilityProcess,
} from "electron";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import * as pty from "node-pty";

const isDev = !!process.env.MINDNEST_DEV;
const DEV_URL = "http://localhost:3000";

// Must be set before app is ready so the menu bar shows "MindNest" not "Electron"
app.setName("MindNest");

let mainWindow: BrowserWindow | null = null;
let nextServer: UtilityProcess | null = null;
let serverUrl: string | null = null;
let currentPort: number | null = null;

const NESTBRAIN_SUBDIRS = [
  "Business",
  "Context",
  "Daily",
  "Library",
  "Projects",
  "Skills",
  "Team",
];

interface Bootstrap {
  nestBrainPath?: string;
}

function getBootstrapPath(): string {
  return join(app.getPath("userData"), "bootstrap.json");
}

function readBootstrap(): Bootstrap {
  try {
    const raw = readFileSync(getBootstrapPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeBootstrap(b: Bootstrap): void {
  const p = getBootstrapPath();
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify(b, null, 2), "utf-8");
}

function getDataDir(): string {
  const bootstrap = readBootstrap();
  if (bootstrap.nestBrainPath && existsSync(bootstrap.nestBrainPath)) {
    const dir = join(bootstrap.nestBrainPath, ".mindnest");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }
  // First-run fallback
  const dir = join(app.getPath("userData"), "data-tmp");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getWikiDir(): string | null {
  const bootstrap = readBootstrap();
  if (bootstrap.nestBrainPath && existsSync(bootstrap.nestBrainPath)) {
    const dir = join(bootstrap.nestBrainPath, "Library", "Knowledge");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }
  return null;
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get free port"));
      }
    });
  });
}

async function startNextServer(reusePort = false): Promise<string> {
  const port = reusePort && currentPort ? currentPort : await findFreePort();
  currentPort = port;
  const dataDir = getDataDir();
  const wikiDir = getWikiDir();

  const resourcesRoot = app.isPackaged
    ? join(process.resourcesPath, "web")
    : join(__dirname, "../../web/.next/standalone");

  const serverJs = join(resourcesRoot, "apps/web/server.js");

  if (!existsSync(serverJs)) {
    throw new Error(`Next.js standalone server not found at: ${serverJs}`);
  }

  nextServer = utilityProcess.fork(serverJs, [], {
    cwd: join(resourcesRoot, "apps/web"),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      MINDNEST_DATA_DIR: dataDir,
      ...(wikiDir ? { MINDNEST_WIKI_DIR: wikiDir } : {}),
      NODE_ENV: "production",
    },
    stdio: "pipe",
    serviceName: "mindnest-next-server",
  });

  nextServer.stdout?.on("data", (d: Buffer) =>
    console.log("[next]", d.toString().trim()),
  );
  nextServer.stderr?.on("data", (d: Buffer) =>
    console.error("[next]", d.toString().trim()),
  );
  nextServer.on("exit", (code: number) => {
    console.log(`[next] exited with code ${code}`);
    // Only quit if the main window closed. If we killed it for a restart, don't quit.
    if (!shuttingDown && mainWindow && !mainWindow.isDestroyed()) {
      // Server died unexpectedly — leave window open with whatever is cached
    }
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url, 30000);
  return url;
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Next.js server did not start within ${timeoutMs}ms`);
}

let shuttingDown = false;

function killNextServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!nextServer) return resolve();
    const srv = nextServer;
    nextServer = null;
    srv.once("exit", () => resolve());
    try {
      srv.kill();
    } catch {
      resolve();
    }
    // Safety timeout
    setTimeout(resolve, 2000);
  });
}

async function restartNextServer(): Promise<void> {
  await killNextServer();
  // Give the OS a moment to release the port (TIME_WAIT)
  await new Promise((r) => setTimeout(r, 300));
  // Reuse the same port so the renderer's API calls transparently hit the new server
  // without requiring a page reload (which would wipe React state mid-onboarding)
  let attempts = 0;
  while (attempts < 5) {
    try {
      serverUrl = await startNextServer(true);
      return;
    } catch (err) {
      attempts++;
      if (attempts >= 5) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = isDev ? DEV_URL : serverUrl;
  if (url) mainWindow.loadURL(url);
}

function setupMenu(): void {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// === IPC handlers ===
ipcMain.handle("mindnest:getBootstrap", () => {
  return {
    ...readBootstrap(),
    isElectron: true,
    platform: process.platform,
  };
});

ipcMain.handle("mindnest:selectDirectory", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose where to create NestBrain",
    properties: ["openDirectory", "createDirectory"],
    buttonLabel: "Select",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// === Terminal (PTY) session management ===
interface PtySession {
  proc: pty.IPty;
  cwd: string;
}
const ptySessions = new Map<string, PtySession>();
let nextSessionId = 1;

function getShell(): { shell: string; args: string[] } {
  if (process.platform === "win32") {
    return { shell: process.env.ComSpec || "powershell.exe", args: [] };
  }
  // Prefer the user's configured shell; fall back to common shells that
  // actually exist on the system.
  const candidates = [
    process.env.SHELL,
    "/bin/zsh",
    "/bin/bash",
    "/bin/sh",
  ].filter((s): s is string => !!s);
  for (const s of candidates) {
    if (existsSync(s)) {
      return { shell: s, args: ["-l"] };
    }
  }
  return { shell: "/bin/sh", args: [] };
}

function sanitizeEnv(): Record<string, string> {
  // node-pty requires all env values to be strings. Electron's process.env
  // may contain non-string or undefined values that make posix_spawnp fail.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") out[k] = v;
  }
  // Drop Electron-specific vars that shouldn't leak into the user shell
  for (const k of [
    "ELECTRON_RUN_AS_NODE",
    "ELECTRON_NO_ATTACH_CONSOLE",
    "NODE_OPTIONS",
  ]) {
    delete out[k];
  }
  out.TERM = "xterm-256color";
  out.COLORTERM = "truecolor";
  return out;
}

ipcMain.handle(
  "mindnest:terminal:create",
  (_e, { cwd, cols = 80, rows = 24 }: { cwd: string; cols?: number; rows?: number }) => {
    if (!existsSync(cwd)) {
      throw new Error(`cwd does not exist: ${cwd}`);
    }
    const { shell: shellPath, args } = getShell();
    console.log(`[pty] spawning shell=${shellPath} args=${JSON.stringify(args)} cwd=${cwd}`);
    const id = `t${nextSessionId++}`;
    let proc: pty.IPty;
    try {
      proc = pty.spawn(shellPath, args, {
        name: "xterm-256color",
        cols,
        rows,
        cwd,
        env: sanitizeEnv(),
      });
    } catch (err) {
      console.error(`[pty] spawn failed:`, err);
      throw new Error(
        `Failed to spawn shell ${shellPath}: ${err instanceof Error ? err.message : err}`,
      );
    }

    proc.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`mindnest:terminal:data:${id}`, data);
      }
    });
    proc.onExit(({ exitCode }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`mindnest:terminal:exit:${id}`, exitCode);
      }
      ptySessions.delete(id);
    });

    ptySessions.set(id, { proc, cwd });
    return { id, cwd };
  },
);

ipcMain.on(
  "mindnest:terminal:write",
  (_e, { id, data }: { id: string; data: string }) => {
    const sess = ptySessions.get(id);
    if (sess) sess.proc.write(data);
  },
);

ipcMain.on(
  "mindnest:terminal:resize",
  (_e, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    const sess = ptySessions.get(id);
    if (sess) {
      try {
        sess.proc.resize(cols, rows);
      } catch {
        /* process may have already exited */
      }
    }
  },
);

ipcMain.on("mindnest:terminal:kill", (_e, { id }: { id: string }) => {
  const sess = ptySessions.get(id);
  if (sess) {
    try {
      sess.proc.kill();
    } catch {
      /* ignore */
    }
    ptySessions.delete(id);
  }
});

// === Directory listing (for file tree) ===
interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

function isHiddenOrIgnored(name: string): boolean {
  return (
    name.startsWith(".") ||
    name === "node_modules" ||
    name === ".mindnest"
  );
}

ipcMain.handle(
  "mindnest:fs:list",
  (_e, dirPath: string): FsEntry[] => {
    if (!existsSync(dirPath)) return [];
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter((e) => !isHiddenOrIgnored(e.name))
        .map((e) => ({
          name: e.name,
          path: join(dirPath, e.name),
          isDirectory: e.isDirectory(),
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    } catch {
      return [];
    }
  },
);

ipcMain.handle(
  "mindnest:fs:createDir",
  (_e, dirPath: string): { ok: true; path: string } => {
    mkdirSync(dirPath, { recursive: true });
    return { ok: true, path: dirPath };
  },
);

ipcMain.handle("mindnest:setupNestBrain", async (_e, parentPath: string) => {
  if (!parentPath || typeof parentPath !== "string") {
    throw new Error("Invalid parent path");
  }
  const nestBrainPath = join(parentPath, "NestBrain");
  mkdirSync(nestBrainPath, { recursive: true });
  for (const sub of NESTBRAIN_SUBDIRS) {
    mkdirSync(join(nestBrainPath, sub), { recursive: true });
  }
  // MindNest-generated wiki lives inside the user-visible Library folder
  mkdirSync(join(nestBrainPath, "Library", "Knowledge"), { recursive: true });
  // .mindnest holds internal state (raw sources, settings, vector index)
  mkdirSync(join(nestBrainPath, ".mindnest"), { recursive: true });

  writeBootstrap({ nestBrainPath });
  // Restart Next.js server so it picks up the new data dir
  await restartNextServer();
  return { nestBrainPath };
});

app.whenReady().then(async () => {
  if (process.platform === "darwin" && !app.isPackaged && app.dock) {
    try {
      const iconPath = join(__dirname, "../build/icon.png");
      if (existsSync(iconPath)) app.dock.setIcon(iconPath);
    } catch {
      /* ignore */
    }
  }

  // About panel (shown by the "About MindNest" menu item on macOS)
  const aboutIconPath = app.isPackaged
    ? join(process.resourcesPath, "icon.png")
    : join(__dirname, "../build/icon.png");
  app.setAboutPanelOptions({
    applicationName: "MindNest",
    applicationVersion: "0.9.1",
    version: "0.9.1",
    copyright: "Copyright © 2026 NextEpochs. All rights reserved.",
    credits:
      "Created by Mike Gazzaruso (NextEpochs) in 2026.\n\nLLM‑powered personal knowledge base with an integrated workspace.",
    authors: ["Mike Gazzaruso"],
    website: "https://github.com/mikegazzaruso/MindNest",
    ...(existsSync(aboutIconPath) ? { iconPath: aboutIconPath } : {}),
  });

  setupMenu();
  try {
    if (!isDev) {
      serverUrl = await startNextServer();
    }
    createWindow();
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  shuttingDown = true;
  killNextServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  shuttingDown = true;
  killNextServer();
});
