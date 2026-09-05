# Running the Swiftaw schema locally

Supabase is not reachable from where the code is written, so a migration gets
proven against a local Postgres before it is handed over to be run in the
dashboard. Nothing here runs in production; it exists so that "it loads" and "it
does what it says" are two separate claims.

## Once

```
initdb -D ~/swiftaw-pg
pg_ctl -D ~/swiftaw-pg -o '-p 5433' -l ~/swiftaw-pg.log start
```

## Every time

```
./supabase/tests/load.sh
psql -h /var/run/postgresql -p 5433 -U postgres -d swiftaw -f supabase/tests/icons.sql
```

`load.sh` drops and recreates the database, loads `00-stubs.sql`, then loads the
migrations in order and reports per file. `00-stubs.sql` is the smallest amount
of Supabase that makes the schema loadable: an `auth.users` table, an
`auth.uid()` that reads a session setting so a test can say who it is acting as,
the three Supabase roles, and the `profiles` table the icon service reads for
its username fallback. It is not a reimplementation of Supabase and should not
grow into one.

To act as somebody in a test:

```sql
select set_config('swiftaw.uid', '00000000-0000-0000-0000-00000000000b', true);
```

Signed out is two things and both have to be set, or a test passes as whoever
went last: `set_config('swiftaw.uid', '', true)` **and** `set local role anon`.

## What the test files are for

`icons.sql` covers the two parts of the icon service that would be expensive to
get wrong.

The first is `icon_check_svg`. It is the only thing between a pasted file and
other people's websites, so every refusal it claims is proven to actually
refuse, and the reason it gives is checked for naming the thing that was wrong:
a rejection an admin cannot act on is half a rejection. Clean files are tested
too, because a function that refused everything would otherwise score full
marks.

The second is the rank check. Each gate is tried from below and from the rank
that is meant to pass, for the same reason: a gate only tested from outside
might be refusing everybody.

**A gate you only prove in one direction is not proved.** If you add a check,
add both halves of it.

## The grants check, and why it is written the way it is

A new function is granted `EXECUTE` to `PUBLIC`. `revoke ... from anon,
authenticated` does **not** take that away, so a function can look locked down
and be callable by anyone. Only `revoke ... from public` closes it.

The last block in `icons.sql` reads `pg_proc.proacl` and fails if any of the
service's functions still carries a PUBLIC execute entry, which in an ACL is a
`=X/owner` entry with no role name in front of the `=`.
