import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { NameCandidate, NameSource } from "../types";

/**
 * Loads any open datasets you have imported into `data/names/*.json`
 * (see `scripts/import-names.mjs`). Read once per server process and kept in
 * memory; a missing or malformed file is skipped, never fatal.
 */

const DATA_DIR = path.join(process.cwd(), "data", "names");

const candidateSchema = z.object({
  name: z.string().min(1).max(40),
  meaning: z.string().max(200).optional(),
  origin: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  gender: z.string().max(20).optional(),
  categories: z.array(z.string().max(30)).max(10).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  source: z.string().max(100).optional(),
  sourceUrl: z.string().url().optional(),
});

let cache: Promise<NameCandidate[]> | null = null;

async function loadAll(): Promise<NameCandidate[]> {
  let files: string[];
  try {
    files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const all: NameCandidate[] = [];
  for (const file of files) {
    try {
      const raw: unknown = JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8"));
      if (!Array.isArray(raw)) continue;
      for (const row of raw) {
        const parsed = candidateSchema.safeParse(row);
        if (parsed.success) {
          all.push({ source: `Imported: ${file}`, ...parsed.data });
        }
      }
    } catch (err) {
      console.warn(`[names] skipping unreadable dataset ${file}:`, (err as Error).message);
    }
  }
  return all;
}

export const localJsonSource: NameSource = {
  id: "local-json",
  load() {
    cache ??= loadAll();
    return cache;
  },
};
