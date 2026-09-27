import type { ApiErrorBody, ApiErrorCode, GenerateNamesResponse, ImageAnalysis } from "../types";

export type ClientErrorCode = ApiErrorCode | "NETWORK";

export class NameRequestError extends Error {
  constructor(readonly code: ClientErrorCode) {
    super(code);
    this.name = "NameRequestError";
  }
}

export interface NameRequest {
  image: Blob;
  specification: string;
  exclude: string[];
  analysis?: ImageAnalysis;
}

export async function requestNames(req: NameRequest): Promise<GenerateNamesResponse> {
  const form = new FormData();
  form.append("image", req.image, "image");
  form.append("specification", req.specification);
  form.append("exclude", JSON.stringify(req.exclude));
  if (req.analysis) form.append("analysis", JSON.stringify(req.analysis));

  let res: Response;
  try {
    res = await fetch("/api/generate-names", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new NameRequestError("NETWORK");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new NameRequestError(body?.error?.code ?? "AI_FAILED");
  }

  try {
    return (await res.json()) as GenerateNamesResponse;
  } catch {
    throw new NameRequestError("AI_FAILED");
  }
}
