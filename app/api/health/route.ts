import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEnvDiagnostics } from "@/lib/env-diagnostics"
import {
  checkJobReadiness,
  checkRedisReadiness,
} from "@/lib/readiness"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const env = getEnvDiagnostics()

  const [database, redis, jobs] = await Promise.all([
    prisma.$queryRaw`SELECT 1`
      .then(() => "up" as const)
      .catch(() => "down" as const),
    checkRedisReadiness(),
    checkJobReadiness(),
  ])

  const redisReady = redis === "up" || redis === "not_configured"
  const ok =
    database === "up" &&
    redisReady &&
    jobs.status !== "down" &&
    env.missingCritical.length === 0
  const status = ok ? 200 : 503

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
        jobs: jobs.status,
        env: env.missingCritical.length === 0 ? "up" : "down",
      },
      env,
    },
    { status }
  )
}
