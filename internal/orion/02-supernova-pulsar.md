# Orion 2 - Supernova and Pulsar

> Train Supernova on a high-performance Groq model. Groq intercepts and corrects
> Supernova's sentences live, and teaches it to write better ones. Admins see
> raw in-training chats, training progression, model versions they can activate
> (auto-updating "Pulsar 1.3") and new models for specific uses. The finished
> Pulsar behaves like Grok: real safety, fewer rules, adult fictional chat only
> when the user explicitly asks for it. Real API keys at 35 RPM, 2,000 RPD,
> 1,000,000 TPM. Integrated into all five products.

**This is the workstream everything else waits on.** Moderation, Headquarters
and the Hereld bots all call Supernova. Every week it stays a stub, those three
cannot be finished honestly.

## Where we actually are

Pulsar has real foundations on its own Supabase project: `schema.sql`,
`model.sql` with an n-gram train and generate running as SQL functions,
`neural.sql`, a Lifecheck import, and a Trainer in the chat topbar visible only
to the Swiftaw account. The Trainer currently writes to `localStorage` rather
than to the tables that are waiting for it.

Hereld's `supernova` edge function is the most complete consumer: it has jobs
for writing, profile summaries, community notes, `@supernova` mentions, seeding
and bots, and it reads its provider and key from an `ai_config` row.

There is no API key system for outside callers, no versioning, no correction
loop, and no moderation job anywhere.

---

## A - The architecture, decided

**D2 is settled: Groq teaches, it does not answer.** Staw left the call to
engineering. Here is what was chosen and why, so nobody reopens it without
knowing what it cost.

The three readings that were on the table:

| | What happens | Cost per reply | What we can honestly claim |
| --- | --- | --- | --- |
| **Teacher** | Groq generates and grades offline, corrections go into the corpus, Pulsar answers alone | One call | The model is ours |
| **Guard** | Pulsar answers, a cheap local check catches known failures, Groq is called only when it trips | About 1.1 calls | The model is ours |
| Live path | Groq rewrites every sentence, presented as Pulsar's | Two calls, roughly double the latency | It is a Groq wrapper |

**We take teacher plus guard.** Five reasons:

1. **Pulsar stays a product.** A model that only sounds good because something
   else rewrites it is not an asset, it is a subscription. The whole point of
   `pulsar_corpus`, `pulsar_vocab` and `pulsar_ngrams` is that the value
   accumulates in our database.
2. **It actually learns.** Under the live path Pulsar is corrected forever and
   improves never, because nothing ever writes back. Under teacher, every
   correction is training data and the model is measurably better each month.
3. **Half the latency and half the cost,** on the path a user is waiting on.
4. **Groq going down does not take Supernova down.** With Groq in the live path,
   our AI has someone else's uptime.
5. **The memo's intent is fully served.** Everything it asks Groq to do -
   demand corrections, enforce the path, generate training data, fix errors and
   half-generated output - still happens. It happens on a schedule instead of
   in front of the user, which is where that work belongs.

The guard is the part that protects quality live: a cheap local check for the
failure modes we know about (empty output, repetition loops, leaked prompt,
off-policy content). It escalates to Groq only when it trips, so the floor is
protected without paying double every time.

- [ ] **A2. Write the loop into `supernova/pulsar/README.md`,** including this
      decision, so nobody reconstructs it from the code.
- [ ] **A3. Shadow grading.** Groq scores a sample of real replies daily without
      touching them. That is how we know whether the model is improving, rather
      than assuming it.

## B - The training loop

- [ ] **B1. Point the Trainer at the database.** The tables
      (`pulsar_training_config`, `pulsar_training_exercises`) already exist and
      the UI already writes the right shape to `localStorage`. This is a small,
      high-value job and it should go first.
- [ ] **B2. Build the corrections table.** Prompt, what Pulsar said, what Groq
      corrected it to, why, and who or what asked. This is the training data,
      and it is also the audit trail for A1.
- [ ] **B3. The grading job.** Groq scores a batch of Pulsar answers and writes
      corrections. Runs on a schedule, not per reply.
- [ ] **B4. Feed the corrections back** into `pulsar_corpus` weighted by score,
      and re-run the n-gram training. This is the bit that makes it a loop
      rather than a logger.
- [ ] **B5. Feed in the team's own instructions** as a first-class, highest-trust
      source, distinct from chats and from the web.
- [ ] **B6. Feed in the explained Lifecheck interactions.** `import-lifecheck.sql`
      already brings the signals across; what is missing is the explanation
      layer that makes a signal mean something to a language model.
- [!] **B7. Groq key.** Needed for anything in B. It goes in `ai_config` or in
      edge-function secrets, never in a page.

## C - Admin, versioning, model management

- [ ] **C1. Raw in-training chats, admin only.** Server-side check on Swiftaw
      admin or superadmin. Not a hidden route: a moderator typing the URL gets
      refused by the database, not by the CSS.
- [ ] **C2. Training progression screen.** Steps, levels, corpus size, vocab
      size, how many corrections landed, how the score is moving. Real numbers
      from the tables or nothing at all.
- [ ] **C3. Model versions as rows.** `pulsar_models` with a semantic version,
      the corpus snapshot it learned from, its scores, and a live flag.
- [ ] **C4. Activate a version.** One click flips which model answers. Includes
      going back, because a bad version needs an exit that is not a redeploy.
- [ ] **C5. Auto-update.** "Pulsar 1.3" tracks the newest version that passed
      its drills, so admins do not have to promote every build by hand. Should
      be switchable off per model.
- [ ] **C6. New models for a purpose.** Start a model scoped to a use, code and
      scripting being the named one, with its own corpus and its own drills.

## D - Behaviour

- [ ] **D1. Write the Pulsar persona properly.** Warm, direct, human, never
      narrating what the user wants. Grok-adjacent in looseness, not in
      cruelty. This is a document before it is a prompt.
- [ ] **D2. Keep the safety floor and drop the rest.** Named as essential:
      children, real-world harm, our own security. General insults and slurs are
      allowed by policy, which is a deliberate call and should be written down
      as one so nobody "fixes" it later.
- [!] **D3. Adult fictional chat is blocked on D3 in the README.** It needs a
      real adult gate, it is off by default, and it is unreachable for any
      account whose age we do not know. Without the gate this is not
      implementable, and a checkbox that says "I am 18" is not a gate. Do not
      build the feature and leave the gate for later.

## E - The public API

**D8 is settled, and A1 is what makes it answerable.** Because Pulsar answers
from our own Postgres rather than by reselling someone else's tokens, our
capacity is our database, not an upstream account. Database capacity is
predictable, cheap and ours to grow. The memo's numbers stop being a promise
against a third party and become an engineering target.

So: **the memo's figures are real, as a granted tier rather than the default.**

| Tier | Per minute | Per day | Tokens per minute | Who gets it |
| --- | --- | --- | --- | --- |
| Free | 10 | 500 | 100,000 | Anyone, on sign-up |
| **Standard** | **35** | **2,000** | **1,000,000** | Granted by us, on request |
| Internal | unmetered | unmetered | unmetered | Our own five products |

Three rules behind it:

- **A global ceiling sits above every per-key ceiling,** so the sum of all keys
  can never exceed what we can actually serve. When the global budget tightens,
  the free tier sheds first and paying attention gets you nothing worse than
  slower. Everyone failing at once because we oversold is the outcome this
  exists to prevent.
- **Never silently truncate.** A limit returns a clear error and a retry-after,
  never a half answer that looks like a bad model.
- **Publish only what we can honour today.** If the ceiling has to come down,
  it comes down before anyone is holding a key, not after.

- [ ] **E1. Key store.** Generate, list, name, revoke, last used. Lifecheck's
      `keys.html` is the working reference for shape and key format.
- [ ] **E2. Metering,** all three counters, server-side, returned in response
      headers so a developer can see where they stand without guessing.
- [ ] **E3. Enforcement and the global ceiling,** per the rules above.
- [ ] **E4. Tier grants** in the admin surface, so Standard is something we give
      rather than something anyone can take.
- [ ] **E5. Developer docs** on the Supernova site, matching Lifecheck's docs in
      shape so a developer learns our conventions once.
- [ ] **E6. Measure the real ceiling before publishing.** Load the RPCs and find
      where Postgres actually stops, then set the global ceiling under it. The
      table above is the target, and it is not published until it is proven.

## F - The five integrations

- [ ] **F1. Swiftaw site.** Assistant bar carrying the Supernova mark, answering
      about our products, services, goals and mission. Scoped to us: it should
      decline to be a general chatbot.
- [ ] **F2. Lifecheck.** Assistant across the docs, the main page and the keys
      page, plus a Supernova signal feeding the widget's own detection.
- [ ] **F3. Supernova site.** The chat talks to the model directly rather than
      through a public API key, so the public key surface cannot be scraped by
      pointing it at our own front door.
- [~] **F4. Hereld.** Profile summaries, post explanations, rewrites, trending
      explanations, community-note summaries and `@supernova` replies are built.
      Moderation is not, and belongs to list 4.
- [ ] **F5. Fortized.** Into the moderation system. List 4 owns the design;
      this line is the wiring.

## G - Deployment reality

- [!] **G1. Staw does not use a terminal.** Every edge function has to be
      deployable from the dashboard editor, or as SQL, or through the GitHub
      integration. Anything that can only ship by CLI cannot ship. Pulsar's
      model already respects this by living in SQL; keep it that way.
- [ ] **G2. Set up the GitHub integration** on the Supabase projects so function
      changes deploy on push and nobody has to paste a thousand-line file.

---

## Done means

Pulsar answers on its own, measurably better this month than last, with the
corrections that made it better visible in a table. An admin can see the raw
chats, watch the progression, promote a version and roll it back. A developer
can hold a key with limits we can actually honour. All five products call it,
and the one place it refuses to go is behind a gate that does not exist yet.
