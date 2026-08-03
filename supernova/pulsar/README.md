# Pulsar — Supernova's own model

This folder is the start of **our real AI**: the Pulsar model that powers the
Supernova chat. It runs on its own Supabase project
(`https://xrmmedxbqmwjcucyjosl.supabase.co`), separate from the Swiftaw
account/auth project.

## What's here

| File | What it is | Runs where |
| --- | --- | --- |
| `schema.sql` | The AI database: chat logs, training corpus, `pulsar_signals`, feedback, web cache, trust layer, training tables. | Run once in the AI Supabase SQL editor. |
| **`model.sql`** | **The model itself as SQL functions: `pulsar_train` (learns n-grams from stocked data, feedback-weighted), `pulsar_generate` (walks the patterns to produce text), `pulsar_stats`, `pulsar_feedback_note`.** | Run once in the SQL editor, after `schema.sql`. The website calls these RPCs directly — **no Edge Function deploy, no terminal.** |
| `import-lifecheck.sql` | No-terminal Lifecheck backfill (calls the Lifecheck REST API from Postgres via the `http` extension). | SQL editor. |
| `feed-lifecheck.mjs` | Same import as a Node script (alternative to the SQL one, if you prefer). | Local, with both service-role keys. |
| `functions/pulsar-chat/*` | Optional Edge Function for later (server-side web search + logging). Not needed for train/generate — those are the SQL RPCs above. | Supabase Edge Function (optional). |

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

## Our own model (not someone else's)

Pulsar generates from **its own data**, it does not run another company's model
underneath. `schema.sql` sets up the model's parameters as data:
`pulsar_corpus` (training text), `pulsar_vocab` + `pulsar_ngrams` (learned
frequencies). A training job tokenises the corpus and fills the n-grams; the
generator then samples the next word from what Pulsar has actually seen. That's
a real (if simple) statistical language model to start; it upgrades to a neural
one later without changing the data pipeline.

## How to turn it on (no terminal)

1. Run `schema.sql` in the AI project SQL editor.
2. Run `model.sql` (n-gram train + generate + stats + feedback).
3. Run `neural.sql` (feedback-learns-sentences + fact **recall** + neural support + Storage bucket).
4. Register Swiftaw: `insert into pulsar_trusted_accounts(user_id,username) values ('SWIFTAW-UID','Swiftaw');`
5. Import Lifecheck: run `import-lifecheck.sql` (paste your Lifecheck service key).
6. Chat a bit (stocks data), then open the **Trainer**:
   - **Train Pulsar now** → the n-gram model (fast, in Postgres). Once vocab > ~300 the chat auto-switches to Pulsar's own generation.
   - **Train neural model (beta)** → trains a small neural net in your browser (`neural.js`, TensorFlow.js) on the exported data, saves it to Storage; every visitor then generates with it. Needs a live run + enough data.

## How Pulsar answers (priority)

`getReply` in chat.js: **recalled fact** (a trusted thing Swiftaw taught, via `pulsar_recall`) → **neural model** (if trained) → **n-gram model** → in-browser draft.

## Feedback teaches Pulsar

- 👍/👎 on a message → `pulsar_feedback` (training weights up-votes ×3, drops down-votes).
- Swiftaw types `Feedback: <note>` → stored as a directive. Any text in **quotes** is learned three ways: a **phrasing example** (`pulsar_sentences`), **corpus** to train on, and a **trusted fact** (`pulsar_facts`, trust 1) that `pulsar_recall` can surface later. So `Feedback: "Elon Musk, as of August 2026, is the richest man on earth."` is remembered and recalled when asked.

## Status — honest

- ✅ Schema, **train + generate SQL functions**, Lifecheck import (SQL + Node), stocking every turn, feedback (thumbs → `pulsar_feedback`; Swiftaw `Feedback:` note → `pulsar_feedback_note`), Trainer UI with live stats + one-click train, persona + trust + image rules, sources UI, image embeds.
- ⏳ **Quality**: an n-gram model is real but simple; expect rough output early, improving with data. Upgrading to a neural model later swaps `pulsar_generate` for a served model without changing the data pipeline. **Live web search** still needs a provider key (the optional Edge Function); until then Pulsar generates from its own data.

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
