import "server-only";

import type { PrivacyDisclosure } from "../types";
import type { VisionAIProvider } from "./provider";
import { DemoProvider } from "./providers/demo";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";

/**
 * The single place that decides which AI backend is used. To add a new
 * vendor, implement `VisionAIProvider` in `providers/` and add a case here.
 *
 *   AI_PROVIDER=openai-compatible  any OpenAI-style chat API with image input
 *   AI_PROVIDER=demo               offline demo, no model needed
 *
 * If AI_PROVIDER is unset, the real provider is used when AI_BASE_URL is set,
 * and the demo provider otherwise.
 */

let cached: VisionAIProvider | null = null;

export function getVisionModel(): VisionAIProvider {
  if (cached) return cached;

  const kind = process.env.AI_PROVIDER || (process.env.AI_BASE_URL ? "openai-compatible" : "demo");

  switch (kind) {
    case "openai-compatible": {
      const baseUrl = process.env.AI_BASE_URL;
      const model = process.env.AI_MODEL;
      if (!baseUrl || !model) {
        throw new Error("AI_BASE_URL and AI_MODEL must be set when AI_PROVIDER=openai-compatible");
      }
      cached = new OpenAICompatibleProvider({
        baseUrl,
        model,
        apiKey: process.env.AI_API_KEY || undefined,
        jsonMode: process.env.AI_JSON_MODE !== "false",
        timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 60_000,
        fallbackModels: parseFallbackModels(process.env.AI_FALLBACK_MODELS),
        extraBody: parseExtraBody(process.env.AI_EXTRA_BODY),
      });
      break;
    }
    case "demo":
      cached = new DemoProvider();
      break;
    default:
      throw new Error(`Unknown AI_PROVIDER "${kind}"`);
  }
  return cached;
}

/** OpenRouter accepts at most 3 models per request: the primary + 2 fallbacks. */
const MAX_FALLBACK_MODELS = 2;

function parseFallbackModels(raw: string | undefined): string[] {
  const models = (raw ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  if (models.length > MAX_FALLBACK_MODELS) {
    throw new Error(`AI_FALLBACK_MODELS accepts at most ${MAX_FALLBACK_MODELS} models`);
  }
  return models;
}

function parseExtraBody(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI_EXTRA_BODY must be valid JSON, e.g. {\"reasoning\":{\"enabled\":false}}");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI_EXTRA_BODY must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

/** Tells the UI, truthfully, where images are sent for analysis. */
export function getPrivacyDisclosure(): PrivacyDisclosure {
  const kind = process.env.AI_PROVIDER || (process.env.AI_BASE_URL ? "openai-compatible" : "demo");
  if (kind === "demo") return { kind: "demo" };

  let host = "";
  try {
    host = new URL(process.env.AI_BASE_URL ?? "").hostname;
  } catch {
    // fall through to "external" — the conservative claim
  }
  const isLocal =
    process.env.AI_PROVIDER_IS_SELF_HOSTED === "true" ||
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

  return {
    kind: isLocal ? "local" : "external",
    providerLabel: process.env.AI_PROVIDER_LABEL || host || undefined,
    mayTrain: process.env.AI_PROVIDER_MAY_TRAIN === "true",
  };
}
