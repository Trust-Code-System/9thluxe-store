// app/api/v1/admin/jobs/route.ts
// GET /api/v1/admin/jobs?status=FAILED -> ADMIN-only job-run list (failed-job retention view).
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import type { JobStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: JobStatus[] = ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED']

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const statusParam = req.nextUrl.searchParams.get('status')?.toUpperCase()
  const where = statusParam && (VALID as string[]).includes(statusParam) ? { status: statusParam as JobStatus } : {}
  const jobs = await prisma.jobRun.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
  return { data: { jobs }, meta: { count: jobs.length } }
})
