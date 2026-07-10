# AI Evaluation

## Goals
Ensure AI features are (1) catalogue-grounded, (2) schema-valid, (3) safe, (4) cost-bounded, and
(5) regression-tracked across prompt versions.

## What is logged (per call)
`provider`, `model`, `task`, `promptVersion`, `latencyMs`, `inputTokens`, `outputTokens`. This is
the raw material for cost dashboards and quality regression. No prompts or PII are logged.

## Structured-output guarantee
Every task validates output with a Zod schema (`integrations/ai/index.ts`). The mock provider
returns valid JSON for all tasks so the pipeline is testable offline. Covered by
`tests/ai/structured.test.ts`.

## Grounding checks (recommendation/concierge)
- The AI ranks only an already-retrieved, in-catalogue candidate set.
- After ranking, results are revalidated for stock/price/link before return.
- An **unavailable product must never be returned as available** — an E2E test for this is defined
  in the test plan (`docs/BACKEND_UPGRADE_TODO.md`, Phase 6) and enforced structurally by
  `scoring.ts` (out-of-stock disqualified unless sample-first).

## Review-summary integrity
Summaries report the number of reviews summarized, are flagged `isAiSummary`, must not turn minority
opinions into universal claims, and should be regenerated when the source set materially changes.

## Suggested evaluation cadence (owner)
- Golden-set prompts per task with expected structured fields (extend `tests/ai`).
- Track schema-failure rate, fallback rate, circuit-open events, p95 latency, token cost per task.
- Bump `promptVersion` on any prompt change; compare metrics across versions.

## Cost controls
`maxOutputTokens` ceilings per task, temperature 0 for extraction tasks, mock default in dev,
circuit breaker to cap runaway failures.
