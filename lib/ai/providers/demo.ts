import "server-only";

import type { NameCandidate } from "../../names/types";
import { CATEGORY_ALIASES, tokenize } from "../../names/vocabulary";
import type { ImageAnalysis, SubjectCategory } from "../../types";
import type {
  GenerateOptions,
  ImageInput,
  NameRecommendation,
  VisionAIProvider,
} from "../provider";

/**
 * Offline stand-in used when no model is configured, so the whole app can be
 * run and developed without an API key. It cannot see the image: it reads the
 * request text and picks from the dataset's best-ranked candidates. The UI
 * labels its results as demo output.
 */
export class DemoProvider implements VisionAIProvider {
  readonly id = "demo";
  readonly isDemo = true;

  async analyzeImage(_image: ImageInput, specification: string): Promise<ImageAnalysis> {
    const words = tokenize(specification);
    const hit = words.find((w) => CATEGORY_ALIASES[w]);
    const category = (hit ? CATEGORY_ALIASES[hit] : "object") as SubjectCategory;
    return {
      subject: hit ?? "",
      category,
      description: "Demo mode — no vision model is connected, so the photo wasn't analysed.",
      colors: [],
      traits: [],
      keywords: hit ? [hit] : [],
    };
  }

  async generateNames(
    _image: ImageInput,
    _specification: string,
    candidates: NameCandidate[],
    { count, analysis }: GenerateOptions,
  ): Promise<NameRecommendation[]> {
    await new Promise((r) => setTimeout(r, 1200));
    return candidates.slice(0, count).map((c) => ({
      name: c.name,
      meaning: c.meaning,
      origin: c.origin,
      reason: demoReason(c, analysis.subject),
      tags: (c.tags ?? []).slice(0, 3),
    }));
  }
}

function demoReason(c: NameCandidate, subject: string): string {
  const style = c.tags?.slice(0, 2).join(" and ") || "friendly";
  const meaning = c.meaning ? ` It means “${c.meaning.toLowerCase()}”.` : "";
  const target = subject ? ` for your ${subject}` : "";
  const article = /^[aeiou]/i.test(style) ? "An" : "A";
  return `${article} ${style} pick from our name list${target}.${meaning}`;
}
