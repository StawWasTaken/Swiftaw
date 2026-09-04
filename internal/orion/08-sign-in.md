# Orion 8 - Signing up and signing in

> Redesign sign-up and sign-in for Swiftaw, Fortized, Hereld, Supernova and
> Lifecheck to fit the brand. Friendly, in the spirit of old Roblox, adapted
> rather than copied. Friendlier on Fortized and Hereld because they are social;
> still friendly but a little more composed on Swiftaw, Supernova and Lifecheck.

This is the first thing anyone ever sees of us, on all five properties, and
right now it is five different first impressions.

**It is not list 3.** List 3 unifies the account systems underneath. This list
is the screen. They are deliberately separate so this can be built now, but it
has to be built so that unification is a change of what the form talks to, not
a rebuild of the form. One component, five skins, one submit path that can be
repointed.

---

## A - The design

- [!] **A1. The old Roblox reference, D11.** Staw is providing a screenshot. Adapt,
      do not copy: it is very old and it is someone else's brand. What we are
      taking is the warmth and the sense of arriving somewhere, not the layout.
- [ ] **A2. One component, five temperaments.** The same fields, validation and
      states everywhere. What changes per property is the illustration, the
      colour, the copy and how much it plays. Fortized and Hereld lean warm.
      Swiftaw, Supernova and Lifecheck stay warm but steadier.
- [ ] **A3. Illustration and motion, per list 0.** This is the page that most
      needs to not be a form on a background. Something to look at, something
      that answers when touched, something that makes signing up feel like
      arriving rather than filling in a record.
- [ ] **A4. Every state designed:** empty, typing, checking, taken, wrong,
      locked out, offline, and the moment it succeeds. Most sign-up forms are
      only designed for the happy path and it shows the second anything is
      wrong.
- [ ] **A5. Mobile deliberately,** not as a narrowed desktop.

## B - What we ask for

| Field | Notes |
| --- | --- |
| Username | Unique, checked live, reserved names refused |
| Email | Verified before the account is fully usable |
| **Date of birth** | **Required.** See section C |
| Password | 8 characters minimum, special characters required |
| Confirm password | |
| Display name | Separate from the username, changeable later |
| Avatar | Optional at sign-up, never a blocker |
| 2FA | Offered at sign-up: authenticator app or passkey |
| Agreements | Swiftaw Privacy Policy, Terms of Service, plus any per-product terms |

- [ ] **B1. Username availability live,** and honest about why one is refused.
      Reserved and platform names are already handled per product and should
      become one list.
- [ ] **B2. Password rule stated up front,** never discovered on submit. Eight
      characters and special characters, with a strength read that reflects the
      actual rule rather than a decorative meter.
- [ ] **B3. 2FA offered here, not buried in settings.** Passkey first,
      authenticator second, and skippable without a guilt-trip. Shares the
      component from list 4, so it is built once.
- [ ] **B4. Avatar at sign-up, optional.** People who set one are far more
      likely to stay, and people who are blocked by one leave.
- [ ] **B5. Agreements as real links to the real routes.** Swiftaw's policy and
      terms, plus each product's additional terms where it has them. Never a
      fabricated URL. Where a product has no additional terms, do not invent a
      link to make the row look complete.
- [ ] **B6. Consent that is genuinely a choice** where the law requires one.
      Nothing in the visual design may imply agreement is mandatory when it is
      not.

## C - Date of birth, which needs care

This answers most of **D4**, and it unlocks a lot: age-adaptive moderation at
13, 15 and 18 in list 4, the adult-content gate in list 2, and the INTSAF
programme.

Three things still have to be true before it ships:

- [!] **C1. What is INTSAF?** Named as launching soon after and as the main
      reason date of birth matters, but not yet described. What it needs from an
      age changes how the field is stored and what we are allowed to do with it.
      This wants a paragraph from Staw before the field is designed.
- [!] **C2. The lawful basis.** A French SAS collecting minors' dates of birth
      has real obligations. The privacy policy has to change, the retention
      period has to be decided, and it has to be settled whether an age below a
      threshold blocks sign-up outright or opens a different experience. This is
      a decision, not an implementation detail.
- [ ] **C3. Store the date, derive the age.** Never store a computed age; it is
      wrong the next morning. Never show a birthday to anyone who has not been
      given it, and keep it out of every profile payload by default.
- [ ] **C4. Ask once, at sign-up, and make it hard to change.** An age that can
      be edited freely is not a gate. Changing it should be a support action
      with a record.
- [ ] **C5. Unknown age gets the strictest treatment,** never the loosest. This
      applies to every account that predates the field, which is all of them.

## D - Rollout

- [ ] **D1. Build it on Hereld first.** Its accounts are already independent and
      self-contained, so it is the lowest-risk place to get the component right.
- [ ] **D2. Then Swiftaw,** which is the one list 3 will eventually build on.
- [ ] **D3. Then Supernova and Lifecheck,** which are the simplest.
- [ ] **D4. Fortized last,** and only after its passwords are hashed and its user
      table has row-level security. Putting a new sign-up screen on top of a
      browser-side password comparison would make the front door look safer than
      it is, which is worse than leaving it alone.
- [ ] **D5. Existing accounts are asked for a date of birth once,** in the app,
      skippable but persistent, rather than being locked out of a product they
      already use.

---

## Done means

The same five minutes of warmth wherever someone joins us, in the right
temperature for the product they are joining. We know how old people are, we
are allowed to know it, and the three things that depend on it can finally be
built. Nobody meets a form on a background.
