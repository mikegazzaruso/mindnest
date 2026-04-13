"use client";

import { useRef, useState } from "react";

const ROLES = [
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder" },
  { value: "researcher", label: "Researcher" },
  { value: "student", label: "Student" },
  { value: "power-user", label: "Power User" },
  { value: "curious", label: "Just curious" },
];

const INPUT =
  "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors text-sm";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const loadedAt = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const f = e.currentTarget;
    const get = (name: string) =>
      (f.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        ?.value ?? "";

    const payload = {
      firstName: get("firstName"),
      email: get("email"),
      role: get("role"),
      useCase: get("useCase"),
      referral: get("referral"),
      website: get("website"), // honeypot
      _t: loadedAt.current,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok && json.error) {
        setStatus("error");
        setErrorMsg(json.error);
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🧠</div>
        <h3 className="text-xl font-semibold text-white mb-2">You&apos;re on the list.</h3>
        <p className="text-zinc-400 text-sm">
          We&apos;ll reach out with updates, tutorials, and early access news.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      {/* Honeypot — hidden from humans, bots fill it */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">First name *</label>
          <input name="firstName" type="text" required placeholder="Alex" className={INPUT} />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="alex@example.com"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">I am a… *</label>
        <select name="role" required defaultValue="" className={INPUT}>
          <option value="" disabled>
            Select your role
          </option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">
          What would you use NestBrain for?{" "}
          <span className="text-zinc-600">(optional)</span>
        </label>
        <textarea
          name="useCase"
          rows={3}
          placeholder="e.g. I want to build a knowledge base from research papers and meeting notes…"
          className={INPUT + " resize-none"}
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">
          How did you find us? <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          name="referral"
          type="text"
          placeholder="Twitter, a friend, Hacker News…"
          className={INPUT}
        />
      </div>

      {status === "error" && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {status === "loading" ? "Joining…" : "Join the waitlist →"}
      </button>
    </form>
  );
}
