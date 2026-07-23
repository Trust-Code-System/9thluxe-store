import { describe, it, expect } from "vitest"
import {
  detectType,
  validateUpload,
  safeBaseName,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/media/validate"

function bytes(...vals: number[]): Uint8Array {
  const arr = new Uint8Array(16)
  vals.forEach((v, i) => (arr[i] = v))
  return arr
}

function ascii(text: string, offset = 0): Uint8Array {
  const arr = new Uint8Array(16)
  for (let i = 0; i < text.length; i++) arr[offset + i] = text.charCodeAt(i)
  return arr
}

describe("detectType (magic bytes, not browser MIME)", () => {
  it("detects JPEG", () => {
    expect(detectType(bytes(0xff, 0xd8, 0xff))?.mime).toBe("image/jpeg")
  })
  it("detects PNG", () => {
    expect(detectType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe("image/png")
  })
  it("detects GIF", () => {
    expect(detectType(ascii("GIF89a"))?.ext).toBe("gif")
  })
  it("detects WEBP", () => {
    const arr = ascii("RIFF")
    "WEBP".split("").forEach((c, i) => (arr[8 + i] = c.charCodeAt(0)))
    expect(detectType(arr)?.mime).toBe("image/webp")
  })
  it("detects MP4 via ftyp", () => {
    expect(detectType(ascii("ftyp", 4))?.kind).toBe("video")
  })
  it("detects WEBM", () => {
    expect(detectType(bytes(0x1a, 0x45, 0xdf, 0xa3))?.mime).toBe("video/webm")
  })
  it("rejects unknown/spoofed content", () => {
    expect(detectType(ascii("<html>"))).toBeNull()
    expect(detectType(bytes(0x00, 0x01, 0x02, 0x03))).toBeNull()
  })
})

describe("validateUpload", () => {
  it("accepts a valid small PNG", () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    expect(validateUpload(png, 1000)).toEqual({ ok: true, detected: expect.objectContaining({ mime: "image/png" }) })
  })
  it("rejects an oversize image", () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    const r = validateUpload(png, MAX_IMAGE_BYTES + 1)
    expect(r.ok).toBe(false)
  })
  it("allows larger videos than images", () => {
    const mp4 = ascii("ftyp", 4)
    expect(validateUpload(mp4, MAX_IMAGE_BYTES + 1).ok).toBe(true)
    expect(validateUpload(mp4, MAX_VIDEO_BYTES + 1).ok).toBe(false)
  })
  it("rejects unsupported types even if large", () => {
    expect(validateUpload(ascii("<?php"), 100).ok).toBe(false)
  })
  it("rejects tiny/empty buffers", () => {
    expect(validateUpload(new Uint8Array(3), 3).ok).toBe(false)
  })
})

describe("safeBaseName", () => {
  it("slugs and strips the extension", () => {
    expect(safeBaseName("My Photo (Final).JPG")).toBe("my-photo-final")
  })
  it("falls back for empty names", () => {
    expect(safeBaseName(".png")).toBe("asset")
  })
})
