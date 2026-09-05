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
- [x] **A3. Cooldown and rate settings** as a screen rather than constants in
      the function. Per bot was done as part of A1; globally is done now, and
      the reason it took a second pass is worth keeping: **the settings page had
      one control, a switch.** Every flag was drawn as on or off, so a flag
      holding a number could be read by the database and set by nobody.
      `staff_set_flag` has taken `p_number` since the day it was written and
      only one caller ever passed one.

      There is a number row now. The page is in two parts, the seed account
      settings and everything else, and the sentence under each control is the
      flag's own `text_value` out of the database, so the console cannot
      describe a setting differently from the way it was written down.

      One thing deliberately refused: **an empty field is not zero.** Zero means
      something different on each of the three - no ceiling, no floor, no notes
      at all - so clearing the box and pressing Save would make one of those by
      accident. A blank is turned away and a typed zero is not.
- [x] **A6. The kill switch was not connected to anything.** It has been tested
      now, which is how that was found. `staff_set_flag` writes
      `bots_emergency` and **no function read it**: not `bot_due`, not
      `bot_fill`. The console renders it as the special switch, above the count,
      and pressing it wrote a row nobody consulted.

      The check was not forgotten, it was overwritten.
      `2026-09-01-hereld-bot-fix.sql` added it to `bot_due`. Two files later
      `-premium-bots` replaced `bot_due` with the tier-aware version and the
      new body does not carry it. So the switch worked, and then quietly
      stopped working, at whatever point that file was run - which, per D4a, is
      a point it never reached in any database. It has never worked in
      production either.

      `2026-09-05-hereld-bot-limits.sql` puts it in both functions. Four checks
      cover it, and taking it back out fails exactly one of them.

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
      accounts can still land on the same sentence honestly. **That half is
      closed now.** `bot_said_before` keeps its signature and reads across
      every seed account rather than one: sixty days against itself, ten days
      against the others, trimmed and case-folded so spacing does not get round
      it. A real person saying the same words does not gag them.
- [x] **B5. The ten standing accounts claimed credentials they do not have.** A
      PhD, a librarian, an engineer, two journalists and a history "since
      2024". None of them names a real person, so the letter of the rule held,
      but "climate solutions journalist" carries weight on a social platform
      that an automated account has not earned, and C says they are not
      designed to deceive. Rewritten to say what the account does rather than
      who it used to be. The instruction "you are a real Gen Z person" is now
      "you write the way a Gen Z person writes", which gets the voice without
      telling the model to assert that it is a person.
- [x] **B1. Cooldowns and rate limits honoured** by the function itself, not
      only by the schedule. Two holes, both closed. `bot_fill` and
      `bot_fill_premium` were executable by any signed-in account, so a
      stranger could queue work past every cooldown by pressing an endpoint;
      D4b covers that. And a manual "run all" obeyed only each account's own
      `cooldown_min`, which the console can set to anything: there was no floor
      under it and no ceiling over a day. Both exist now, in `bot_due`, which
      is the gate every path goes through including the button.
      `bots_min_gap_min` raises a cooldown set too low and cannot loosen one
      set higher. `bots_max_per_day` counts successful actions in the last
      twenty four hours; zero means no ceiling rather than a ceiling of zero,
      which is the mistake that would have stopped everything the day it
      shipped.
- [~] **B3. Spread the schedule.** Half. Queueing no longer lands everything on
      the same minute: each account is given somewhere in the next three
      quarters of an hour rather than four to twelve minutes out, and quiet
      hours keep the small hours empty in each account's own timezone rather
      than the server's. The other half is the cron itself, which still fires
      at the top of the hour and is D1.
- [x] **B4. Bots stay out of moderation queues** as reporters, at the insert
      rather than in the code that calls it: a trigger on `reports` refuses a
      reporter that is in `bots`. Client, worker or console, it is the same
      answer. And they do not pile onto real people: the note branch counted
      notes already **written** on a post and not ones already **queued** for
      it, so one fill could stack several onto the same post before any of them
      landed. It counts both now, and a person's post takes at most one
      whatever the cap is set to.

### The roster was readable by anybody with an account, and stayed that way

**Read D4b before this section.** What follows is the diagnosis, which was
right. The migration written from it was not, and the roster was still open
after it ran.


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
- [!] **D4. Run the outstanding migrations,** in this order, which is a
      dependency order and **not** the alphabetical one:
      `2026-08-29-hereld-core`, `-algorithm`, `-supernova`,
      `2026-08-30-hereld-affiliates`,
      `2026-08-31-hereld-assoc-mark`, `-composer`,
      `2026-08-30-hereld-features`,
      `2026-09-01-hereld-bot-fix`, `-bot-queue-fix`, `-edit`,
      `-premium-bots`, `2026-09-04-hereld-attachments`,
      `2026-09-04-hereld-edit-columns`, `2026-09-05-hereld-bot-workers`,
      `2026-09-05-hereld-bot-grants`, `2026-09-05-hereld-bot-limits`.
      `2026-08-31-hereld-assoc-mark` has never been run against any database.

      This order, and a loader that runs it, are now in the repository at
      `supabase/tests/load.sh`, with a README beside it. It needs Postgres 16
      and nothing else. Every file reads ok from a clean database, so anything
      that fails in the SQL editor is the editor or the order, not the file.

      **Two of these had to be repaired first, and the repairs are the
      finding.** The whole schema was loaded into a local Postgres 16 and asked
      who could call what, which had never been done, and it answered twice.

      `-features` reads `p.disclosure`, which `-composer` creates, so
      alphabetical order fails on it. Ordering here is by what depends on what.

- [x] **D4a. `-premium-bots` could not run, and stopped at line 161.** It
      revokes on `bot_create_premium_internal(text x7)`. The function takes
      **nine** arguments. Postgres answers `function does not exist`, the
      script stops, and **everything below that line has never existed in any
      database this file was run against**: the staff-checked
      `bot_create_premium`, `bot_fill_premium`, the tier-aware `bot_due` and
      `feed_premium`.

      Which explains two things nobody had connected. The worker calls
      `bot_fill_premium` on every run and logs an error every time. And it
      reads `b.tier` off `bot_due`, which without the tier-aware version is
      never there, so `isPremium` has been false since the day it was written.
      **The premium tier has never once worked.** With the signature corrected
      the file loads, and so does the whole schema.

- [x] **D4b. `-bot-workers` does not do what it says.** This is the migration
      written last time to take the roster back off anybody with an account,
      and it did not. It revokes `from anon, authenticated`, which removes two
      named grants and leaves alone the grant every function is created with,
      **EXECUTE to PUBLIC**, of which anon and authenticated are both members.

      Read back out of the database after applying it, where a leading
      `=X/postgres` is PUBLIC holding EXECUTE:

      ```
      bot_due             ->  =X/postgres , postgres=X/postgres
      bot_fill_premium    ->  =X/postgres , postgres=X/postgres
      bot_suggest_persona ->  =X/postgres , postgres=X/postgres
      bot_fill            ->  postgres=X/postgres
      ```

      `bot_fill` is the only one genuinely closed, and it is the only one of
      the four whose original line, written a week earlier in
      `-supernova`, said `revoke all ... from public`. **The old line was
      right and the correction to it was wrong.**

      `2026-09-05-hereld-bot-grants.sql` revokes from PUBLIC on all seven,
      takes its signatures out of `pg_proc` rather than from memory, since a
      signature from memory is what caused D4a, and skips a function the
      database does not have rather than stopping, since stopping is what
      caused D4a as well. Three read `PUBLIC can execute` before it and all
      seven read `restricted` after; it is idempotent; and `service_role`
      keeps its grant across a re-run, so the worker is unaffected.

      **The lesson is the one this project keeps relearning.** Both of these
      were written from a correct diagnosis, read correctly on the page, and
      were false. A grant is not closed because a migration says it is closed.
      Load it and ask the database.
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
