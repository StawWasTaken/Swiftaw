# Orion 11 - Swiftaw Mail

From Staw, 2026-09-04. The name is not settled.

> i am SURE at a 100% that i'll realise this project at some point, and 80% sure
> that i'll do it in the incoming weeks or months.

That certainty is why it gets a list now rather than staying a paragraph at the
bottom of list 3. It is still filed behind that list, for the reason in section
A, and nothing here starts before it.

**This document may be modified.**

---

## A - It is two products, and only one of them is mail

This is the most useful thing to get straight early, because it is the thing
that decides the order:

1. **An account system**, usable by anybody, with whatever email address they
   already have. This is [`03-swiftaw-account.md`](03-swiftaw-account.md). It is
   already a list, it is already the most dangerous item in the programme, and
   it is not duplicated here.
2. **A mailbox**, for the smaller group who move their mail to a Swiftaw
   address. This list.

The CEO put it as one system: *"the mail & the account system will both be
merged into a system similar to Google's"*. Google is the right reference and
the right warning. A Google account works perfectly well with no Gmail attached
to it, and Gmail is a thing that account can have. Built that way round, the
account ships years before the mailbox and never waits on it. Built the other
way round, everyone who wants an account is waiting on DKIM.

**So: the account is list 3 and ships first. The mailbox is this list and hangs
off it.** Nothing in here is buildable until list 3 has landed, because a
mailbox with no account system behind it is a second account system.

---

## B - What it has to do

> provides an account system usable with external emails, plus an email system
> only for those who migrated their email to a swiftaw one - which means they
> can import previous data or sets to their new swiftaw email, while also being
> able to keep their original email provider

- [ ] **B1. Keep the old provider working.** Explicitly asked for and it is the
      right call: nobody abandons an address they have had for ten years on
      week one. In practice this means forwarding in, sending as, and not
      pretending the other mailbox stopped existing.
- [ ] **B2. Import.** Existing mail and contacts brought across. IMAP import is
      the realistic path and it is slow, resumable and failure-prone by nature.
      Design it as a job with a progress screen, not a button that hangs.
- [ ] **B3. The folders,** as named: inbox, compose, starred, sent, drafts,
      spam, scheduled, important, and user folders beyond those.
      Two of those are not folders and want saying out loud:
      **compose** is an action, and **important** is a judgement the system
      makes. Important in particular means either a classifier or an honest
      manual flag, and shipping a folder that quietly stays empty is worse than
      not shipping it.
- [ ] **B4. Supernova in the mailbox,** the way Gemini is in Gmail: summarise a
      thread, draft a reply, find something. Depends on
      [`02-supernova-pulsar.md`](02-supernova-pulsar.md) being real rather than
      a stub, and it is a feature of the mailbox rather than the reason for it.
- [!] **B5. What people read mail on.** Web only, or IMAP and SMTP access so
      existing clients work. IMAP access is a large amount of extra surface and
      it is also what makes a mail service usable by anyone who has a phone.
      Decide before building, it changes the storage model. **D16.**

---

## C - The part that is not the interface

The inbox screen is the small half of this. Said plainly, because it is the
usual way a mail project goes wrong:

**Running mail is an operations job that never stops.**

- **Deliverability.** SPF, DKIM and DMARC set up correctly is the entry fee, not
  the finish line. A new domain sending mail starts with no reputation and gets
  filed as spam by default until it has earned otherwise, and that takes weeks
  of consistent, low-volume, unreported sending.
- **Abuse.** The day the service opens, people will sign up to send spam from
  it. If they succeed, the domain's reputation is gone and every real user's
  mail starts landing in spam folders. Sending limits, sign-up friction and an
  abuse desk are launch requirements.
- **Incoming spam.** Filtering someone else's spam out is a whole product on its
  own and everybody compares it to Gmail's.
- **Storage.** Mail is not small and it is never deleted. This is the first
  Swiftaw product with an unbounded per-user storage cost, and Fortized is
  already over its Supabase egress quota with no mailboxes at all.
- **Never losing a message.** People forgive a social app that drops a post.
  Nobody forgives a mail service that drops mail, and there is no way to
  apologise for it afterwards.
- **Legal.** Holding people's correspondence is a different category of
  responsibility from holding their posts: retention, access requests, lawful
  interception rules, and a privacy policy that has to be specific rather than
  general.

None of that is a reason not to do it. It is the reason to budget for the
operations rather than the inbox UI, and to decide B6 with open eyes.

- [!] **B6. Do we run the mail server, or do we run a mailbox on top of somebody
      else's infrastructure?** A provider handles deliverability, abuse and spam
      filtering and charges per mailbox. Running it ourselves is cheaper per
      user, is more genuinely ours, and is the entire list above becoming our
      job. There is a middle path where a provider carries the sending and
      receiving and the product, storage and interface are ours, and that is
      probably the honest answer for a first version. **D15.**

---

## D - Before any of it

- [!] **D1. The domain.** `@swiftaw.com` is the obvious one and it is also the
      domain the company's own mail and the website live on. Deciding to hand
      out addresses on it means a stranger's spam complaint affects our own
      mail. A separate domain for user mailboxes keeps the two reputations
      apart. Needs Staw.
- [!] **D2. The name.** "Swiftaw Mail" is called unofficial. Whatever it lands
      on wants to be settled before anything carries it, because a mail service
      is a thing people type into other people's address books.
- [ ] **D3. List 3 has landed,** including its rollback having been run rather
      than designed. Not negotiable, per section A.

---

## Done means

Somebody keeps their existing address, opens a Swiftaw one, brings their old
mail across, and reads both in one place. Their mail arrives in other people's
inboxes rather than their spam folders. Nothing has been lost. And the Swiftaw
account they used to get there worked for a year before the mailbox existed.
