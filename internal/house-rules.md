# House rules

Rules that hold across every project we own, not just this repository.
Swiftaw, Workstation, Lifecheck, Fortized, Hereld, Supernova.

## Icons

**Ours first. FontAwesome second. Nothing third.**

Before drawing or importing an icon anywhere, look through Swiftaw Icons.
If the set already has the mark you want, use that one. Only when nothing in
the set fits do you reach for FontAwesome.

The reason is not tidiness. Our set is the thing we hand out, and it only
grows if the people building on top of it keep noticing what is missing.
Reaching straight for FontAwesome every time means the set never fills in and
we end up shipping somebody else's drawing on every surface we own.

Two things follow from it:

- **Using is not distributing.** FontAwesome marks may sit on our pages. They
  are never handed out as part of Swiftaw Icons, never uploaded into the set,
  and never exported in a copy or a download from the library.
- **Write down which is which.** Anywhere a mark can come from either source,
  the source is stored next to it. `icon_categories.icon_source` does this for
  category marks: `swiftaw:<slug>` or `fontawesome`. Once both are just a path
  in a column, nothing else can tell them apart.

Where the rule is enforced by shape rather than by memory, keep it that way.
The category mark picker opens on our library, searchable, filling the dialog;
the paste box for a FontAwesome mark is underneath, behind a line. Reaching the
second option takes a deliberate scroll past the first.

**Never invent path data.** If you cannot reach the real drawing, leave the
slot empty and say so. A made-up path draws garbage, and garbage that renders
is worse than a gap that does not.

## Writing

No em dashes. Ever. Use a plain hyphen.

No filler, no slogans that could belong to any company, no invented numbers,
customers, testimonials, partnerships, awards or capabilities. If a thing is
not built, the copy does not say it is.

## Secrets

Service keys, admin credentials and private API keys never appear in
client-side code. Privileged work happens server-side and is permission
checked there. Hiding a button is not a permission.
