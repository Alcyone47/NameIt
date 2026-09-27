import "server-only";

import { createHash } from "node:crypto";

/**
 * Minimal fixed-window rate limiter held in process memory. Clients are keyed
 * by a salted hash of their IP, so raw addresses are never kept, and entries
 * expire with their window.
 *
 * On multi-instance/serverless deployments each instance counts separately;
 * swap this for a shared store (e.g. Redis/Upstash) if that matters.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const salt = crypto.randomUUID();

const LIMIT = Number(process.env.RATE_LIMIT_MAX) || 10;
const WINDOW_MS = (Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now();
  if (windows.size > 10_000) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
  }

  const key = createHash("sha256").update(salt).update(clientId).digest("base64url");
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count++;
  return {
    allowed: current.count <= LIMIT,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}

export function clientIdFrom(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
