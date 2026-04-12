import { contextBridge, ipcRenderer } from "electron";

// Mark HTML element so web UI can adjust for native chrome
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("is-desktop");
  if (process.platform === "darwin") {
    document.documentElement.classList.add("is-desktop-mac");
  }
});

interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface CreateTerminalResult {
  id: string;
  cwd: string;
}

contextBridge.exposeInMainWorld("mindnest", {
  isElectron: true,
  platform: process.platform,

  getBootstrap: () => ipcRenderer.invoke("mindnest:getBootstrap"),
  selectDirectory: () => ipcRenderer.invoke("mindnest:selectDirectory"),
  setupNestBrain: (parentPath: string) =>
    ipcRenderer.invoke("mindnest:setupNestBrain", parentPath),

  // File system
  fs: {
    list: (dirPath: string): Promise<FsEntry[]> =>
      ipcRenderer.invoke("mindnest:fs:list", dirPath),
    createDir: (dirPath: string): Promise<{ ok: true; path: string }> =>
      ipcRenderer.invoke("mindnest:fs:createDir", dirPath),
  },

  // Terminal
  terminal: {
    create: (opts: { cwd: string; cols?: number; rows?: number }): Promise<CreateTerminalResult> =>
      ipcRenderer.invoke("mindnest:terminal:create", opts),
    write: (id: string, data: string) =>
      ipcRenderer.send("mindnest:terminal:write", { id, data }),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send("mindnest:terminal:resize", { id, cols, rows }),
    kill: (id: string) => ipcRenderer.send("mindnest:terminal:kill", { id }),
    onData: (id: string, callback: (data: string) => void) => {
      const channel = `mindnest:terminal:data:${id}`;
      const handler = (_e: unknown, data: string) => callback(data);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.off(channel, handler);
    },
    onExit: (id: string, callback: (code: number) => void) => {
      const channel = `mindnest:terminal:exit:${id}`;
      const handler = (_e: unknown, code: number) => callback(code);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.off(channel, handler);
    },
  },
});
