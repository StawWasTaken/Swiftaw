# Swiftaw — brand architecture

**Internal. Not surfaced anywhere on the sites yet.** This lands publicly when
the whole estate is redesigned and polished; until then it is how we talk
about ourselves internally, and the rule for deciding where a new thing goes.

> Worth knowing: this repo is the GitHub Pages source, so anything in it is
> reachable by URL to anyone who guesses the path. "Not public" here means
> "not linked, named, or designed for anywhere on the sites" — not secret.

---

## Swiftaw

The parent company. Everything below belongs to it.

**Tagline: Make It Matter.** Three words, that capitalisation, that full stop.
It is not a sentence opener — nothing follows it, and it does not get expanded
into a longer line of marketing.

---

## Swiftaw Services

Small, focused things we run. A service does one job well and leans on
everything Swiftaw already has rather than standing up its own.

| | |
|---|---|
| **Lives at** | `servicename.swiftaw.com` |
| **Accounts** | The Swiftaw account system. No separate log-in, ever. |
| **Logo** | Swiftaw's multicolour gradient mark on a black background |
| **Scope** | Focused. One job, done well. |

**Today:** Lifecheck · Supernova

> ⚠️ **The address row is aspiration, not fact.** Both services ship at a path
> today — `swiftaw.com/lifecheck/` and `swiftaw.com/supernova/` — and the
> sitemap says so. Either move them to subdomains or change this row; right
> now the doc and the estate disagree, and the doc is the one that is wrong.

---

## Swiftaw Products

Big projects that stand on their own. A product has its own name, its own
front door and its own users, and is built to make sense to someone who has
never heard of Swiftaw.

| | |
|---|---|
| **Lives at** | Its own domain |
| **Accounts** | Its own system. A Swiftaw account can be *linked*, never required. |
| **Logo** | A single-colour background with the mark in black in front |
| **Scope** | Large. A project in its own right. |

**Today:** Fortized · Hereld *(incoming)*

---

## Which is it?

Four questions, and they should all point the same way. If they split, the
answer is almost always Service — a thing earns Product status, it doesn't
start there.

1. **Does it need its own domain to make sense?** Product.
2. **Would someone sign up for it without knowing Swiftaw exists?** Product.
3. **Does it need users and data of its own?** Product.
4. **Is it one job, wired into what we already run?** Service.

A Service can graduate to a Product. It means a new domain, its own account
system, and a logo built the other way round — plan it as a move, not a
rename.

---

## Consequences worth remembering

- **Accounts are the sharpest line.** A Service that grows its own log-in has
  stopped being a Service. If that happens, promote it deliberately rather
  than letting it drift.
- **The logos invert on purpose.** Gradient-on-black says "part of Swiftaw";
  black-on-colour says "its own thing, made by Swiftaw". Don't mix them.
- **Linking is not requiring.** Products may offer "connect your Swiftaw
  account" as a convenience. The moment it is mandatory, it's a Service
  wearing a Product's coat.
- **Legal copy already leans on this.** `/legal/products-policy` covers
  Products, and Lifecheck carries its own integration terms as a Service.
  Keep the wording in step when this goes public.

---
---

# The design language

Roughly **85% Neo-Brutalism, 15% dark-mode cyber**, with a strong 1960s
influence in the type and the flat colour. It should read as made by people
who like making things — community-centric, playful, technical, confident.

It should **not** read as an AI-generated SaaS site. Concretely, that means no
glassmorphism, no gradient washes, no floating blobs, no endless rounded
cards, no soft shadow stacks, no fake futuristic HUD chrome, no glow.

The whole system is one file: **`css/swiftaw-nb.css`**, served from
swiftaw.com and loaded by every site in the estate. There is one copy. A site
that needs something different gets a surface context, not a fork.

## The rules that decide everything else

| | |
|---|---|
| **Borders** | Black and thick. 3px (`--nb-bd-w`), 2px for fine work. |
| **Shadows** | Hard. `4px 6px 0 #000` — **blur 0, opacity 100%**. Never soft, never coloured. |
| **Colour** | Flat. One colour per surface. No gradients. |
| **Radius** | Generous and consistent — 10 / 18 / 26 / pill (`--nb-r-*`). |
| **Motion** | Short and eased-out. Buttons travel *into* their shadow. |

A neutral drop shadow for depth is fine. A coloured blur halo is a glow, and
glows are out.

## The Rainbaw

Five colours. There is no sixth, and we do not invent one.

| | Hex | Token |
|---|---|---|
| Red | `#FF0033` | `--nb-red` |
| Green | `#3ECF6E` | `--nb-green` |
| Blue | `#2CAFFC` | `--nb-blue` |
| Yellow | `#FFF93E` | `--nb-yellow` |
| Pink | `#FF77E4` | `--nb-pink` |

**Yellow is primary.** The others are accents, structure and play — the
`.nb-rainbaw` stripe, category marks, state colours.

> ⚠️ **Two live near-misses to correct.** Supernova's `--sn-blue` is `#30aefc`
> and Lifecheck uses `#fef83d` — both are a few points off the official blue
> and yellow. They read as the Rainbaw and are not the Rainbaw. Fix them to
> the tokens when each site is rebuilt.

## Type

| Role | Face |
|---|---|
| Biggest display / headline titles | **Tropicon** |
| Section headings, card headings, important UI headings | **Syne Bold** |
| Body | DM Sans |

Tropicon is the ecosystem's display face — it is what makes a Swiftaw page
recognisable at a glance. Syne Bold carries everything below the hero.

**Syne Extra Bold is Fortized's logo weight and stays there.** It does not
become the general heading weight for the ecosystem; new work sits at 500–700.

Tropicon is not in this repo yet. `@font-face` points at
`/fonts/Tropicon.woff2` with a Syne fallback, so nothing breaks before the
file lands.

## Buttons

Inherited from Fortized, because it was already right:

- **Rest** sits on its shadow.
- **Hover** lifts a pixel and the shadow grows.
- **Press** travels *into* the shadow — `translate(3px,4px)`, shadow shrinks.

The radius is pinned in every state. A press must never square a button off.

## Surfaces

`[data-nb="light" | "yellow" | "dark"]` re-skins the whole component set.

**Only the fill changes. The stroke is black and the shadow is black on every
surface, light or dark** — that is the whole rule, and it is the one the spec
card shows: black stroke, black shadow, white fill. A white stroke with a
black shadow reads as two different objects stuck together; both black is
what makes a raised panel read as one solid thing cut out of the page.

That has a consequence worth stating plainly: **on a dark page the panels are
paper, not near-black.** A black stroke needs paper to read against. So
`dark` splits its tokens in two:

| | page ground | raised panel |
| --- | --- | --- |
| background | `--nb-bg` — night `#0C0F15` | `--nb-surface` — paper |
| text | `--nb-fg` — white | `--nb-surface-fg` — ink |
| muted text | `--nb-fg-muted` | `--nb-surface-fg-muted` |

In `light` and `yellow` both columns are the same thing, so the split costs
nothing. Anything sitting **on** a surface (`.nb-card`, `.nb-panel`,
`.nb-dialog`, `.nb-nav`, `.nb-footer`, `.nb-btn`, `.nb-input`, `.nb-tag`,
`.nb-alert`) reads `--nb-surface-fg`; anything sitting on the page ground
reads `--nb-fg`.

Two things deliberately do **not** use `--nb-line`, because they are glyphs on
the page rather than panel edges and a black one would vanish on night ground:
`.nb-spin` and any icon stroke. Both use `currentColor`.

## Artwork

Two libraries exist and both are real:

- **`SWFT-Deco/`** — Swiftaw's own deco art. Place it where it *means*
  something: `infos-safe-deco.png` beside security information,
  `privacy-deco.png` beside privacy information. Not scattered as decoration.
- **`Icons/CharacterIcons/`** (Fortized repo) — Fortized's character art,
  keyed by mood rather than filename.

Icons are **free Font Awesome SVGs** and emoji are **Twemoji**. Nothing paid,
nothing invented.

Hereld has logos and a favicon and nothing else yet; its own artwork is coming
from the user later.

---

# Per brand

Each entry records what is **true today**. Where something is undecided it
says so rather than guessing — an invented domain or an invented hex is worse
than a blank.

## Fortized — Product

| | |
|---|---|
| **What it is** | A chat platform. Bastions, channels, DMs, group chats. |
| **Tagline** | **More Than A Chat App** |
| **Domain** | `fortized.com` (+ `invite.fortized.com` for invites only) |
| **Accounts** | Its own. Not to be merged with anything. |
| **Primary** | `#FFF93E` — Rainbaw yellow |
| **Logo type** | Syne Extra Bold |
| **Surface** | Dark |
| **Hosting** | Express (`server.js`), not Pages |
| **Privacy** | `/legal/privacy-policy` and `/privacy` |
| **Scope here** | **Web pages only.** The app is not in this redesign. |

"Build Your Fortress" is retired. It does not appear in new copy.

The character art is a genuine asset and part of the brand — the Heroic Search
knight, Joyster, the herald. Use it where the mood fits; an empty state that
is a *win* does not get a defeated knight.

## Hereld — Product *(incoming)*

| | |
|---|---|
| **What it is** | A professional social network. |
| **Tagline** | Not chosen. Must be original — not "What's happening?!". |
| **Domain** | **Undecided.** Products get their own domain; nobody has picked one. |
| **Accounts** | Its own, independent. Not merged with Swiftaw or Fortized. |
| **Primary** | `#2CAFFC` — Rainbaw blue |
| **Background** | `#0C0F15` |
| **Text** | White primary |
| **Surface** | Dark |
| **Privacy** | **None exists.** Needs writing before its consent card can link one. |
| **Assets** | Logomarks + favicons only. Artwork coming from the user. |

Swiftaw Neo-Brutalism with a **restrained** medieval character — the name
carries the heraldry, the interface should not cosplay it.

Notifications have a signature: a **white bubble with a thick `#2CAFFC`
outline**. That is Hereld's, and it should stay distinctive to Hereld.

The splash animation uses the Hereld logo. **Fortized's splash is untouched.**

The `index.html` in the repo today is a scraped X.com page — minified React
and nonces. It is not a starting point; only the logo PNGs are real.

## Lifecheck — Service

| | |
|---|---|
| **What it is** | The CAPTCHA / human-verification service. |
| **Lives at** | `swiftaw.com/lifecheck/` |
| **Accounts** | Swiftaw accounts. |
| **Colour** | `#fef83d` today — **should be `#FFF93E`**. |
| **Surface** | Dark (`#0d1117` / `#0a0e14`) |
| **Privacy** | Swiftaw's, `/legal/privacy-policy` |
| **Consumers** | Fortized uses it live. Hereld will. |

Site keys are `lc_site_<12>`; secrets are `lc_secret_…` and belong in a request
body, never in an `apikey` header. The domain allow-list matches bare
hostnames, not full URLs.

Where Hereld uses it: signup, suspicious auth, account creation, company
verification, abuse prevention. **Not everywhere** — a CAPTCHA on every action
is just friction.

## Supernova — Service

| | |
|---|---|
| **What it is** | The AI service. |
| **Lives at** | `swiftaw.com/supernova/` |
| **Accounts** | Swiftaw accounts. |
| **Colours** | Blue `#30aefc` → **should be `#2CAFFC`**; pink `#FF77E4` ✓; green `#3ECF6E` ✓ |
| **Surface** | Dark |
| **Privacy** | Swiftaw's, `/legal/privacy-policy` |

Two of its three colours are already exactly Rainbaw. The blue is the odd one
out and should be corrected rather than the Rainbaw bent to match it.

Where Hereld uses it: the **Ask Supernova** page, and topic summaries on
Explore. Anything Supernova writes is **labelled as AI-generated** wherever it
appears. Credentials stay server-side — never in client JavaScript.

---

# Shared components

Built once, in this repo, loaded by all five sites.

## `css/swiftaw-nb.css`

The design system above. Every site loads it.

## `css/swiftaw-consent.js` + `css/swiftaw-consent.css`

The cookie consent card. One implementation, config-driven by a single script
tag:

```html
<script src="https://swiftaw.com/css/swiftaw-consent.js"
        data-product="Hereld" data-theme="dark"></script>
```

It opens as a card in the bottom-left, and after about a minute of being
ignored it moves to a centred modal with the page dimmed behind it. Escalation
raises **prominence, not stakes** — "Necessary only" sits beside "Accept" at
the same size and weight in both states.

Privacy links per site, using **only routes that exist**:

| Site | Links |
|---|---|
| Swiftaw | Swiftaw |
| Lifecheck | Swiftaw |
| Supernova | Swiftaw |
| Fortized | Swiftaw + Fortized |
| Hereld | Swiftaw only, **until Hereld has a privacy page** |

## `css/swiftaw-launcher.js` + `css/swiftaw-launcher.css`

Ecosystem navigation only. A Rainbaw 2×2 button opens a panel with three
sections — **Favourites**, **Swiftaw Products** (Fortized, Hereld) and
**Swiftaw Services** (Lifecheck, Supernova). Same single script tag as the
consent card:

```html
<script src="https://swiftaw.com/css/swiftaw-launcher.js"
        data-current="fortized" data-theme="dark"></script>
```

`data-current` puts a **You're here** flag on the tile you are standing on.
Swiftaw itself is not a tile — it is the thing the tiles belong to.

Favourites are pinned with the star on each tile and kept in `localStorage`
per browser. Nothing about them leaves the device.

**Hereld has no domain, so its tile has no link.** It is a `<div>` flagged
*Coming soon*, not an `<a href="#">` — a tile that leads nowhere must not
behave like one that does. It becomes a link the moment a domain exists.

It navigates between products. It does **not** unify the account systems
underneath them, and the panel says so in a standing line in its own footer:
*"Swiftaw, Fortized and Hereld accounts are separate. Each product signs you
in itself."* That line is not fine print to be trimmed when the panel gets
crowded — this panel puts three products a click apart, and the natural
assumption is that clicking through carries you with it.

**There is no account in here.** The account is its own button, sitting beside
this one — see below. They were briefly one control and that was wrong twice
over: it buried the account inside a products menu, and a launcher that also
holds your session is precisely the thing that makes people believe the
products share one.

### Icons

`product-logos/` holds a square icon per entry — a favicon, essentially.
Fortized's shipped as one; Supernova's is its real `supernova/Supernova
favicon.png`; Hereld's is the app icon lifted out of its own logomark;
Lifecheck's is its gradient arrow seated on the same near-black Supernova
uses, because its wordmark is white and does not survive on its own. Every
pixel comes from an asset that already existed — none of it is drawn from
scratch.

**They carry no stroke and no shadow.** Each is already drawn with its own
rounded edge, and an outline around them just draws a second box around a box.
This is the one place in the system where a raised-looking thing is bare.

## `css/swiftaw-account.js` — the account button

The second button in the dock, and a separate control on purpose, the way
Google separates the apps grid from the avatar. Two buttons, two jobs: one
moves you between products, one is who you are.

- **Signed out** it is a plain `<a>` to `/account` with a person glyph. No
  dropdown — there is nothing to choose between, and a menu holding one row is
  a door with a hallway behind it.
- **Signed in** it is the avatar, opening a panel: avatar, username, email,
  *Manage your Swiftaw account*, any other accounts on the roster to switch
  to, add another, settings, log out.
- The footer repeats the account rule in the place it actually bites:
  *"Swiftaw, Fortized and Hereld accounts are separate. Signing in here does
  not sign you into a product."*

If Supabase cannot be reached it still draws the signed-out button rather than
nothing. We cannot know who you are, and `/account` is the one route that can
recover the session — a gap in the corner helps no one.

Its styles are injected by the script rather than pulled from `nb.css`,
because it loads on pages that have not been rebuilt on the system yet and an
account control has to render. Same recipe either way: black stroke, black
hard shadow, paper fill.

### The dock

Both floating controls mount into one `#swiftaw-dock` — a fixed flex row,
top-right, `gap:10px`. Whichever script loads first creates it and the other
finds it by id, so neither has to guess an offset the other must match. Order
is pinned in CSS (`[data-swl-dock-item]` order 1, `[data-swa-dock-item]`
order 2), so the grid is always left of the avatar regardless of load order.
The dock is positioned with an inline style rather than from the stylesheet,
so it lands correctly before the CSS link has resolved — a control that jumps
across the corner on load is worse than none.

A page can place either control itself with `[data-swiftaw-launcher]` or
`[data-swiftaw-account]`, in which case it does not join the dock.

## Loading them

`css/swiftaw.js` loads the launcher and the consent card on every page served
from this origin and works out which site you are on from the path, because
swiftaw.com, `/lifecheck/` and `/supernova/` are three products sharing one
origin. The account script was already loaded there.

`swiftaw-nb.css` is deliberately **not** loaded there. It restyles base
elements and these pages have not been rebuilt on it yet, so all three
components carry their own literal fallbacks for the tokens and the nb classes
they use. They look correct with the design system and without it.

Fortized and Hereld are served elsewhere and need their own script tags, plus
a CSP that allows `https://swiftaw.com` as a script and style source.

---

# The account rule, restated because it keeps mattering

Fortized accounts, Hereld accounts and Swiftaw accounts are **three separate
systems** and stay that way through this work. The launcher is navigation. The
consent component is per-origin. Neither is a step toward merging anything.

Account architecture is a separate job, for later.
