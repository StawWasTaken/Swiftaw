# Swiftaw — Handoff

Everything built in this work stream: the **Lifecheck** product, the shared
**Swiftaw account system**, the **Supabase** backend, and site-wide polish.
The site is a static build on GitHub Pages (`swiftaw.com`), deployed from
`main`.

---

## 🟣 SUPERNOVA — Swiftaw's own generative AI (product page live, AI not built yet)

`swiftaw.com/supernova` (dir `supernova/`, work branch `claude/supernova`,
mirrored to `main`). Built on the shared `swiftaw.css` capsule-nav / 3D-button
system, chrome in `supernova/sn.css`, page-specific styles inline in
`supernova/index.html`.

**What Supernova IS (the real vision, not bot-detection):** a *generative AI
assistant* of our own (Gemini / ChatGPT / Claude shaped) that you can talk to,
trained on our own projects + free public web data, and the SAME intelligence
will then power the automated systems inside Lifecheck, Fortized and future
projects. Lifecheck consumes Supernova, not the other way around.

**Brand:** blue `#30aefc`, pink `#ff77e4`, green `#3ecf6e` (tokens
`--sn-blue/-pink/-green` + `*-rgb` in `sn.css`). Signature hero visual = the
multicolour equalizer **bars** (spectrum cycles the 3 brand colours) + the
Supernova avatar. Assets (user-uploaded, in `supernova/`): `Supernova Logo.png`
(wordmark), `Supernova favicon.png` (favicon), `Supernova pfp.png` (chatbot
avatar, conic blue/green/pink mark). Page is intentionally SHORT/punchy.

**Page titles convention (this repo):** `<page> - <Product>`, e.g.
`Overview - Supernova`, and Lifecheck retitled to `Overview / Docs / API keys
- Lifecheck` (were `... - Swiftaw`). Home stays `Swiftaw - swiftly beyond`.

**AI database (Supabase, for when we build the AI — NOT wired up yet):**
- URL: `https://xrmmedxbqmwjcucyjosl.supabase.co`
- publishable key (client-safe, RLS-protected): `sb_publishable_ObemhvadYmuXSJchH-SpzA_W4awNZtM`
- NEVER commit the service_role / secret key.

**Deferred build notes (user-provided, for the real AI later):**
- The chat interface will be **inspired by Fortized**'s chat.
- Code that Supernova generates → render in **cards like the Lifecheck docs**
  code blocks (Copy button + a View action to preview the script where possible,
  e.g. HTML).
- Tables Supernova outputs → styled like the **Lifecheck docs tables**.
- Longer term: `supernova.swiftaw.com` subdomain (DNS/hosting, later).
- Public copy keeps data-sourcing HIGH LEVEL ("our own world + the open web,
  handled with care for privacy") — decide the real consent/data story and
  reconcile with Fortized's private-messages privacy policy before claiming
  training on user data.

---

## 🔴 SESSION HANDOFF — Lifecheck v1.2 (redesign + telemetry + Edge Function)

Repo **StawWasTaken/Swiftaw**, branch **`claude/swiftaw-handoff-legal-brand-gxlmab`**,
mirrored to `main` (GitHub Pages deploy branch).

### 📋 Standing rules (every push)
- Push to **the work branch AND `main`** each time: `git push -u origin <branch>`,
  then `git branch -f main HEAD && git push origin main`.
- **`main` can move under you** (user uploads assets via the GitHub web
  uploader) → `git fetch origin main` first, rebase onto it, never force-clobber.
- Verify UI via a **local HTTP server** (`python3 -m http.server`) + Playwright,
  never `file://` (pages use root-absolute paths). Sandbox can't reach Supabase /
  Google Fonts / the GitHub CDN — local PNGs render, web fonts fall back.
- **No em-dashes in widget copy**, no "reCAPTCHA" wording.
- **Anti-abuse mechanism details stay OUT of public docs + served source.**
- **Bump `BUILD` in `lifecheck/lifecheck.js` on every widget deploy** so the
  embed iframe cache-busts (an hourly bucket is a safety net, but the bump gives
  an instant refresh).

### ✅ Shipped this session
- **Widget redesign (`lifecheck/embed.html`)**
  • White **LifeCheck wordmark** overlay (`filter:brightness(0) invert(1)`) + `v1.2`
    + Privacy·Terms badge; single-line quiet **consent footer**; widget widened to
    **396px** (loader iframe max-width **402px**) so consent fits one line.
  • **Close button removed** — an open mini-game must be completed (no dismiss +
    re-trigger the quick passive pass).
  • **3 new mini-games** (Twemoji **drawn on `<canvas>`** so the answer isn't in
    the DOM): `imagepick` ("click the X"), `oddone` (tap the non-life), `tally`
    (count life forms). Brute-force capped at 2 wrong taps. Existing 5 kept
    (grid/slider/rotate/sequence/code) = 8 total. Twemoji `jdecked/twemoji@15.1.0`
    72×72 PNG, native-glyph fallback.
  • **Real-key enforcement**: only first-party (swiftaw.com) pages get local demo
    tokens; everyone else needs a registered `lc_site_` key (server token).
  • **Interaction telemetry** → `lifecheck_events` via `lifecheck_log_events` RPC
    (throttled fire-and-forget batches). Events: widget_open, check_click,
    cursor_flag, spot_check, passive_pass, challenge_open, minigame_correct/wrong,
    challenge_pass/fail, speed_flag, tamper, key_fail, verified, **session_summary**.
  • **`session_summary`** = one labelled **feature-vector row per session**
    (duration, via, touch, challengesShown, wrongTaps, suspiciousSignals,
    spotChecked, cursor stats) — the row you'd train a bot/human model on.
  • **Telemetry diagnostics**: `flushEvents` now surfaces the RPC `{error}` via
    `console.warn` (it resolves with error, doesn't throw — was fully swallowed
    before) + `?lcdebug=1` logs successes.
- **SQL (`swiftaw-supabase-setup.sql`)**: new `lifecheck_events` table +
  `lifecheck_log_events` RPC (RLS-locked, security-definer, batch/size capped,
  granted to anon). Tokens `LC1.1_`→`LC1.2_`, verify response `v1.1`→`v1.2`.
  **USER RAN THIS — confirmed working (STATUS 204).**
- **Edge Function** `supabase/functions/lifecheck-verify/` (+ `supabase/config.toml`,
  `verify_jwt=false`): browser-safe verify — browser sends public sitekey+token,
  function looks up the secret server-side (service role) → CORS-enabled verdict,
  secret never in the browser. **USER DEPLOYED via dashboard (JS version, Verify
  JWT off) — working (200, CORS OK).** `.ts` file is for CLI deploy.
- **Verifier page `lifecheck/verify-test.html`**: pass widget → mint token →
  verify against the Edge Function. Working.
- **Docs (`lifecheck/docs.html`)**: Data & consent note, "No backend? Verify in
  the browser safely" section + verify-test link. **Removed the public
  explanation** of the anti-abuse mechanism; softened the revocation note.
  **Changelog: restored v1.1** (now v1.2/v1.1/v1.0); v1.2 reworded to not reveal
  internals.
- **Secrecy pass**: stripped the plain-English anti-theft explanations from
  `embed.html` comments + `lifecheck.js` header; user-facing failures are generic
  ("Can't verify here" / "Lifecheck isn't set up for this site").
- **Consent + Privacy Policy copy** broadened (vague-but-precise): data is used to
  "run, improve and **train** Swiftaw's systems **and AI**, and build new
  products." Privacy Policy §02/§03 updated (`legal/privacy-policy/index.html`).
- **Footer (all 3 lifecheck pages + `lc.css`)**: Fortized-style — dropped "by
  Swiftaw", copy = "© 2026 Lifecheck · made by **Swiftaw**" (Swiftaw → swiftaw.com),
  **inset divider** (not full-bleed).

### ✅ Resolved (was a false alarm)
- **"Telemetry stopped recording"** → NOT a bug. The user was paging the Supabase
  table editor and missed the newest rows on later pages. A direct anon RPC test
  returned **STATUS 204** — the whole pipeline is healthy. (Tip: sort
  `lifecheck_events` by `created_at` desc.) The diagnostics added are a keeper.

### 🎯 OPEN TODO — NEXT SESSION
0. **★ START BUILDING OUR AI (the focus of the new session).** Use the
   `lifecheck_events` data — especially the `session_summary` feature rows — to
   start Swiftaw's automated systems & AI:
   (a) tune Lifecheck's heuristics from real signal distributions;
   (b) **anomaly detection / clustering** on the feature vectors (bot detection,
       no labels needed) — the first shippable "automated system";
   (c) weak-label **supervised human/bot classifier** (suspicious/robotic ≈ bot,
       clean passive pass ≈ human);
   (d) feed the same signals into **Fortized's moderation AI**;
   (e) longer term → Swiftaw's own AI models + new products.
   First concrete steps: build an **export + labeling pipeline** from
   `lifecheck_events`; decide whether to capture richer signals (full cursor
   trajectories); pick model/infra (Supabase → feature engineering → model).
1. **Cache-bust the widget.** The iframe loads `embed.html?v=1.2` (constant), so
   browsers cache the widget and returning visitors can get a stale version (this
   caused a scare this session). Add a real per-deploy cache-buster.
2. **Site-wide brand-colour pass** (original 2nd goal, not started): apply the new
   palette — red `#fd0235` / green `#36c05f` / blue `#2daffb` / yellow `#fdf846` —
   CORRECTLY across the Swiftaw + Lifecheck sites. Tokens exist in
   `css/swiftaw.css` but need to actually be applied + eyeballed per page.
3. **Fortized legal copy voice pass** (carried over): rewrite the 5 Fortized doc
   pages in the plain human voice, without changing legal meaning.
4. **Reconcile legal entity**: "Swiftaw SAS" + real SIRET/registration
   (placeholder currently).

### ⚠️ Live-verify on deploy (sandbox is CDN/Supabase-blind)
- Twemoji artwork renders on real browsers; real `lc_site_` key end-to-end →
  `success: true`; the widget records `lcs_…` rows incl. `session_summary`.

### 🧭 Key anchors
Widget `lifecheck/embed.html`: telemetry `logEvent`/`flushEvents`/`sessionSummary`
(~415-480), challenges `buildImagePick`/`buildOddOne`/`buildTally`/`buildGrid`/
`buildSlider`/`buildRotate`/`buildSequence`/`buildCode`, `emojiCanvas`/`twemojiCode`,
`issueToken`/`firstPartyEmbed`, `DEBUG` (`?lcdebug`). Loader `lifecheck/lifecheck.js`
(VERSION 1.2, iframe max-width 402). SQL `swiftaw-supabase-setup.sql` (§2c events +
log RPC; §2b tokens LC1.2/v1.2). Edge fn `supabase/functions/lifecheck-verify/index.ts`
+ `supabase/config.toml`. Verifier `lifecheck/verify-test.html`. Docs
`lifecheck/docs.html` (changelog, verify §, data/consent). Footer `lifecheck/lc.css`
(`.lc-footer`/`.lc-footer-inner`) + markup in index/docs/keys.html. Privacy clause
`legal/privacy-policy/index.html` §02/§03.

### 🔑 Supabase state (USER-side, all confirmed working)
Project `mwszvynzzugbowdngzab.supabase.co`; anon publishable key
`sb_publishable_dqsqX2klo1j4xSyEFA7O1w_UjM8lEGf`. SQL run ✓ · email confirmation
off ✓ · `lifecheck-verify` Edge Function deployed (JWT off) ✓ · telemetry
recording ✓. Tables: `lifecheck_events`, `lifecheck_keys`, `lifecheck_tokens`,
`profiles`, `swiftaw_reactions`.

---

---

## 🔴 SESSION HANDOFF — Legal system, brand palette, Lifecheck v1.2

Two repos in play, both deploy from `main` (GitHub Pages):
**StawWasTaken/Swiftaw** (`swiftaw.com`) and **StawWasTaken/Fortized**
(`fortized.com`). Work branch on BOTH: `claude/swiftaw-handoff-docs-p2bflf`.

### 📋 Standing rules (every push)
- **Push to `main` AND the work branch** on each repo. `main` is the deploy
  branch for both. Flow: `git push -u origin claude/swiftaw-handoff-docs-p2bflf`,
  then `git branch -f main HEAD && git push origin main`.
- **`main` can move under you** — the user uploads assets straight to `main`
  ("Add files via upload"). Before touching `main`, `git fetch origin main`
  and check `git log HEAD..origin/main`. If it's non-empty, **rebase onto it,
  never force-clobber** (`git rebase origin/main`; a real upload like the
  LifeCheck logo lives only there). Only fast-forward `main` once HEAD contains
  origin/main.
- Push with retry/backoff on network errors (2s, 4s, 8s, 16s).
- **Verify UI via a local HTTP server, not `file://`** — pages use root-absolute
  paths (`/css/swiftaw.css`), which `file://` can't resolve. Run
  `python3 -m http.server` from the repo root and screenshot with Playwright
  (module `/opt/node22/lib/node_modules/playwright`, chromium under
  `/opt/pw-browsers/…`). The dev server needs the `.html` suffix; GitHub Pages
  serves the clean URL. Sandbox can't reach Supabase / Google Fonts / the GitHub
  CDN — local PNGs + layout render true, web fonts fall back.

### ✅ Shipped this stream
**Legal system (both sites, uniformized)**
- New Swiftaw **general** legal pages (reusable for ALL products): `/legal/
  terms-of-service`, `/legal/privacy-policy`, `/legal/products-policy`. Cover the
  service (delivering digital products: Fortized, Lifecheck), French + EU law /
  GDPR, and the goodwill clause: **data is never sold to third parties or used
  for commercial resale**.
- **Google-style layout** (final): one readable column straight on the page
  background — **no wrapping card**, no boxed TOC, borderless summary/notes
  (accent-rule only). `SWFT-Deco` art shown **BIG + standalone against the bg**,
  placed by MEANING: `terms-deco`=TOS hero · `privacy-deco`=Privacy hero ·
  `provide-to-us`="what you hand over / we collect" · `we-create-content`="we
  use it to build & maintain" + Products hero · `infos-safe`=security section.
  Copy written in a **plain human voice** (not AI-sounding).
- **Legal nav dropdown** on both sites. Swiftaw nav gained a `Legal` dropdown
  (Terms / Privacy / Products) across all pages + mobile menu + footers +
  sitemap. Fortized: the `Legal` pill → a `Legal` dropdown (nav-dropdown CSS in
  `css/fortized-2026.css`, handler in `css/fortized-2026.js`); the `/legal`
  landing hub was **deleted**; footer "Legal" → `/legal/terms-of-service`;
  doc back-links → home.
- **Fortized legal doc pages reference Swiftaw's** general TOS/Privacy/Products
  (blue accent-rule callout at the top of each) — written to co-exist (Fortized
  rule wins for Fortized; Swiftaw general terms govern the rest).
- **Fortized legal card removed**: `.legal-prose` no longer sits in a panel;
  text is on the bg, section numbers are plain accent numerals, callouts/summary
  are card-free accent rules — matches Swiftaw's clean look.

**Brand palette site-wide (2026 logo refresh)**
- New brand colours: **red `#fd0235` · green `#36c05f` · blue `#2daffb` ·
  yellow `#fdf846`** (yellow stays the lead). In `css/swiftaw.css` the decorative
  accent tokens now carry them: `--c-pink`=red, `--c-blue`=blue, `--c-mint`=green
  (+ `--brand-*` and `--c-red`/`--c-green`). This tints accents across the whole
  site (chips, deco icons, leadership avatars, legal accents). Lifecheck widget
  palette (`embed.html` `:root`) aligned to the exact hues.

**Lifecheck**
- Bumped **v1.1 → v1.2** everywhere: site pages, docs (title/meta/examples),
  `lifecheck.js` (`VERSION`), widget (`embed.html` badge/tag, postMessage `v`,
  `LC1.2_` local-token prefix).
- **Website logo** now `/lifecheck/LifeCheck logo.png` (the multicolour mark) in
  the nav + footer (`lc.css` `.nav-logo.lc-brand img` 27px, footer 18px). The
  **embed widget keeps the Swiftaw mark** — logo swap is website-only, per the
  user.
- Widget card shows **Privacy · Terms** links (`.badge-legal`) → the Swiftaw
  legal pages.

### 🔧 OPEN TODO (next session)
1. **Lifecheck v1.2 — "redesign the widget slightly".** Only a palette refresh
   was done so far. The user wants a light visual redesign of the widget
   (`lifecheck/embed.html`) — refresh the collapsed card + challenge UI, keep the
   challenge logic intact. Confirm direction/reference with the user first.
2. **Fortized legal COPY voice pass.** Layout is uniform, but the 5 Fortized doc
   pages (`terms-of-service`, `terms-of-use`, `privacy-policy`, `creator-policy`,
   `fortshop-policy`) still carry the ORIGINAL, more formal wording. Rewrite in
   the same plain human voice as Swiftaw's — carefully, without changing legal
   meaning.
3. **Lawyer review of all legal copy** before it's the binding version. Note:
   Fortized TOS says "Swiftaw SAS" with a **placeholder SIRET**; Swiftaw's pages
   say "Swiftaw" generally (French, Île-de-France). Reconcile the legal entity
   name + real registration details.
4. **Supabase still needs setup** (carried from below) for real Lifecheck token
   verification: run `swiftaw-supabase-setup.sql`, turn OFF email confirmation,
   then do the end-to-end key→embed→verify test.
5. **Live-verify on deploy** (sandbox is CDN/font/Supabase-blind): legal pages
   with real Syne + the big deco images; the new LifeCheck logo; brand colours
   across the site; both Legal dropdowns (desktop + mobile); the widget v1.2 +
   Privacy·Terms.

### 🧭 Key files
Swiftaw: `css/swiftaw.css` (`:root` brand tokens ~26; `LEGAL PAGES` block at END
— `.legal-*`, `.legal-figure`, `.legal-lead/-note`); `legal/*/index.html` (3
pages, `--legal-accent` per page: blue/green/yellow); `SWFT-Deco/*.png`;
`sitemap.xml`; `lifecheck/{index,docs,keys}.html` (nav logo + v1.2),
`lifecheck/embed.html` (widget palette + v1.2 + `.badge-legal`),
`lifecheck/lifecheck.js` (`VERSION`), `lifecheck/lc.css` (logo sizing).
Fortized: `css/fortized-2026.css` (nav-dropdown block near `.nav-spacer`;
`.legal-prose` card removed ~504; `.sec-num`/callouts/summary card-free),
`css/fortized-2026.js` (dropdown handler); `legal/*/index.html` (dropdown nav +
Swiftaw cross-ref callout); `legal/index.html` **deleted**.

---

## 1. What exists now

### Main site (`swiftaw.com`)
- Floating **capsule navbar** with two dropdowns: **Company** (About, Mission)
  and **Products** (Fortized → fortized.com, Lifecheck → /lifecheck/).
- The yellow nav CTA reads **"Create an account"** when logged out, and
  reverts to **"Fortized"** when logged in.
- A detached **account badge** (top-right) appears when logged in: avatar +
  username, with a Google-style menu (switch account, add another account,
  account settings, log out).
- The standalone `/products` **page was removed**; Products lives only as a
  nav dropdown now.

### Lifecheck (`swiftaw.com/lifecheck/`)
A human-verification widget (the friendly "I'm not a robot" box). Its own
capsule navbar (Swiftaw wordmark + "Lifecheck" + v1.1 chip).
- **Overview** `/lifecheck/` — marketing page + a **live demo** of the real widget.
- **Docs & API** `/lifecheck/docs` — integration guide + full API reference,
  with copy buttons on every code block.
- **API keys** `/lifecheck/keys` — signed-in dashboard to create / reveal /
  delete Lifecheck key pairs (routes auth to `/account`).

### Accounts (`swiftaw.com/account`)
- Log in / Create account (email, username, optional avatar, password +
  confirm, Lifecheck human check on signup).
- A **settings view** (same page, `?view=settings`) to change username + avatar.
- **Swiftaw accounts are separate from Fortized accounts** — stated on the page
  and in the account menu.

---

## 2. Files & what they do

### Shared assets (`/css/`)
| File | Purpose |
|---|---|
| `swiftaw.css` | Design system (tokens, capsule nav, buttons, stickers, mobile menu, reveal). Default browser scrollbars (custom thin scrollbar removed). |
| `swiftaw.js` | Shared behaviour on **every** page: injects icon sprite, nav scroll polish, mobile-menu toggle, reveal-on-scroll, **code-block copy buttons**, the reactions widget, and it **loads `swiftaw-account.js`**. |
| `swiftaw-account.js` | The account system. One Supabase client + session shared across the whole origin. Multi-account roster in `localStorage`, the top-right account switcher widget, and the nav-CTA swap. Exposes `window.SwiftawAccount`. |

`window.SwiftawAccount` API: `.ready(cb)`, `.client()`, `.user()`,
`.onChange(cb)`, `.signInWithPassword()`, `.signUp()`, `.signOut()`,
`.switchTo(id)`, `.addAccount()`, `.accounts()`.

### Pages
| File | Route | Notes |
|---|---|---|
| `index.html` | `/` | Homepage. Hero "See what we make" → `#make`. Reactions widget. |
| `about-us.html`, `mission.html`, `innovation-room.html`, `newsroom.html` | `/about-us` etc. | Company/Lab/News pages. |
| `account.html` | `/account` | Auth + settings. |
| `404.html` + `404/index.html` | 404 | Kept identical. |
| `sitemap.xml` | — | Lists `/account`, `/lifecheck/`, `/lifecheck/docs`, `/lifecheck/keys`. |

### Lifecheck (`/lifecheck/`)
| File | Route | Notes |
|---|---|---|
| `index.html` | `/lifecheck/` | Overview + live demo. |
| `docs.html` | `/lifecheck/docs` | Docs & API reference. |
| `keys.html` | `/lifecheck/keys` | Key dashboard + Swiftaw-styled delete modal. |
| `embed.html` | iframe target | The actual widget + challenges. Mints tokens (see §4). |
| `lifecheck.js` | loader/API | What third parties embed. Renders the iframe, wires `postMessage` → callback / hidden field. Exposes `window.Lifecheck`. |
| `lc.css` | — | Lifecheck nav/footer chrome. |

### Database
| File | Purpose |
|---|---|
| `swiftaw-supabase-setup.sql` | **Run this in Supabase.** Profiles + accounts, Lifecheck keys + tokens, reactions, and all RLS/RPC. Idempotent. |

---

## 3. Supabase setup (required)

Project: `https://mwszvynzzugbowdngzab.supabase.co`
Public (anon) key used in the client: `sb_publishable_dqsqX2klo1j4xSyEFA7O1w_UjM8lEGf`

**To make everything work you must:**
1. Open Supabase → **SQL Editor** → paste **all** of `swiftaw-supabase-setup.sql`
   → Run. (Safe to re-run; uses `IF NOT EXISTS` / `OR REPLACE`.)
2. **Authentication → Providers → Email → turn OFF "Confirm email"** so signups
   log in instantly (otherwise avatar/username save is deferred until the user
   confirms and logs in).
3. The SQL creates a public **`avatars`** storage bucket automatically; confirm
   it exists under Storage.

What the SQL creates:
- `profiles` — one row per user (auto-created by a trigger; `username` +
  `avatar_url` come from signup metadata). RLS: users see/update only their own.
- `username_available(text)` — public RPC for the signup form's live check.
- `avatars` bucket + storage policies (public read; a user writes only under
  their own `uid/` folder).
- `lifecheck_keys` — the site/secret key pairs. RLS: owner-only.
- `lifecheck_tokens` + `lifecheck_issue_token()` + `lifecheck_verify_token()`
  — the real verification path (see §4). No direct table access; RPC only.
- `swiftaw_reactions` + `swiftaw_inc_reaction()` / `swiftaw_dec_reaction()`
  — the live reaction counter used on the homepage/mission (public read).

> Keep the **service role** key server-side only. The site never uses it.

---

## 4. How Lifecheck verification works (the security model)

1. A site owner creates a key on `/lifecheck/keys` → a `lc_site_*` (public) and
   `lc_secret_*` (private) pair, optionally scoped to allowed domains.
2. The integrator embeds Lifecheck (`lifecheck.js` + a `.lifecheck` div with
   `data-sitekey`). The widget runs sandboxed in an iframe on swiftaw.com.
3. When a visitor passes, the widget calls **`lifecheck_issue_token`** on
   Supabase. A token is only returned if the **site key still exists** and the
   host is on the allow-list. → Copied widgets with no valid key get nothing;
   **deleting a key stops verification instantly, no page reload needed.**
4. The token rides along in a hidden field / callback. The integrator's
   **server** verifies it with **`lifecheck_verify_token`** (POST to
   `…/rest/v1/rpc/lifecheck_verify_token`, `apikey` header = public key, body =
   `{ p_secret, p_token }`). Tokens are single-use and expire ~2 min.

**Swiftaw's own pages** (overview demo, the signup human-check) use
non-registered demo keys (`lc_demo_public`, `lc_account_public`) and get a
**local token** so they work without a DB round-trip.

**Honest limitation:** like any browser-based check, a determined bot can drive
the widget itself. The real guarantees are (a) live key validation + revocation
and (b) server-side secret verification — not client-side friction. The docs
say this plainly. Making it bot-proof would need server-side behavioural
scoring (e.g. a Supabase Edge Function), which is **not** built.

---

## 5. Account switching notes

- Sessions are shared automatically across the origin (same Supabase storage
  key), so login on `/lifecheck/keys` = logged in everywhere on swiftaw.com.
- Multi-account switching stores each account's tokens in `localStorage` and
  swaps the active session. Supabase rotates refresh tokens, so a
  switched-away account's stored token can go stale; when that happens the
  switcher bounces to `/account` to re-enter that account's password (email
  pre-filled). This is expected, not a bug.

---

## 6. Site-wide polish shipped
- Default browser scrollbars everywhere.
- Grouped, labelled **mobile menu** (Company / Products / More) so dropdown
  destinations are reachable on phones; hamburger verified working.
- **Copy button** on every code block in Docs + Overview.
- Swiftaw-styled **confirm modal** replaces the browser `confirm()` on key delete.
- Lifecheck page titles/footers read **"… - Swiftaw"**.
- No "reCAPTCHA" wording anywhere (Google trademark); no em-dashes in visible copy.

---

## 7. Open items / TODO
- **Run the updated SQL** (§3) — the token system won't verify until it exists.
- **Turn off email confirmation** (or handle the confirm flow) for smooth signup.
- **Do a real end-to-end test** once the DB is set: sign up → create a key →
  embed on a test page → confirm a pass issues a token and your server verify
  returns `success: true` → delete the key and confirm verification stops.
- Optional hardening: a Supabase **Edge Function** for behavioural scoring /
  rate-limiting token issuance if you want to raise the bot bar.
- The sandbox here can't reach Supabase/CDNs, so all Supabase calls were tested
  against stubs; verify against the live project.

---

## 8. Git
- Deploys from **`main`** (GitHub Pages). Work branch: `claude/amazing-allen-oplugu`
  (kept in sync with main).
- Every change in this stream is on `main`.
