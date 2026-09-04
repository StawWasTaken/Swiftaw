# Orion 9 - Hereld, fixed and finished

Hereld gets its own list for the same reason Fortized has one: it is a whole
product, it is live, and the work on it is not a subsection of anything else.

This list is the CEO's punch list of 2026-09-04, plus the audit that came with
it. Three of the seven items belong to other lists and are cross-referenced
rather than duplicated. The other four are here in full, with what has already
been found.

---

## A - The four that are Hereld's own

### A1. The splash mark is the wrong blue, and sometimes not there

**Found.** `_css/hereld.css:58`:

```css
.hd-splash img { filter: invert(72%) sepia(87%) saturate(1450%) hue-rotate(174deg) brightness(101%) contrast(98%); }
```

That is a filter chain guessing at a colour. It cannot land on `#2CAFFC`
exactly, it lands somewhere near it, and where it lands depends on the browser's
filter maths. `--nb-blue` is right there in `hereld-nb.css:21` and is never
consulted.

`HereldAt.png` is 581x581, 8-bit, colortype 6, so it already carries a real
alpha channel. The fix is the technique this codebase already uses for the
Supernova mark: mask the artwork over a `background: var(--nb-blue)` fill. Exact
colour, one token, and it follows the theme if the theme ever moves.

- [ ] **A1a.** Replace the filter chain with a mask on `--nb-blue`.
- [ ] **A1b.** "Doesn't always appear" is a separate half. Find out whether the
      mark is missing or merely invisible against the ground before changing
      anything. A mask whose image fails to load hides the element completely,
      which is exactly the bug found in `.hd-nova-av-wrap::after` on 2026-09-04,
      so the mask fix must not introduce the same failure mode. Check the splash
      timing too: if it is dismissed on a timer rather than on load, a fast
      connection can take it away before it has drawn.

### A2. Sign-in is asking for the handle where it should ask for the email

**Found, and it needs a decision before it is touched.**

`docs/join.html:62` puts the credential autocomplete on the handle field:

```html
<input class="nb-input" id="handle" type="text" autocomplete="username" ...>
```

while the email field on line 70 gets `autocomplete="email"`, which browsers do
not treat as a credential. The form logic itself is correct: `paint()` hides
name and handle on sign-in, and line 192 signs in with `H.signIn(email, pw)`.
So the account system is not confused, the password manager is. It saved the
credential against the handle box and offers it back there.

That gives two possible readings of the complaint and they are different sizes
of work:

- **The small one.** Move `autocomplete="username"` to the email field on
  sign-in, since that is the field that identifies the account. Half an hour.
- **The large one.** Actually let people sign in with their handle. Supabase
  auth is email-keyed, so this needs a handle-to-email lookup before the auth
  call, which is an account-enumeration surface: anybody can then ask the server
  whether a handle exists. It is buildable, it wants rate limiting and a
  constant-time answer, and it is not a CSS fix.

- [!] **A2a. Which one?** Ask before building. Assume the small one until told.

### A3. Buttons are half cut

**Mechanism identified.** The Neo-Brutalist button carries an offset shadow
outside its own box: `--nb-sh: 4px 6px 0`, growing to `5px 7px` on hover, and
`:active` translates the button itself by `3px, 4px`. So a button needs 4 to 7
pixels of room to its right and 6 to 11 below, and it needs its parent not to
clip.

Hereld clips in a lot of places. `.hd-hero`, `.hd-prof`, `.hd-art`,
`.hd-stf-box`, `.hd-modal-body` and around thirty more carry `overflow: hidden`
for good reasons of their own. Any button sitting near the edge of one of those
loses its shadow, and on hover or press moves partly outside the clip.

**Fix the containers and the spacing, not the shadows.** The shadow is the
design. Removing it to stop the clipping would be fixing the symptom.

- [ ] **A3a.** Sweep the app for buttons inside clipping parents, tight grid
      cells and flex rows with no trailing gap. Screenshot the ones that cut.
- [ ] **A3b.** Give each its room: padding on the parent, or the parent stops
      clipping if nothing needed it to.
- [ ] **A3c.** Check the press state too, not only rest. A button can look right
      until it is pushed.

### A4. Feed, Explore and Home do not read like X

The instruction was "we need more diverse stuff, find it yourself", so this is
design work rather than a bug, and it is the largest item on the list.

What X actually does that Hereld currently does not, as a starting reading and
not a specification:

- **The timeline is not one shape repeated.** Posts, quote posts, threads,
  replies shown with their parent, media-led posts, polls, a trend module, a
  who-to-follow module, a live topic. Hereld renders a near-uniform card down
  the whole column.
- **Explore is editorial, not a list.** Trends carry a category and a count, a
  news item carries a picture and a summary, sections have their own headers.
- **Home has entry points.** For you and Following as real switches with
  different results behind them.

- [ ] **A4a.** Inventory what Hereld renders today across the three views, and
      what post shapes the data already supports. Some of this may only need
      rendering, not a schema.
- [ ] **A4b.** Design the additional shapes against the Neo-Brutalist rules, not
      against X's visual language. The density and the variety is what is being
      borrowed. The look stays ours.
- [ ] **A4c.** Build, in the order that adds the most variety per unit of work.
- [ ] **A4d.** No fabricated numbers anywhere in it. Trend counts, view counts
      and follower suggestions come from the database or they do not appear.
      This is a standing rule and this is exactly the screen that tempts people
      to break it.

---

## B - The three that live in other lists

- **Bots need fixing** goes to [`06-hereld-bots.md`](06-hereld-bots.md). That
  list is nearly complete already and names the gaps: no way to shape a bot from
  the console, five blocked items waiting on Staw. Section A5 there is very
  likely the concrete complaint.
- **Supernova's design is ugly** goes to
  [`02-supernova-pulsar.md`](02-supernova-pulsar.md) and to list 1 section A1.
  Hereld's Supernova surface should not be redesigned separately from
  Supernova's own, or there will be two of them.
- **Sign-in** overlaps [`08-sign-in.md`](08-sign-in.md), which is where the
  join screen is due to be rebuilt anyway. A2 above is the immediate fix; the
  rebuild is list 8's.

---

## C - The audit: everything the other account added

> "look for every feature added not by you but by account and fix them"

**Scope established.** Between 2026-08-30 and 2026-09-01, roughly 35 commits
authored `stawwastaken` went into Hereld. Author counts since 2026-08-01: 25
Claude, 18 StawWasTaken, 41 stawwastaken. The files that account touched most:

| File | Commits |
| --- | --- |
| `supabase/functions/supernova/index.ts` | 28 |
| `supabase/migrations/2026-08-30-hereld-features.sql` | 20 |
| `_js/hereld-app.js` | 16 |
| `_css/hereld.css` | 16 |
| `_js/hereld-staff.js` | 5 |
| `_js/hereld-ui.js` | 3 |
| `supabase/migrations/2026-09-01-hereld-premium-bots.sql` | 3 |

The features named in those commit subjects, which is the audit list:

- [ ] **C1.** Premium bot system: tier column, ten personas, article-style posts,
      the `create_premium` job.
- [ ] **C2.** Auto-mentions, with logging.
- [ ] **C3.** The explain / analyse card.
- [ ] **C4.** Profile summaries, in the hover card and on the profile page.
- [ ] **C5.** The floating new-posts capsule.
- [ ] **C6.** Replier avatars, via the `post_repliers` RPC.
- [ ] **C7.** Always-on markdown live preview in the composer.
- [ ] **C8.** Community notes.
- [ ] **C9.** Disclosures.
- [ ] **C10.** The splash colour overlay. This is A1. Same code, same commit.
- [ ] **C11.** The compass icon replacement.
- [ ] **C12.** The Supernova redesign. This is the "ugly" complaint, and it
      confirms the two are the same thing.
- [ ] **C13.** Post editing.

**How to audit one.** Not "does it render". Against the standards file: does it
work in all four states, is the permission check at the mutation, is there one
of it or did it become the second copy of something, does the copy read as
written by a person, and is there an em dash in it. The Supernova mask bug found
on 2026-09-04 came from this same body of work and had never drawn once, so
assume things are broken until seen working rather than the other way round.

The unminified sources are the ones to read: `_js/` and `_css/`, not `docs/css/`.

---

## Done means

The splash draws the real blue every time. Sign-in asks for what it signs in
with. No button is cut anywhere in the app, at rest or pressed. The three main
views have real variety in them and none of it is invented. Every feature the
other account added has been read, tested and either fixed or confirmed sound.
