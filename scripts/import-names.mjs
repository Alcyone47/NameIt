#!/usr/bin/env node
/**
 * Convert an open name dataset (CSV) into NameIt's JSON format.
 *
 *   node scripts/import-names.mjs <input.csv> <output-name> [--source "Name"] [--url https://...]
 *
 * The CSV needs a header row. Recognised columns (any order, case-insensitive):
 *   name (required), meaning, origin, language, gender, categories, tags
 * `categories` and `tags` are separated by ";" or "|".
 * Output goes to data/names/<output-name>.json and is picked up automatically.
 *
 * Only import data whose licence allows it, and keep the licence/attribution
 * in the `source`/`sourceUrl` fields.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const [input, outName, ...rest] = process.argv.slice(2);
if (!input || !outName) {
  console.error("Usage: node scripts/import-names.mjs <input.csv> <output-name> [--source NAME] [--url URL]");
  process.exit(1);
}
const flag = (f) => {
  const i = rest.indexOf(f);
  return i >= 0 ? rest[i + 1] : undefined;
};

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

const [header, ...rows] = parseCsv(readFileSync(input, "utf8"));
const cols = header.map((h) => h.trim().toLowerCase());
const col = (r, name) => {
  const i = cols.indexOf(name);
  return i >= 0 ? (r[i] ?? "").trim() : "";
};
const list = (v) => v.split(/[;|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);

const seen = new Set();
const out = [];
for (const r of rows) {
  const name = col(r, "name");
  if (!name || name.length > 40 || seen.has(name.toLowerCase())) continue;
  seen.add(name.toLowerCase());
  const entry = { name };
  for (const key of ["meaning", "origin", "language", "gender"]) {
    const v = col(r, key);
    if (v) entry[key] = v.slice(0, key === "meaning" ? 200 : 40);
  }
  const categories = list(col(r, "categories"));
  const tags = list(col(r, "tags"));
  if (categories.length) entry.categories = categories.slice(0, 10);
  if (tags.length) entry.tags = tags.slice(0, 20);
  if (flag("--source")) entry.source = flag("--source");
  if (flag("--url")) entry.sourceUrl = flag("--url");
  out.push(entry);
}

const dir = path.join(process.cwd(), "data", "names");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${outName.replace(/[^a-z0-9_-]/gi, "")}.json`);
writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(`Imported ${out.length} names → ${path.relative(process.cwd(), file)}`);
