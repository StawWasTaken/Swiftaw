# Tropicon — read this before wiring up an `@font-face`

**Tropicon cannot be served from swiftaw.com under the licence we hold.** The
font file has been removed from the repository for that reason. This is not
caution; the EULA rules it out in four separate places.

The licence itself is beside this file:
`Tropicon - Monotype Desktop EULA.html`.

## What the licence actually says

It is a **Font Software For Desktop End User License Agreement**. The grant is
to *Licensed Desktop Users*, on *Workstations*, and it is bounded:

> …install the Font Software on such Licensed Desktop User's Workstation(s);
> Use the Font Software on such Workstations to create, edit, view, print and
> distribute materials, **provided that, (a) the materials do not contain the
> Font Software embedded**…

And the prohibitions, verbatim:

> **Install the Font Software on any server or in any digital asset management
> system.**

> **Modify the Font Software in any way**, including to create, directly or
> indirectly, Derivative Works from the Font Software or any portion thereof…

> Rent, lease, sublicense, give, lend, or further distribute the Font Software,
> or any copy thereof…

Four things follow, and each one on its own is enough:

1. **`@font-face` is embedding.** The grant explicitly excludes materials that
   contain the font embedded.
2. **A web host is a server.** Putting the `.otf` in this repository *was*
   installing it on a server — GitHub Pages publishes this tree, so the file
   was reachable at `swiftaw.com/Tropicon/Tropicon-Regular.otf` while it sat
   here.
3. **Converting to WOFF2 is prohibited.** "Modify… in any way" covers format
   conversion and subsetting; the definition of Font Software names Subsets
   directly.
4. **Serving it to visitors is distribution.** Every page view hands a copy of
   the font to a stranger's browser.

## What we can still do with it

The desktop licence is a real licence and it is useful — it just licenses a
designer's machine, not a web server.

- **Set type on the workstation and export a flat image.** A hero lockup, a
  wordmark, one fixed headline: set it in Tropicon locally, export SVG or PNG,
  ship the image. That is the ordinary permitted use of a desktop licence.
- **One caveat on that**, from the same clause: the image must not be part of a
  scheme where glyphs are *"individually addressed by software, a website… to
  render such designs"*. A whole headline baked as one graphic is fine. An
  image-per-letter renderer that reassembles words in the browser is a webfont
  wearing a costume, and it is out.

## What we are doing instead, for now

The biggest display titles use **Syne** at its heaviest weight, which is what
they use today and what every Swiftaw page already loads. Nothing is blocked
by this; the type just does not change until the licence does.

## To actually use Tropicon on the web

Buy a **Web Font licence** for it from the Monotype property it came from
(fonts.com / MyFonts / monotype.com). That is a different product from the one
we hold, it is priced on pageviews, and it comes with its own EULA and usually
its own WOFF2 build — which also removes the "no modification" problem, because
we would not be the ones converting anything.

Once that exists, the wiring is small: the `@font-face` goes in
`css/swiftaw-nb.css` next to the other font declarations, and
`--nb-font-display` points at it. Nothing else in the system needs to know.

## One loose end worth closing deliberately

Removing the file from the current tree takes it off the live site immediately,
but **git history still contains the blob**, and GitHub keeps history blobs
reachable by their commit SHA. If that matters — and for a licensed commercial
font it reasonably might — the history has to be rewritten
(`git filter-repo --path Tropicon/Tropicon-Regular.otf --invert-paths`) and
force-pushed, which rewrites every commit after the upload and requires anyone
with a clone to re-clone. That is a deliberate, disruptive step, so it is
flagged here rather than done quietly.
