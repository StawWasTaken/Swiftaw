# Swiftaw — Handoff

Everything built in this work stream: the **Lifecheck** product, the shared
**Swiftaw account system**, the **Supabase** backend, and site-wide polish.
The site is a static build on GitHub Pages (`swiftaw.com`), deployed from
`main`.

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
