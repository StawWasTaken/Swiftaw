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

The console work is done and live. It needed no new database work at all:
**`staff_bot_edit`, `bot_new` and the log had been written and then never
called by anything.** The page printed "No persona set" against an account
while the function to set one sat in the database unused.

- [x] **A1. Edit a bot.** Character, interests and minutes between actions, in
      a sheet, through `staff_bot_edit`. The fifteen minute floor is applied in
      the sheet as well as in the RPC, so the field cannot promise something
      the database will quietly refuse. Saving drops whatever the account was
      queued to say, because that was decided under the character it had
      before, which is the RPC's own doing and worth knowing.
- [x] **A2. New seed account,** through `supernova?job=bot_new`. It is made
      inactive, so nothing starts talking because somebody filled in a form.
- [x] **A4. Activity,** a real log: every account or one, everything or only
      the failures. The failures are the half you need when nothing appears,
      and until now the page showed the last line per row and nothing else.
- [x] **A5. Nothing was wrong with the numeric input.** It carries `min="0"`
      and no `max` at all, so the reported "no more than 0" cannot come from
      this field as it stands. Either it was already fixed or it was another
      field. Left as it is rather than changed on a guess.
- [ ] **A3. Cooldown and rate settings** as a screen rather than constants in
      the function. Per bot is done, as part of A1. Globally is not.
- [ ] **A6. The kill switch, tested.** Setting the count to zero has to stop
      everything within one run, and somebody should confirm it does rather
      than assume. The page now says which state it is in rather than
      repeating the instructions, so at least the reading is unambiguous.

**Fixed while in there, all three the other account's:** "Run bots now" read
`r.made` from a function that returns `posted`, so a run that posted four
things toasted zero. The last-action line was emitted with a class that has no
CSS, placed after a button carrying `margin-left:auto`, so it landed wherever
the flex row had room left; the row is a grid now with that sentence on its
own line. And the third of the three run buttons forgot to put itself back
after a failure.

## B - Behaviour

Written, **not live.** The function has to be redeployed from the dashboard
and `2026-09-05-hereld-bot-workers.sql` has to be run.

- [x] **B0. The @ was the one that mattered, and it was not on this list.** The
      prompt told every account it "can mention @handles when it fits
      naturally". A model asked to write like a person reaches for a name, and
      a name it invents is a handle somebody may well hold, so the account
      pings a stranger who never asked to be in the conversation. Unprompted
      @-mentions from accounts nobody can tell are automated is a spam vector
      and it has been live. The prompt says not to now, and `botText` makes
      that true rather than hoped for: it drops the sigil and keeps the word,
      so the sentence still stands. Email addresses and hashtags are untouched.
      A reply is threaded already and never needed to name anybody.
- [x] **B2. Half of it, and it was worse than repetition.** When the model gave
      nothing twice running the account posted one of **eight canned lines that
      every account drew from**, so a bad minute for the model showed up as
      four different people posting "vibes". It posts nothing now. Silence is
      what a person does when they have nothing to say, and the failure lands
      in the log that A4 just made visible. **The other half is still open:**
      `bot_said_before` only asks whether *that* account said it, so two
      accounts can still land on the same sentence honestly.
- [x] **B5. The ten standing accounts claimed credentials they do not have.** A
      PhD, a librarian, an engineer, two journalists and a history "since
      2024". None of them names a real person, so the letter of the rule held,
      but "climate solutions journalist" carries weight on a social platform
      that an automated account has not earned, and C says they are not
      designed to deceive. Rewritten to say what the account does rather than
      who it used to be. The instruction "you are a real Gen Z person" is now
      "you write the way a Gen Z person writes", which gets the voice without
      telling the model to assert that it is a person.
- [ ] **B1. Cooldowns and rate limits honoured** by the function itself, not
      only by the schedule. A manual "run all" should not let a bot post ten
      times in a minute. **One hole in this is closed:** `bot_fill` and
      `bot_fill_premium` were executable by any signed-in account, so a
      stranger could queue work past every cooldown by pressing an endpoint.
- [ ] **B3. Spread the schedule.** Everything firing at the top of the hour
      reads as machinery, which is exactly what it must not read as.
- [ ] **B4. Bots stay out of moderation queues** as reporters, and they do not
      pile onto real people.

### The roster was readable by anybody with an account

`bots_read` is `using (public.is_staff())` and that is deliberate. Four worker
functions were granted to `authenticated` anyway, and being `security definer`
they run **past** that policy rather than into it. `bot_due` hands back the
handle, the character and the interests of every active account together with
what it is about to do, so one request enumerated the whole roster.
`bot_suggest_persona` did the same in smaller pieces. Nothing in the
application calls any of them; only the worker does, on the service role.

The first version got this right: `2026-08-29-hereld-supernova.sql` ends
`bot_fill` with `revoke all ... from public`. A later rewrite granted it.
`2026-09-05-hereld-bot-workers.sql` puts it back for all four.

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
      `-premium-bots`, `2026-09-04-hereld-attachments`,
      `2026-09-04-hereld-edit-columns`, `2026-09-05-hereld-bot-workers`.
      `2026-08-31-hereld-assoc-mark` has never been run against any database.
      The last two are new and both close something real: the first stops an
      author clearing the mark that says a post was edited, the second takes
      the roster back off anybody with an account.
- [!] **D5. Redeploy the `supernova` edge function** from the dashboard editor.
      The deployed copy predates the `write` job, which is why rewriting still
      answers "Nothing was asked." **It also predates B0, B2 and B5**, so
      until it is redeployed the accounts are still free to @-mention
      strangers and still post canned filler when the model gives nothing.

---

## Done means

A bot can be created, given a personality and switched on from the console
without anyone opening a file. It acts on a schedule that does not look like a
schedule, never twice the same way, and stops completely the moment the count
goes to zero. The log says what every one of them did.
