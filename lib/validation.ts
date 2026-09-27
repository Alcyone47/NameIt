/**
 * Validation rules shared by the browser (fast feedback) and the API
 * (the actual enforcement point — never trust the client).
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_SPEC_LENGTH = 500;
export const MAX_EXCLUDED_NAMES = 120;
export const MAX_NAME_LENGTH = 40;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const DEFAULT_SPECIFICATION =
  "Suggest names that naturally fit the object shown in the image.";

export const ERROR_COPY = {
  NO_IMAGE: "We need a picture first.",
  UNSUPPORTED_TYPE: "That image format isn't supported. Try JPG, PNG or WEBP.",
  TOO_LARGE: "That's a little too big. Please choose an image under 10 MB.",
  AI_FAILED: "Hmm, we couldn't find the right names this time. Give it another shot.",
  AI_BUSY: "We're getting a lot of naming requests right now. Please try again in a little while.",
  RATE_LIMITED: "Whoa, that's a lot of naming! Take a breather and try again in a minute.",
  NETWORK: "We couldn't reach our servers. Check your connection and try again.",
  INVALID_REQUEST: "Something about that request didn't look right. Please try again.",
  FORBIDDEN: "This request isn't allowed.",
} as const;

export type ImageValidationError = "NO_IMAGE" | "UNSUPPORTED_TYPE" | "TOO_LARGE";

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Cheap checks on declared type and size. Used on both sides. */
export function validateImageFile(
  file: { type: string; size: number } | null | undefined,
): ImageValidationError | null {
  if (!file || file.size === 0) return "NO_IMAGE";
  if (!isAllowedImageType(file.type)) return "UNSUPPORTED_TYPE";
  if (file.size > MAX_IMAGE_BYTES) return "TOO_LARGE";
  return null;
}

/**
 * Identify the real format from the file's magic bytes, so a renamed
 * executable can't masquerade as a JPEG.
 */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/**
 * Normalise free text from the user: strip control characters and markup-ish
 * brackets, collapse whitespace and cap the length. The result is only ever
 * placed inside a delimited block of the model prompt, never executed.
 */
export function sanitizeSpecification(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>{}`]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_SPEC_LENGTH);
}

export function sanitizeName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.normalize("NFKC").replace(/\s+/g, " ").trim();
  // Reject rather than repair: "<script>" should not become "script".
  if (!cleaned || cleaned.length > MAX_NAME_LENGTH || /[^\p{L}\p{M}\p{N} '’.-]/u.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function normalizeNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
