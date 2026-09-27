import { AIProviderError } from "@/lib/ai/provider";
import { imageAnalysisSchema } from "@/lib/ai/schema";
import { checkRateLimit, clientIdFrom } from "@/lib/rate-limit";
import { isAllowedOrigin } from "@/lib/security";
import { generateNameSuggestions } from "@/lib/services/generate-names";
import type { ApiErrorBody, ApiErrorCode, GenerateNamesResponse, ImageAnalysis } from "@/lib/types";
import {
  ERROR_COPY,
  MAX_EXCLUDED_NAMES,
  MAX_IMAGE_BYTES,
  sanitizeName,
  sanitizeSpecification,
  sniffImageType,
  validateImageFile,
} from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Multipart overhead on top of the image itself. */
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, code: ApiErrorCode, extraHeaders?: Record<string, string>) {
  const body: ApiErrorBody = { error: { code, message: ERROR_COPY[code] } };
  return Response.json(body, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

/**
 * POST /api/generate-names  (multipart/form-data)
 *   image          JPG/PNG/WEBP, ≤ 10 MB            required
 *   specification  free text, ≤ 500 chars            optional
 *   exclude        JSON array of names already shown optional
 *   analysis       JSON ImageAnalysis from a prior response (skips re-analysis)
 *
 * The image is held in memory for the duration of this request only. It is
 * never written to disk, a database or object storage, and never logged.
 */
export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers)) return fail(403, "FORBIDDEN");

  const limit = checkRateLimit(clientIdFrom(request.headers));
  if (!limit.allowed) {
    return fail(429, "RATE_LIMITED", { "Retry-After": String(limit.retryAfterSeconds) });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > MAX_BODY_BYTES) return fail(413, "TOO_LARGE");
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return fail(400, "INVALID_REQUEST");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "INVALID_REQUEST");
  }

  const file = form.get("image");
  if (!(file instanceof File)) return fail(400, "NO_IMAGE");

  const fileError = validateImageFile(file);
  if (fileError) return fail(fileError === "TOO_LARGE" ? 413 : 400, fileError);

  const specification = sanitizeSpecification(form.get("specification"));
  const exclude = parseExclude(form.get("exclude"));
  const analysis = parseAnalysis(form.get("analysis"));
  if (exclude === null || analysis === null) return fail(400, "INVALID_REQUEST");

  let data: Buffer | null = Buffer.from(await file.arrayBuffer());
  try {
    // Trust the bytes, not the declared MIME type.
    const mimeType = sniffImageType(data);
    if (!mimeType) return fail(400, "UNSUPPORTED_TYPE");

    const result: GenerateNamesResponse = await generateNameSuggestions({
      image: { data, mimeType },
      specification,
      exclude,
      analysis,
    });
    return Response.json(result, { headers: NO_STORE });
  } catch (err) {
    // Log the failure, never the image or the user's text.
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[generate-names] failed —", reason);
    if (err instanceof AIProviderError && err.status === 429) {
      // The model provider's quota is used up (common on free tiers).
      return fail(503, "AI_BUSY");
    }
    return fail(err instanceof AIProviderError ? 502 : 500, "AI_FAILED");
  } finally {
    // Drop our copy of the image as soon as we're done with it.
    data?.fill(0);
    data = null;
  }
}

function parseExclude(value: FormDataEntryValue | null): string[] | null {
  if (value === null || value === "") return [];
  if (typeof value !== "string" || value.length > 8000) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map(sanitizeName)
      .filter((n): n is string => n !== null)
      .slice(-MAX_EXCLUDED_NAMES);
  } catch {
    return null;
  }
}

/** `undefined` = not supplied, `null` = supplied but invalid. */
function parseAnalysis(value: FormDataEntryValue | null): ImageAnalysis | undefined | null {
  if (value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > 4000) return null;
  try {
    const parsed = imageAnalysisSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
