import { z } from "zod";

import { SUBJECT_CATEGORIES, type ImageAnalysis } from "../types";
import { AIProviderError, type NameRecommendation } from "./provider";

/**
 * Models are sloppy with JSON: code fences, trailing prose, nulls instead of
 * missing fields. Everything the model says passes through these schemas
 * before the app trusts it.
 */

const optionalText = (max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? v.trim().slice(0, max) : undefined))
    .transform((v) => v || undefined);

const wordList = (maxItems: number) =>
  z
    .array(z.unknown())
    .nullish()
    .transform((list) =>
      (list ?? [])
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim().toLowerCase().slice(0, 24))
        .filter(Boolean)
        .slice(0, maxItems),
    );

export const imageAnalysisSchema = z.object({
  subject: z
    .string()
    .nullish()
    .transform((v) => (v ?? "").trim().slice(0, 60)),
  category: z
    .string()
    .nullish()
    .transform((v) => {
      const c = (v ?? "").toLowerCase();
      return (SUBJECT_CATEGORIES as readonly string[]).includes(c)
        ? (c as ImageAnalysis["category"])
        : "object";
    }),
  description: z.string().trim().min(1).transform((v) => v.slice(0, 300)),
  colors: wordList(4),
  traits: wordList(6),
  keywords: wordList(8),
});

const recommendationSchema = z.object({
  name: z.string().trim().min(1).max(60),
  meaning: optionalText(160),
  origin: optionalText(40),
  reason: z.string().trim().min(1).transform((v) => v.slice(0, 280)),
  tags: wordList(4),
});

const recommendationsSchema = z.object({
  suggestions: z.array(z.unknown()).min(1),
});

/** Pull the first JSON object out of a model reply. */
export function extractJson(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new AIProviderError("Model reply contained no JSON object");
  }
  try {
    return JSON.parse(unfenced.slice(start, end + 1));
  } catch (err) {
    throw new AIProviderError("Model reply was not valid JSON", { cause: err });
  }
}

export function parseImageAnalysis(text: string): ImageAnalysis {
  const parsed = imageAnalysisSchema.safeParse(extractJson(text));
  if (!parsed.success) {
    throw new AIProviderError("Image analysis did not match the expected shape", {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

/** Keeps every well-formed suggestion and drops the malformed ones. */
export function parseRecommendations(text: string): NameRecommendation[] {
  const outer = recommendationsSchema.safeParse(extractJson(text));
  if (!outer.success) {
    throw new AIProviderError("Model reply had no suggestions array", { cause: outer.error });
  }
  const items = outer.data.suggestions.flatMap((item) => {
    const r = recommendationSchema.safeParse(item);
    return r.success ? [r.data] : [];
  });
  if (items.length === 0) {
    throw new AIProviderError("Model returned no usable suggestions");
  }
  return items;
}
