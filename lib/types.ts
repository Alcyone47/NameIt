/**
 * Types shared between the browser and the API. Nothing in here may import
 * server-only code.
 */

export interface NameSuggestion {
  name: string;
  meaning?: string;
  origin?: string;
  reason: string;
  tags: string[];
  /** True when the name came from the curated dataset rather than the model. */
  fromDataset: boolean;
}

/**
 * What the model saw in the picture. Returned to the browser so that
 * "Give me more" can skip re-analysing the image. Contains no personal data.
 */
export interface ImageAnalysis {
  subject: string;
  category: SubjectCategory;
  description: string;
  colors: string[];
  traits: string[];
  keywords: string[];
}

export const SUBJECT_CATEGORIES = [
  "pet",
  "toy",
  "vehicle",
  "plant",
  "person",
  "character",
  "object",
] as const;

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

export interface GenerateNamesResponse {
  suggestions: NameSuggestion[];
  analysis: ImageAnalysis;
  /** "demo" means no real vision model is configured. */
  mode: "live" | "demo";
}

export type ApiErrorCode =
  | "NO_IMAGE"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "AI_FAILED"
  | "AI_BUSY";

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

/** Where images are sent for analysis, so the UI can say so truthfully. */
export interface PrivacyDisclosure {
  /** demo: image goes nowhere; local: model on our infra; external: third-party API. */
  kind: "demo" | "local" | "external";
  providerLabel?: string;
  /** The provider may keep submitted images and use them for training. */
  mayTrain?: boolean;
}
