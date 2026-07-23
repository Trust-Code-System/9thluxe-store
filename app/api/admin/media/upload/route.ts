import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { validateUpload, safeBaseName } from "@/lib/media/validate"
import { getStorageAdapter, StorageUnavailableError } from "@/lib/media/storage"
import { recordUpload } from "@/lib/media/service"

export const runtime = "nodejs"

// POST - multipart upload. The browser MIME type is ignored; the type is sniffed server-side.
export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const check = validateUpload(buffer, buffer.byteLength)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 })
  }

  try {
    const adapter = getStorageAdapter()
    const stored = await adapter.save(
      buffer,
      check.detected.ext,
      safeBaseName(file.name || "asset"),
      check.detected.mime
    )
    const asset = await recordUpload(
      {
        url: stored.url,
        filename: stored.filename,
        kind: check.detected.kind,
        mimeType: check.detected.mime,
        sizeBytes: buffer.byteLength,
      },
      { actorId: admin.id, actorRole: admin.role }
    )
    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 501 })
    }
    console.error("Upload media error:", error)
    return NextResponse.json({ error: "Failed to store upload" }, { status: 500 })
  }
}
