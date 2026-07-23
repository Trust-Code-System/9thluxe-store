// lib/media/storage.ts
// Provider-abstracted storage for uploaded media. Ships with a local-disk adapter that works in
// development and on a self-hosted Node server (files are written under public/uploads and served
// statically at /uploads/...). Production uploads use Vercel Blob when BLOB_READ_WRITE_TOKEN is
// configured. Operators can still register existing URLs if storage is unavailable.

import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { put } from "@vercel/blob"

export interface StoredFile {
  url: string
  filename: string
}

export interface StorageAdapter {
  readonly name: string
  save(bytes: Uint8Array, ext: string, baseName: string, mime: string): Promise<StoredFile>
}

export class StorageUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageUnavailableError"
  }
}

const localAdapter: StorageAdapter = {
  name: "local",
  async save(bytes, ext, baseName) {
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const filename = `${baseName}-${randomUUID().slice(0, 8)}.${ext}`
    const relDir = join("uploads", yyyy, mm)
    const absDir = join(process.cwd(), "public", relDir)
    await mkdir(absDir, { recursive: true })
    await writeFile(join(absDir, filename), bytes)
    // Public URL (POSIX separators regardless of OS).
    const url = `/${relDir.split(/[\\/]/).join("/")}/${filename}`
    return { url, filename }
  },
}

const blobAdapter: StorageAdapter = {
  name: "vercel-blob",
  async save(bytes, ext, baseName, mime) {
    const now = new Date()
    const yyyy = String(now.getUTCFullYear())
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
    const filename = `${baseName}-${randomUUID().slice(0, 8)}.${ext}`
    const pathname = `media/${yyyy}/${mm}/${filename}`
    const blob = await put(pathname, bytes, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return { url: blob.url, filename }
  },
}

/**
 * Choose a storage adapter. Refuses local disk on read-only serverless platforms so we never
 * pretend an upload persisted when it did not.
 */
export function getStorageAdapter(): StorageAdapter {
  const onServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME
  const requested = process.env.MEDIA_STORAGE?.trim().toLowerCase()
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

  if (requested === "blob" && !hasBlobToken) {
    throw new StorageUnavailableError(
      "Vercel Blob is selected, but BLOB_READ_WRITE_TOKEN is not configured."
    )
  }
  if (hasBlobToken && requested !== "local") return blobAdapter

  // Explicit escape hatch for self-hosted deployments that DO have a writable public dir.
  const allowLocal = process.env.MEDIA_ALLOW_LOCAL_UPLOAD === "1"
  if (onServerless && !allowLocal) {
    throw new StorageUnavailableError(
      "File uploads are not configured for this deployment. Add a blob storage provider, or add media by URL instead."
    )
  }
  return localAdapter
}
