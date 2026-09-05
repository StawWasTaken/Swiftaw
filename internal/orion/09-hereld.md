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

**Then the second half, and it is the bigger one.** Every opaque pixel in
`HereldAt.png` is `(12, 15, 21)`, which is `#0C0F15`, which is `--nb-bg`, which
is the exact colour of the surface the splash paints. The artwork is drawn in
the colour of its own background. So the colour treatment is not decoration: it
is the only reason anything is visible at all, and for as long as
`docs/css/hereld.css` takes to arrive there is nothing on the screen. That is
"doesn't always appear", and it gets worse the slower the connection.

- [x] **A1a.** Replaced the filter chain with a mask on `--nb-blue`, on a
      `.hd-splash-mark` span rather than an `<img>`.
- [x] **A1b.** The same two rules are inlined in `docs/app.html`'s head, with a
      `preload` on the artwork, so the splash is painted before the external
      stylesheet lands. `--nb-blue` carries a literal fallback there for the
      same reason.
- [x] **A1c. Both halves of that either/or, since neither was enough alone.**
      The beat is counted from the artwork now rather than from the page. The
      inline script loads `HereldAt.png` itself and stamps `__hdSplashArt` when
      it decodes; `splashOff` waits for that stamp and holds `SPLASH_HOLD` from
      there. `SPLASH_CAP` of 4200ms is the ceiling on the waiting, because a
      fetch that never resolves either way must not hold the door shut, and by
      then what is behind it is ready anyway.

      And a fetch that fails puts the name up in words. Holding on the artwork
      is worth nothing if the artwork is never coming: the mask would draw
      nothing, the hold would run to the cap, and the screen would be empty for
      every second of it. On `onerror` the mark becomes `Hereld` set in Syne,
      and the hold drops to the plain beat since there is no longer anything to
      wait for.

      Three paths checked, timed inside the page: artwork present, gone at
      2931ms with the mark up from 73ms; artwork 2600ms late, gone at 4825ms,
      which is the cap holding rather than 2600 + 2300; artwork failed, words
      up at 106ms and gone at 2946ms.

      **The harness lesson is worth more than the fix.** A slow image cannot be
      simulated by Playwright routing here. The script that starts the clock
      sits after a `<link rel=stylesheet>`, the Google Fonts stylesheet is
      blocked in the sandbox, so by the time the script runs the delayed image
      has already landed: three route hits each held 2600ms and the artwork
      still arrived 4ms after the splash went up. Routing was measuring the
      sandbox, not the page. Stub the `Image` constructor instead, which is the
      boundary the code actually depends on. And the run before that one
      reported "all clear" while proving nothing, because the delay never
      landed and the slow case finished in the same 2.96s as the baseline. A
      test that cannot fail is not a test: assert on the measured arrival, not
      only on the outcome.

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

- [x] **The small one is done.** `autocomplete="username"` now sits on the email
      field and the handle field is `autocomplete="off"`. A password manager
      will offer the saved credential where the account is identified.
- [!] **A2a. Which one did Staw mean?** Still open, still needs a word before the
      large one gets built. The small one is shipped in the meantime and does no
      harm either way.

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

**Swept.** Every route was rendered at 1360 and 430 against a stubbed data layer
and each control measured against its nearest clipping ancestor. Three real
cases, and the third turned out not to be a shadow problem at all.

- [x] **A3a. `.hd-tabs`.** `overflow-x: auto` forces `overflow-y` to compute to
      `auto` as well, so the row clips vertically even though nothing asked it
      to, and `.hd-tab.is-on` lost 4px of its shadow at both widths. Padding
      buys the room back, a negative margin returns the row to where it sat.
- [x] **A3b. `.hd-stf-nav` under 900px.** Same mechanism. It already had
      `padding-bottom: 6px`, which covered the shadow but not the 1px the hover
      lift needs above and to the left.
- [x] **A3c. The staff console was 148px wide on a phone**, and that is the one
      a person would actually describe as buttons being cut in half.
      `body.hd-wide .hd-shell` restates `grid-template-columns` after all three
      breakpoints have been declared, so it wins at every width and holds the
      rail column at its full 258px right down to 430px, leaving the console
      148px to live in. The breakpoints are now restated for `.hd-wide`.
      **The lesson is general:** an unconditional override placed below a set of
      media queries defeats all of them. Worth grepping for elsewhere.
- [x] **A3d. The press state is clean**, measured rather than assumed. Every
      control on all eight routes at both widths was forced into `:active` and
      `:hover` through CDP and re-measured against its clipping ancestor.
      Nothing is cut. The reason is in the geometry and is worth knowing: the
      button moves `3px, 4px` while its shadow shrinks from `4px 6px` to
      `1px 2px`, so the outer envelope is 4 right and 6 down either way. Press
      cannot clip anything that rest does not. **A3 is closed.**

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

- [x] **A4a. Inventoried, and it found something worse than monotony.** Explore
      printed Vibes and Worth following down the middle of the column while the
      right hand column printed the same two modules beside it, on the same
      screen, with two different empty states for the same thing. That is not a
      variety problem, that is the page saying everything twice.
- [x] **A4b. Explore now owns its width and lays out inside it.** The right hand
      column stands down on Explore (`body.hd-ex`), which is what X effectively
      does, and the width that buys is spent on a layout Explore has and the
      feed does not: four tabs (For you, Vibes, People, Latest), a two column
      body on For you, numbered topic rows, and a hero top topic on Vibes. Each
      tab fetches only what it will show, so nothing is read that is not drawn.
- [x] **A4c. Home carries modules, but only where the rail is gone.**
      Interleaving on desktop would just duplicate the rail. Under 940px the
      rail is not there at all, so from Home there was no route to a topic or a
      person. `feedWithModules` puts Worth following after the third post and
      Vibes after the ninth, CSS hides both above 941px, and neither RPC is
      called when they will not be shown.
- [x] **A4d. Nothing is invented.** Every count on both screens comes from
      `the_cry` and `who_to_follow`. No placeholder numbers were added anywhere.
- [x] **A4e. The post card is not one shape any more.** Done with **C6**, as
      that entry said it had to be. Two things came off it.

      The strip is gone from every post that has no replies. It used to go on
      all of them, make a request, then remove itself, so a quiet column was a
      column of round trips spent drawing nothing, and every card ended the
      same way whether or not it had anything to end with.

      And a post that is one short line is now set at 21px instead of 15.5.
      Six words at the size of six paragraphs sit lost in the middle of all
      that border, and that was most of what made a column of text posts read
      as the same card nine times over. Only where the words are all there is:
      a picture, a ballot, a quote or a note already gives a card its own
      shape, a link blown up is just a URL blown up, and in a thread the post
      being answered is the one that should carry the weight, so replies keep
      the ordinary setting.

      What was already true stays true: quote posts, media posts and polls
      differ in the data. They now differ enough in the layout to break the
      rhythm, because the two cards either side of them are no longer
      identical to each other.

**Fixed along the way:** the new Explore pushed the page 196px wider than the
viewport at 1360. A grid item will not shrink below its content unless it is
told to, and a sideways scroller inside one expands the item instead of
scrolling. `min-width: 0` on the children. Worth remembering, it is the same
family of mistake as A3c: a rule that looks local and is not.

**And one that looked like that mistake and was not.** Checking A4e at 430,
`scrollWidth` said the page was 102px too wide. It is not: the suggestions
strip is a sideways scroller, and its own scroll extent counts towards
`scrollWidth` whether or not anything can move. `body` clips it and setting
`scrollLeft` does nothing. Ask whether the page can actually be scrolled
sideways, not what `scrollWidth` says, on any page carrying a scroller.

---

## B - The three that live in other lists

- **Bots need fixing** went to [`06-hereld-bots.md`](06-hereld-bots.md) and is
  **done there as far as it can be done from here.** The console half is live:
  a bot can be given a character, a new one can be made, and there is a real
  activity log. That needed no database work at all, because the three things
  to do it with had been written and then never called by anything. The
  behaviour half is written but waits on a redeploy and a migration, and it
  turned up two things worth naming here: the accounts were told they could
  @-mention handles, and any signed-in account could read the whole roster with
  its characters. Both are in list 6.
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
      the `create_premium` job. **Goes with list 6**, and one finding is already
      recorded there: the persona prompt tells a bot it "can mention @handles
      when it fits naturally", and a model inventing a handle will sooner or
      later invent a real one. Bots @-ing strangers unprompted is a spam vector
      and it is live. **Now written and waiting on a redeploy**, along with the
      canned filler and the credentials the ten standing accounts claimed. The
      console half of that list shipped. See list 6.
- [x] **C2. Auto-mentions.** This is Supernova answering when it is called into
      a thread, and it is sound: it checks whether it already replied, logs
      every attempt with the model and the reason it failed, and writes nothing
      when nothing usable came back.
- [x] **C3. The explain / analyse card.** Two real faults, both fixed.
      **It was built in an `hd-grok-*` namespace** - 29 class names carrying a
      competitor's product name, a hundred times over across the script and the
      stylesheet, in the page source of every deploy. Renamed to `hd-look-*`. And **Supernova's first answer lost its formatting**: the
      opening answer was escaped as plain text while every follow-up in the same
      panel went through the renderer, so one conversation formatted two ways.
      Copy rewritten off "Analysing Post..." and "Thinking about your request".
- [x] **C4. Profile summaries.** Same `hd-grok-*` namespace, same rename. Both
      code paths are reachable after all, one from the hover card and one from
      the profile menu, so neither is dead.
- [x] **C5. The floating new-posts capsule.** Two faults. **It leaked a scroll
      listener on every visit to a feed**, and they stack for the life of the
      page. And it worked out which view it was on by **serialising the whole
      column and searching the string for the word Latest**, which any post
      could contain, and which the new Explore tab now contains by name. It
      asks the route now.
- [x] **C6. The strip was stating a number it could not know.** It printed the
      length of the face list, and the face list is asked for three, so a post
      with forty answers said "3 people replied". Wrong, on a social platform,
      about that platform's own activity, and the reply button an inch below it
      carried the true count the whole time. So the strip was the same figure
      twice when it happened to be right and a false one when it was not, in
      the same words on every card in the column.

      It names people now, which is the one thing the button cannot do and the
      one thing that differs post to post: two names and how many others, with
      the total taken off the post's own `reply_count`, which was already on
      the row and cost nothing to ask.

      **Two more, found while in there.** The strip went on every post
      including the ones with no replies, so those made a request and then
      removed themselves. And the requests were awaited in a loop, so a column
      of twenty posts was twenty round trips end to end with the faces
      arriving down the page for as long as that took. Gated on the count and
      sent together. Done with **A4e**, as this entry said it had to be.
- [x] **C7. The composer preview.** The comment above it says the preview stays
      out of the way below the bar where the renderer actually does something.
      The code previewed everything, so most posts, which are plain, were typed
      back at their author underneath themselves. It does what it says now.
- [x] **C8. Community notes.** Sound, and better than expected. The opener the
      CEO specified is not merely asked for in the prompt, it is **checked, and
      a summary that does not start with it is thrown away** rather than
      published. Contributions are attributed, disagreement is kept.
- [x] **C9. Disclosures.** Sound. Drawn before the words rather than after, so
      it is read before the thing it qualifies rather than as a footnote to it.
- [x] **C10.** The splash colour overlay. This is A1, done.
- [x] **C11. The compass icon.** It was added to the registry **twice, byte for
      byte identical**, so one of the two had never been read by anything. The
      duplicate is gone. It was the only duplicated key in 57.
- [x] **C12. The Supernova redesign, and the defect under the taste
      complaint.** "The supernova design is ugly" was right, and it was sitting
      on top of something worse: **every turn was signed by the wrong speaker.**
      A question the reader typed was drawn beside Supernova's mark, and an
      answer Supernova generated was drawn beside the reader's own face.
      Machine text under a person's name is the one attribution an assistant
      must never get wrong, and nobody had noticed because both halves looked
      plausible on their own.

      **The cause is one word carrying two meanings.** On the wire a turn is
      `you` or `them`, and both are written from Supernova's side of the
      conversation: `supabase/functions/supernova/index.ts:58` reads `you` as
      the assistant. The send handler pushed by that rule. The page renderer
      read `you` as "you, the reader". And the follow-up chat on a post card
      spoke a **third** vocabulary, opposite again, two lines away from a push
      that used the wire's. Three readings of one word inside one file.

      The wire strings are untouched, because the function that reads them
      cannot be redeployed from here, and renaming them client-side would break
      every conversation the moment it shipped. Instead `saidByNova` is now the
      **only** place the word is interpreted, and `addChatTurn` takes the wire's
      role and hands off to the same renderer the page uses. One vocabulary, one
      reading of it.

      The shape was rebuilt in Hereld's own language rather than a new one:
      the bubbles are gone (18px pills with a clipped tail corner, a shape this
      app speaks nowhere else and every phone messaging app speaks everywhere,
      capping an answer at 78% of half a column); an exchange reads down the
      column now, question as a heading, answer full width beneath it, parted by
      the same 3px rule the rest of the app uses. The mark arrives and then
      **stops** rather than panning five colours on a six second loop forever,
      on every mark on screen, which is the house style of every assistant on
      the internet and is not ours. The name is said once where it was said
      three times in 500px. The composer sits in the card the way the post
      composer does. And an empty screen is an opener with three starting
      questions, each one something this can actually answer, since a button
      offering to post or moderate is a lie the first click exposes.

      One regression caught in the making: with only a `min-height` the card
      grew with the conversation, which put the scroll on the window, made the
      panel's own scroll-to-newest a no-op, and pushed the composer off the
      page. A fixed height fixed it, and then `flex: none` on the turns, because
      **a column flex item shrinks by default**, so a long answer in a short
      panel is squeezed rather than scrolled past.

      Checked at 1360 and 430, on both surfaces: attribution both ways, the
      answer at full column width (640 of 640), the panel sitting at the newest
      turn, no sideways scroll, no bubble left drawn.
- [x] **C13. Post editing.** The migration says "nothing else is allowed to be
      edited through this door", and that is what it meant, but **a row policy
      cannot say which columns an update may touch.** The counts are already
      safe, the core migration revokes `view_count`, `endorse_count`,
      `reply_count`, `relay_count`, `hidden` and `author` at the column level,
      which is the right way to do it. Two things were still open, both reachable
      as the author's own request to the API with no button to find first:
      **clearing `edited_at`**, which is the one thing the whole feature exists
      to show, and **moving `created_at`**, and with it their place in a timeline
      sorted on it. `2026-09-04-hereld-edit-columns.sql` stamps the mark in the
      database instead of accepting it from the client and pins the columns that
      place a post. **It has to be run.**

**Also swept:** every RPC the client calls exists in a migration, all 27 of
them, so nothing is calling into a function that was never written. Two em
dashes, one in a toast and one in a migration comment. And the app was calling
one thing two names: the action row says Relay, the notification filter and the
analyse card said Repost. Relay is ours, so Relay everywhere now, including in
the prompt Supernova reads, which could otherwise have said Repost back to a
reader.

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
