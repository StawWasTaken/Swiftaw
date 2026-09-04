# Orion 1 - Ecosystem and websites

> Uniformize all Swiftaw websites into a consistent, coherent, and polished
> ecosystem (excluding the main Swiftaw website, which stays as-is for now).
> Include the Fortized app in the redesign. Keep overview pages only on Fortized
> and Lifecheck. Polish Hereld and Fortized. Consolidate Newsroom and Innovation
> Room down to Newsroom, with videos on articles. Clean the scripts so they are
> hard to crack and do not read as AI.

## Where we actually are

The shared Neo-Brutalist system exists (`_css/swiftaw-nb.css`) and so do the
shared components: the ecosystem launcher, the consent card, the legal and
account chrome. Most of swiftaw.com is already on it - homepage, about us,
mission, newsroom, innovation room, 404, the three legal pages, account,
contact, press kit. The Lifecheck site and widget are rebuilt.

Not done: the Supernova site, the Fortized web pages, Hereld's repolish, the
Newsroom consolidation, and any video anywhere. There is no `<video>` element in
the estate today.

---

## A - Finish the sites

- [ ] **A1. Rebuild the Supernova site on the shared system.** Per **D7** the
      overview page goes and the chat becomes the front door, so the site is
      chat plus docs plus keys, not a marketing page with a chat behind it.
      Keep `supernova/chat.html` working throughout; it is the product.
- [ ] **A2. Rebuild the Fortized web pages** on the shared system. **D1 is
      answered and the app goes too,** but that is large enough to be its own
      workstream: the public pages belong here, the app belongs to
      [list 7](07-fortized.md). Build the pages first so the app has finished
      components to land on.
- [ ] **A3. Retire Hereld's overview page** and make the signed-out app the
      front door. Confirm against **D7**. A signed-out visitor still needs a
      real first screen with something to read, not an empty shell behind a
      login wall.
- [ ] **A7. Repolish Hereld's UI.** Staw's read is that it functions well and
      looks decent, and that it now wants a **fuller, more Twitter-like layout**
      rather than the airy one it has. Two jobs in one: give the columns real
      density, and go back over the surfaces OpenCode changed, which left
      inconsistencies behind. Walk it surface by surface rather than restyling
      globally, because what is there mostly works.
- [ ] **A4. Audit every page against the type hierarchy.** Tropicon on the one
      most important headline per page, at its own weight and no heavier. Syne
      Bold for big and secondary titles and for anything small. Syne for body.
      This has been got wrong before and it is the fastest way to make a good
      page look cheap.
- [ ] **A5. One header and one footer, everywhere.** Same markup, same
      behaviour, same launcher, on all five properties. Where a property needs
      something extra it extends the shared one rather than forking it.
- [ ] **A6. Shadow-clip sweep.** Neo-Brutalist offset shadows get cut off by
      parents with `overflow: hidden` and by tight grid cells. Walk every
      property and fix the containers, not the shadows.

## B - Newsroom, and the end of the Innovation Room

- [ ] **B1. Move the Innovation Room projects into the Newsroom** as articles,
      keeping their content. Nothing is deleted, it changes address.
- [ ] **B2. Redirect `innovation-room.html`** to the Newsroom and remove it from
      the nav, the sitemap, the launcher and every internal link. Grep the whole
      estate rather than trusting the nav map.
- [ ] **B3. Attach video to an article.** One field on an article, one player.
      Articles without video are unaffected.
- [ ] **B4. Build the player once,** in the shared CSS, on the Neo-Brutalist
      system. Own controls, not the browser's. This is the same component
      Hereld will use, so build it to be lifted.
- [ ] **B5. Homepage header video.** Plays on the header illustration, muted,
      pausable, and links straight to the full article in the Newsroom. Static
      poster frame first so nothing shifts while it loads.
- [ ] **B6. Port the player to Hereld** for post video, replacing the bare
      `<video controls>` the attachments work ships with.
- [!] **B7. Get the video files.** Nothing can be built past B4 without real
      footage and a poster image. Ask Staw for the first one.

## C - The Swiftaw mess

- [ ] **C1. De-AI the copy on swiftaw.com.** The memo is specific: too much
      explanatory tutorial text. Cut it back until it reads like a person who
      knows the product wrote it in one sitting.
- [ ] **C2. Strip AI residue from the source.** Explanatory comments that narrate
      the obvious, scaffolding notes, anything that reads as generated. Comments
      that earn their place stay.
- [ ] **C3. Make the scripts harder to lift.** Be honest about the ceiling:
      anything a browser runs can be read. Minification and mangling raise the
      cost, they do not stop it. What genuinely protects us is keeping the
      valuable logic server-side, and that overlaps with the Supernova work in
      list 2.
- [ ] **C4. Add `contact.html` and `presskit.html`** to the nav map in the
      navigation checker so they stop being invisible to it.

## D - Housekeeping carried over

- [ ] **D1. Update the Swiftign innovation-project article** to the current
      design, before or during B1.
- [ ] **D2. Update `internal/domains.md`** for Render rather than Cloudflare,
      covering `hereld.swiftaw.com`, `lifecheck.swiftaw.com` and
      `supernova.swiftaw.com`.
- [!] **D3. Point the subdomains.** Needs Staw in Spaceship, plus the decision
      in `domains.md` about one custom domain per Pages repository. The existing
      Lifecheck widgets on Fortized must keep working across the URL change, so
      the old address has to answer for a while rather than being cut over.
- [ ] **D4. Reconcile `internal/brand-architecture.md`** with reality. It
      already admits the address row is aspiration; once D3 lands, make it true.

---

## Done means

Every property looks like it came from the same company. One header, one
footer, one launcher, one type hierarchy, one shadow that is never clipped.
There is exactly one newsroom. An article can carry a video and the homepage
plays one on its header. Nothing on any page claims something we have not
built.
