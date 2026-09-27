import "server-only";

import { AIProviderError, type ImageInput, type NameRecommendation } from "../ai/provider";
import { getVisionModel } from "../ai/vision-model";
import { getNameRepository } from "../names/repository";
import type { NameCandidate } from "../names/types";
import type { GenerateNamesResponse, ImageAnalysis, NameSuggestion } from "../types";
import { DEFAULT_SPECIFICATION, normalizeNameKey, sanitizeName } from "../validation";

const SUGGESTION_COUNT = 10;
const MIN_SUGGESTIONS = 4;
const CANDIDATE_POOL_SIZE = 60;

export interface GenerateNamesInput {
  image: ImageInput;
  specification: string;
  exclude: string[];
  /** Re-used from a previous response ("Give me more") to skip re-analysis. */
  analysis?: ImageAnalysis;
}

/**
 * The naming pipeline:
 *   1. understand the photo      (vision model)
 *   2. retrieve real names       (name repository)
 *   3. choose & explain          (vision model, grounded in the candidates)
 *   4. validate & enrich         (dataset meanings override model guesses)
 *
 * Nothing here persists anything. The image lives only in `input.image`.
 */
export async function generateNameSuggestions(
  input: GenerateNamesInput,
): Promise<GenerateNamesResponse> {
  const model = getVisionModel();
  const repository = getNameRepository();
  const specification = input.specification || DEFAULT_SPECIFICATION;

  const analysis = input.analysis ?? (await model.analyzeImage(input.image, specification));

  const candidates = await repository.findCandidates({
    specification,
    category: analysis.category,
    keywords: [analysis.subject, ...analysis.colors, ...analysis.traits, ...analysis.keywords],
    exclude: input.exclude,
    limit: CANDIDATE_POOL_SIZE,
  });

  const recommendations = await model.generateNames(input.image, specification, candidates, {
    analysis,
    exclude: input.exclude,
    count: SUGGESTION_COUNT,
  });

  const suggestions = await finalize(recommendations, candidates, input.exclude);
  if (suggestions.length < MIN_SUGGESTIONS) {
    throw new AIProviderError(`Only ${suggestions.length} usable suggestions`);
  }

  return {
    suggestions: suggestions.slice(0, SUGGESTION_COUNT),
    analysis,
    mode: model.isDemo ? "demo" : "live",
  };
}

async function finalize(
  recommendations: NameRecommendation[],
  candidates: NameCandidate[],
  exclude: string[],
): Promise<NameSuggestion[]> {
  const seen = new Set(exclude.map(normalizeNameKey));
  const known = new Map(candidates.map((c) => [normalizeNameKey(c.name), c]));

  // Names the model chose from outside the pool may still be in the dataset.
  const unknown = recommendations.map((r) => r.name).filter((n) => !known.has(normalizeNameKey(n)));
  if (unknown.length) {
    for (const [key, c] of await getNameRepository().lookup(unknown)) known.set(key, c);
  }

  const out: NameSuggestion[] = [];
  for (const rec of recommendations) {
    const name = sanitizeName(rec.name);
    if (!name) continue;
    const key = normalizeNameKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const fromDataset = known.get(key);
    out.push({
      name: fromDataset?.name ?? name,
      // Dataset facts win over anything the model claims.
      meaning: fromDataset ? fromDataset.meaning : rec.meaning,
      origin: fromDataset ? displayOrigin(fromDataset.origin) : rec.origin,
      reason: rec.reason,
      tags: rec.tags.length ? rec.tags : (fromDataset?.tags ?? []).slice(0, 3),
      fromDataset: Boolean(fromDataset),
    });
  }
  return out;
}

function displayOrigin(origin?: string): string | undefined {
  return origin === "Invented" ? "Playful original" : origin;
}
