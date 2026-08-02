# Pulsar — Supernova's own model

This folder is the start of **our real AI**: the Pulsar model that powers the
Supernova chat. It runs on its own Supabase project
(`https://xrmmedxbqmwjcucyjosl.supabase.co`), separate from the Swiftaw
account/auth project.

## What's here

| File | What it is | Runs where |
| --- | --- | --- |
| `schema.sql` | The AI database: chat logs, training corpus, feedback, web-search cache + sources, a trust layer, and a training/exercise queue. | Run once in the AI Supabase SQL editor. |
| `feed-lifecheck.mjs` | Loads Lifecheck `session_summary` feature vectors into `pulsar_signals` so Pulsar learns from real human-vs-bot behaviour. | You run it locally with both service-role keys. |
| `functions/pulsar-chat/index.ts` | The chat brain: auth → web search → sources → **model call** → persist. Persona + trust rules live here. | Supabase Edge Function. |

## How Pulsar learns (three inputs)

1. **Lifecheck signals** — anonymous behaviour vectors (`feed-lifecheck.mjs` → `pulsar_signals`).
2. **Chats** — treated as *claims to check*, never as automatic truth.
3. **The open web** — Pulsar searches instead of trusting a claim, and cites what it used.

## The rules that make Pulsar trustworthy

- **Don't just believe the user.** Anything factual/current is checked on the web; sources are cited (title + link + favicon, Grok-style). Encoded in the system prompt (`functions/pulsar-chat/index.ts`) and the `pulsar_facts.trust` column.
- **Swiftaw is ground truth.** The `Swiftaw` account is registered in `pulsar_trusted_accounts`. When Swiftaw says it's certain, Pulsar treats it as 100% true (`trust = 1.0`, `is_pulsar_admin()`).
- **Persona.** Warm and human, never "the user wants me to…". Full text in `SYSTEM_PROMPT`.

## The Trainer (Swiftaw account only)

The flask icon in the chat topbar (visible only to the `Swiftaw` account) opens
the Trainer: pick the model, toggle which data sources it trains on, and run
**drills** (fact-check, trust drill, reasoning, voice). Those map to
`pulsar_training_config` and `pulsar_training_exercises` in `schema.sql`. Today
the chat UI writes these to `localStorage`; point it at the AI Supabase to
persist (the tables are ready).

## Status — honest

- ✅ Schema, Lifecheck feed, Edge Function scaffold, persona + trust rules, sources UI, Trainer UI.
- ⏳ **Two things need real infrastructure before Pulsar actually thinks:**
  1. **A served model.** `callPulsar()` has a clear TODO. Point `PULSAR_MODEL_URL` at our model endpoint (or a provider while we train ours). Until then the chat uses the in-browser simulation.
  2. **A search provider.** `webSearch()` returns `[]` until `SEARCH_API_KEY` + a provider (Brave / Tavily / SerpAPI / Bing) are wired.

## Wiring the frontend to the real backend (when ready)

In `supernova/chat.js`, `respondTo()` currently calls `buildReply()` (the
simulation). Swap it for a `fetch` to the `pulsar-chat` function (send the
Swiftaw JWT as `Authorization`), stream the response into the same bubble, and
render `sources` with the existing `sourcesHTML()`. Replace the `localStorage`
thread store with `pulsar_conversations` / `pulsar_messages`. Everything else
(streaming UI, code cards, tables, math, feedback, Trainer) already works.

## Setup checklist

1. Run `schema.sql` in the AI Supabase project.
2. Register Swiftaw as trusted: get Swiftaw's auth `user_id`, then the seed
   `insert` at the bottom of `schema.sql`.
3. `node supernova/pulsar/feed-lifecheck.mjs` with the four env vars.
4. Deploy `pulsar-chat`; set `SEARCH_API_KEY`, `PULSAR_MODEL_URL`, `PULSAR_MODEL_KEY`.
5. Flip `respondTo()` in `chat.js` from the simulation to the function.

**Never commit** the service_role or model keys. The publishable key
(`sb_publishable_…`) is the only client-safe one.
