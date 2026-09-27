import type { AllowedImageType } from "../validation";
import type { NameCandidate } from "../names/types";
import type { ImageAnalysis } from "../types";

/**
 * The contract every AI backend implements. The rest of the app only talks
 * to this interface, so swapping models or vendors never touches the UI or
 * the API route — see `vision-model.ts` for how one is chosen.
 */

export interface ImageInput {
  data: Buffer;
  mimeType: AllowedImageType;
}

export interface NameRecommendation {
  name: string;
  meaning?: string;
  origin?: string;
  reason: string;
  tags: string[];
}

export interface GenerateOptions {
  analysis: ImageAnalysis;
  exclude: string[];
  count: number;
}

export interface VisionAIProvider {
  readonly id: string;
  /** True for the offline demo provider, which cannot actually see images. */
  readonly isDemo: boolean;

  analyzeImage(image: ImageInput, specification: string): Promise<ImageAnalysis>;

  generateNames(
    image: ImageInput,
    specification: string,
    candidates: NameCandidate[],
    options: GenerateOptions,
  ): Promise<NameRecommendation[]>;
}

/** Any failure talking to, or understanding, the model. */
export class AIProviderError extends Error {
  /** HTTP status from the model server, when the failure was an HTTP error. */
  readonly status?: number;

  constructor(message: string, options?: { cause?: unknown; status?: number }) {
    super(message, { cause: options?.cause });
    this.name = "AIProviderError";
    this.status = options?.status;
  }
}
