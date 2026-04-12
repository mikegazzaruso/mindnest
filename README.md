# MindNest

**LLM-powered personal knowledge base — now as a native Mac/Windows app.** Raw sources go in, a structured Markdown wiki comes out — compiled, linked, and maintained entirely by AI, inside a dedicated workspace with an integrated terminal.

![MindNest](https://img.shields.io/badge/status-Native_App-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![License](https://img.shields.io/badge/license-GPL--3.0-blue)

---

## What is MindNest?

MindNest ingests raw documents — articles, papers, PDFs, GitHub repos, arXiv papers, YouTube transcripts, RSS feeds — and uses an LLM to compile them into an interconnected wiki of Markdown files. Everything lives inside a **NestBrain** workspace directory on your disk, browsable through a stunning dark-mode native UI, compatible with Obsidian, and queryable via natural language.

**You feed sources. The LLM builds the knowledge base. You explore it.**

### Key Features

#### Native desktop app
- **Cross‑platform** — Packaged as a native macOS (DMG) and Windows (NSIS) application via Electron wrapping a Next.js standalone server
- **NestBrain workspace** — On first run, the app asks where to create your `NestBrain/` directory with a scaffold of `Business/`, `Context/`, `Daily/`, `Library/`, `Projects/`, `Skills/`, `Team/`. The compiled wiki lives in `Library/Knowledge/`
- **Guided onboarding** — 6‑step first‑run flow: welcome → explanation → directory picker → LLM provider setup → interactive first ingest → compile guide with celebration
- **VS Code‑style file tree** — Foldable sidebar explorer rooted at NestBrain, always in sync with disk
- **Integrated terminal** — Real PTY terminal (xterm.js + node‑pty) inside the app, with multi‑session tabs, resizable bottom panel, and always‑available toggle in the status bar. Launches a full shell (zsh/cmd) per project
- **New Project button** — Creates `NestBrain/Projects/<name>` and immediately opens a terminal session cwd’d into it
- **Custom About panel** — Native macOS About dialog with author, copyright, version and icon

#### Knowledge base engine
- **Ingest** — Paste a URL or upload files. Supports web pages, PDFs, GitHub repos, arXiv papers, YouTube transcripts, and RSS feeds. Duplicate‑source detection with confirmation dialog
- **Compile** — The LLM summarizes sources, extracts concepts, creates wiki articles with `[[wikilinks]]`, and builds a navigable knowledge graph. Compilation is incremental and scales to hundreds of sources. Optional **auto‑compile** after every ingest
- **Browse** — Wikipedia‑style wiki browser with navigable wikilinks, backlinks panel, tags, breadcrumbs, and article translation (12 languages)
- **Mind Map** — Interactive radial visualization of concepts and their connections. Zoom, pan, click to navigate
- **Ask** — Query your knowledge base in natural language. Answers are grounded in your wiki via hybrid semantic + keyword search, with filtered citations. Responds in the language you ask in
- **Search** — Hybrid search combining local semantic embeddings (all‑MiniLM‑L6‑v2) and weighted keyword search, normalized so semantic dominates
- **Health Check** — LLM‑powered wiki auditing: finds orphans, broken links, stubs, inconsistencies, and suggests new articles
- **Translate** — Every wiki article can be translated on‑the‑fly to 12 languages via LLM
- **Dark/Light Mode** — Toggle between dark and light themes
- **Obsidian Compatible** — `Library/Knowledge/` is a valid Obsidian vault. Open it anytime
- **CLI** — Full command-line interface alongside the desktop app: `ingest`, `compile`, `ask`, `search`, `lint`, `serve`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 33 + electron‑builder |
| Language | TypeScript (monorepo) |
| Frontend | Next.js 16 (App Router, standalone build) |
| Styling | Tailwind CSS |
| Terminal | xterm.js + node‑pty |
| Embeddings | Local model via @huggingface/transformers (all‑MiniLM‑L6‑v2) |
| LLM | Claude CLI (Max subscription) or OpenAI API |
| Diagrams | Mermaid (rendered inline in articles) |
| Monorepo | Turborepo + pnpm |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Claude CLI authenticated (`claude auth login`) **or** an OpenAI API key

### Run the native desktop app (development)

```bash
git clone git@github.com:mikegazzaruso/MindNest.git
cd MindNest
pnpm install
pnpm desktop:build
pnpm --filter @mindnest/desktop start
```

On first launch the onboarding flow walks you through creating your NestBrain workspace and choosing an LLM provider.

### Package a distributable binary

```bash
pnpm desktop:package:mac    # → apps/desktop/release/*.dmg
pnpm desktop:package:win    # → apps/desktop/release/*.exe (NSIS)
```

### Run the web UI (legacy/dev mode)

```bash
pnpm install
pnpm build
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
MindNest/
├── apps/
│   ├── desktop/            # Electron main process, preload, icons, packaging
│   │   ├── src/main.ts     # PTY manager, IPC, Next.js standalone wrapper
│   │   ├── src/preload.ts  # contextBridge API exposed to the renderer
│   │   └── build/          # Icon pipeline (.icns/.ico/.png) + prebuild helpers
│   └── web/                # Next.js application (frontend + API)
│       ├── src/app/        # Pages: wiki, mindmap, search, ask, ingest, health, settings
│       ├── src/components/ # Sidebar, file tree, terminal, onboarding, new‑project modal
│       └── src/lib/        # Terminal/compile/theme contexts, native loader, settings
├── packages/
│   ├── core/               # Business logic
│   │   ├── ingest/         # URL, PDF, markdown, GitHub, arXiv, YouTube, RSS
│   │   ├── compiler/       # Wiki compilation with incremental tracking
│   │   ├── qa/             # Q&A with hybrid search + citation filtering
│   │   ├── search/         # Semantic + keyword hybrid search (normalized)
│   │   ├── lint/           # Wiki health checks
│   │   ├── llm/            # Provider abstraction (Claude CLI, OpenAI)
│   │   └── vectorstore/    # Local embeddings + cosine similarity search
│   ├── shared/             # Shared types and constants
│   ├── db/                 # Vector DB layer
│   └── cli/                # CLI entry point (all commands functional)
├── NestBrain/              # User workspace (created during onboarding)
│   ├── Business/
│   ├── Context/
│   ├── Daily/
│   ├── Library/
│   │   └── Knowledge/      # Compiled wiki (Obsidian‑compatible)
│   ├── Projects/           # Per‑project directories with integrated terminals
│   ├── Skills/
│   ├── Team/
│   └── .mindnest/          # Internal state (raw sources, settings, vector index)
└── docker/                 # Docker configuration (web mode)
```

---

## How It Works

```
URL / PDF / GitHub / arXiv            Compiled Wiki
YouTube / RSS / .md                        │
     │                                     ▼
     ▼                              ┌──────────────┐
┌─────────┐    ┌──────────┐   ┌───▶│  Wiki Files  │
│  Ingest  │───▶│ Compile  │───┤    │   (.md)      │
│ Pipeline │    │  (LLM)   │   │    └──────┬───────┘
└─────────┘    └──────────┘   │           │
                              │     ┌─────┼──────────────┐
                              │     ▼     ▼              ▼
                              │  ┌─────┐ ┌──────┐ ┌──────────┐
                              │  │Wiki │ │Mind  │ │  Health   │
                              │  │View │ │Map   │ │  Check    │
                              │  └─────┘ └──────┘ └──────────┘
                              │
                              └───▶ Vector Index
                                        │
                              ┌─────────┘
                              ▼
                       ┌────────────┐
                       │  Hybrid    │
                       │  Search    │──▶ Q&A ──▶ Auto‑saved to wiki
                       └────────────┘
```

### Ingest
URLs are fetched and converted to Markdown (Readability + Turndown). PDFs are text‑extracted. GitHub repos pull README + key files + file tree. arXiv papers download and extract the full PDF. YouTube fetches transcripts. RSS feeds ingest multiple entries. Everything lands in `NestBrain/.mindnest/raw/`. Duplicate sources are detected and require confirmation.

### Compile
The LLM processes **only new/changed sources** (incremental). For each new source:
1. Generates a summary article
2. Extracts concepts from **only the new summary**
3. Writes articles for **new concepts only**, passing existing concept names for cross‑linking
4. Embeds each article into the local vector index
5. Regenerates the master index and concept map

Cost: ~3‑5 LLM calls per new source, regardless of total wiki size. With auto‑compile enabled this runs automatically after every ingest.

### Search
Hybrid approach running in parallel, with scores **normalized to [0,1]** before being combined:
- **Semantic search** (weight 0.7) — query embedded via all‑MiniLM‑L6‑v2, cosine similarity against the vector index
- **Keyword search** (weight 0.3) — weighted scoring (title 5x, filename 3x, content 1x) with stop‑word filtering (EN + IT)

### Q&A
1. Hybrid search finds top relevant articles
2. Article bodies passed to LLM as context
3. LLM answers **in the user's language**
4. Citations filtered to only those actually referenced in the answer
5. Answer auto‑saved to `Library/Knowledge/outputs/`

### Integrated terminal
The Electron main process runs real PTY sessions via node‑pty. Each session is tied to a `BrowserWindow` and streamed over IPC to an xterm.js frontend. Tabs, resize, keep‑alive on hide, and a status‑bar toggle are all first‑class.

### Health Check
Automated wiki auditing: orphan detection, broken link detection, stub/empty article detection, gap analysis, LLM‑powered inconsistency detection, health score dashboard.

---

## Supported Ingest Sources

| Source | Example | What's Extracted |
|--------|---------|-----------------|
| Web URL | `https://example.com/article` | Clean article text + images |
| PDF | Upload `.pdf` file | Full text extraction |
| Markdown | Upload `.md` file | Direct copy with frontmatter |
| GitHub | `https://github.com/user/repo` | README, key files, file tree, metadata |
| arXiv | `https://arxiv.org/abs/2301.00001` | Abstract, full paper text, metadata |
| YouTube | `https://youtube.com/watch?v=...` | Auto‑generated transcript |
| RSS | `https://example.com/feed.xml` | Latest entries as individual sources |

---

## LLM Providers

### Claude (default)
Uses your Claude Max subscription via the CLI. No API costs, no bans — the native app talks to the CLI in the background.

```bash
claude auth login  # authenticate once
```

### OpenAI
Uses the OpenAI API. Configure in Settings.

Supports all models: GPT‑4o, GPT‑4 Turbo, GPT‑5, o1, o3, o4 series. The provider automatically handles `max_tokens` vs `max_completion_tokens` and `system` vs `developer` role differences.

---

## CLI

All commands are fully functional alongside the desktop app:

```bash
mindnest ingest <source>       # Ingest any supported source
mindnest compile               # Compile wiki (incremental)
mindnest compile --force       # Recompile everything
mindnest ask "your question"   # Ask with citations
mindnest search "query"        # Hybrid search
mindnest lint                  # Run health check
mindnest serve                 # Start web UI
```

---

## Configuration

Settings are managed through the **Settings** page in the app. They are persisted in `NestBrain/.mindnest/settings.json`, which includes:

- LLM provider (Claude CLI / OpenAI) + model
- OpenAI API key
- Auto‑compile toggle
- Onboarding completion flag
- Danger‑zone wipe

---

## Obsidian Integration

`NestBrain/Library/Knowledge/` is a fully compatible Obsidian vault:

- `[[wikilinks]]` work natively
- YAML frontmatter on every article
- Images with relative paths
- Graph view shows concept connections

Just open `NestBrain/Library/Knowledge/` as a vault in Obsidian — you can work on the same knowledge base from both MindNest and Obsidian simultaneously.

---

## Author

Created by **Mike Gazzaruso** ([NextEpochs](https://github.com/mikegazzaruso)) in 2026.
Copyright © 2026 NextEpochs. All rights reserved.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
