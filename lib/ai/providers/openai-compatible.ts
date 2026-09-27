import "server-only";

import type { NameCandidate } from "../../names/types";
import type { ImageAnalysis } from "../../types";
import {
  ANALYSIS_SYSTEM_PROMPT,
  NAMING_SYSTEM_PROMPT,
  analysisUserPrompt,
  namingUserPrompt,
} from "../prompts";
import {
  AIProviderError,
  type GenerateOptions,
  type ImageInput,
  type NameRecommendation,
  type VisionAIProvider,
} from "../provider";
import { parseImageAnalysis, parseRecommendations } from "../schema";

/**
 * Talks to any server that implements the OpenAI Chat Completions API with
 * image input. That covers most ways of running open vision-language models:
 * Ollama and vLLM locally, or hosted Hugging Face, OpenRouter, Groq, Together…
 * Only configuration changes between them.
 */

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  /** Ask for `response_format: json_object`. Retried without it if rejected. */
  jsonMode: boolean;
  timeoutMs: number;
  /**
   * Models to try, in order, if `model` fails. Sent as OpenRouter's `models`
   * array, so only set this for servers that support it.
   */
  fallbackModels: string[];
  /** Provider-specific request fields, e.g. `{"reasoning":{"enabled":false}}`. */
  extraBody: Record<string, unknown>;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface ChatMessage {
  role: "system" | "user";
  content: string | ContentPart[];
}

interface ChatCompletionResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
}

export class OpenAICompatibleProvider implements VisionAIProvider {
  readonly id = "openai-compatible";
  readonly isDemo = false;
  private jsonModeSupported: boolean;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.jsonModeSupported = config.jsonMode;
  }

  async analyzeImage(image: ImageInput, specification: string): Promise<ImageAnalysis> {
    const text = await this.complete(
      [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: withImage(analysisUserPrompt(specification), image) },
      ],
      { temperature: 0.2, maxTokens: 500 },
    );
    return parseImageAnalysis(text);
  }

  async generateNames(
    image: ImageInput,
    specification: string,
    candidates: NameCandidate[],
    { analysis, exclude, count }: GenerateOptions,
  ): Promise<NameRecommendation[]> {
    const messages: ChatMessage[] = [
      { role: "system", content: NAMING_SYSTEM_PROMPT },
      {
        role: "user",
        content: withImage(
          namingUserPrompt(specification, analysis, candidates, exclude, count),
          image,
        ),
      },
    ];

    // Small open models occasionally emit broken JSON; retry that once,
    // cooler. Transport errors are not retried.
    const first = await this.complete(messages, { temperature: 0.9, maxTokens: 2000 });
    try {
      return parseRecommendations(first);
    } catch {
      const second = await this.complete(messages, { temperature: 0.6, maxTokens: 2000 });
      return parseRecommendations(second);
    }
  }

  private async complete(
    messages: ChatMessage[],
    { temperature, maxTokens }: { temperature: number; maxTokens: number },
  ): Promise<string> {
    const body: Record<string, unknown> = {
      ...this.config.extraBody,
      model: this.config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };
    if (this.config.fallbackModels.length) {
      body.models = [this.config.model, ...this.config.fallbackModels];
    }
    if (this.jsonModeSupported) body.response_format = { type: "json_object" };

    let res = await this.post(body);

    // Some servers/models reject response_format; fall back to prompt-only
    // JSON. Only remember that if dropping it is what actually fixed things.
    if (res.status === 400 && this.jsonModeSupported) {
      delete body.response_format;
      res = await this.post(body);
      if (res.ok) this.jsonModeSupported = false;
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new AIProviderError(`HTTP ${res.status} from model server: ${detail}`, {
        status: res.status,
      });
    }

    const data = (await res.json()) as ChatCompletionResponse;
    if (data.model && data.model !== this.config.model) {
      console.info(`[ai] answered by fallback model ${data.model}`);
    }
    const content = data.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((p) => p.text ?? "").join("")
          : "";
    if (!text.trim()) throw new AIProviderError("Model returned an empty reply");
    return text;
  }

  private async post(body: Record<string, unknown>): Promise<Response> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;

    try {
      return await fetch(`${this.config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
        cache: "no-store",
      });
    } catch (err) {
      throw new AIProviderError("Could not reach the model server", { cause: err });
    }
  }
}

function withImage(text: string, image: ImageInput): ContentPart[] {
  return [
    { type: "text", text },
    {
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${image.data.toString("base64")}` },
    },
  ];
}
