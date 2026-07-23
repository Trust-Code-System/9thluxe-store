import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const iterations = Math.min(
  Math.max(Number.parseInt(process.env.QUERY_PERF_ITERATIONS ?? "10", 10), 3),
  50,
)
const budgetMs = Math.max(
  Number.parseInt(process.env.QUERY_P95_BUDGET_MS ?? "1000", 10),
  50,
)

const queries = {
  publishedProducts: () =>
    prisma.product.findMany({
      where: { deletedAt: null, publishStatus: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: { id: true, slug: true, name: true, priceNGN: true },
    }),
  publishedBrands: () =>
    prisma.product.findMany({
      where: {
        deletedAt: null,
        publishStatus: "PUBLISHED",
        brand: { not: null },
      },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
      select: { brand: true },
    }),
  recentOrders: () =>
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, status: true, totalNGN: true, createdAt: true },
    }),
  recentUsers: () =>
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true },
    }),
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(Math.ceil(sorted.length * fraction) - 1, sorted.length - 1)]
}

let failed = false
try {
  const report = {}
  for (const [name, query] of Object.entries(queries)) {
    // Establish the database connection and warm the query plan before measuring.
    // Otherwise the first sample mostly measures TLS/network startup.
    await query()
    const samples = []
    for (let index = 0; index < iterations; index += 1) {
      const started = performance.now()
      await query()
      samples.push(performance.now() - started)
    }
    const p95Ms = percentile(samples, 0.95)
    report[name] = {
      iterations,
      averageMs: Number(
        (samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(1),
      ),
      p95Ms: Number(p95Ms.toFixed(1)),
      maxMs: Number(Math.max(...samples).toFixed(1)),
      budgetMs,
      ok: p95Ms <= budgetMs,
    }
    if (p95Ms > budgetMs) failed = true
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} finally {
  await prisma.$disconnect()
}

if (failed) process.exitCode = 1
