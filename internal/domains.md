# swiftaw.com — the subdomain plan

Three subdomains are wanted: `hereld.swiftaw.com`, `lifecheck.swiftaw.com`,
`supernova.swiftaw.com`. This is what has to be true for each of them, what to
give Spaceship, and the one decision that has to be made first.

---

## What exists today

`swiftaw.com` is a **GitHub Pages** site served from the `StawWasTaken/Swiftaw`
repository. The repo holds a `CNAME` file containing `swiftaw.com` and a
`.nojekyll` marker. Lifecheck and Supernova are **paths on that same site** —
`swiftaw.com/lifecheck/` and `swiftaw.com/supernova/` — not separate hosts.

Hereld has a repository (`StawWasTaken/Hereld`) but nothing deployed. Its
`index.html` today is a saved copy of someone else's page, kept as a reference;
it is not the site.

## The decision that comes first

**GitHub Pages allows exactly one custom domain per repository.** That is the
whole constraint, and everything below follows from it.

So `lifecheck.swiftaw.com` cannot be served by the repository that already
answers to `swiftaw.com`. There are three ways out, and they are real choices
with different costs:

| | what it means | cost |
| --- | --- | --- |
| **A. A repo per subdomain** | `Swiftaw-Lifecheck`, `Swiftaw-Supernova`, `Hereld` each get their own Pages site and their own `CNAME` file | Free. Shared CSS/JS is still loaded from `swiftaw.com`, so the design system stays in one place. Each repo is a separate deploy. |
| **B. One host in front** | Move the whole estate to a host that routes subdomains itself (Render, Netlify, Cloudflare Pages) | One deploy, real routing, and a server when Hereld needs one. More setup, and Render's free tier sleeps. |
| **C. Redirect only** | `lifecheck.swiftaw.com` 301s to `swiftaw.com/lifecheck/` | Cheapest, but the address bar reverts to the path, so it is a shortcut rather than a home. |

**Hereld is the one that does not fit A cleanly.** The brief requires staff
permissions enforced *server-side*, and a bot system — neither of which a
static host can do. Hereld can start on Pages as a landing page and move to a
real host later (the DNS record just gets repointed, which is a one-line
change), or it can go straight onto Render the way Fortized already does.

Nothing below is blocked on choosing. The DNS record shape is the same for A
and C; only the target changes for B.

---

## The records to give Spaceship

All three are **CNAME** records in the `swiftaw.com` zone. None of them touch
the apex, so none of them can break `swiftaw.com` itself.

### If the subdomain is served by GitHub Pages (option A or C)

| Type | Host / Name | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `hereld` | `stawwastaken.github.io` | automatic (or 3600) |
| CNAME | `lifecheck` | `stawwastaken.github.io` | automatic (or 3600) |
| CNAME | `supernova` | `stawwastaken.github.io` | automatic (or 3600) |

Notes worth saying to alf out loud, because they are the two things that most
often go wrong:

- The value is the **user** Pages host, `stawwastaken.github.io` — not
  `stawwastaken.github.io/Hereld`, and not the repository name. A CNAME points
  at a hostname; it cannot carry a path.
- Some panels want the value with a trailing dot (`stawwastaken.github.io.`)
  and some add it themselves. Either is correct; a doubled one is not.
- Only add the record for a subdomain whose repository is actually publishing.
  A CNAME pointing at Pages with no repo claiming that hostname serves a 404,
  which looks like a broken site rather than an unfinished one.

### If the subdomain is served by Render (option B, and likely Hereld eventually)

| Type | Host / Name | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `hereld` | *the `*.onrender.com` hostname Render shows for that service* | automatic |

Render prints the exact value in **Settings → Custom Domains** after the domain
is added there. Do not guess it — it is per-service.

## The other half, in the repository

DNS alone is not enough for Pages. The repository being served must also claim
the hostname, or GitHub will not issue a certificate for it:

1. In the repo, add a file named `CNAME` at the root containing exactly one
   line — `hereld.swiftaw.com` — and nothing else. No scheme, no trailing
   slash.
2. **Settings → Pages → Custom domain**, enter the same hostname, save.
3. Wait for the *"DNS check successful"* tick, then turn on **Enforce HTTPS**.
   The tick can take minutes; the certificate can take up to an hour. An
   HTTPS error in that window is normal and is not a misconfiguration.

Order matters slightly: add the DNS record **first**, then the custom domain in
GitHub. Doing it the other way round makes GitHub fail its check once and it
does not always re-check promptly.

## Verifying it

Once propagated:

```
dig +short hereld.swiftaw.com          # → stawwastaken.github.io. then the Pages IPs
curl -sI https://hereld.swiftaw.com    # → HTTP/2 200, and a GitHub server header
```

`dig` answering with the CNAME but the site 404ing means DNS is done and the
repository side is not.

## What is still open

- Which of A / B / C the estate uses. This one is yours to call — it changes
  how Lifecheck and Supernova get built, so it is worth settling before that
  work starts rather than after.
- Where Hereld is hosted once it needs a server. Fortized's Render setup is the
  obvious precedent.
- Whether `www.swiftaw.com` and the apex stay as they are. Nothing here touches
  them, and nothing here should.
