import type { FormSubmissionStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { sanitizeText } from "@/lib/stories/util"

export const FORM_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const

export function isFormStatus(value: unknown): value is FormSubmissionStatus {
  return typeof value === "string" && FORM_STATUSES.includes(value as FormSubmissionStatus)
}

export function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value)
  // Spreadsheet applications may execute cells beginning with formula sigils.
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${text.replace(/"/g, '""')}"`
}

export async function createContactSubmission(input: { name: string; email: string; subject: string; message: string }) {
  return prisma.formSubmission.create({
    data: { source: "contact", name: input.name, email: input.email.toLowerCase(), subject: input.subject, message: input.message },
  })
}

export async function listFormSubmissions(options: { query?: string; status?: FormSubmissionStatus; take?: number } = {}) {
  const query = sanitizeText(options.query).slice(0, 200)
  const where: Prisma.FormSubmissionWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(query ? { OR: ["name", "email", "subject", "message"].map((field) => ({ [field]: { contains: query, mode: "insensitive" } })) } : {}),
  }
  const [submissions, counts] = await Promise.all([
    prisma.formSubmission.findMany({ where, orderBy: { createdAt: "desc" }, take: Math.min(options.take ?? 100, 500) }),
    prisma.formSubmission.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { status: true } }),
  ])
  return { submissions, counts: Object.fromEntries(counts.map((row) => [row.status, row._count.status])) as Partial<Record<FormSubmissionStatus, number>> }
}

export async function updateFormSubmission(id: string, input: { status?: unknown; notes?: unknown }, actor: { actorId: string; actorRole: string }) {
  const current = await prisma.formSubmission.findUnique({ where: { id } })
  if (!current) throw new Error("Submission not found")
  if (input.status !== undefined && !isFormStatus(input.status)) throw new Error("Invalid status")
  const nextStatus = input.status ?? current.status
  const notes = input.notes === undefined ? current.notes : sanitizeText(input.notes).slice(0, 4000) || null
  const submission = await prisma.formSubmission.update({
    where: { id },
    data: { status: nextStatus, notes, resolvedAt: nextStatus === "RESOLVED" ? current.resolvedAt ?? new Date() : null },
  })
  await writeAudit({
    actorId: actor.actorId, actorRole: actor.actorRole, action: "form_submission.update",
    targetType: "FormSubmission", targetId: id, metadata: { from: current.status, to: submission.status, notesChanged: notes !== current.notes },
  })
  return submission
}

export async function exportFormSubmissions(options: { query?: string; status?: FormSubmissionStatus } = {}) {
  const { submissions } = await listFormSubmissions({ ...options, take: 500 })
  const rows = ["id,source,status,createdAt,name,email,subject,message,notes"]
  for (const item of submissions) rows.push([item.id, item.source, item.status, item.createdAt.toISOString(), item.name, item.email, item.subject, item.message, item.notes].map(csvCell).join(","))
  return rows.join("\r\n")
}
