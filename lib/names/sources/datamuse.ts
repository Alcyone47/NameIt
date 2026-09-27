import "server-only";

import type { CandidateQuery, NameCandidate, NameSource } from "../types";

/**
 * Optional external source: the free, key-less Datamuse word API
 * (https://www.datamuse.com/api/). Given visual keywords like "fluffy" or
 * "cloud" it returns related words, which often make charming names.
 *
 * Opt-in via NAME_SOURCE_DATAMUSE=true. Only derived keywords (never the image
 * or the user's text) are sent. Results are cached in memory, requests are
 * capped per query and time out fast, and any failure yields no results.
 */

const ENDPOINT = "https://api.datamuse.com/words";
const TIMEOUT_MS = 2000;
const MAX_KEYWORDS = 3;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

const cache = new Map<string, { at: number; names: NameCandidate[] }>();

async function relatedWords(keyword: string): Promise<NameCandidate[]> {
  const hit = cache.get(keyword);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.names;

  const url = `${ENDPOINT}?ml=${encodeURIComponent(keyword)}&max=12`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return [];

  const words = (await res.json()) as Array<{ word?: unknown }>;
  const names: NameCandidate[] = words
    .map((w) => (typeof w.word === "string" ? w.word : ""))
    .filter((w) => /^[a-z]{3,10}$/.test(w))
    .map((w) => ({
      name: w[0].toUpperCase() + w.slice(1),
      meaning: `An English word related to “${keyword}”`,
      origin: "English",
      language: "English",
      tags: ["word", keyword],
      source: "Datamuse",
      sourceUrl: "https://www.datamuse.com/api/",
    }));

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(keyword, { at: Date.now(), names });
  return names;
}

export const datamuseSource: NameSource = {
  id: "datamuse",
  async load(query: CandidateQuery) {
    const keywords = [...new Set(query.keywords.map((k) => k.toLowerCase()))]
      .filter((k) => /^[a-z]{3,20}$/.test(k))
      .slice(0, MAX_KEYWORDS);
    const settled = await Promise.allSettled(keywords.map(relatedWords));
    return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },
};
