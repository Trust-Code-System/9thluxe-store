# AI Architecture

## Provider independence
`integrations/ai/types.ts` defines `AiProvider` (low-level) and `AiServices` (high-level tasks).
`integrations/ai/index.ts` wraps a selected provider (`mock` default, `anthropic`, `openai`,
`gemini`) with resilience and exposes `aiServices`. Selection is env-driven (`AI_PROVIDER` + key
presence); if the chosen provider's key is missing it safely falls back to the deterministic mock.
Gemini uses the Generative Language API in JSON response mode (`GEMINI_API_KEY`, `GEMINI_MODEL`).

## Model defaults (current, 2026-07)
All model IDs are env-overridable so they can be upgraded/pinned without code changes:
- **Anthropic** — `ANTHROPIC_MODEL`, default `claude-haiku-4-5-20251001` (latest Haiku 4.5).
- **OpenAI** — `OPENAI_MODEL`, default `gpt-5.6-terra` (GPT-5.6 family). The adapter sends
  `max_completion_tokens` and omits custom temperature for GPT-5.x/o-series models per API rules.
- **Gemini** — `GEMINI_MODEL`, default `gemini-3.5-flash` (latest stable GA Flash).
- **xAI (search query expansion)** — `XAI_MODEL`, default `grok-4.5`.

## Resilience (every call)
- **PII redaction** (`scrubPrompt`): emails, phones, 16-digit PANs masked; hard 6k input ceiling.
  Addresses, payment data, and private conversations are **never** sent to a provider.
- **Timeout** (`withTimeout`), **retry** (primary twice), **fallback** to the deterministic mock.
- **Circuit breaker** per provider (opens after 4 failures for 30s).
- **Structured output validation**: every task parses model output as JSON and validates it with a
  Zod schema; invalid output → retry → mock → `AI_OUTPUT_INVALID`. Never returns unvalidated text.
- **Logging**: provider, model, task, prompt version, latency, token usage. No prompt/PII payloads.

## Services (`AiServices`)
`classifyIntent`, `explainRecommendation`, `answerSupport` (sets `escalate`), `summarizeReviews`
(reports count, `isAiSummary: true`), `draftMarketing` (draft only, never auto-sent), `ownerBrief`
(claims traceable to metrics JSON).

## Scent Concierge grounding
Pipeline: intent → hard constraints → retrieve (search provider) → **validate budget/stock/exclusions/
required attributes** → score (`scoring.ts`) → business safeguards → concise explanation →
**revalidate stock/price/link** → typed results → optional feedback. Requests outside the catalogue
get a clarification/refusal (`AI_REQUEST_UNSUPPORTED`). No medical/allergy/health guarantees.

## Safety
- Catalogue text, reviews, and user messages are **untrusted input** (prompt-injection surface):
  they are redacted, length-bounded, and never granted tool authority. AI tools (when added) use
  explicit allowlists and bounded permissions.
- Hidden prompts and internal reasoning are never exposed to customers.

## Prompt/version discipline
Each task carries a `promptVersion` (currently `v1`) logged with every call so outputs are traceable
and evaluable. See `docs/AI_EVALUATION.md`. The prompt-version registry lives in
`integrations/ai/cost.ts` (`PROMPT_VERSIONS`) and is surfaced at `GET /api/v1/admin/ai-cost`.

## Cost accounting
Every AI call is aggregated by `recordAiUsage()` (`integrations/ai/cost.ts`): calls + input/output
tokens per task/provider/model/prompt-version, exposed to the owner via `GET /api/v1/admin/ai-cost`.
**Limitation:** this aggregation is **per serverless instance (process-scoped)**. Durable,
cross-instance cost accounting is a documented follow-up — persist usage rows to a dedicated table
(e.g. `AiUsageLog`) and aggregate there. This was deliberately not added this session to avoid a
live-DB migration.

## Owner Copilot AI usage
The marketing assistant (`lib/copilot/marketing.ts`) uses `aiServices.draftMarketing` to produce
**drafts only** (`autoSend:false`) — it never sends. The daily brief / owner-brief summaries execute
nothing. Margin/insight/inventory assistants are deterministic aggregations (no AI fabrication);
where cost inputs are missing they report `no_cost_price_data` rather than inventing numbers.
