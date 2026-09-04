# Plan Orion - the programme

**Internal. Personnel use only.** Written from the CEO's Orion memo, broken into
work that can actually be picked up and finished. The memo is the authority; if
anything here contradicts it, the memo wins and this file is wrong.

**Read [`00-standards.md`](00-standards.md) first.** It is not a workstream, it
is the bar every workstream is held to: who Swiftaw is, what makes a page ours,
how the code has to be written, how the source is protected, and the three
places generated work shows. Everything below assumes it.

Then eleven lists, each workable without holding the others in your head:

| | Workstream | File | Rough state |
| --- | --- | --- | --- |
| 0 | **How Swiftaw builds** | [`00-standards.md`](00-standards.md) | The bar, not a task list |
| 1 | Ecosystem and websites | [`01-ecosystem.md`](01-ecosystem.md) | Well under way |
| 2 | Supernova and Pulsar | [`02-supernova-pulsar.md`](02-supernova-pulsar.md) | Foundations only |
| 3 | The Swiftaw Account | [`03-swiftaw-account.md`](03-swiftaw-account.md) | Not started |
| 4 | Safety, security, moderation | [`04-safety-and-moderation.md`](04-safety-and-moderation.md) | Part built |
| 5 | Headquarters | [`05-headquarters.md`](05-headquarters.md) | Not started |
| 6 | Hereld bots | [`06-hereld-bots.md`](06-hereld-bots.md) | Nearly there |
| 7 | **Fortized, redesigned and reworked** | [`07-fortized.md`](07-fortized.md) | Big. Partly running already |
| 8 | **Signing up and signing in** | [`08-sign-in.md`](08-sign-in.md) | Not started |
| 9 | **Hereld, fixed and finished** | [`09-hereld.md`](09-hereld.md) | The punch list of 2026-09-04 |
| 10 | Swiftaw Workspace, and the icon service | [`10-workspace.md`](10-workspace.md) | Idea, written down |
| 11 | Swiftaw Mail | [`11-mail.md`](11-mail.md) | Idea, filed behind list 3 |

Lists 10 and 11 came from the CEO on 2026-09-04 and both say on their face that
they may be modified. They are written down so they stop taking up room in one
person's head, not because either starts tomorrow.

Status marks used in every list:

- `[ ]` not started
- `[~]` part built, needs finishing
- `[x]` done
- `[!]` blocked on a decision or a credential only Staw can give

---

## Read this before you file anything here

This repository is the GitHub Pages source for `swiftaw.com`. It used to publish
from the repository root, and it carries a `.nojekyll` marker, so **every file
in it was served over the web**, this folder included. A memo marked *"Do not
leak to the public"* was sitting at a guessable URL, and so were `_js/` and
`_css/`, which hold the unminified commented sources of every script.

**That is fixed. D6 is taken and done:** the site publishes from `docs/`, and
everything outside `docs/` is no longer reachable over the web. This folder is
one of those things.

**Hereld has had the same treatment,** on 2026-09-04, in the same two commits.
It publishes from `docs/` too and its `_js/` and `_css/` are no longer served.

One caveat that does not go away: anything you put **inside `docs/`** is
published the moment it is pushed. Internal material goes here, never there.

Keep credentials and keys out of this folder anyway. Nothing in these lists
contains a secret, and that should stay true.

---

## The order the work wants to happen in

Not a schedule, a dependency chain. Doing it out of order means building things
twice.

0. **D6, done on both.** It closed a source leak and a document leak together.
   Nothing is owed here any more.
1. **Ecosystem (1).** Visible, low risk, and every other workstream ships its
   screens inside it. Finishing Supernova's site also settles design questions
   the rest inherit.
2. **Supernova (2), and it is the load-bearing one.** Moderation (4),
   Headquarters (5) and the bots (6) all consume Supernova. Every week it stays
   a stub is a week those three cannot be finished properly.
3. **Fortized (7) starts in parallel, from its section A.** Section A is
   invisible plumbing that shrinks what has to be redesigned later, so it can run
   alongside anything. Its visible sections wait for the ecosystem work to settle
   the shared components.
4. **Sign-in (8) after the ecosystem work,** built on Hereld first as the
   lowest-risk place to get the component right. Blocked on D9 and D10.
5. **Moderation (4) once Supernova can be asked to judge something.** The parts
   that do not need it - block, report, ignore, the staff console, passkeys and
   2FA - can go earlier and should.
6. **The Swiftaw Account (3) on its own.** This is the one that can lock every
   user out of every product at once. Its own run, nothing else in flight, and a
   rollback that has been executed rather than designed.
7. **Headquarters (5) in two halves.** The read-only half works today against
   three separate databases and is useful immediately. The cross-platform half
   only makes sense after (3).
8. **Hereld bots (6) whenever.** Independent of everything and mostly done.

**Where lists 9, 10 and 11 sit.** List 9 is not in that chain: it is live
product with faults in it, so its four own items get fixed as they come and its
three cross-referenced items are handled by the lists that own them. Lists 10
and 11 sit behind everything above. List 10's first tenant could be built any
time, but the Workspace shell it belongs in wants the ecosystem work settled
first, and list 11 explicitly does not start before list 3 has landed.

---

## Decisions

### Taken

**D1 - The Fortized app is fully redesigned, not just its web pages.** Staw's
call, with three reasons: it shows Fortized belongs to a shared ecosystem, it
puts real distance between us and Discord and Guilded so we stop reading as
copyists, and the borrowed layout was always meant as a starting base to be
replaced. This is large enough to be its own workstream: **list 7**.

**D2 - Groq teaches, it does not answer.** Left to engineering. Groq generates
training data, grades Pulsar's output and writes corrections into the corpus on
a schedule; a cheap local guard protects quality live and escalates only when it
trips. Pulsar stays ours, costs one call instead of two, keeps working when Groq
does not, and actually improves. Full reasoning in list 2 section A.

**D8 - The memo's API limits are real, as a granted tier.** Also left to
engineering, and D2 is what makes it answerable: because Pulsar answers from our
own Postgres rather than reselling someone else's tokens, our ceiling is our
database. Free tier 10 RPM / 500 RPD / 100k TPM by default, the memo's 35 /
2,000 / 1,000,000 granted on request, a global ceiling above both so we can
never oversell, and the number proven by load before it is published. Table in
list 2 section E.

**D4 - Yes, we collect date of birth,** at sign-up, on every property. Staw
marked it very important, particularly for the INTSAF programme. This unlocks
age-adaptive moderation and the adult gate. The legal half is not settled and
moves to D9.

**D6 - Internal documents live outside the published folder.** Swiftaw now
publishes from `docs/`; `internal/`, `_js/`, `_css/`, `_build/`, `supabase/` and
`supernova/pulsar/` stay out of it. Hereld publishes from `docs/` too, with
`_js/`, `_css/`, `_build/` and `supabase/` outside. This fixes the class of
problem rather than the one instance: anything not deliberately put in `docs/`
is not on the web.

### Still open

**D3 - What proves someone is over 18?**
Adult fictional chat cannot ship on a "yes I am" checkbox. It needs a real gate,
it is off by default, and it is unreachable for any account whose age we do not
know. D4 gets us an age; it does not by itself get us proof. Until the gate
exists the feature is not buildable, and the honest thing is to say so rather
than ship a checkbox and call it done.

**D9 - The lawful basis for holding dates of birth.**
D4 answered the product question. A French SAS collecting minors' dates of birth
still has real obligations: the privacy policy changes, a retention period has
to be set, and it has to be decided whether an age below a threshold blocks
sign-up outright or opens a different experience. Needed before list 8 ships.

**D10 - What is INTSAF?**
Named as launching soon and as the main reason date of birth matters, but not
yet described. What it needs from an age changes how the field is stored and
what we are allowed to do with it. A paragraph would unblock list 8 section C.

**D5 - Which project owns identity?**
Swiftaw, Fortized and Hereld each have their own Supabase and their own users
table. One of them becomes the home, or a new project does. Whichever it is,
every existing account needs a linked identity created without anyone losing
access on the day. See list 3.

**D7 - Which pages exactly are being retired?**
The memo keeps overview pages on Fortized and Lifecheck and drops them on Hereld
and Supernova. On Supernova that means today's `supernova/index.html` goes and
the chat becomes the front door. On Hereld it means the landing page goes and
the signed-out app becomes the front door. Say if either reading is wrong.

**D11 - The old Roblox sign-up screenshot.**
Named as the reference for how friendly the new sign-up should feel. List 8
cannot start its design work without seeing it. One image unblocks it.

**D12 - Do we redistribute Font Awesome icons through our own icon service?**
Using them inside our products is settled and unremarkable. Handing them out
from an icon service of ours is a different act. Font Awesome Free licenses its
icons CC BY 4.0, so it is permitted with attribution, and the attribution and
the labelling of which icons are whose then have to be right forever. The
alternative is a smaller library that is unambiguously ours. Neither is wrong;
the wrong thing is picking one by building it. See list 10 section B6.

**D13 - "Swiftaw Workspace" or "Swiftaw Devs"?**
Both were said. They point at different audiences and the tenant list as
described is not a developer toolbelt, so Workspace fits the contents better.
List 10 section A1.

**D14 - Which Workspace tenants are free, and which are paid?**
The cooperative side means helping others "either in a free way either where
they have to pay". Which is which, and whether there is one price or a price per
tenant, is not inferable. List 10 section A5.

**D15 - Do we run mail ourselves, or a mailbox on somebody else's
infrastructure?** The interface is the small half. Deliverability, abuse, spam
filtering, unbounded storage and never losing a message is the large half, and
running it ourselves means all of it is our job. List 11 section C.

**D16 - Web only, or IMAP and SMTP too?**
Client access is what makes a mail service usable by anyone who already has a
phone set up, and it is a large amount of extra surface. It changes the storage
model, so it is decided before building rather than after. List 11 section B5.

Also needed, and smaller: the mail domain, and whether "Swiftaw Mail" is the
name (list 11 section D).

---

## The rules that do not change

These already govern everything and they keep governing it. A future session
picking up any of these lists should read this section first, then
[`00-standards.md`](00-standards.md) in full.

**Who we are**

- Swiftaw is a **Devigner**: the building and the designing are the same act.
  Animation, illustration, things that answer when you touch them, small pieces
  of craft nobody asked for. Something to play with.
- **Innovation is a department**, the Innovation Dep., broadly the R&D side, and
  one of the core values. It has to be visible in the work, not just claimed.
- Branding is deliberate and total. The same marks and the same voice on every
  property. Joyful propaganda, everywhere we own.
- **Never plain, static or boring.** Neo-Brutalism is not sterile: hard strokes,
  flat colour and real motion is what reads as designed rather than generated.

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
