# Orion 4 - Safety, security, moderation

> Uniformize security across Swiftaw, Lifecheck, Supernova, Fortized and Hereld
> using passkeys and authenticator 2FA. The 2FA QR must carry a true square
> centre holding the Swiftaw logo in the QR's own colour. Deploy one
> Supernova-equipped moderation system across Fortized and Hereld, enforcing
> core safety while permitting general insults and slurs, with a uniform
> ignore, block and report system and staff console. Plan age-adaptive
> moderation at 13, 15 and 18.

## Where we actually are

Swiftaw's `account.html` already enrols TOTP and WebAuthn through Supabase MFA,
and 2FA can only be removed after passing a Lifecheck. That is the reference
implementation; the other four properties have nothing.

Fortized has a full staff console with reports, bans, suspensions, warnings, an
audit log and an automod pass on send. Hereld has a staff console with its own
hierarchy and a Swiftaw platform account. They share no code and no vocabulary.

Nothing anywhere calls Supernova to judge content.

---

## A - Passkeys and 2FA everywhere

- [ ] **A1. Extract Swiftaw's 2FA into a shared component,** rather than writing
      it a fourth and fifth time. Enrol, verify, list factors, remove behind a
      Lifecheck.
- [ ] **A2. The QR code, done properly.** A true square hole in the centre, the
      Swiftaw logo inside it, drawn in the QR's own colour. Raise the error
      correction to H so the code still scans with the middle removed, and test
      it against a real authenticator app rather than a decoder library.
- [ ] **A3. Passkeys as the first suggestion,** authenticator app second,
      because the passkey is the one people actually keep.
- [ ] **A4. Recovery codes.** A person who loses their phone and their passkey
      currently loses the account. Generated once, shown once, stored hashed.
- [ ] **A5. Roll out per property.** Lifecheck, Supernova, Hereld, Fortized. If
      list 3 has landed, this is one implementation on the shared account and
      most of this list collapses. **Do this after list 3 if the timing allows;
      doing it before means building it five times and migrating it once.**
- [ ] **A6. Removal always goes through Lifecheck,** on every property, matching
      what Swiftaw does today.

## B - One moderation system

- [ ] **B1. Write the policy before the code.** What is enforced: children, real
      harm, threats, sexual content involving minors, our own security. What is
      explicitly allowed: general insults and slurs. This is a deliberate
      product decision and it needs to exist as a document so that nobody
      quietly tightens it later and nobody is surprised by it.
- [ ] **B2. One `moderate` job on Supernova.** Text in, a verdict and a reason
      out, with the calling environment as a parameter so Fortized and Hereld
      can differ without forking the model.
- [ ] **B3. Environment adaptations.** A bastion's own rules on Fortized, a
      public timeline on Hereld. Same engine, different thresholds, both
      readable in one place.
- [ ] **B4. The guard runs at the mutation.** Fortized learned this the hard
      way: checking permission where the button is drawn is not checking it.
      Every moderation decision is enforced where the write happens.
- [ ] **B5. Uniform ignore, block and report.** Same words, same shapes, same
      outcomes on both platforms. Blocking updates the feed immediately.
      Reporting reaches a real queue. Not interested actually changes what gets
      shown.
- [ ] **B6. One staff console vocabulary.** The two consoles do not have to
      share code, but a warning, a suspension and a ban must mean the same thing
      on both, and both must feed Headquarters in list 5.
- [ ] **B7. Server-side permissions, tested by trying to break them.** A
      moderator typing a superadmin URL is refused by the database. Write the
      test that attempts it.
- [ ] **B8. Every action audited,** including the ones that only read.

## C - Age-adaptive moderation

Planned, not built, and correctly flagged in the memo as needing brainstorming.
**D4 is now answered: we do collect date of birth,** at sign-up, on every
property. That removes the thing that blocked this outright. What is left is a
dependency and a decision.

- [~] **C1. The age itself now arrives with [list 8](08-sign-in.md).** The field
      is designed there; this list consumes it. Nothing here can be built before
      that ships, and every account predating it has no age at all, which is
      what C4 exists for.
- [!] **C2. The legal half is still open, as D9.** A French SAS holding minors'
      dates of birth has real obligations: the privacy policy changes, a
      retention period has to be set, and it has to be settled whether an age
      below a threshold blocks sign-up or opens a different experience. **D10,
      what INTSAF actually is,** may change the answer, since it was named as
      the main reason the field matters.
- [!] **C3. The 18+ tier and the adult chat in list 2 are the same gate.**
      Whatever satisfies one satisfies the other, so design it once. A
      self-declared checkbox is not it. This is **D3** and it is unchanged by
      D4: knowing a claimed age is not proof of one.
- [ ] **C4. Design the three tiers** at 13, 15 and 18, and decide what an
      account with no known age gets. It gets the strictest tier, never the
      loosest, and that is most accounts on the day this ships.

---

## Done means

One person's security works the same way on all five properties, and losing a
phone is recoverable. One policy, written down, enforced by one engine at the
point of writing, adapted per environment rather than reimplemented. Blocking,
reporting and ignoring do what they say on both platforms. Age tiers are
designed against an age we are actually allowed to hold.
