# Concierge V2 provider matrix

Documentation verified: 2026-07-11. Model IDs remain environment-configurable because provider availability changes.

| Provider | Default model | Chat | Structured | Tools | Hosted web | Streaming | Adapter path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI | `gpt-5.6-terra` | Yes | Yes | Yes | Yes | Yes | Responses API |
| Anthropic | `claude-haiku-4-5-20251001` | Yes | Yes | Yes | Yes | Yes | Messages API |
| Google Gemini | `gemini-3.5-flash` | Yes | Yes | Yes | Yes | Yes | `generateContent` compatibility path |
| xAI | `grok-4.5` | Yes | Yes | Yes | Yes | Yes | Responses-compatible API for V2, Chat Completions compatibility for legacy structured tasks |
| Mock | `mock-concierge-v2` | Development/test/demo only | Yes | No | No | Simulated app events | Local deterministic implementation |

## Routing policy

- `AI_PROVIDER_PRIORITY` defines the normal priority order. The first configured provider with all required capabilities is called.
- A normal turn uses one primary provider. On timeout, invalid output, or provider error, V2 moves to the next compatible configured provider.
- Circuit breakers are keyed by provider plus requested capability set. Three consecutive failures open a circuit for 45 seconds.
- Current/external research requires `WEB_SEARCH`. General knowledge and catalogue answers require `CHAT` only.
- Mock cannot run in production unless `AI_DEMO_MODE=true` is explicitly configured. Legacy structured services now enforce the same production rule.
- Product existence, publication, price, stock, variants, Fádé reviews, and ownership never come from any provider.

## Current official sources

- OpenAI: [latest model guidance](https://developers.openai.com/api/docs/guides/latest-model.md), [web search](https://developers.openai.com/api/docs/guides/tools-web-search), [streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses).
- Anthropic: [tool reference](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference), [web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool), [streaming](https://platform.claude.com/docs/en/build-with-claude/streaming), [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- Google: [Interactions overview](https://ai.google.dev/gemini-api/docs/interactions-overview), [tools](https://ai.google.dev/gemini-api/docs/tools), [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [streaming](https://ai.google.dev/gemini-api/docs/streaming).
- xAI: [tools overview](https://docs.x.ai/developers/tools/overview), [function calling](https://docs.x.ai/developers/tools/function-calling), [structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs), [models](https://docs.x.ai/developers/models).

## Known adapter limitation

The Gemini V2 adapter stays on the supported `generateContent` REST path for a smaller migration surface. Google recommends Interactions for new agentic projects as of June 2026. A later measured migration can adopt Interactions and `previous_interaction_id` after the V2 evaluation set has stable baselines.
