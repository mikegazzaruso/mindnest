import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/db";

// In-memory rate limiter — persists for the lifetime of the container process.
// Single-container deployment, so this is sufficient.
const rl = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW = 60 * 60 * 1000; // 1 hour
const RL_MAX = 3;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function allowed(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + RL_WINDOW });
    return true;
  }
  if (e.count >= RL_MAX) return false;
  e.count++;
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!allowed(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields, humans don't
  if (body.website) {
    return NextResponse.json({ ok: true }); // silent discard
  }

  // Time check — reject submissions faster than 3 s (bot behavior)
  const loadedAt = Number(body._t ?? 0);
  if (!loadedAt || Date.now() - loadedAt < 3000) {
    return NextResponse.json({ ok: true }); // silent discard
  }

  const firstName = String(body.firstName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "").trim();
  const useCase = String(body.useCase ?? "").trim() || undefined;
  const referral = String(body.referral ?? "").trim() || undefined;

  if (!firstName || !email || !role) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    await insertLead({ firstName, email, role, useCase, referral, ip });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "This email is already on the waitlist." },
        { status: 409 }
      );
    }
    console.error("[waitlist]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
