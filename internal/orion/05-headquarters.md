# Orion 5 - Headquarters

> Build a global administrative hub at `swiftaw.com/account` for superadmins.
> Full visibility into every user, account, piece of data and platform Swiftaw
> owns. Inspect accounts across all platforms, run cross-platform moderation,
> and put a platform into maintenance from the central console. It should work
> like a headquarters managing territories.

## Where we actually are

Fortized has the console this should feel like: sixteen pages, a command centre,
dossiers, a review queue, a global monitor with a self-contained world map, an
economy view, statistics and an audit log. Hereld has its own smaller one.
Swiftaw has an account page with an inbox and support tickets.

Nothing spans the three. There is no cross-platform view of one person because
there is no cross-platform identity yet, which is why this list splits in two.

---

## A - Build it read-only first, against what exists

This half is worth having immediately and does not wait on list 3.

- [ ] **A1. The shell,** on the Neo-Brutalist system, at `swiftaw.com/account`
      behind a superadmin check. Fortized's console is the reference for the
      shape: a rail of real sections, a sticky page head, one page at a time.
- [ ] **A2. Server-side authority.** The check lives in the database, not in the
      page. A moderator typing the URL gets nothing back, not a hidden button.
      This is the single most important line in this file.
- [ ] **A3. A territory tile per platform:** Swiftaw, Fortized, Hereld,
      Lifecheck, Supernova. Accounts, activity, whether it is up, whether it is
      in maintenance. Real numbers or an honest empty state, never a placeholder
      that looks like data.
- [ ] **A4. Look someone up on one platform** and open their dossier, reusing
      what each console already knows how to show rather than inventing a third
      dossier.
- [ ] **A5. Read the queues:** open reports, bans, suspensions, tickets, across
      all platforms in one list, each row saying where it came from.
- [ ] **A6. One audit log,** fed by every platform, including reads. A console
      that can see everything must record every time someone looked.

## B - Actions

- [ ] **B1. Act on one platform from here.** Warn, suspend, ban, restore. Every
      action goes through that platform's own server-side path, so the rules are
      enforced once and cannot drift between the console and the app.
- [ ] **B2. Maintenance mode per platform.** Fortized's already works end to end
      and propagates in about five seconds; use it as the model. Hereld and the
      sites need one.
- [ ] **B3. A confirmation that matches the blast radius.** Putting a platform
      into maintenance is not the same click as warning one account.

## C - Cross-platform, after list 3

This half genuinely cannot be built honestly before identity is unified. Joining
three user tables on an email address is guesswork, and guesswork in a
moderation console gets the wrong person banned.

- [ ] **C1. One person, one row,** across every platform they hold an account
      on.
- [ ] **C2. One dossier** showing every platform's view of them side by side.
- [ ] **C3. Act everywhere at once,** with each platform's own confirmation
      still applying and an obvious way to act on only one.
- [ ] **C4. Search across everything** by name, handle, email or identity.

## D - The part that needs saying out loud

A console that can read every message, every account and every piece of data
across five products is the highest-value target we own. Three things are not
optional:

- [ ] **D1. Every read is audited,** not just every write. Otherwise nobody can
      ever answer the question of who looked at what.
- [ ] **D2. Superadmin is a short list and it is reviewed.** Today that is Staw.
      Whoever is added later should be added deliberately and recorded.
- [ ] **D3. There is a lawful basis for looking.** Full visibility into every
      user's data is a real obligation for a French SAS, not just a feature.
      Worth a note in the privacy policy about staff access, and worth writing
      down internally what counts as a legitimate reason to open a dossier.

---

## Done means

One place where Staw can see all five territories, look up any account, act on
it through the platform's own rules, and put a platform into maintenance. A
moderator who guesses the URL gets refused by the server. Every look is
recorded.
