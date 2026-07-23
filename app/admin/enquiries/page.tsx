import { EnquiriesInbox } from "@/components/admin/enquiries-inbox"
import { isFormStatus, listFormSubmissions } from "@/lib/forms/submissions"

export const dynamic = "force-dynamic"

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams
  let result: Awaited<ReturnType<typeof listFormSubmissions>> = { submissions: [], counts: {} }
  let error = false
  try { result = await listFormSubmissions({ query: params.q, status: isFormStatus(params.status) ? params.status : undefined }) } catch { error = true }
  if (error) return <div><h1 className="font-serif text-2xl font-semibold">Enquiries</h1><p className="mt-4 text-muted-foreground">The FormSubmission table is unavailable. Apply the authored migration to a development database before verification.</p></div>
  return <EnquiriesInbox submissions={result.submissions} counts={result.counts} query={params.q ?? ""} status={isFormStatus(params.status) ? params.status : ""} />
}
