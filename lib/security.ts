import "server-only";

/**
 * The API is only meant to be called by NameIt's own pages. We don't send any
 * CORS headers (so browsers block cross-origin reads) and additionally reject
 * cross-site POSTs outright so they can't burn model quota.
 *
 * Extra origins (e.g. a separate frontend) can be allowed with
 * ALLOWED_ORIGINS=https://a.example,https://b.example
 */
export function isAllowedOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");

  if (!origin) {
    // Non-browser clients send no Origin. Browsers always do on cross-site
    // POSTs, and label them via Sec-Fetch-Site.
    return headers.get("sec-fetch-site") !== "cross-site";
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {
    return false;
  }

  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}
