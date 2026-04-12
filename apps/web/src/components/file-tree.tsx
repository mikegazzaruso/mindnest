"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";

interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface FileTreeProps {
  rootPath: string;
  onNewProject: () => void;
}

export function FileTree({ rootPath, onNewProject }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([rootPath, `${rootPath}/Projects`]),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const toggle = useCallback((path: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Auto refresh when window gains focus
  useEffect(() => {
    function onFocus() {
      refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <div className="flex-shrink-0 border-b border-sidebar-border">
      {/* Prominent New Project CTA */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-br from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white text-[12px] font-semibold rounded-lg shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Create a new project in NestBrain/Projects"
        >
          <Plus size={14} className="shrink-0" strokeWidth={3} />
          <span>New Project</span>
        </button>
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted/60 uppercase tracking-wider">
          NestBrain
        </span>
        <button
          onClick={refresh}
          className="p-1 text-muted/40 hover:text-muted hover:bg-card rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw size={11} />
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto pb-2 pr-1">
        <TreeNode
          key={refreshKey}
          path={rootPath}
          name="NestBrain"
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          isRoot
        />
      </div>
    </div>
  );
}

interface TreeNodeProps {
  path: string;
  name: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  isRoot?: boolean;
}

function TreeNode({
  path,
  name,
  depth,
  expanded,
  onToggle,
  isRoot,
}: TreeNodeProps) {
  const isOpen = expanded.has(path);
  const [children, setChildren] = useState<FsEntry[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined" || !window.mindnest) return;
    let cancelled = false;
    window.mindnest.fs.list(path).then((list) => {
      if (!cancelled) setChildren(list);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, path]);

  const indent = depth * 10;

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        className="w-full flex items-center gap-1 px-2 py-0.5 text-[12px] text-muted hover:text-foreground hover:bg-card rounded transition-colors"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        <ChevronRight
          size={11}
          className={`shrink-0 transition-transform ${
            isOpen ? "rotate-90" : ""
          } text-muted/50`}
        />
        {isOpen ? (
          <FolderOpen size={13} className="shrink-0 text-accent/70" />
        ) : (
          <Folder size={13} className="shrink-0 text-muted/50" />
        )}
        <span className={`truncate ${isRoot ? "font-semibold" : ""}`}>
          {name}
        </span>
      </button>
      {isOpen && children && (
        <div>
          {children.map((entry) =>
            entry.isDirectory ? (
              <TreeNode
                key={entry.path}
                path={entry.path}
                name={entry.name}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
              />
            ) : (
              <div
                key={entry.path}
                className="flex items-center gap-1 px-2 py-0.5 text-[12px] text-muted/60"
                style={{ paddingLeft: `${(depth + 1) * 10 + 8}px` }}
              >
                <div className="w-[11px] shrink-0" />
                <FileText size={13} className="shrink-0 text-muted/40" />
                <span className="truncate">{entry.name}</span>
              </div>
            ),
          )}
          {children.length === 0 && (
            <div
              className="text-[11px] text-muted/30 italic py-0.5"
              style={{ paddingLeft: `${(depth + 1) * 10 + 28}px` }}
            >
              empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}
