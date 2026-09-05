# The design system

How every site we own ends up looking like it came from the same place.
Swiftaw, Workstation, Lifecheck, Fortized, Hereld, Supernova.

House rules cover the things that are not visual. This file covers the
visual ones, and more importantly it covers the machinery, because a design
system held together by remembering to match is not a system.

## The short version

Four things, and a page that has all four is inside the system:

1. **One token file.** `_css/swiftaw-nb.css`. Colour, border, shadow, radius,
   spacing, easing and type all come out of it. No component writes a literal.
2. **One script.** `<script defer src="/css/swiftaw.js">`. That single tag
   pulls in the account layer, the launcher and the consent banner.
3. **One footer.** A `<!--footer:site-->` marker in the page, filled in by
   `_build/footer.mjs` when the build runs.
4. **One build, one gate.** `node _build/min.mjs` builds. `node
   _build/min.mjs --check` exits 1 if anything is out of date.

Everything below is why those four, and what to do about the places that are
not there yet.

## The tokens

`_css/swiftaw-nb.css` is the only file where a colour is allowed to be a
number. Rainbaw sits at the top (red `#FF0033`, green `#3ECF6E`, blue
`#2CAFFC`, yellow `#FFF93E`, pink `#FF77E4`), then ink and paper, then the
one shadow off the spec sheet: `#000`, X4, Y6, blur 0.

The part worth understanding is `[data-nb]`. Two pairs of tokens, not one:

- `--nb-bg` / `--nb-fg` are the page ground and the text on it.
- `--nb-surface` / `--nb-surface-fg` are a raised panel and the text on it.

They are separate because on a dark page the ground is dark and the panels
are paper, while on a light page both are paper. A component that reads the
pair instead of picking a colour works on either without a single override.
Flip `data-nb="dark"` on a section and everything inside re-skins.

It is in real use, not aspirational: 44 dark contexts, 6 yellow, 6 light
across the pages and sheets today.

When you build a component, the test is simple. Drop it into a dark section
and a light one. If it needs an override to survive the move, it is reading
a literal somewhere and it should not be.

## The chrome

Account, launcher, consent, legal, footer, icons, pick, trace, zip. Each is
a `_js` file, some with a `_css` partner. A page does not name them.

`_js/swiftaw.js` is the bootstrap and the only one a page loads. It injects
`swiftaw-account.js` directly and lazily loads `swiftaw-launcher.js` and
`swiftaw-consent.js` when they are needed. That is why grepping the pages
for those filenames finds nothing: the pages have never heard of them.

This is the strongest piece of the system and the reason to keep using it.
Adding a shared behaviour to every site we own is one edit to one file, not
23 script tags. Resist the urge to add a second tag to a page. If it needs
to be everywhere, it belongs in the bootstrap.

## The footer

`_build/footer.mjs` holds the shape once. Sites are keys in a `SITES` map,
the Swiftaw legal and about columns are shared objects, and `render(site,
indent)` prints the markup at whatever depth the page nests it.

`min.mjs` finds `<!--footer:site--> ... <!--/footer-->` in every page under
`docs/` and refills it. The markup is real HTML in the file, so it is
crawlable and needs no script, and there is still only one place the shape
is written down.

Change a link in `footer.mjs` and run the build. Never edit the stamped
markup in a page: the next build overwrites it, and `--check` will call the
page stale before that.

## Where it stands, measured

Honest numbers rather than adjectives. Run these again when you want to know
if a change moved anything.

**Swiftaw repo, `docs/`, 23 pages.** 20 carry the token sheet. The same 20
carry a stamped footer. The three that carry neither:

- `lifecheck/embed.html` is the widget iframe that renders inside a
  customer's site. It must not carry our nav, our footer or our fonts. It is
  correctly outside the system and should stay outside.
- `supernova/index.html` and `supernova/chat.html` are the old
  `_css/swiftaw.css` capsule-nav build. They are already queued for redesign
  and will join then.

So there is no straggler. Two exceptions with reasons and one deliberate
exclusion.

**Colour literals outside the token file**, counting only bare ones and not
`var(--token, #fallback)` pairs, which are correct:

| sheet | bare literals |
| --- | --- |
| `_css/swiftaw.css` (legacy) | 61 |
| `_css/swiftaw-consent.css` | 28 |
| `_css/swiftaw-legal.css` | 17 |
| `_css/swiftaw-launcher.css` | 11 |
| `_css/swiftaw-icons.css` | 9 |
| `_css/lifecheck.css` | 3 |
| `_css/swiftaw-footer.css` | 1 |

The legacy sheet is where the debt lives and it retires with Supernova. The
consent and legal sheets are the two worth fixing on purpose, because both
run on every site and both are currently pinned to one look.

**Em dashes**, banned everywhere: 1 page left in Swiftaw `docs/`
(`supernova/index.html`), 0 in Hereld, 10 in Fortized's marketing pages.

**Hereld has its own copy of the token file.** `docs/css/hereld-nb.css`,
52 token names, every one of them also in Swiftaw's 54, and every value
byte-identical today. That is the whole problem in one file. It matches
right now, nothing enforces it, and nothing will tell you the day it stops.
Either it becomes a build output copied from Swiftaw's, or it carries a
sync note the way Fortized's footer sheet does. The current state, a silent
fork that happens to agree, is the worst of the three.

**Fortized's marketing pages** carry the shared footer sheet on 13 pages and
nothing else from the system. They should join it. The Fortized app should
not: it has its own appearance-token system that members can re-theme at
runtime, and its bundle is 4.5 MB on a throttled egress budget. Loading our
sheet there buys nothing and costs a re-download for every returning user.

## Keeping it that way

`--check` already exists and already fails a stale footer or stale build
output. The useful next step is widening it into one checker that runs over
all three repositories and fails on:

- a bare colour literal in any sheet that is not the token file
- an em dash in any source file
- a page under `docs/` with no `<!--footer:-->` marker and no reason recorded
- a page missing the token sheet
- a page missing the bootstrap script
- fonts loaded from anywhere but the one shared link
- a missing favicon or `theme-color`

Each of those is a grep. None of them needs a dependency, which matters
because there is no `package.json` in this repository and there does not need
to be one. Every command is a bare `node _build/...` invocation.

The exceptions are the interesting part. `lifecheck/embed.html` must fail
several of those checks forever, so the checker needs a small allow list with
a reason written next to each entry. A list of exceptions nobody can explain
is how a system rots quietly, and writing the reason down is what stops an
exception from being copied by the next person who needs one.

## What to do when you build a new page

- Load `/css/swiftaw-nb.css` and `/css/swiftaw-footer.css`, the shared Google
  Fonts link, and `<script defer src="/css/swiftaw.js">`. That is the whole
  boilerplate.
- Put `<!--footer:site--><!--/footer-->` where the footer goes and run the
  build.
- Set `data-nb` on any section whose ground differs from the page. Never
  restyle a component to survive the move.
- Title is `<page> - <Product>`.
- If a colour is not in the token file and you genuinely need it, add it to
  the token file rather than to your page.
- Run `node _build/min.mjs` before you push, and `--check` if you want to
  know whether someone else forgot to.
