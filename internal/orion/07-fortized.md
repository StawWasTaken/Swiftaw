# Orion 7 - Fortized, redesigned and reworked

> **D1 is answered: the app itself is redesigned, not only its web pages.**
>
> Three reasons, from Staw. It shows Fortized belongs to a shared ecosystem. It
> puts real distance between us and Discord and Guilded, so we stop reading as
> copyists and start being recognisable. And the layout was near-copied from
> Discord on purpose, as a base to start from, always meant to be replaced.
> This is the replacement.

## The diagnosis, with numbers

Staw described it as puzzle pieces forced together: some parts excellent, some
old and broken, much of it outdated, a lot of it superficial and non-working,
and none of it matching Swiftaw. That is measurable, and it measures worse than
it feels.

| | |
| --- | --- |
| `app/app.js` | **4.29 MB**, 75,775 lines, one file |
| `app/styles.css` | **1.44 MB**, 20,724 lines |
| Distinct CSS namespaces | **25 or more**: `.ftz-` `.fs-` `.stf-` `.rad-` `.ch-` `.gdm-` `.sc-` `.msg-` `.fpp-` `.sim-` `.disc-` `.pw-` `.chat-` `.qst-` `.bset-` `.mc-` `.mpp-` `.bstr-` `.rail-` `.home-` `.up-` `.fr-` `.np-` `.epp-` `.ev-` |
| Dead staff console still shipping | **490** `.sc-` references in JS, 234 CSS rules, unreferenced since its rebuild |
| Inline `style="` written from JS | **3,590** |
| Hardcoded colour literals outside `:root` | **3,226** |
| `font-weight: 800/900`, against a cap of 700 | **464** |
| FontAwesome class icons, against an inline-SVG rule | **322** across 113 glyphs |
| Emoji standing in for an icon | **171** |
| Coloured shadow declarations, against a no-glow rule | **153** |

Twenty-five namespaces is the whole story. Every one was somebody solving the
same problem again because reaching the existing solution was harder than
writing a new one. 3,590 inline styles is the design system being bypassed
three and a half thousand times. And 5.7 MB shipped to every returning user on
a cache-bust, on a project already over its egress quota.

None of this is an argument for a rewrite from zero. Fortized does a great deal
that works, and it is a real product with real people in it. It is an argument
for doing the rework in a fixed order so the pieces stop multiplying.

## What this does not touch

The existing REWORK plan in `docs/rework-plan.md` is good and is already
running: phases 0, 1a, 1b and 1e shipped, 1c and 1d next. **That plan is not
replaced, it is extended.** It was already collapsing duplicated logic, which is
exactly the prerequisite for a redesign. Finish its structural phases, then
redesign onto what is left, rather than redesigning twenty-five namespaces one
by one.

Accounts are untouched here. Fortized's account work belongs to list 3 and its
password hashing and row-level security are prerequisites there, not here.

---

## A - Make the surface area smaller before redesigning it

Every item here reduces what has to be redesigned afterwards. None of it is
visible, and all of it is the difference between a redesign and a repaint.

- [ ] **A1. Delete the retired staff console.** 490 JS references, 234 CSS
      rules, unreferenced by the shell and inert behind its own guards. It is
      the single largest dead weight and it ships to every user.
- [ ] **A2. Finish the collapse phases** of the existing rework plan, 1c the one
      composer and 1d the one message row, before any redesign lands. Collapsing
      the send path already surfaced four real defects; the composer and the row
      will surface more.
- [ ] **A3. Namespace amnesty.** Twenty-five down to a defensible number. Each
      one either becomes part of the shared system, merges into a neighbour, or
      is deleted with its feature. Nothing keeps its own namespace because it
      was written first.
- [ ] **A4. Split `app.js`.** 4.29 MB in one file is why everything is coupled
      to everything. Modules by surface, loaded as needed. This also directly
      serves the standing egress rule, since a returning user stops downloading
      the whole product to receive one fix.
- [ ] **A5. Ratchet the debt counters** that already exist in
      `tools/check-tokens.mjs` and `check-icons.mjs`. They only go down. Turn on
      `--strict` per category as each reaches zero.

## B - The design, on the Swiftaw system

- [ ] **B1. Port the Neo-Brutalist tokens into Fortized** as the source of
      truth, mapped onto its appearance system rather than fighting it. Fortized
      has themes and always will; the tokens define what a theme is allowed to
      change.
- [ ] **B2. Kill the 3,226 colour literals** by pointing them at tokens. This
      is what makes appearances work properly for the first time, and it is the
      biggest single readability win in the codebase.
- [ ] **B3. One button, one card, one field, one modal,** shared with the rest
      of the ecosystem. Fortized's 3D press is genuinely good and it is a
      Swiftaw idea, not a Discord one; keep the feel and rebuild it on the
      shared stroke and shadow.
- [ ] **B4. Retire the 464 heavy weights** to 700 and apply the type hierarchy:
      Tropicon on the one most important headline, Syne Bold below it, Syne for
      body, Syne Bold for anything small.
- [ ] **B5. Retire the 153 coloured shadows.** Overriding a glow leaves it for
      the next person to switch back on by accident; remove the declarations.
- [ ] **B6. Icons to inline SVG.** 322 FontAwesome class sites and 171 emoji
      standing in for icons. Blocked on real path data, which is not in the repo
      and cannot be fetched from the sandbox, so this converts surface by
      surface as each is rebuilt. Never invent a path.
- [ ] **B7. Twemoji everywhere,** as on every other Swiftaw property.
- [ ] **B8. The 3,590 inline styles go.** Anything computed stays as a custom
      property; anything static becomes a class.

## C - The layout, which is the actual point

This is where Fortized stops being a Discord tribute. It wants Staw in the room
rather than a specification written now, but the shape of the question is:

- [ ] **C1. The rail, the sidebar and the topbar** are the three most recognisably
      borrowed pieces. They are also the three most used. Redesign them first,
      together, because changing one without the others is what produced the
      current patchwork.
- [ ] **C2. Chat, on the collapsed message row** from phase 1d. One row, one
      composer, one send path, then a design that is ours.
- [ ] **C3. Bastions.** The bastion rework has its own plan and phases 1 through
      2c have shipped; phase 3 continues under this list rather than beside it.
- [ ] **C4. Everything else, surface by surface:** Friends, Quests, Radiance,
      Fortshop, Discover, Creator, profile, settings. Each one done fully, with
      its debt counters brought down, before starting the next.
- [ ] **C5. Innovation, deliberately.** Per list 0, a Swiftaw surface has
      something to touch. Fortized already does this well in places, the wallet
      capsules and the card tilts among them. Decide per surface what the piece
      of craft is, rather than leaving it to whoever gets there.

## D - Rework, not repaint

- [ ] **D1. Audit for superficial features.** Staw's word was "supercial", and
      there is precedent: `mention_everyone` had never been read by anything,
      `_verifiedCache` was written in three places and read in none, six of
      seven Discover category tabs could never match anything, the maintenance
      switch wrote a field nobody read. Every surface gets checked for controls
      that do not do what they say.
- [ ] **D2. De-AI the source** per list 0. Comments that narrate, defensive
      wrapping, duplicated helpers.
- [ ] **D3. Sweep the copy** for hollow lines and for `—`.
- [ ] **D4. One shared moderation system,** from list 4. Fortized's automod and
      staff console become an implementation of the company's system rather than
      their own thing.

---

## Order

A, then B, then C, and C in the order given. The temptation will be to start
with C1 because it is the visible one. Doing that before A means redesigning a
rail that still has twenty-five namespaces underneath it, and it is how the
current patchwork was made in the first place.

## Done means

Fortized reads as a Swiftaw product on sight, and nobody's first thought is
Discord. One namespace system, one set of tokens, one button. Nothing ships
that does not do what it says. The debt counters are at zero or moving there
every session, and the app is meaningfully smaller than 5.7 MB.
