# Plan Orion - the programme

**Internal. Personnel use only.** Written from the CEO's Orion memo, broken into
work that can actually be picked up and finished. The memo is the authority; if
anything here contradicts it, the memo wins and this file is wrong.

Six lists. Each one is a workstream that can be worked without holding the
others in your head:

| | Workstream | File | Rough state |
| --- | --- | --- | --- |
| 1 | Ecosystem and websites | [`01-ecosystem.md`](01-ecosystem.md) | Well under way |
| 2 | Supernova and Pulsar | [`02-supernova-pulsar.md`](02-supernova-pulsar.md) | Foundations only |
| 3 | The Swiftaw Account | [`03-swiftaw-account.md`](03-swiftaw-account.md) | Not started |
| 4 | Safety, security, moderation | [`04-safety-and-moderation.md`](04-safety-and-moderation.md) | Part built |
| 5 | Headquarters | [`05-headquarters.md`](05-headquarters.md) | Not started |
| 6 | Hereld bots | [`06-hereld-bots.md`](06-hereld-bots.md) | Nearly there |

Swiftaw-Mail is deliberately not a list. The memo defers it to its own session
and it should stay deferred until 1 to 5 are somewhere near done.

Status marks used in every list:

- `[ ]` not started
- `[~]` part built, needs finishing
- `[x]` done
- `[!]` blocked on a decision or a credential only Staw can give

---

## Read this before you file anything here

This repository is the GitHub Pages source for `swiftaw.com`, and it carries a
`.nojekyll` marker, which means **every file in it is served over the web**,
including this folder. `robots.txt` allowed all of it until now.

So a memo classified *"Do not leak to the public"* would have been sitting at a
guessable URL. `internal/` is now disallowed in `robots.txt`, but be clear about
what that buys: **it stops search engines indexing it, it does not stop anyone
who types the path.** It is a courtesy, not a lock.

The real fix is decision **D6** below. Until it is taken, treat this folder as
publicly readable and keep credentials, keys and anything genuinely sensitive
out of it. Nothing in these six lists contains a secret.

---

## The order the work wants to happen in

Not a schedule, a dependency chain. Doing it out of order means building things
twice.

1. **Ecosystem (1) first.** It is visible, it is low risk, and every other
   workstream ships its screens inside it. Finishing Supernova's site and
   Fortized's web pages also settles the design questions the rest inherit.
2. **Supernova (2) second, and it is the load-bearing one.** Moderation (4),
   Headquarters (5) and the bots (6) all consume Supernova. Every week Supernova
   stays a stub is a week those three cannot be finished properly.
3. **Moderation (4) once Supernova can be asked to judge something.** The parts
   that do not need Supernova - the block and report and ignore surfaces, the
   staff console, passkeys and 2FA - can go earlier and should.
4. **The Swiftaw Account (3) on its own.** This is the one that can lock every
   user out of every product at once. It gets its own run, with nothing else in
   flight, and a rollback that has been tested rather than assumed.
5. **Headquarters (5) in two halves.** The read-only half works today against
   three separate databases and is useful immediately. The cross-platform half,
   where one person is one row across all products, only makes sense after (3).
6. **Hereld bots (6) whenever.** Independent of everything else and mostly done.

---

## Decisions only Staw can make

Each of these changes what gets built, not just how. Where there is a
recommendation it is what I would do absent an answer.

**D1 - Does the Fortized *app* become Neo-Brutalist, or only its web pages?**
The memo says to include the Fortized app in the redesign and align it with the
company, and it also says Fortized's inspiration is Discord with a little
Roblox. Those pull in different directions, and the app is mid-rework on its own
tactile language. *Recommendation:* the public fortized.com pages go fully
Neo-Brutalist, the app keeps its own feel but adopts the shared pieces - the
Rainbaw five, the account launcher, the consent card, the footer, the shared
Supernova moderation. One company, two rooms in it. Confirm before anyone
touches the app's CSS.

**D2 - Is Groq a teacher, or is it in the live path?**
The memo describes Groq intercepting and correcting Supernova's sentences in
real time, then presenting the result as Supernova's own. Read literally, every
reply costs two model calls and Supernova is a Groq wrapper with a delay, which
also contradicts Pulsar's own README promising a model that is ours.
*Recommendation:* Groq teaches offline. It generates training data, grades
Pulsar's answers, and writes corrections into the corpus, so Pulsar genuinely
improves. In the live path keep only a cheap guard for the failure modes we know
about. Full detail and the middle option are in list 2.

**D3 - What proves someone is over 18?**
Adult fictional chat cannot ship on a "yes I am" checkbox. It needs a real gate,
it must be off by default, and it must be unreachable for any account whose age
we do not know. Until that gate exists the feature is not buildable, and the
honest thing is to say so rather than ship a checkbox and call it done.

**D4 - Do we start collecting date of birth?**
Age-adaptive moderation at 13, 15 and 18 needs an age, and we do not ask for
one. Collecting it is a privacy-policy change and a lawful-basis question for a
French SAS. This wants a real answer before any of it is designed.

**D5 - Which project owns identity?**
Swiftaw, Fortized and Hereld each have their own Supabase and their own users
table. One of them becomes the home, or a new project does. Whichever it is,
every existing account needs a linked identity created without anyone losing
access on the day. See list 3.

**D6 - Where do internal documents live?**
See the warning above. *Recommendation:* move the site into a `docs/` folder and
point Pages at it, leaving `internal/` outside the served tree. It is a
one-commit change and it fixes the class of problem, not this one instance.

**D7 - Which pages exactly are being retired?**
The memo keeps overview pages on Fortized and Lifecheck and drops them on Hereld
and Supernova. On Supernova that means today's `supernova/index.html` goes and
the chat becomes the front door. On Hereld it means the landing page goes and
the signed-out app becomes the front door. Say if either reading is wrong.

**D8 - What is behind the API limits?**
35 requests a minute, 2,000 a day and a million tokens a minute is a real
promise to whoever holds the key. If Groq is upstream, our ceiling is Groq's
account ceiling divided by everyone using us. We can either meter against what
we actually have, or oversell and fail in public. Needs a number.

---

## The rules that do not change

These already govern everything and they keep governing it. A future session
picking up any of these lists should read this section first.

**Voice and copy**

- Swiftaw is **Make It Matter.** Fortized is **More Than A Chat App**. Hereld is
  **Hear me out.**
- **No em dashes anywhere.** Use `-`. This includes page titles. Accented
  characters are a different thing and stay correct.
- Nothing invented. No made-up statistics, customers, testimonials,
  partnerships, awards, history, employees or capabilities. No fabricated view
  counts. If a feature is not built, do not write copy claiming it is.
- No giant AI-shaped marketing paragraphs, no tutorial-ish over-explaining. It
  should read as though a person wrote it, because a person is meant to have.

**Design**

- Around 85% Neo-Brutalist, 15% dark cyber, with a 1960s influence and a light
  medieval undertone. Professional, not fantasy.
- Black stroke, black hard offset shadow: X 4, Y 6, blur 0, full opacity.
- Rainbaw five: red `#FF0033`, green `#3ECF6E`, blue `#2CAFFC`, yellow
  `#FFF93E`, pink `#FF77E4`. Hereld leads on `#2CAFFC` over `#0C0F15`.
- Avoid glassmorphism, gradient soup, floating blobs, endless rounded cards,
  heavy shadows, fake futuristic panels, decorative glow.
- Interfaces stay dark.
- Type: Tropicon for the most important headline only, and never bolded further
  than it already is. Then big title in Syne Bold, then secondary title in Syne
  Bold, then body in Syne. Small text is Syne Bold, never Tropicon.
- Twemoji on every Swiftaw site. Emoji are never used as icons.
- People's pictures are circles, companies' are squares.

**Engineering**

- No service keys, admin credentials or private API keys in anything the browser
  can read. Privileged work is server-side and permission-checked.
- Permissions are enforced on the server. Hiding a button is not a permission. A
  moderator typing a superadmin URL must be refused by the server.
- Never invent a credential, a key, a domain or an SVG path. Ask.
- Never invent a privacy-policy URL. Use the routes that exist.
- If something cannot be built because a schema, an API or a key is missing, say
  exactly what is missing. Do not fill the hole with something fake.
- Fix the bug rather than hide it.
- Ship in halves and push, so there is something to look at before a limit
  lands.

---

## Inspirations, for reference

From the memo, unchanged. This is positioning, not a licence to copy anyone's
interface.

| Product | Looks to |
| --- | --- |
| Swiftaw | Google mainly, then Apple, Roblox, X |
| Fortized | Discord, a little Roblox |
| Hereld | X. Acquired by Swiftaw August 2026, rebranded from Voyager |
| Lifecheck | reCAPTCHA |
| Supernova | Gemini and Grok |
| Swiftaw-Mail | Gmail |
