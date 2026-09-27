# Imported name datasets

Any `*.json` file in this folder is loaded at server start and merged with the
built-in curated list (`lib/names/data/curated.ts`). Each file is an array of
`NameCandidate` objects:

```json
[{ "name": "Mochi", "meaning": "Rice cake", "origin": "Japanese", "tags": ["cute"], "categories": ["pet", "toy"], "source": "…", "sourceUrl": "…" }]
```

Create one from a CSV with `node scripts/import-names.mjs input.csv my-dataset --source "Dataset name" --url https://…`.
Only import data whose licence permits it.
