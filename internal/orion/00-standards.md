# Orion 0 - How Swiftaw builds

This applies to every website, product and script we own. It is not a list of
tasks so much as the bar everything else in Orion is held to. Read it before
picking up any of the other lists.

---

## Who we are, and what that means for a screen

Swiftaw is not a developer that happens to design, and not a design studio that
happens to ship. **Devigner** is the word: the building and the designing are
the same act, done by the same people, at the same time.

So a Swiftaw page is not a document with a stylesheet on it. It has animation,
illustration, things that answer when you touch them, small pieces of craft you
were not expecting. Something to play with. It should feel *made*.

**Innovation is a department, not an adjective.** The Innovation Dep., the R&D
side of the company, is one of the core values and it has to be visible in the
work. If a page could have been assembled from a template by anyone, it is not
ours yet.

Branding runs across all of it, hard and deliberately, the same marks and the
same voice on every property. Joyful propaganda, everywhere we own.

The one thing a Swiftaw page must never be is **plain, static and boring.**

Weigh that against the design rules in the master file rather than through
them: no glassmorphism, no gradient soup, no glow. Neo-Brutalism is not
sterile. Hard strokes, hard shadows, flat colour and real motion is exactly the
combination that reads as designed rather than generated.

---

## 1. It has to actually work

- Fewer bugs, fewer design faults, fewer incoherences. Every screen gets its
  loading, empty, error and no-permission states, and the permission check
  belongs at the mutation, not where the button is drawn.
- No superficial features. A control that does not do the thing it says it does
  is worse than no control, because people learn to distrust the whole product.
- Fix the cause, not the symptom. If something is masked rather than fixed, say
  so in the commit rather than letting the next person find out.
- One way to do a thing, used everywhere. Two components that do the same job
  will diverge inside a week, and then there are two bugs.
- If it cannot be built because a schema, key or API is missing, say exactly
  what is missing. Never fill the hole with something fake.

## 2. Keeping the source ours

**Read this before doing any minification work, because there is a live problem
that makes all of it pointless.**

Swiftaw and Hereld both carry a `.nojekyll` marker, which means GitHub Pages
serves **every file in the repository**, including `_js/` and `_css/`. Those
folders hold the unminified, fully commented sources. The pages themselves load
the stripped build from `css/`, so the intended protection is there, but the
original is sitting one URL away at `/_js/<file>.js`.

The comment-stripping build is therefore cosmetic today. Anyone who guesses the
path gets the real source with every comment intact. Hereld's is 200 KB and
holds the whole application.

- [!] **S1. Take decision D6.** Move the site into `docs/` and point Pages at
      it, leaving `_js/`, `_css/`, `_build/` and `internal/` outside the served
      tree. One commit, and it closes the source leak and the internal-document
      leak together. **Nothing else in this section is worth doing first.**
- [ ] **S2. Then mangle, not just strip.** Renaming identifiers is what
      actually raises the cost of reading lifted code. The current build
      deliberately does not, to avoid ASI risk; that is the right call for a
      comment stripper and the wrong ceiling for protection.
- [ ] **S3. No source maps in production.** A source map hands back everything
      minification took away.
- [ ] **S4. Keep the valuable logic on the server.** This is the only real
      protection and everything above is friction. Detection heuristics, scoring,
      moderation thresholds, prompts and anything that took thought to get right
      belongs behind an endpoint. Lifecheck's widget is the model: the client
      collects, the server decides.
- [ ] **S5. Be honest internally about the ceiling.** Anything a browser runs
      can be read by whoever runs it. We raise the cost, we do not make it
      impossible, and no document of ours should claim otherwise.

## 3. Nothing that reads as generated

Three places it shows, and all three matter.

**In the copy.** No hollow slogans. The worked example, from Staw: *"We post
when there's something worth posting."* It has the cadence of a line and says
nothing, and that shape is instantly recognisable. Write the specific thing
instead. If a sentence would survive being moved to a competitor's site
unchanged, delete it.

No giant marketing paragraphs. No tutorial voice explaining what a button is.
No enthusiasm that has not been earned by something on the page.

**In the code.** No comments narrating the obvious. No comment restating the
line under it. No scaffolding notes, no "in a real implementation", no
placeholder apologies. A comment earns its place by saying *why*, or by warning
the next person about something that will bite them. Everything else goes.

The shape of the code counts too: the same three helpers rewritten in four
files, defensive checks around things that cannot be null, every function
wrapped in a try that swallows the error. That reads as generated whether or not
it was.

**The character.** Never `—`. Use `-`. It is the single most recognisable tell
there is, and it is banned everywhere: copy, headings, page titles, commit
messages, comments, alt text. Accented characters are unrelated and stay
correct.

---

## The check before anything ships

1. Does it work, in all four states, with the guard at the mutation?
2. Does it look like the rest of the ecosystem?
3. Is there one of it, or did we just make a second one?
4. Would a person believe a person wrote this copy?
5. Is there a single `—` anywhere in the diff?
6. Is anything valuable now readable in the browser that was not before?
7. Is there something here worth touching, or is it a document with a
   stylesheet on it?
