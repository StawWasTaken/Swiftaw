# Orion 3 - The Swiftaw Account

> Unify all user account systems across Swiftaw, Fortized and Hereld into one
> centralized Swiftaw Account, inspired by how Google works across its products,
> while each platform keeps its own customization independent.

**This is the most dangerous thing in the whole programme.** Everything else, if
it goes wrong, looks bad. This one, if it goes wrong, locks every user out of
every product on the same afternoon. It gets its own run with nothing else in
flight.

Until this workstream is formally started, the standing instruction still holds:
**do not redesign or migrate account systems, do not merge Hereld accounts with
Swiftaw accounts, do not modify Fortized accounts.** Orion is what lifts that,
and only for this workstream, and only once **D5** is answered.

## Where we actually are

Three separate Supabase projects, three separate user tables, three separate
sign-ins. Swiftaw's `account.html` already does TOTP and WebAuthn through
Supabase MFA. Hereld's accounts are deliberately independent. Fortized still
compares a password in the browser against a row read with the anon key, and
`users` has no row-level security - that is a known, written-down problem in its
own repo and it becomes this workstream's problem the moment Fortized joins.

---

## A - Decide, before touching anything

- [!] **A1. Answer D5: which project owns identity.** Swiftaw's, or a new one
      built for the job. A new project is cleaner and means no product's existing
      data is the odd one out; Swiftaw's is less work and already has MFA.
      *Recommendation: a new identity project*, because whichever existing one
      wins inherits every assumption its product made about its own users.
- [ ] **A2. Write the identity model down.** One Swiftaw account. Per-product
      profiles hanging off it. What is shared: who you are, your email, your
      security. What is never shared: display name, avatar, settings, everything
      each product made its own. The memo is explicit that per-platform
      customization stays independent, and that is the whole design.
- [ ] **A3. Decide what happens to someone who has all three today** under
      different names and different emails. Linking has to be something they do
      on purpose, and refusing to link must remain possible.

## B - Fortized has to be safe first

Fortized cannot join a shared identity system while its own is this open. This
is not scope creep, it is a prerequisite: linking accounts across products means
a weakness in one becomes a weakness in all three.

- [ ] **B1. Hash the passwords.** They are plaintext in `users` today and
      compared in the browser. Needs bcrypt or argon2, the comparison moved
      server-side, a migration, and a dual-read window so nobody is locked out
      mid-rollout. `POST /api/session` is already the right shape for it.
- [ ] **B2. Turn on row-level security for `users`.** Until this lands, anyone
      holding the shipped anon key can read every row, passwords included.

## C - Build it

- [ ] **C1. The identity project:** accounts, linked product profiles, sessions,
      security factors, an audit trail.
- [ ] **C2. One sign-in screen** on the Swiftaw system, used by all three.
- [ ] **C3. Session sharing** so signing in once is enough, with an explicit
      sign-out-everywhere.
- [ ] **C4. The account switcher** works across products. It has been reported
      broken before; it needs a real test, not a look.
- [ ] **C5. Per-product profile settings** stay in their own product. Nothing
      about Fortized's appearance system or Hereld's handles moves.

## D - Migration, which is the actual risk

- [ ] **D1. Create a Swiftaw identity for every existing user** without touching
      their ability to sign in the old way. Both paths work at once.
- [ ] **D2. Link on next sign-in,** silently where the email matches, with a
      real confirmation where it does not.
- [ ] **D3. A rollback that has been run.** Not designed, run, against a copy.
      If it has not been executed it does not exist.
- [ ] **D4. Retire the old paths one product at a time,** smallest first, with a
      gap between each. Never all three in one day.
- [ ] **D5. A way back in for anyone stranded,** and a person watching support
      on migration day.

---

## Swiftaw Mail

Now its own list: [`11-mail.md`](11-mail.md).

The one thing to carry here, because it decides this list's priority rather than
that one's: **the mailbox hangs off the account, not the other way round.** A
Google account works perfectly well with no Gmail attached, and that is the
shape to copy. Built that way, this list ships and is useful long before any
mail server exists. Built the other way, everyone waiting for an account is
waiting on DKIM.

So list 11 does not start until this one has landed, including its rollback
having been run rather than designed.

---

## Done means

One person, one Swiftaw account, signed in once, recognised by Swiftaw,
Fortized and Hereld, each of which still looks and behaves like itself. Nobody
lost access on the way. Fortized's passwords are hashed and its user table is
no longer world-readable.
