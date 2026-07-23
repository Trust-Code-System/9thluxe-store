import { afterEach, describe, expect, it } from "vitest"
import { getStorageAdapter, StorageUnavailableError } from "@/lib/media/storage"

const original = {
  token: process.env.BLOB_READ_WRITE_TOKEN,
  storage: process.env.MEDIA_STORAGE,
  vercel: process.env.VERCEL,
  lambda: process.env.AWS_LAMBDA_FUNCTION_NAME,
  allowLocal: process.env.MEDIA_ALLOW_LOCAL_UPLOAD,
}

afterEach(() => {
  setEnv("BLOB_READ_WRITE_TOKEN", original.token)
  setEnv("MEDIA_STORAGE", original.storage)
  setEnv("VERCEL", original.vercel)
  setEnv("AWS_LAMBDA_FUNCTION_NAME", original.lambda)
  setEnv("MEDIA_ALLOW_LOCAL_UPLOAD", original.allowLocal)
})

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

function clearStorageEnv() {
  delete process.env.BLOB_READ_WRITE_TOKEN
  delete process.env.MEDIA_STORAGE
  delete process.env.VERCEL
  delete process.env.AWS_LAMBDA_FUNCTION_NAME
  delete process.env.MEDIA_ALLOW_LOCAL_UPLOAD
}

describe("getStorageAdapter", () => {
  it("uses local storage during development without a token", () => {
    clearStorageEnv()
    expect(getStorageAdapter().name).toBe("local")
  })

  it("selects Vercel Blob whenever a token is configured", () => {
    clearStorageEnv()
    process.env.BLOB_READ_WRITE_TOKEN = "test-token"
    expect(getStorageAdapter().name).toBe("vercel-blob")
  })

  it("supports an explicit local override for self-hosting", () => {
    clearStorageEnv()
    process.env.BLOB_READ_WRITE_TOKEN = "test-token"
    process.env.MEDIA_STORAGE = "local"
    expect(getStorageAdapter().name).toBe("local")
  })

  it("fails clearly when Blob is selected without a token", () => {
    clearStorageEnv()
    process.env.MEDIA_STORAGE = "blob"
    expect(() => getStorageAdapter()).toThrow(StorageUnavailableError)
  })

  it("refuses ephemeral serverless disk without Blob credentials", () => {
    clearStorageEnv()
    process.env.VERCEL = "1"
    expect(() => getStorageAdapter()).toThrow(StorageUnavailableError)
  })
})
