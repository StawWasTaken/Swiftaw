-- Does the icon service refuse what it says it refuses?
--
-- Two halves. The first is icon_check_svg, which is the only thing standing
-- between a pasted file and other people's websites, so every refusal is proven
-- to bite and a clean file is proven to still get through. The second is the
-- rank check, proven at each rank rather than only at the one that is allowed:
-- a gate only tested from outside might be refusing everybody.

\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on
\pset format unaligned

create or replace function pg_temp.ok(label text, got boolean) returns void
language plpgsql as $$
begin
  if got then raise notice 'pass  %', label;
  else raise exception 'FAIL  %', label; end if;
end $$;

-- Did the file get in, and if not, does the reason name the thing that was
-- wrong with it? A refusal an admin cannot act on is half a refusal.
create or replace function pg_temp.refused(label text, svg text, needle text)
returns void language plpgsql as $$
declare r jsonb := public.icon_check_svg(svg);
begin
  if (r ->> 'ok')::boolean then
    raise exception 'FAIL  % (it was ACCEPTED)', label;
  elsif position(lower(needle) in lower(r ->> 'error')) = 0 then
    raise exception 'FAIL  % (refused, but the reason was "%")', label, r ->> 'error';
  else
    raise notice 'pass  %', label;
  end if;
end $$;

-- ── The clean cases ──────────────────────────────────────────────────────────
-- If only the refusals were tested, a function that refused everything would
-- score full marks.

do $$
declare r jsonb;
begin
  r := public.icon_check_svg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">' ||
    '<path d="M256 8C119 8 8 119 8 256z"/></svg>');
  perform pg_temp.ok('a plain icon is accepted',        (r ->> 'ok')::boolean);
  perform pg_temp.ok('the viewBox is read off the tag', r ->> 'view_box' = '0 0 512 512');
  perform pg_temp.ok('the body is the inside only',     r ->> 'body' = '<path d="M256 8C119 8 8 119 8 256z"/>');
  perform pg_temp.ok('one colour reads as monochrome',  (r ->> 'monochrome')::boolean);
end $$;

do $$
declare r jsonb;
begin
  -- No viewBox is common out of a drawing tool. Working one out from the size
  -- is the difference between an icon that scales and a file we cannot use.
  r := public.icon_check_svg('<svg width="24" height="24"><rect x="0" y="0" width="24" height="24"/></svg>');
  perform pg_temp.ok('no viewBox, worked out from the size', (r ->> 'ok')::boolean);
  perform pg_temp.ok('and it is the right box',              r ->> 'view_box' = '0 0 24 24');

  r := public.icon_check_svg('<svg viewBox="0,0,32,32"><circle cx="16" cy="16" r="8"/></svg>');
  perform pg_temp.ok('commas in the viewBox are normalised', r ->> 'view_box' = '0 0 32 32');

  -- A brand mark with its own colours cannot take the colour of the text
  -- around it, and the card has to know that before it offers a control.
  r := public.icon_check_svg('<svg viewBox="0 0 10 10"><path fill="#FF0033" d="M0 0h10z"/></svg>');
  perform pg_temp.ok('a coloured mark is accepted',      (r ->> 'ok')::boolean);
  perform pg_temp.ok('and is not called monochrome', not (r ->> 'monochrome')::boolean);

  r := public.icon_check_svg(
    '<svg viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/>' ||
    '</linearGradient></defs><path fill="url(#g)" d="M0 0h10z"/></svg>');
  perform pg_temp.ok('a gradient is allowed',            (r ->> 'ok')::boolean);
  perform pg_temp.ok('a gradient is not monochrome', not (r ->> 'monochrome')::boolean);

  -- A local url(#id) has to survive, or clip paths and gradients cannot work.
  r := public.icon_check_svg(
    '<svg viewBox="0 0 10 10"><defs><clipPath id="c"><rect x="0" y="0" width="5" height="5"/>' ||
    '</clipPath></defs><path clip-path="url(#c)" d="M0 0h10z"/></svg>');
  perform pg_temp.ok('a local url(#id) reference survives', (r ->> 'ok')::boolean);

  -- A comment is not markup. Stripping it must not make the file look guilty.
  r := public.icon_check_svg(
    '<svg viewBox="0 0 10 10"><!-- drawn by hand --><path d="M0 0h10z"/></svg>');
  perform pg_temp.ok('a comment is stripped, not punished', (r ->> 'ok')::boolean);
end $$;

-- ── The refusals ─────────────────────────────────────────────────────────────

select pg_temp.refused('a script tag',
  '<svg viewBox="0 0 10 10"><script>fetch("//x")</script><path d="M0 0h1z"/></svg>', 'script');

select pg_temp.refused('a script hiding after a comment',
  '<svg viewBox="0 0 10 10"><!-- nothing here --><script>x()</script></svg>', 'script');

select pg_temp.refused('an event handler',
  '<svg viewBox="0 0 10 10"><path onload="x()" d="M0 0h1z"/></svg>', 'event handler');

select pg_temp.refused('a javascript: value',
  '<svg viewBox="0 0 10 10"><path fill="javascript:x" d="M0 0h1z"/></svg>', 'javascript');

select pg_temp.refused('an external image',
  '<svg viewBox="0 0 10 10"><image href="https://x/y.png"/></svg>', 'tag we do not allow');

select pg_temp.refused('a use with a link',
  '<svg viewBox="0 0 10 10"><use xlink:href="#a"/></svg>', 'tag we do not allow');

select pg_temp.refused('a style tag',
  '<svg viewBox="0 0 10 10"><style>path{fill:red}</style><path d="M0 0h1z"/></svg>', 'tag we do not allow');

select pg_temp.refused('a style attribute',
  '<svg viewBox="0 0 10 10"><path style="fill:red" d="M0 0h1z"/></svg>', 'style attribute');

select pg_temp.refused('a foreignObject',
  '<svg viewBox="0 0 10 10"><foreignObject><b>x</b></foreignObject></svg>', 'tag we do not allow');

select pg_temp.refused('a fill pointing at another server',
  '<svg viewBox="0 0 10 10"><path fill="url(https://evil.example/a)" d="M0 0h1z"/></svg>', 'somewhere else');

select pg_temp.refused('a protocol-relative reference',
  '<svg viewBox="0 0 10 10"><path fill="url(//evil.example/a)" d="M0 0h1z"/></svg>', 'somewhere else');

select pg_temp.refused('a doctype',
  '<!DOCTYPE svg><svg viewBox="0 0 10 10"><path d="M0 0h1z"/></svg>', 'doctype');

select pg_temp.refused('an entity declaration',
  '<!ENTITY x "y"><svg viewBox="0 0 10 10"><path d="M0 0h1z"/></svg>', 'doctype or an entity');

select pg_temp.refused('a CDATA block',
  '<svg viewBox="0 0 10 10"><![CDATA[x]]><path d="M0 0h1z"/></svg>', 'CDATA');

select pg_temp.refused('an animation tag',
  '<svg viewBox="0 0 10 10"><path d="M0 0h1z"><animate attributeName="x"/></path></svg>', 'tag we do not allow');

-- The message naming the tag is the point of these two. An admin who is told
-- only "rejected" has to guess which line to change.
select pg_temp.refused('an unknown tag, named in the reason',
  '<svg viewBox="0 0 10 10"><canvas/></svg>', '<canvas>');

select pg_temp.refused('an unknown attribute, named in the reason',
  '<svg viewBox="0 0 10 10"><path data-tracker="1" d="M0 0h1z"/></svg>', 'data-tracker');

select pg_temp.refused('not an SVG at all', '<html><body>hello</body></html>', 'not an SVG');
select pg_temp.refused('nothing at all',    '',                                'no file');
select pg_temp.refused('an empty SVG',      '<svg viewBox="0 0 10 10"></svg>', 'empty');
select pg_temp.refused('a nested SVG',
  '<svg viewBox="0 0 10 10"><svg viewBox="0 0 5 5"><path d="M0 0h1z"/></svg></svg>', 'nested');
select pg_temp.refused('no viewBox and no size',
  '<svg><path d="M0 0h1z"/></svg>', 'no viewBox');
select pg_temp.refused('a viewBox that is not four numbers',
  '<svg viewBox="0 0 10"><path d="M0 0h1z"/></svg>', 'four numbers');
select pg_temp.refused('a file too big to be an icon',
  '<svg viewBox="0 0 10 10"><path d="' || repeat('M0 0h1z', 20000) || '"/></svg>', '100 KB');

-- ── Who may write ────────────────────────────────────────────────────────────

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@x'),
  ('00000000-0000-0000-0000-00000000000b', 'admin@x'),
  ('00000000-0000-0000-0000-00000000000c', 'mod@x'),
  ('00000000-0000-0000-0000-00000000000d', 'nobody@x')
on conflict do nothing;

insert into public.profiles (id, username) values
  ('00000000-0000-0000-0000-00000000000a', 'swiftaw'),
  ('00000000-0000-0000-0000-00000000000b', 'someadmin'),
  ('00000000-0000-0000-0000-00000000000c', 'somemod'),
  ('00000000-0000-0000-0000-00000000000d', 'astranger')
on conflict do nothing;

insert into public.swiftaw_staff (id, rank) values
  ('00000000-0000-0000-0000-00000000000b', 'admin'),
  ('00000000-0000-0000-0000-00000000000c', 'moderator')
on conflict (id) do update set rank = excluded.rank;

do $$
begin
  perform pg_temp.ok('a stranger has no rank',
    public.swiftaw_rank('00000000-0000-0000-0000-00000000000d') = 0);
  perform pg_temp.ok('a moderator is rank 1',
    public.swiftaw_rank('00000000-0000-0000-0000-00000000000c') = 1);
  perform pg_temp.ok('an admin is rank 2',
    public.swiftaw_rank('00000000-0000-0000-0000-00000000000b') = 2);
  -- The fallback that makes the service work before anyone edits the roster.
  perform pg_temp.ok('the swiftaw account is superadmin without a roster row',
    public.swiftaw_rank('00000000-0000-0000-0000-00000000000a') = 3);
  perform pg_temp.ok('nobody signed in is nobody',
    public.swiftaw_rank(null) = 0);
end $$;

-- ── The gate on the writes ───────────────────────────────────────────────────
-- Refused twice from below and allowed once from the right rank, per function.
-- This is the rule that a moderator typing the upload URL gets stopped by the
-- database rather than by a missing button.

create or replace function pg_temp.tried(label text, uid text, sql text, want_fail boolean)
returns void language plpgsql as $$
declare failed boolean := false;
begin
  perform set_config('swiftaw.uid', uid, true);
  begin execute sql; exception when others then failed := true; end;
  if failed = want_fail then raise notice 'pass  %', label;
  else raise exception 'FAIL  % (it %)', label,
    case when failed then 'was refused' else 'went through' end;
  end if;
end $$;

\set ICON '''<svg viewBox="0 0 512 512"><path d="M0 0h1z"/></svg>'''

select pg_temp.tried('a stranger cannot add an icon',
  '00000000-0000-0000-0000-00000000000d',
  'select icon_upsert(''a'', ''A'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || ')', true);

select pg_temp.tried('a moderator cannot add an icon',
  '00000000-0000-0000-0000-00000000000c',
  'select icon_upsert(''a'', ''A'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || ')', true);

select pg_temp.tried('an admin can add an icon',
  '00000000-0000-0000-0000-00000000000b',
  'select icon_upsert(''a'', ''A'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || ')', false);

select pg_temp.tried('an admin cannot delete an icon',
  '00000000-0000-0000-0000-00000000000b', 'select icon_delete(''a'')', true);

select pg_temp.tried('a superadmin can delete an icon',
  '00000000-0000-0000-0000-00000000000a', 'select icon_delete(''a'')', false);

select pg_temp.tried('a category has to exist',
  '00000000-0000-0000-0000-00000000000b',
  'select icon_upsert(''b'', ''B'', ''no-such-category'', ''{}''::text[], ' || :'ICON' || ')', true);

select pg_temp.tried('a bad slug is refused',
  '00000000-0000-0000-0000-00000000000b',
  'select icon_upsert(''Not A Slug'', ''B'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || ')', true);

select pg_temp.tried('a hostile file is refused at the write, not only in the check',
  '00000000-0000-0000-0000-00000000000b',
  'select icon_upsert(''c'', ''C'', ''brand-marks'', ''{}''::text[], ' ||
  '''<svg viewBox="0 0 10 10"><script>x()</script></svg>'')', true);

-- ── Moving an icon ───────────────────────────────────────────────────────────
-- The address is what a published icon is found by, so a move is proved to
-- actually move it, and proved not to eat the icon already sitting on the
-- address it is moved onto.

-- The file is run more than once against the same database, and a move leaves
-- its icon behind at the new address.
delete from icons where slug like 'mv-%';

select pg_temp.tried('setting up two icons to move between',
  '00000000-0000-0000-0000-00000000000b',
  'select icon_upsert(''mv-one'', ''One'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || '), ' ||
  '       icon_upsert(''mv-two'', ''Two'', ''brand-marks'', ''{}''::text[], ' || :'ICON' || ')', false);

select pg_temp.tried('a moderator cannot move an icon',
  '00000000-0000-0000-0000-00000000000c', 'select icon_rename(''mv-one'', ''mv-three'')', true);

select pg_temp.tried('a move onto a taken address is refused',
  '00000000-0000-0000-0000-00000000000b', 'select icon_rename(''mv-one'', ''mv-two'')', true);

select pg_temp.tried('a move onto a bad address is refused',
  '00000000-0000-0000-0000-00000000000b', 'select icon_rename(''mv-one'', ''Not A Slug'')', true);

select pg_temp.tried('an admin can move an icon',
  '00000000-0000-0000-0000-00000000000b', 'select icon_rename(''mv-one'', ''mv-three'')', false);

select pg_temp.ok('the icon is at its new address and not its old one',
  (select count(*) = 1 from icons where slug = 'mv-three')
  and (select count(*) = 0 from icons where slug = 'mv-one'));

select pg_temp.ok('the icon it was moved past is untouched',
  (select name = 'Two' from icons where slug = 'mv-two'));

select pg_temp.tried('an admin can unpublish',
  '00000000-0000-0000-0000-00000000000b', 'select icon_set_published(''mv-two'', false)', false);

select pg_temp.tried('a stranger cannot unpublish',
  '00000000-0000-0000-0000-00000000000d', 'select icon_set_published(''mv-two'', true)', true);

-- ── What lands in the row ────────────────────────────────────────────────────

do $$
declare r record;
begin
  perform set_config('swiftaw.uid', '00000000-0000-0000-0000-00000000000b', true);
  perform icon_upsert('rainbaw-mark', 'Rainbaw mark', 'brand-marks',
    array['brand', 'logo'],
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">' ||
    '<path d="M0 0h48z"/></svg>', true);

  select * into r from public.icons where slug = 'rainbaw-mark';
  perform pg_temp.ok('the root tag is thrown away',   r.body = '<path d="M0 0h48z"/>');
  perform pg_temp.ok('the viewBox is kept',           r.view_box = '0 0 48 48');
  perform pg_temp.ok('the uploader is recorded',      r.uploaded_by = '00000000-0000-0000-0000-00000000000b');
  perform pg_temp.ok('published because it was told to', r.published);
  -- Search is a substring match on one column, so the tags have to be in it or
  -- looking for "logo" finds nothing.
  perform pg_temp.ok('the tags are searchable',       r.search like '%logo%');
  perform pg_temp.ok('the name is searchable',        r.search like '%rainbaw%');

  -- Same slug twice replaces rather than duplicating, or a fixed icon becomes a
  -- second icon and the library grows copies.
  perform icon_upsert('rainbaw-mark', 'Rainbaw mark v2', 'brand-marks', array['brand'],
    '<svg viewBox="0 0 48 48"><path d="M1 1h46z"/></svg>', true);
  perform pg_temp.ok('uploading the same slug replaces it',
    (select count(*) from public.icons where slug = 'rainbaw-mark') = 1);
  perform pg_temp.ok('and it is the new one',
    (select name from public.icons where slug = 'rainbaw-mark') = 'Rainbaw mark v2');
end $$;

-- ── Reading ──────────────────────────────────────────────────────────────────
-- A draft is not public. The read policy is the only thing enforcing that,
-- because the table is granted to anon for the published ones.

do $$
declare n int;
begin
  perform set_config('swiftaw.uid', '00000000-0000-0000-0000-00000000000b', true);
  perform icon_upsert('a-draft', 'A draft', 'interface', '{}'::text[],
    '<svg viewBox="0 0 10 10"><path d="M0 0h1z"/></svg>', false);

  -- Signed out is two things at once: the anon role, and no auth.uid(). Leaving
  -- the uid set would have this pass as the admin who just uploaded the draft.
  perform set_config('swiftaw.uid', '', true);
  set local role anon;
  select count(*) into n from public.icons;
  set local role postgres;
  perform pg_temp.ok('a signed-out visitor sees only what is published', n = 1);
end $$;

-- ── The grants ───────────────────────────────────────────────────────────────
-- A new function is granted EXECUTE to PUBLIC, and revoking from anon and
-- authenticated does not take that away. Only revoking from public does, so
-- what is checked here is the absence of the PUBLIC entry itself: in proacl a
-- leading "=X/" with no role name in front of it is PUBLIC holding execute.

do $$
declare f text; bad text := '';
begin
  foreach f in array array['icon_upsert', 'icon_delete', 'icon_rename', 'icon_set_published',
                           'icon_category_upsert', 'icon_my_rank',
                           'icon_check_svg', 'swiftaw_rank']
  loop
    if exists (
      select 1 from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = f
        and array_to_string(coalesce(p.proacl, '{}'), ' ') ~ '(^| )=[a-zA-Z]*X'
    ) then bad := bad || f || ' '; end if;
  end loop;
  perform pg_temp.ok('no function is still executable by PUBLIC: ' || coalesce(nullif(bad, ''), 'none'),
                     bad = '');
end $$;

\echo 'all checks passed'
