# Orion 10 - Swiftaw Workspace, and the icon service

From Staw, 2026-09-04. Two things in one list because the second is the first
one's reason to exist.

> I fear that i have too many ideas that are small, so individually they might
> take too much space [...] So i imagined making something like a Swiftaw
> Workspace [...] where we could put every little service we own that arent too
> big.

That is the right instinct and it is worth saying why. A company with fourteen
small products has fourteen navigations, fourteen headers, fourteen sign-in
screens and fourteen places to fix the same bug. A company with one Workspace
and fourteen tenants has one of each. It is also the difference between reading
as a company and reading as a person with a lot of side projects.

**This document may be modified.** It was written from a first description and
the CEO said as much.

---

## A - The Workspace itself

**What it is.** One shell that small Swiftaw services live inside. Half
inspired by Google Workspace: one identity, one header, one grid of apps, one
place the user learns once.

**What goes in it.** The services too small to carry their own site: the icon
service, Lifecheck, Swiftaw Accounts, Swiftaw Mail if it happens, and whatever
comes next. Named as the counter-example: **Supernova does not go in it.**
Supernova is a Swiftaw service that is too big to sit in a drawer with the
others, and it keeps its own front door.

**What it is not.** Not a dashboard nobody visits. Each tenant has to be usable
by someone who arrived straight at it and has never seen the Workspace, because
most people will.

- [!] **A1. The name.** Two names are in play and they answer different
      questions. **The service is named: Swiftaw Icons.** The container it will
      one day sit in is not, and Staw has said the Workspace itself "is not
      really done and planned", so it is not being named to unblock a build that
      does not need it. "Swiftaw Workspace" or "Swiftaw Devs" were both said;
      Workspace fits the tenant list better, because icons, Lifecheck, accounts
      and mail are not a developer toolbelt. **D13 stays open and blocks
      nothing.**
- [ ] **A2. The shell.** Header, app grid, account menu, footer. Built once,
      shared, and to the Neo-Brutalist standard like everything else.
- [x] **A3. Routing and domains. Settled: a path on swiftaw.com, and the
      subdomain waits for the Workspace to be a real thing.** Staw wants a
      subdomain for the Workspace eventually and none for the individual
      service, and says the Workspace "isnt really done and planned" yet.

      So Swiftaw Icons lives at **`/icons/`**, at the top level rather than
      under a `/workspace/` prefix that names something undecided. The point of
      the warning in this row is that moving costs redirects forever, and a
      short top-level path is the one address that survives every version of
      the Workspace question: if the Workspace gets a subdomain later, the
      tenant moves there and `/icons/` keeps answering, which it would have to
      do anyway.

      The GitHub Pages constraint stands and is the reason a subdomain is not
      free: **one custom domain per Pages repo**, so a subdomain per tenant
      means a repository per tenant.
- [ ] **A4. One identity across the tenants.** This is list 3's job, not this
      one's. Cross-reference, do not rebuild.
      See [`03-swiftaw-account.md`](03-swiftaw-account.md).
- [!] **A5. Free or paid.** The memo says the cooperative side means helping
      others, "either in a free way either where they have to pay". Which
      tenants are free, which are paid, and whether there is one Workspace price
      or a price per tenant, is a business decision nobody can infer. **D14.**

---

## B - Swiftaw Icons

> a swiftaw service, like fontawesome, where there could be in disposition of
> everyone; svg icons that they could added as svg & html

The first tenant, and a good one to be first: it is self-contained, it has an
obvious shape, and Swiftaw already needs it internally for the brand marks.

**Where the icons live.** Not in the repository. Staw: *"i'll upload them
through the swiftaw account, rather than putting them into the github repo"*,
and *"you can use the database we use for swiftaw accounts"*. So the SVG source
is a column in the Swiftaw Accounts project (`mwszvynzzugbowdngzab`), written
through the upload screen by a signed-in staff account, and the site reads it
back. Nothing about the library ships in a commit, which also means adding an
icon never needs a deploy.

### B1 - What it holds

Categories named: brand marks, astronomy, buildings, business, alert,
accessibility, people, coding, communication, construction, and more. Brand
marks are the ones we cannot get anywhere else and are the reason this is worth
building rather than only using someone else's library.

- [ ] **B1a.** Schema: icon, name, slug, category, tags, the SVG itself, who
      uploaded it, when, licence, published state.
- [ ] **B1b.** Categories as data, not a hardcoded list. There will be more.
- [ ] **B1c.** Store the SVG normalised: one viewBox convention, `currentColor`
      on the fills, no stray width and height attributes. An icon library whose
      icons do not all behave the same way is a worse library than none.

### B2 - Uploading

> icons will be uploaded THROUGH the actual website by swiftaw superadmins &
> admins, with a given name, selected category, etc

- [ ] **B2a.** Upload screen, admin and superadmin only.
- [ ] **B2b.** **The permission is checked on the server**, at the write. A
      moderator typing the upload URL gets refused by the database, not by a
      hidden button. Standing rule, and this is the screen where it matters
      most: an unchecked upload endpoint means anyone can put anything on our
      CDN under our name.

      **A note on who counts as staff, because Swiftaw Accounts has no roles
      yet.** The one rule in the project today is `is_support_staff`, which is
      literally `username = 'swiftaw'`. Ranks are list 3's and list 4's work and
      this list does not get to invent them. So the icons migration adds its own
      small roster, `swiftaw_staff`, with a rank per account, and seeds nothing:
      the `swiftaw` account is recognised as superadmin by the same fallback the
      support system already uses, so the service works on day one without
      anybody hand-editing a table. When the real role system lands, that
      fallback is the one thing to delete.
- [ ] **B2c.** Sanitise on upload. An SVG can carry `<script>`, event handlers
      and external references. We are about to serve these to other people's
      websites, so an unsanitised SVG is not a bug, it is a supply-chain
      problem. Strip to a known-good element and attribute allowlist and reject
      what does not survive.
- [ ] **B2d.** Bulk upload, or the brand set takes an afternoon of clicking.

### B3 - The browse screen

> a search capsule, with also category list on the left side, in the center and
> as you go down until you find the next page and the (1/5), you will see the
> most recently uploaded svg icons BY DEFAULT

- [ ] **B3a.** Search capsule at the top.
- [ ] **B3b.** Category list down the left.
- [ ] **B3c.** Grid of squares in the middle, each showing the icon and its
      name. Newest first by default.
- [ ] **B3d.** Paged, with the count shown as `1 / 5`. Paged rather than
      infinite scroll, which is what was asked for and is also the right call:
      a person looking for one icon wants to be able to come back to page 3.

### B4 - The icon card

> a card where you can change the colour of the preview, you cannot drag the
> preview, you cannot save the preview, you cannot open the preview in a new
> page, you cant steal it, etc

- [ ] **B4a.** Colour control on the preview.
- [ ] **B4b.** Drag disabled, context menu on the preview disabled, no direct
      file URL to open in a new tab.
- [ ] **B4c.** The copy block: SVG selected by default, HTML as the other
      option, showing exactly the snippet to copy.

**On "you cant steal it", honestly.** B4a and B4c hand the visitor the SVG
source, because that is the entire purpose of the service. Everything in B4b is
friction against the casual case and nothing more: the source is in the copy
box, in the DOM, and in the network tab. Standing rule S5 in
[`00-standards.md`](00-standards.md) says be honest internally about that
ceiling, so: **what protects these icons is the licence we publish them under,
not the interface.** Worth doing the friction anyway, worth nobody believing it
is protection.

- [ ] **B4d.** Decide and publish the licence our own icons ship under. Without
      one, a company that wants to use a Swiftaw icon has no answer and will not
      use it.

### B5 - The customiser

> a sort of place where you can customize svg icons (inspired of the icon wizard
> from fontawesome) with icons, modifiers, elements, etc

Second phase. It is a bigger build than the rest of the service put together
and the service is useful without it.

- [ ] **B5a.** Scope it once B1 to B4 are live and there is something to
      customise.

### B6 - Font Awesome alongside ours

> Swiftaw would both use fontawesome svg icons (cuz we've already started to do
> so and that theyre kinda good) and also our own svg icons

- [x] **D12. Answered: we use Font Awesome, we do not hand it out.** Staw drew
      the line in one sentence and it is the right line: *"using doesnt mean
      distributing"*. Font Awesome Free icons keep being used inside our own
      products, which is what we already do and what its licence allows. **The
      library serves only Swiftaw's own icons**, uploaded through the site by
      the Swiftaw account.

      Two consequences worth holding on to. It means the library is small on day
      one and grows at the speed we draw, which is slower than importing
      somebody else's set and is the trade Staw took knowingly. And it means the
      service carries no attribution obligation and no "whose terms is this one
      under" label on the grid, because every icon in it is ours: nothing on the
      page has to explain a second licence to a visitor.

      Nothing in the service reads from a Font Awesome package, and no upload
      path exists that would put one in. If that changes it changes here first.

---

## C - What this list will not do

- It will not build the account system. That is list 3.
- It will not move Lifecheck into the Workspace before Staw has settled what
  Lifecheck becomes. They said themselves that new services may be merged into
  it and that they would say more later.
- It will not invent tenants. The Workspace ships with what exists.

---

## Done means

One shell, one identity, and Swiftaw Icons inside it: an admin can upload a
brand mark from the website, anyone can find it by search or category, take the
SVG or the HTML, and recolour the preview before they do. Nothing on the page
claims to protect something it cannot, and the Font Awesome question has an
answer written down rather than a default nobody chose.
