import { WaitlistForm } from "@/components/WaitlistForm";

const POLAR_URL =
  "https://buy.polar.sh/polar_cl_vUklKAvx1qFnOAULxY0OaUS7OI17d5x4S5kxs3av7iy";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-base tracking-tight">
            <span className="text-violet-400">Nest</span>Brain
          </span>
          <a
            href={POLAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Get NestBrain — $29
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="dot-grid relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Early Access · v0.10
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Your second brain,
            <br />
            <span className="gradient-text">powered by AI</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            NestBrain ingests your documents, articles, and notes — then uses AI
            to build a living, interconnected knowledge base you can search,
            query, and think with.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={POLAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold px-8 py-3.5 rounded-xl text-base"
            >
              Get NestBrain — $29
            </a>
            <a
              href="#waitlist"
              className="text-zinc-400 hover:text-white transition-colors font-medium px-8 py-3.5 rounded-xl text-base border border-zinc-700 hover:border-zinc-500"
            >
              Join the waitlist ↓
            </a>
          </div>

          <p className="mt-5 text-xs text-zinc-600">
            One-time purchase · No subscription · Mac (Apple Silicon) + Windows
          </p>
        </div>
      </section>

      {/* ── Pain points ────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: "📂",
              title: "Your knowledge is scattered",
              body: "Notion pages, browser bookmarks, downloaded PDFs, Slack threads. You've read it. You can't find it when it matters.",
            },
            {
              icon: "💬",
              title: "AI assistants forget everything",
              body: "ChatGPT starts from zero every session. No memory, no context, no connection between ideas. It knows nothing about your work.",
            },
            {
              icon: "⏱️",
              title: "Re-reading is wasted time",
              body: "The insight you need is in a tab you closed six months ago. NestBrain remembers everything — so you don't have to.",
            },
          ].map((p) => (
            <div key={p.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-zinc-400 mb-14">Three steps. Zero configuration. All yours.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Ingest",
                body: "Drop in URLs, PDFs, Markdown files, GitHub repos, or plain text. NestBrain pulls everything in.",
              },
              {
                step: "02",
                title: "Compile",
                body: "The AI reads every source and builds a structured, interlinked wiki. Concepts connect. Gaps surface automatically.",
              },
              {
                step: "03",
                title: "Ask & Explore",
                body: "Ask questions, get cited answers. Browse the knowledge graph. Your second brain — always ready, always growing.",
              },
            ].map((s) => (
              <div key={s.step} className="relative text-left">
                <div className="text-5xl font-black text-zinc-800 mb-4 select-none">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for people who think deeply
            </h2>
            <p className="text-zinc-400">Whatever your role, NestBrain adapts to you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "💻",
                role: "Developers",
                body: "Build a technical knowledge base from docs, RFCs, codebases, and research papers. Ask questions about your own stack — and get answers backed by your own sources.",
                tags: ["Documentation", "Repos", "RFCs"],
              },
              {
                icon: "🚀",
                role: "Founders",
                body: "Turn market research, competitor analysis, investor decks, and meeting notes into structured intelligence. Stop re-reading the same reports.",
                tags: ["Research", "Strategy", "Meetings"],
              },
              {
                icon: "🧠",
                role: "Power Users & AI-curious",
                body: "If you've used ChatGPT and wondered \"what if it actually remembered everything I've ever read?\" — this is exactly that. For people who take their thinking seriously.",
                tags: ["PKM", "Notes", "Learning"],
              },
            ].map((p) => (
              <div
                key={p.role}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col"
              >
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{p.role}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed flex-1">{p.body}</p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-zinc-400 mb-10">Pay once. Own it forever.</p>

          <div className="bg-zinc-900 border border-violet-800/50 rounded-2xl p-8">
            <div className="text-5xl font-black text-white mb-1">$29</div>
            <div className="text-zinc-500 text-sm mb-8">one-time · no subscription</div>

            <ul className="space-y-3 text-sm text-zinc-300 mb-8 text-left">
              {[
                "Signed & notarized Mac app (Apple Silicon)",
                "Windows x64 installer",
                "All future updates included",
                "Local-first — your data stays yours",
                "Full Claude AI integration",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-violet-400 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={POLAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold py-3.5 rounded-xl text-center"
            >
              Get NestBrain →
            </a>
          </div>
        </div>
      </section>

      {/* ── Waitlist ───────────────────────────────────────── */}
      <section id="waitlist" className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Not ready to buy?</h2>
          <p className="text-zinc-400 mb-10">
            Join the waitlist. Get early access news, tutorials, and a launch discount.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 py-8 px-6 text-center text-zinc-600 text-xs">
        <p>
          © 2026 NextEpochs ·{" "}
          <a href="https://nestbrain.app" className="hover:text-zinc-400 transition-colors">
            nestbrain.app
          </a>
        </p>
      </footer>
    </div>
  );
}
