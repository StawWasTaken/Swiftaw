# Orion 6 - Hereld bots

> Implement automated user-simulation bots only on Hereld, to increase platform
> activity and keep it populated.

Independent of every other list, and the closest to done. Hereld only.

## Where we actually are

The system is mostly built. `bots` and `bot_log` tables exist, the staff console
has a Seed accounts page that lists every bot with its persona line, active
state, action count and last action, activates and deactivates individually, and
runs the jobs by hand. The `supernova` function has `seed`, `seed_all`,
`mentions`, `bot_new` and `create_premium`. The count flag is `bots_active` and
setting it to zero stops everything.

The gaps are all in the same place: there is no way to *shape* a bot from the
console, only to switch it on and off. The page prints "No persona set" for a
bot and offers nowhere to set one.

---

## A - Finish the console

- [ ] **A1. Edit a bot.** Persona, interests, tone, how often it acts. The
      column exists and the page already displays it.
- [ ] **A2. New seed account** button, calling `supernova?job=bot_new`. The job
      is written and nothing in the interface calls it.
- [ ] **A3. Cooldown and rate settings** as a screen rather than constants in
      the function. Per bot and globally.
- [ ] **A4. A real bot log page,** rather than the last action per row. What ran,
      when, what it produced, what failed and why.
- [ ] **A5. Fix the numeric input** if it is still refusing values above zero.
      Reported once already as "select a value that is no more than 0", which is
      a `max` attribute being written from a flag before the flag has loaded.
- [ ] **A6. The kill switch, tested.** Setting the count to zero has to stop
      everything within one run, and somebody should confirm it does rather
      than assume.

## B - Behaviour

- [ ] **B1. Cooldowns and rate limits honoured** by the function itself, not
      only by the schedule. A manual "run all" should not let a bot post ten
      times in a minute.
- [ ] **B2. Deduplication.** Two bots must not post near-identical text, and one
      bot must not repeat itself across a week.
- [ ] **B3. Spread the schedule.** Everything firing at the top of the hour
      reads as machinery, which is exactly what it must not read as.
- [ ] **B4. Bots stay out of moderation queues** as reporters, and they do not
      pile onto real people.

## C - The rules that already govern this

Written down before, still binding, and worth repeating here because this is the
list where they get broken:

- Bots are **off by default**.
- Lowering the active count **deactivates, it never deletes**. Nothing may
  automatically delete a bot account because a number went down.
- They behave as ordinary accounts and we do not announce their existence, but
  they are **not designed to deceive**: no bot presents a photograph of a real
  person as its own, no bot claims to be someone who exists, and no bot is used
  to vouch for us, review us or testify to anything.
- They never fabricate numbers about the platform.
- Hereld only. Not Fortized, not anywhere else.

## D - Blocked on Staw

- [!] **D1. Set `HERELD_CRON_SECRET`** and schedule `seed`, `notes` and
      `mentions`. Until then the bots only run when somebody clicks a button.
- [!] **D2. Schedule `publish_due()`,** or scheduled posts never go out. This is
      not a bot problem but it lives in the same cron.
- [!] **D3. An account with the handle `supernova`** must exist for the
      `@supernova` replies to have anywhere to come from.
- [!] **D4. Run the outstanding migrations,** in order:
      `2026-08-29-hereld-core`, `-algorithm`, `-supernova`,
      `2026-08-30-hereld-affiliates`, `-features`,
      `2026-08-31-hereld-composer`, `-assoc-mark`,
      `2026-09-01-hereld-bot-fix`, `-bot-queue-fix`, `-edit`,
      `-premium-bots`, `2026-09-04-hereld-attachments`.
      `2026-08-31-hereld-assoc-mark` has never been run against any database.
- [!] **D5. Redeploy the `supernova` edge function** from the dashboard editor.
      The deployed copy predates the `write` job, which is why rewriting still
      answers "Nothing was asked."

---

## Done means

A bot can be created, given a personality and switched on from the console
without anyone opening a file. It acts on a schedule that does not look like a
schedule, never twice the same way, and stops completely the moment the count
goes to zero. The log says what every one of them did.
