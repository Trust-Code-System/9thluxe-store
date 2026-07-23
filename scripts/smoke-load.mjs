const baseUrl = (process.env.LOAD_TEST_BASE_URL ?? "http://localhost:3000")
  .replace(/\/$/, "")
const concurrency = Math.min(
  Math.max(Number.parseInt(process.env.LOAD_TEST_CONCURRENCY ?? "10", 10), 1),
  50,
)
const requests = Math.min(
  Math.max(Number.parseInt(process.env.LOAD_TEST_REQUESTS ?? "100", 10), 10),
  2_000,
)
const budgetMs = Math.max(
  Number.parseInt(process.env.LOAD_TEST_P95_BUDGET_MS ?? "2000", 10),
  100,
)
const paths = ["/", "/shop", "/api/products?page=1&pageSize=24"]

let cursor = 0
const samples = []
let failures = 0

async function worker() {
  while (cursor < requests) {
    const index = cursor
    cursor += 1
    const path = paths[index % paths.length]
    const started = performance.now()
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { "user-agent": "9thluxe-readiness-load-check/1.0" },
      })
      if (!response.ok) failures += 1
      await response.arrayBuffer()
    } catch {
      failures += 1
    } finally {
      samples.push(performance.now() - started)
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))
const sorted = [...samples].sort((a, b) => a - b)
const p95Ms = sorted[Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1)]
const failureRate = failures / requests
const report = {
  baseUrl,
  requests,
  concurrency,
  failures,
  failureRate,
  averageMs: Number(
    (samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(1),
  ),
  p95Ms: Number(p95Ms.toFixed(1)),
  budgetMs,
  ok: failureRate <= 0.01 && p95Ms <= budgetMs,
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
if (!report.ok) process.exitCode = 1
