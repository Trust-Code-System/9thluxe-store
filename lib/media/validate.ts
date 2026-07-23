// lib/media/validate.ts
// Server-side upload validation. The browser-reported MIME type is NEVER trusted; the real type is
// sniffed from the file's magic bytes. Pure functions so they can be unit-tested without a request.

export interface DetectedType {
  mime: string
  ext: string
  kind: "image" | "video"
}

// Size limits (bytes).
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false
  }
  return true
}

function ascii(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false
  }
  return true
}

/** Sniff a supported image/video type from magic bytes. Returns null for anything unrecognised. */
export function detectType(bytes: Uint8Array): DetectedType | null {
  // JPEG: FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg", kind: "image" }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: "image/png", ext: "png", kind: "image" }
  // GIF: "GIF87a" / "GIF89a"
  if (ascii(bytes, 0, "GIF8")) return { mime: "image/gif", ext: "gif", kind: "image" }
  // WEBP: "RIFF"...."WEBP"
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP"))
    return { mime: "image/webp", ext: "webp", kind: "image" }
  // MP4 / ISO base media: bytes 4-7 == "ftyp"
  if (ascii(bytes, 4, "ftyp")) return { mime: "video/mp4", ext: "mp4", kind: "video" }
  // WEBM / Matroska: 1A 45 DF A3
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]))
    return { mime: "video/webm", ext: "webm", kind: "video" }
  return null
}

export interface ValidationOk {
  ok: true
  detected: DetectedType
}
export interface ValidationErr {
  ok: false
  error: string
}

export function validateUpload(bytes: Uint8Array, sizeBytes: number): ValidationOk | ValidationErr {
  if (!bytes || bytes.length < 12) return { ok: false, error: "File is empty or too small" }
  const detected = detectType(bytes)
  if (!detected) {
    return { ok: false, error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM." }
  }
  const limit = detected.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (sizeBytes > limit) {
    const mb = Math.round(limit / (1024 * 1024))
    return { ok: false, error: `File is too large. Max ${mb} MB for ${detected.kind}s.` }
  }
  return { ok: true, detected }
}

/** Slug-safe base filename (no extension), for building a human-readable unique name. */
export function safeBaseName(original: string): string {
  const withoutExt = original.replace(/\.[^./\\]+$/, "")
  const base = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return base || "asset"
}
