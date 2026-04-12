"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, Loader2, X } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string) => Promise<void>;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9._-][a-zA-Z0-9._ -]*$/.test(trimmed)) {
      setError("Use letters, numbers, spaces, dashes, underscores or dots.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
    setBusy(false);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-[90%] mx-4 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
              <FolderPlus size={18} className="text-white" />
            </div>
            <h3 className="text-base font-semibold">New Project</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted/40 hover:text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-2">
            Project name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-awesome-project"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 font-mono"
            disabled={busy}
          />
          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg hover:bg-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="px-5 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
