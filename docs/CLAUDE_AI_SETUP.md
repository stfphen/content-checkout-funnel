# Claude / AI Features Setup (Phase 4)

_How the AI features authenticate and how to turn them on for production._

## What's AI-powered

| Feature | Route | Engine |
|---|---|---|
| AI Tenant Builder | `POST /api/admin/tenants/generate` | Anthropic |
| AI Deep Research (existing lead) | `POST /api/admin/leads/research` | Anthropic + web search/fetch |
| AI Deep Research (from a query) | `POST /api/admin/leads/research-from-query` | Anthropic + web search/fetch |
| Fill Missing Info | `POST /api/admin/leads/fill-missing` | Anthropic (+ providers) |
| LLM Sales Brief (enrichment) | enrichment workflow | **OpenAI** (separate, optional) |

Auth logic lives in `lib/ai/claudeBackend.js`; research in `lib/leadResearch/researchLead.js`.

## Two auth paths — pick ONE (subscription preferred)

`aiMode()` (`claudeBackend.js:16-20`) decides at runtime:

1. **`CLAUDE_CODE_OAUTH_TOKEN` → "subscription"** (preferred). Uses your **Claude Max/Pro subscription** via `@anthropic-ai/claude-agent-sdk` — **no per-token API billing**.
2. **`ANTHROPIC_API_KEY` → "apiKey"** (pay-as-you-go from console.anthropic.com). Also the **automatic fallback** if a subscription call fails.
3. **Neither set → "off"** — features return a clean `AiNotConfigured` error: _"AI is not configured. Set CLAUDE_CODE_OAUTH_TOKEN (Claude subscription) or ANTHROPIC_API_KEY."_ The rest of the app is unaffected.

### Setting up the subscription path (recommended)

```bash
npm i -g @anthropic-ai/claude-code     # install the CLI
claude setup-token                     # generates a long-lived token (one time)
# paste the token into the VPS .env as CLAUDE_CODE_OAUTH_TOKEN, then recreate the app
```

> **Runtime requirement:** the subscription path **spawns the Claude Code CLI** as a subprocess (`subscriptionEnv()` even strips `ANTHROPIC_API_KEY` to force subscription). The CLI must be installed **inside the app container**, not just on the host. If it isn't in the Docker image, either add it to the `Dockerfile` (`RUN npm i -g @anthropic-ai/claude-code`) or use the API-key path instead. **Verify after deploy** that a Deep Research call actually succeeds in the container.

### Setting up the API-key path (simplest in Docker)

Put `ANTHROPIC_API_KEY=sk-ant-...` in the VPS `.env`. No CLI needed — the `@anthropic-ai/sdk` Messages API is called directly. Pay-as-you-go billing applies. This is the lowest-friction option for a container and is a safe default; you can switch to the subscription token later.

## Cost controls

| Knob | Env var | Default |
|---|---|---|
| Model | `LEAD_RESEARCH_MODEL` | `claude-opus-4-8` |
| Web search/fetch cap per research run | `LEAD_RESEARCH_MAX_WEB_SEARCHES` | `8` |
| Route timeout | (code) `maxDuration = 120` | 120s |

The Tenant Builder model is currently **hardcoded** to `claude-opus-4-8` (`lib/ai/.../generateTenant.js:5`) — no env override. For cost-sensitive launch, consider setting `LEAD_RESEARCH_MODEL` to a cheaper model and lowering `LEAD_RESEARCH_MAX_WEB_SEARCHES`.

## OpenAI (optional, separate)

`OPENAI_API_KEY` (+ `OPENAI_MODEL`, default `gpt-4o-mini`) powers only the enrichment **sales brief** (`lib/enrichment/llmBrief.js`). If unset, it silently falls back to a deterministic brief. Not related to the Anthropic features.

## Go-live checklist

1. Choose a path; set the env var on the VPS; recreate the app.
2. If subscription path: confirm the CLI is installed **in the container** and the token is valid.
3. Smoke test: in `/admin`, run one Deep Research and one Tenant Builder generation; confirm success (not `AiNotConfigured`).
4. Set `LEAD_RESEARCH_MAX_WEB_SEARCHES` to your cost comfort level.
