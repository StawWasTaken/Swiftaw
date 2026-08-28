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

> ⚠️ **One live near-miss left.** Supernova's `--sn-blue` is `#30aefc` — a few
> points off the official blue. It reads as the Rainbaw and is not the
> Rainbaw. Fix it to the token when that site is rebuilt.
>
> Lifecheck's set is **corrected**: it had five of its own (`#fdf846`,
> `#36c05f`, `#2daffb`, `#fd0235`, and pink already right) across
> `embed.html`, `verify-test.html` and three `theme-color` metas. Each was
> close enough to look fine alone and far enough that the widget never quite
> matched a Swiftaw page behind it. The `-s` stroke shades beside them
> (`--yellow-s`, `--green-s`, …) are **deliberately untouched** — they are
> hand-tuned darker companions, they were already darker than the corrected
> bases, and retuning them would be redesigning a widget that does not need
> redesigning.

## Type

| Role | Face |
|---|---|
| Biggest display / headline titles | **Tropicon** — *blocked, see below* |
| Section headings, card headings, important UI headings | **Syne Bold** |
| Body | DM Sans |

Tropicon is the intended display face — the thing that would make a Swiftaw
page recognisable at a glance. Syne Bold carries everything below the hero.

**Syne Extra Bold is Fortized's logo weight and stays there.** It does not
become the general heading weight for the ecosystem; new work sits at 500–700.

### 🚫 Tropicon cannot be served on the web under the licence we hold

The licence that came with the font is a **Monotype Desktop EULA**. It grants
use on a workstation and explicitly excludes materials "containing the Font
Software embedded", forbids installing it "on any server", forbids modifying it
in any way (which rules out a WOFF2 conversion), and forbids further
distribution (which is what serving it to every visitor is). Any one of those
is enough on its own.

The `.otf` was briefly committed to this repository, which publishes as a
website, so it was live at `swiftaw.com/Tropicon/…`. **It has been removed.**
The licence is kept for the record at `internal/fonts/`, with the exact clauses
and what to do next: **`internal/fonts/README.md`**.

So `--nb-font-display` resolves to Syne today, and there is **no `@font-face`
for Tropicon anywhere in the CSS** — do not add one. What is permitted is
setting a fixed headline or lockup in Tropicon on a workstation and shipping it
as a flat SVG. What unblocks the real thing is a **Web Font licence** bought
from the Monotype property it came from; the wiring is then two lines in
`swiftaw-nb.css`.

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

**A dark UI stays dark.** The spec card is white because that is the example
it happens to be drawn on, not because a black stroke demands paper. What it
demands is a *seam*: the panel is a lighter dark than the page it sits on, the
black stroke lands in the gap between the two, and the black shadow reads as
the page falling away underneath. Night `#0C0F15` page, `#161B24` panel,
`#1F2634` for the second surface inside it.

Tokens come in two pairs — the page ground and the raised panel:

| | page ground | raised panel |
| --- | --- | --- |
| background | `--nb-bg` — `#0C0F15` | `--nb-surface` — `#161B24` |
| text | `--nb-fg` | `--nb-surface-fg` |
| muted text | `--nb-fg-muted` | `--nb-surface-fg-muted` |

On `dark` both columns are white text, and on `light` and `yellow` both are
ink, so today the split costs nothing — it exists so that a surface which ever
*does* diverge from its page (a yellow card on a dark section, say) colours
its own text correctly instead of inheriting the page's. Anything sitting
**on** a surface (`.nb-card`, `.nb-panel`,
`.nb-dialog`, `.nb-nav`, `.nb-footer`, `.nb-btn`, `.nb-input`, `.nb-tag`,
`.nb-alert`) reads `--nb-surface-fg`; anything sitting on the page ground
reads `--nb-fg`.

Some things deliberately do **not** use `--nb-line`, because they are glyphs
*printed on* a surface rather than edges *of* one, and a black one would
vanish into a dark panel: `.nb-spin`, `.nb-toggle .nb-knob`, `.swl-empty`'s
dashed rule, the "coming soon" pill, and any icon stroke. They use
`currentColor` or a surface token. Three things carry a baked-in colour that
cannot inherit and so get an explicit dark override instead: the `.nb-select`
chevron (a data URI), the `.nb-skel` sheen (a gradient), and the consent
card's REQUIRED chip.

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
| **Colour** | `#FFF93E` — the Rainbaw yellow. |
| **Surface** | Dark (`#0d1117` / `#0a0e14`) |
| **Privacy** | Swiftaw's, `/legal/privacy-policy` |
| **Consumers** | Fortized uses it live. Hereld will. |

Site keys are `lc_site_<12>`; secrets are `lc_secret_…` and belong in a request
body, never in an `apikey` header. The domain allow-list matches bare
hostnames, not full URLs.

Where Hereld uses it: signup, suspicious auth, account creation, company
verification, abuse prevention. **Not everywhere** — a CAPTCHA on every action
is just friction.

### The widget was kept, not redesigned

`lifecheck/embed.html` is the good one. It was brought onto the Rainbaw and
onto Swiftaw's checkmark, and one challenge was rebuilt because it was lying
about what it measured. Everything else about it stands.

**The checkmark is Swiftaw's, and it is not a glyph.** It used
`<i class="fa-solid fa-check">`. It now draws the same mark the consent card
draws, the same way: two 3px borders on an empty 11×6 box, rotated -45°. That
matters beyond consistency — FontAwesome is a CDN, this widget renders inside
*other people's pages*, and the one mark that says "you passed" should not
depend on a third party being reachable. Verified with the CDN blocked.

The tick is scoped as `.chk-tick` rather than replacing `.chk-box i`
wholesale, because two states in that same slot legitimately want real
glyphs: the jam state sets `fa-gear` and its retry sets `fa-rotate-right`.
And the checked rule has to restate `rotate(-45deg)` alongside its `scale(1)`
— a bare `scale(1)` drops the rotation and draws a right angle.

### Trace the beam now traces the pointer

The old build was a reveal, not a trace. `.beam-live` carried the **ideal**
curve and `stroke-dashoffset` unveiled it as you advanced, so the line that
appeared was perfect no matter how badly the hand actually moved — a drawing
playing back. It measured nothing about the pointer that the checkpoint hits
did not already measure, and it *looked* like an animation, which is the
opposite of what a proof-of-human control should feel like.

The stroke is now the pointer's own path: samples collected on `move()`,
thinned at 1.2 units, capped at 600, redrawn as `M x yL x y…` with
`stroke-linejoin:round` (a wobbling hand spikes at every sample without it).
It wobbles where you wobbled and it wanders into the margin when you leave
the track, which is also the honest picture of why a stray was counted.

Two details that are easy to get wrong:

- **One sample paints nothing.** `M x y` alone draws no pixel even with a
  round cap, so a single point emits `M x yL x y` — it goes to itself.
- **The tolerance has to be measured in screen pixels.** The svg is
  `preserveAspectRatio="none"`, so one x unit and one y unit are different
  numbers of real pixels; a radius in svg units is an *ellipse* on screen.
  `dist()` scales by `rect.width/W` and `rect.height/H` first.

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

### The tile is a square, not a row

Icon on top, name underneath, nothing beside either — three to a row. The
first build put a one-line description next to every icon, which turned the
panel into a list to *read* when it should be a board to *aim at*. You already
know what Fortized is; you are here to click it. So the icon is the target and
grew to 52px, the name is a label and shrank to 12.5px, and the description
survives only as the tile's `title`.

The star moved into the tile's top-right corner for the same reason: a row of
its own would have cost every tile another 30px of height for a control most
people touch once. Hover lifts the tile rather than sliding it — in a grid, a
tile that slides right walks into its neighbour.

### Starring MOVES a product

Favourites are pinned with the star and kept in `localStorage` per browser;
nothing about them leaves the device. A starred product **leaves its category
and appears only under Favourites**. It is not listed twice. Two tiles for one
product — one starred, one not — is the panel disagreeing with itself, and it
makes the star look like it did nothing, because the tile you just clicked is
still sitting exactly where it was. Favourites is a section, not a badge.

**Hereld has no domain, so its tile has no link.** It is a `<div>` flagged
*Coming soon*, not an `<a href="#">` — a tile that leads nowhere must not
behave like one that does. It becomes a link the moment a domain exists.

### There is no account in here, and no footnote about accounts either

The account is its own button, sitting beside this one — see below. They were
briefly one control and that was wrong twice over: it buried the account
inside a products menu, and a launcher that also holds your session is
precisely the thing that makes people believe the products share one.

The panel used to carry a standing line at the bottom about the three account
systems being separate. **That line now lives only in the account panel**,
which is where somebody thinking about accounts is actually looking. The fact
has not been softened or dropped — it moved to the door it belongs behind. A
paragraph about accounts at the bottom of a menu with no account in it was
answering a question nobody was asking there.

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
- **Signed in** it is the avatar, opening a panel that reads in Google's order
  and for Google's reason: **email first**, small, then the avatar, then the
  username, then *Manage your Swiftaw account*. On a machine with three
  accounts saved, the only question you have when you open this is which one
  you are currently signed in as — so the address answers it before anything
  else does. Below that: the other accounts on the roster, add another,
  settings, log out.
- ***Manage your Swiftaw account* is yellow with black text.** It was a paper
  button on a paper panel, which is the one combination in this system that
  has no fill of its own to show — a 3px stroke drawing a rectangle around
  nothing. Yellow is the primary Rainbaw and this is the panel's primary
  action, so it is the one thing in here allowed to be loud. It is also
  smaller than it was: at 13.5px in a 3px stroke it carried the same weight as
  the 66px avatar above it and outranked the account it belongs to. Black text
  is not a choice — nothing else is readable on `#FFF93E`.
- The footer repeats the account rule in the place it actually bites:
  *"Swiftaw, Fortized and Hereld accounts are separate. Signing in here does
  not sign you into a product."* This is now the **only** place that line
  appears; the launcher used to carry a copy and no longer does.
- Under it, **Privacy Policy** and **Terms of Service**, absolute to
  `swiftaw.com/legal/…`. Absolute rather than root-relative because this panel
  also renders on Lifecheck and Supernova, where a root-relative path would
  land somewhere else entirely. Both routes exist; neither is invented.

If Supabase cannot be reached it still draws the signed-out button rather than
nothing. We cannot know who you are, and `/account` is the one route that can
recover the session — a gap in the corner helps no one.

Its styles are injected by the script rather than pulled from `nb.css`,
because it loads on pages that have not been rebuilt on the system yet and an
account control has to render. Same recipe either way: black stroke, black
hard shadow, and a fill that follows the page. It reads `data-theme` off its
own `<script>` tag and **defaults to `dark`**, since every Swiftaw property
is dark today; a light page opts out with `data-theme="light"`.

**The avatar is a rounded square that fills the button**, not a circle inside
it. Nothing else in this system is round, and a circle floating inside a
rounded square reads as two shapes arguing over the same 42px. On the trigger
it takes the button's whole content box with no stroke of its own — the button
already has one — and an inner radius of the outer radius less the border
width, so the two curves are concentric rather than one cutting across the
other.

### Only one popover at a time

Clicking either dock control closes the other. It cannot be done with an
outside-click listener, because each script calls `stopPropagation()` on its
own button so the other's `document` handler never hears the click. Instead,
opening dispatches a `swiftaw:popover` CustomEvent on `document` carrying its
own id, and every other popover closes on any event that is not its own.
Neither script imports the other, neither has to load first, and either can be
absent.

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

# `index.html` — the homepage, rebuilt

The first page rebuilt on `swiftaw-nb.css`. It carries `data-nb="dark"`, so
the ground is `#0C0F15` and the panels are the lighter dark. **The page did
not become paper.** The reference images were white because the reference was
white; the instruction that followed them was "i still want the UIs to be
dark, not light". Only the hero slab is yellow, and it is yellow because it is
the one thing on the page that has to be looked at first.

## The tagline is the hero

```html
<h1 class="nb-display nb-d1 hp-tagline">Make It Matter<span class="stop">.</span></h1>
```

Three words, that capitalisation, that full stop — and the full stop is
Rainbaw red, because the sentence ends on a colour rather than trailing off.
Nothing is appended to it. "BUILD BOLD." and "swiftly beyond" are gone from
the page, the `<title>`, the meta description and the JSON-LD `slogan`.

The slab re-points `--nb-fg` and `--nb-fg-muted` at ink, the way every surface
in this system does, so the eyebrow and the sub-line under the tagline are
coloured for the yellow they are printed on and not for the dark page behind
it.

## Everything the page claims is true

Fortized is Live. Hereld says **In build**, and that is all it says — no link,
no waiting list, no "sign up to hear first", because there is nothing to sign
up to. Lifecheck and Supernova are Live, and Supernova's card states the
AI-labelling promise rather than a capability list.

The three fact cards say two platforms, two services, founded 2025 in
Île-de-France. That is the whole of what is verifiable, so that is the whole
of what is on the page. No customer counts, no uptime figure, no logos of
companies that have never heard of us.

### Hereld is not greyed out

`.is-soon { filter: grayscale(1) }` was applied to its icon. A real brand
rendered in grey reads as discontinued, not as early. The rule and the class
are gone; the "In build" tag carries the status on its own.

## 🐞 The 133 reactions that never happened

`css/swiftaw.js` seeded the reaction widget with

```js
const SEED = { stoked: 53, stunned: 37, loved: 43 };
```

and `swiftaw-supabase-setup.sql` inserted the same numbers into
`swiftaw_reactions`. The code's own comment said they "live in the Supabase
row as if they were real". They were shown to every visitor as a count of
what other people had felt about the page — on the site whose own rule is
*do not invent fake statistics*. Both are zero now.

⚠️ **Zeroing the seed does not clean an existing project.** `on conflict do
nothing` means a database that was set up before this change still holds 133.
The reset is in the SQL file, commented, and has to be run once by hand:

```sql
update public.swiftaw_reactions set count = 0;
```

## 🐞 The reveal observer only knew one design system

`.nb-reveal` starts at `opacity:0` and waits for `.is-in`. The observer in
`css/swiftaw.js` only ever added `.visible`, to `.reveal`. **Every revealed
block on the new homepage would have rendered blank**, and it would have done
so on every future NB page too. The observer now serves both:

```js
e.target.classList.add(
  e.target.classList.contains('nb-reveal') ? 'is-in' : 'visible');
```

⚠️ It is exposed as `window.SwiftawObserveReveals(root)` so content injected
after load can be observed. Anything that builds reveal blocks at runtime has
to call it — an unobserved `.nb-reveal` is permanently invisible, not merely
un-animated.

Confetti in the same file drew `#fef83d`, `#fff000` and `#ff8ab4` — two
near-misses of the Rainbaw yellow and a pink that is not ours. It draws the
five now.

---

# `about-us.html` and `mission.html`

The second and third pages on the system, and the pair that turned one page's
choices into a page *shape*. Every rebuilt interior page now opens the same
way: `.pg-head` → `.pg-slab` → an eyebrow, a display heading whose full stop
is a real `<span class="dot">`, a lede.

⚠️ **The interior slab is `--nb-surface`, not yellow.** Only the homepage hero
and the mission thesis are yellow. Yellow means *this is the one thing to read
first*; a yellow slab at the top of every page is wallpaper, and then nothing
on the site is emphasised. **The stop is `--nb-red` everywhere**, including the
homepage — one rule, not a coincidence that held twice.

## About

Three facts, and they are the same three that were already true: Île-de-France,
August 2025, independent. Four product cards, each carrying the real status
(`Live` / `In build`) and only Hereld's is unlinked, because there is nothing
to link to.

The leadership roster is carried over unchanged — same four seats, same names,
same dates. **The vacancy is drawn as a vacancy**: "Open seat", grey, with the
date it opened. Filling that square with a stock face or quietly dropping the
row would both be inventing an employee, in opposite directions.

⚠️ `.ab-item` is a column flex container, so a `.nb-btn` inside it stretches to
the full card width and reads as a banner rather than a button. It needs
`align-self:flex-start`, and `margin-top:auto` so the four buttons line up
across the grid however long each card's copy runs.

## Mission

The four pillars are band cards: the colour lands only on the 12px band, so
four cards read as one set with four labels instead of four separate designs.
One yellow slab in the middle carries "Make It Matter." as the thesis, and
nothing else on the page competes with it.

The section that earns the page is **"What that rules out"** — an engagement
feed, selling what people say to each other, passing AI off as a person,
announcing things that do not exist. A promise is only worth reading if it
says what it costs, and each of those is a thing we could ship that would
work.

### 🐞 The mission page was advertising the fake seed

Its explainer row read **"133 to start the party. everything after is you."**
That was the fabricated reaction count from the homepage bug, printed as a
feature. The whole reaction widget is gone from this page: it is a duplicate of
the homepage's, bound to the same three Supabase rows, so it was one counter
rendered twice.

---

# The nav burger is shared

`swiftaw.js` now drives **both** menus: the old pages' `.nav-hamburger` +
`.mobile-menu` pair, and the rebuilt pages' `.nb-nav` collapsing its own
`.nb-nav-links` row. The homepage carried its own six-line copy for one
release; it does not any more.

⚠️ A rebuilt page needs `.nb-nav`, `.nb-nav-burger` and `.nb-nav-links` present
for it to bind. It closes on link click as well as on the button, because
in-page anchors do not reload and the menu would otherwise sit over the section
it just jumped to.

---

# `innovation-room.html` and `newsroom.html`

Both are list-plus-detail pages driven by one data object, and both keep the
URL contract the old build had: `?innoproject=<id>` and `?article=<id>` still
resolve, so any link anyone has already shared still lands on the right thing.

## The Lab has exactly one project, and that is what it shows

`PROJECTS` holds **swiftign**, because swiftign is the only Innoproject there
is. Nothing was added to make the grid look busier. `SwiftawLab-Soundboard.png`
sits in the repo root and is **not** a project — an orphan asset is not
evidence of one, and inventing an entry to give it a home would be inventing a
product.

The status taxonomy — Live · Cooking · Dreaming · Shelved · Killed — is real
and stays, rendered as a chip row with counts read off `PROJECTS` at runtime.
It cannot drift, because nothing states a number by hand. Five of the six chips
currently read `0`, and that is the honest shape of a lab with one project on
the bench.

⚠️ **Killed projects stay on the page.** A lab that only shows the wins is a
showroom.

⚠️ The "this is an Innoproject, not an announced product" note used to appear
only on non-live project pages. It now **also** sits on the list page as a
standing `nb-alert--info`, because the sentence is the point of the whole
section, not a disclaimer bolted to individual entries.

### 🐞 The signoff said "this page is built with it"

swiftign's write-up is dated 13 jun 2026 and describes the *old* language:
dark canvas, one yellow accent, tilts, capsule nav, Syne + DM Sans. The body is
carried over verbatim — it is a record of a real project and not mine to
rewrite. But its last line claimed the page you were reading was built in it,
and after the neo-brutalist rebuild that is simply false. **That one sentence
is changed**, and only that one, to say the page is the record of swiftign
rather than a demonstration of it.

## The Newsroom is empty, on purpose

`SW_ARTICLES = {}`. Nothing has been published, so nothing is listed, and no
placeholder release was written to fill the grid. When there is a post, the
comment above the object says exactly which keys it needs.

⚠️ **With no posts there is no search box and no category chips.** Both are
hidden until there is something to search: a filter over zero rows is
furniture. The chip row also stays hidden while only one category exists — an
"All" chip standing next to a single category filters nothing.

## Two shared details, worth not relearning

⚠️ **A card is a real `<button>`, so every part inside it is a `<span>`.** A
`<div>` inside a button is invalid, and browsers reparent it silently — the
banner ends up *outside* the card and nothing errors. `bannerHTML()` takes a
tag argument for exactly this: `span` in the card, `div` on the detail page.
Each span then has to be told to be a block.

⚠️ **Cards are built after the shared reveal observer's first sweep**, so
`renderGrid()` hands the new nodes to `window.SwiftawObserveReveals(grid)`.
Skip it and a filtered grid renders at `opacity: 0` — present, measurable, and
invisible.

⚠️ **The empty-state and missing-banner art is same-origin.** It was
`fortized.com/Icons/FortizedHelmet.png`. A placeholder that only ever appears
when something is already missing must not itself depend on another site's CDN;
it is now `/SWFT-Deco/pretty-logo.png` (Lab) and
`/SWFT-Deco/we-create-content-deco.png` (Newsroom).

---

# The account rule, restated because it keeps mattering

Fortized accounts, Hereld accounts and Swiftaw accounts are **three separate
systems** and stay that way through this work. The launcher is navigation. The
consent component is per-origin. Neither is a step toward merging anything.

Account architecture is a separate job, for later.
