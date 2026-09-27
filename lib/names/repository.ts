import "server-only";

import { normalizeNameKey } from "../validation";
import { curatedSource } from "./sources/curated";
import { datamuseSource } from "./sources/datamuse";
import { localJsonSource } from "./sources/local-json";
import type { CandidateQuery, NameCandidate, NameSource } from "./types";
import {
  CATEGORY_ALIASES,
  FEMININE_WORDS,
  MASCULINE_WORDS,
  ORIGIN_ALIASES,
  STYLE_ALIASES,
  tokenize,
} from "./vocabulary";

interface Preferences {
  origins: Set<string>;
  styles: Set<string>;
  visual: Set<string>;
  visualWords: Set<string>;
  category?: string;
  gender?: "feminine" | "masculine";
  wantsShort: boolean;
}

function readPreferences(query: CandidateQuery): Preferences {
  const specTokens = tokenize(query.specification);
  const visualTokens = query.keywords.flatMap(tokenize);

  const origins = new Set<string>();
  const styles = new Set<string>();
  const visual = new Set<string>();
  let specCategory: string | undefined;

  for (const t of specTokens) {
    ORIGIN_ALIASES[t]?.forEach((o) => origins.add(o));
    STYLE_ALIASES[t]?.forEach((s) => styles.add(s));
    specCategory ??= CATEGORY_ALIASES[t];
  }
  for (const t of visualTokens) {
    STYLE_ALIASES[t]?.forEach((s) => visual.add(s));
  }

  const feminine = specTokens.some((t) => FEMININE_WORDS.has(t));
  const masculine = specTokens.some((t) => MASCULINE_WORDS.has(t));

  return {
    origins,
    styles,
    visual,
    visualWords: new Set(visualTokens.filter((t) => t.length > 2)),
    // What the user says beats what the model guessed from the photo.
    category: specCategory ?? query.category,
    gender: feminine === masculine ? undefined : feminine ? "feminine" : "masculine",
    wantsShort: styles.has("short"),
  };
}

function score(c: NameCandidate, p: Preferences): number {
  let s = 0;
  const tags = c.tags ?? [];

  if (p.origins.size > 0) {
    s += c.origin && p.origins.has(c.origin) ? 6 : -3;
  }

  if (p.category) {
    if (c.categories?.includes(p.category)) s += 3;
    // Don't offer "Chonk" for a baby.
    else if (p.category === "person") s -= 5;
  }

  for (const style of p.styles) if (tags.includes(style)) s += 3;
  for (const v of p.visual) if (tags.includes(v)) s += 1.5;

  if (c.meaning && p.visualWords.size > 0) {
    for (const word of tokenize(c.meaning)) if (p.visualWords.has(word)) s += 2;
  }

  if (p.wantsShort) {
    const len = c.name.replace(/\s/g, "").length;
    if (len <= 5) s += 2;
    else if (len > 8) s -= 3;
  }

  if (p.gender && c.gender && c.gender !== "unisex" && c.gender !== p.gender) s -= 4;

  return s;
}

export class NameRepository {
  constructor(private readonly sources: NameSource[]) {}

  private async loadPool(query: CandidateQuery): Promise<Map<string, NameCandidate>> {
    const results = await Promise.allSettled(this.sources.map((s) => s.load(query)));
    const pool = new Map<string, NameCandidate>();
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`[names] source "${this.sources[i].id}" failed:`, r.reason);
        return;
      }
      for (const c of r.value) {
        const key = normalizeNameKey(c.name);
        if (key && !pool.has(key)) pool.set(key, c);
      }
    });
    return pool;
  }

  /**
   * Rank the pool against the request and return the top matches plus a few
   * random wildcards, so repeated requests don't return identical shortlists.
   */
  async findCandidates(query: CandidateQuery): Promise<NameCandidate[]> {
    const pool = await this.loadPool(query);
    const excluded = new Set(query.exclude.map(normalizeNameKey));
    const prefs = readPreferences(query);

    const ranked = [...pool.entries()]
      .filter(([key]) => !excluded.has(key))
      .map(([, c]) => ({ c, s: score(c, prefs) + Math.random() * 1.5 }))
      .sort((a, b) => b.s - a.s);

    const wildcardCount = Math.min(6, Math.floor(query.limit / 6));
    const top = ranked.slice(0, query.limit - wildcardCount);
    const rest = ranked.slice(top.length).filter((r) => r.s > 0);
    const wildcards = shuffle(rest).slice(0, wildcardCount);

    return [...top, ...wildcards].map((r) => r.c);
  }

  /** Exact lookup, used to back-fill meanings for names the model chose. */
  async lookup(names: string[]): Promise<Map<string, NameCandidate>> {
    const pool = await this.loadPool({ specification: "", keywords: [], exclude: [], limit: 0 });
    const found = new Map<string, NameCandidate>();
    for (const n of names) {
      const hit = pool.get(normalizeNameKey(n));
      if (hit) found.set(normalizeNameKey(n), hit);
    }
    return found;
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let repository: NameRepository | null = null;

export function getNameRepository(): NameRepository {
  if (!repository) {
    const sources: NameSource[] = [curatedSource, localJsonSource];
    if (process.env.NAME_SOURCE_DATAMUSE === "true") sources.push(datamuseSource);
    repository = new NameRepository(sources);
  }
  return repository;
}
