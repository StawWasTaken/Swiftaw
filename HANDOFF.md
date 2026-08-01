# Swiftaw — Handoff

Everything built in this work stream: the **Lifecheck** product, the shared
**Swiftaw account system**, the **Supabase** backend, and site-wide polish.
The site is a static build on GitHub Pages (`swiftaw.com`), deployed from
`main`.

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
