-- Swiftaw Icons
-- Run once in the SQL editor of the Swiftaw Accounts project. Idempotent.
--
-- Holds the icon library: categories, the icons themselves, who may write one,
-- and the check that decides whether a given piece of SVG is allowed in at all.
--
-- The library serves Swiftaw's own icons only. Font Awesome stays a thing we
-- use inside our products and is not redistributed from here, so there is no
-- second licence in this schema and no column to record one.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Who may write
-- ─────────────────────────────────────────────────────────────────────────────
-- Swiftaw Accounts has no rank system yet; the only rule in the project is
-- is_support_staff, which is username = 'swiftaw'. Ranks belong to the account
-- work and are not being invented here, so this is a roster local to the icon
-- service: a row per staff account, a rank on it, and nothing seeded.

create table if not exists public.swiftaw_staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  rank       text not null check (rank in ('moderator', 'admin', 'superadmin')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.swiftaw_staff enable row level security;

-- Staff can see the roster. Nobody writes it from the client: adding staff is a
-- deliberate act done in the dashboard, which is the correct amount of friction
-- for the table that decides who can publish under our name.
drop policy if exists swiftaw_staff_read on public.swiftaw_staff;
create policy swiftaw_staff_read on public.swiftaw_staff
  for select to authenticated
  using (id = auth.uid());

grant select on public.swiftaw_staff to authenticated;

-- Rank as a number so callers can ask "at least admin" in one comparison.
--   0 nobody · 1 moderator · 2 admin · 3 superadmin
--
-- The username fallback is what makes the service work on the day it ships
-- without anyone hand-editing a table. It is also the single line to delete
-- when the real role system lands.
create or replace function public.swiftaw_rank(p_uid uuid)
returns int
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select case s.rank
              when 'superadmin' then 3
              when 'admin'      then 2
              when 'moderator'  then 1
            end
       from public.swiftaw_staff s where s.id = p_uid),
    (select 3 from public.profiles p
      where p.id = p_uid and lower(p.username) = 'swiftaw'),
    0
  );
$$;

revoke all on function public.swiftaw_rank(uuid) from public;
grant execute on function public.swiftaw_rank(uuid) to authenticated;

-- The same answer about the caller and nobody else. Two reasons it exists
-- rather than the page calling swiftaw_rank with a uuid: the upload screen asks
-- this before it draws anything, and the read policy on icons asks it on every
-- select, including for a signed-out visitor. Taking no argument means anon can
-- be given it without also being able to ask whether some other account is
-- staff.
create or replace function public.icon_my_rank()
returns int
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.swiftaw_rank(auth.uid()); $$;

revoke all on function public.icon_my_rank() from public;
grant execute on function public.icon_my_rank() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. The check on the SVG
-- ─────────────────────────────────────────────────────────────────────────────
-- These files get pasted into other people's websites. An SVG can carry script,
-- event handlers and references to somewhere else, so anything arriving here is
-- read as hostile until it proves otherwise.
--
-- It rejects rather than cleans. Cleaning means guessing what the author meant
-- and shipping the guess; rejecting means an admin sees the reason and fixes
-- the file. Rejection is also the only one of the two that cannot quietly
-- half-succeed.
--
-- Returns jsonb: { ok, error, view_box, body, monochrome }.
-- Body is the inside of the root tag. The root is thrown away deliberately, so
-- every icon in the library is drawn by the same wrapper at read time and none
-- of them can carry its own width, height or colour behaviour.

create or replace function public.icon_check_svg(p_svg text)
returns jsonb
language plpgsql
immutable
as $$
declare
  s        text := coalesce(p_svg, '');
  root     text;
  vb       text;
  body     text;
  w        text;
  h        text;
  tag      text;
  attr     text;
  m        record;
  ok_tags  text[] := array[
    'path','g','circle','ellipse','rect','line','polyline','polygon',
    'defs','clippath','mask','lineargradient','radialgradient','stop',
    'title','desc'
  ];
  ok_attrs text[] := array[
    'd','fill','fill-rule','fill-opacity','clip-rule','clip-path','mask',
    'stroke','stroke-width','stroke-linecap','stroke-linejoin',
    'stroke-miterlimit','stroke-dasharray','stroke-dashoffset','stroke-opacity',
    'opacity','transform','cx','cy','r','rx','ry','x','y','x1','y1','x2','y2',
    'width','height','points','id','offset','stop-color','stop-opacity',
    'gradientunits','gradienttransform','maskunits','clippathunits',
    'patternunits','fill-opacity','vector-effect'
  ];
begin
  if length(s) = 0 then
    return jsonb_build_object('ok', false, 'error', 'There is no file here.');
  end if;
  if length(s) > 100000 then
    return jsonb_build_object('ok', false, 'error',
      'Over 100 KB. An icon that size is a picture, not an icon.');
  end if;

  -- Comments, the XML declaration and a doctype are noise, and a doctype is
  -- also where an entity attack would be written. They go before anything is
  -- looked at, so nothing can hide inside one.
  s := regexp_replace(s, '<!--.*?-->', ' ', 'gs');
  s := regexp_replace(s, '<\?xml.*?\?>', ' ', 'gs');
  if s ~* '<!doctype' or s ~* '<!entity' then
    return jsonb_build_object('ok', false, 'error',
      'Carries a doctype or an entity declaration. Export it again without one.');
  end if;
  if s ~* '<!\[cdata\[' then
    return jsonb_build_object('ok', false, 'error', 'Carries a CDATA block.');
  end if;

  -- The named refusals. Each of these is a way for a file to run code or to
  -- fetch something from a server that is not ours once it is on a customer's
  -- page, which is the whole reason this function exists.
  if s ~* '<\s*script' then
    return jsonb_build_object('ok', false, 'error', 'Contains a script tag.');
  end if;
  if s ~* '<\s*(foreignobject|iframe|image|use|style|set|animate|animatetransform|animatemotion)\M' then
    return jsonb_build_object('ok', false, 'error',
      'Contains a tag we do not allow in an icon (script, style, image, use, foreignObject or an animation tag).');
  end if;
  if s ~* '\son[a-z]+\s*=' then
    return jsonb_build_object('ok', false, 'error',
      'Carries an event handler attribute.');
  end if;
  if s ~* '(javascript|data|vbscript)\s*:' then
    return jsonb_build_object('ok', false, 'error',
      'Carries a javascript:, data: or vbscript: value.');
  end if;
  if s ~* '(xlink:href|\shref\s*=)' then
    return jsonb_build_object('ok', false, 'error', 'Carries a link reference.');
  end if;
  if s ~* 'url\s*\(\s*[''"]?\s*(https?:)?//' then
    return jsonb_build_object('ok', false, 'error',
      'Points at a file somewhere else. An icon has to be self-contained.');
  end if;
  if s ~* '\sstyle\s*=' then
    return jsonb_build_object('ok', false, 'error',
      'Uses a style attribute. Use presentation attributes instead.');
  end if;

  root := substring(s from '<svg[^>]*>');
  if root is null then
    return jsonb_build_object('ok', false, 'error', 'This is not an SVG file.');
  end if;

  -- One viewBox convention, taken from the file or worked out from its size.
  -- Without one the icon cannot be scaled by the page it lands on, which is the
  -- single thing every icon in a library has to be able to do.
  vb := substring(root from 'viewBox\s*=\s*"\s*([^"]+?)\s*"');
  if vb is null then
    vb := substring(root from 'viewbox\s*=\s*"\s*([^"]+?)\s*"');
  end if;
  if vb is null then
    w := substring(root from 'width\s*=\s*"\s*([0-9.]+)');
    h := substring(root from 'height\s*=\s*"\s*([0-9.]+)');
    if w is null or h is null then
      return jsonb_build_object('ok', false, 'error',
        'No viewBox, and no width and height to work one out from.');
    end if;
    vb := '0 0 ' || w || ' ' || h;
  end if;
  vb := regexp_replace(btrim(vb), '[\s,]+', ' ', 'g');
  if vb !~ '^-?[0-9.]+ -?[0-9.]+ [0-9.]+ [0-9.]+$' then
    return jsonb_build_object('ok', false, 'error',
      'The viewBox is not four numbers: ' || vb);
  end if;

  body := substring(s from position(root in s) + length(root));
  body := regexp_replace(body, '</\s*svg\s*>\s*$', '', 'i');
  body := btrim(body);
  if body = '' then
    return jsonb_build_object('ok', false, 'error', 'The SVG is empty.');
  end if;
  if body ~* '<\s*svg' then
    return jsonb_build_object('ok', false, 'error',
      'Contains a nested SVG. Flatten it first.');
  end if;

  -- Everything left has to be on the list. Anything that is not gets named in
  -- the message, because "rejected" with no reason is a message an admin
  -- cannot act on.
  for m in
    select (regexp_matches(body, '<\s*/?\s*([a-zA-Z][a-zA-Z0-9:-]*)', 'g'))[1] as t
  loop
    tag := lower(m.t);
    if not (tag = any (ok_tags)) then
      return jsonb_build_object('ok', false, 'error',
        'Contains a <' || tag || '> tag, which is not one we allow.');
    end if;
  end loop;

  for m in
    select (regexp_matches(body, '[\s"''](?:[a-zA-Z]+:)?([a-zA-Z][a-zA-Z0-9-]*)\s*=', 'g'))[1] as a
  loop
    attr := lower(m.a);
    if not (attr = any (ok_attrs)) then
      return jsonb_build_object('ok', false, 'error',
        'Uses the attribute "' || attr || '", which is not one we allow.');
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'error', null,
    'view_box', vb,
    'body', body,
    -- A single-colour icon takes the colour of the text around it. A brand mark
    -- with its own colours in it does not, and saying so is what lets the card
    -- turn the colour control off honestly instead of offering a control that
    -- would do nothing.
    'monochrome', (body !~* '(fill|stroke|stop-color)\s*=\s*"\s*(#|rgb|hsl)'
                   and body !~* '<\s*(linear|radial)gradient')
  );
end;
$$;

revoke all on function public.icon_check_svg(text) from public;
grant execute on function public.icon_check_svg(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. The tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.icon_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null check (length(btrim(name)) between 1 and 60),
  position   int  not null default 100,
  created_at timestamptz not null default now()
);

-- A shelf carries a mark of its own. It is stored the same way an icon is,
-- body and box, because it goes through the same gate and is drawn by the same
-- code. Where it came from is written down next to it: a shelf mark may be one
-- of ours or one of FontAwesome's, and only ours are ever handed out, so the
-- two must not become indistinguishable once they are both just a path.
alter table public.icon_categories
  add column if not exists icon_body     text not null default '',
  add column if not exists icon_view_box text not null default '0 0 24 24',
  add column if not exists icon_source   text not null default '';

create table if not exists public.icons (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (length(btrim(name)) between 1 and 80),
  category_id uuid references public.icon_categories(id) on delete restrict,
  tags        text[] not null default '{}',
  -- The inside of the SVG. The wrapper is drawn by the page, so every icon in
  -- the library behaves the same way in the same box.
  body        text not null,
  view_box    text not null,
  monochrome  boolean not null default true,
  published   boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One column to match against, so a search is one index lookup rather than an
-- or across three. Filled by the trigger below rather than generated, because
-- array_to_string is only stable and a generated column will not take it.
alter table public.icons add column if not exists search text not null default '';

create index if not exists icons_recent_idx    on public.icons (created_at desc);
create index if not exists icons_category_idx  on public.icons (category_id, created_at desc);

-- Search is a substring match, which no plain index can serve, so it wants
-- trigrams. If the extension is not available the index is skipped rather than
-- the whole script failing: search still works, it just scans, and a library
-- this size will not notice for a long while.
do $$
begin
  create extension if not exists pg_trgm;
  create index if not exists icons_search_idx on public.icons using gin (search gin_trgm_ops);
exception when others then
  raise notice 'pg_trgm not available, icons_search_idx skipped';
end $$;

create or replace function public.icons_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.search := lower(new.name) || ' ' || new.slug || ' ' ||
                lower(coalesce(array_to_string(new.tags, ' '), ''));
  return new;
end;
$$;

drop trigger if exists icons_touch_t on public.icons;
create trigger icons_touch_t before insert or update on public.icons
  for each row execute function public.icons_touch();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Reading
-- ─────────────────────────────────────────────────────────────────────────────
-- Published icons are public: the whole point is that a stranger can take one
-- without an account. An unpublished one is a draft and only staff see it.

alter table public.icon_categories enable row level security;
alter table public.icons           enable row level security;

drop policy if exists icon_categories_read on public.icon_categories;
create policy icon_categories_read on public.icon_categories
  for select to anon, authenticated using (true);

drop policy if exists icons_read on public.icons;
create policy icons_read on public.icons
  for select to anon, authenticated
  using (published or public.icon_my_rank() >= 1);

-- No insert, update or delete policy on either table, on purpose. Every write
-- goes through the functions below, which is where the rank is checked.
grant select on public.icon_categories to anon, authenticated;
grant select on public.icons           to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Writing
-- ─────────────────────────────────────────────────────────────────────────────
-- Each of these re-reads the caller's rank from the database. Hiding the upload
-- screen from a moderator is a courtesy; this is the part that actually stops
-- them, whatever URL they type.

create or replace function public.icon_upsert(
  p_slug     text,
  p_name     text,
  p_category text,
  p_tags     text[],
  p_svg      text,
  p_publish  boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rank int := public.swiftaw_rank(auth.uid());
  v_cat  uuid;
  v_chk  jsonb;
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_id   uuid;
begin
  if v_rank < 2 then
    raise exception 'Only an admin can add an icon.' using errcode = '42501';
  end if;

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The name in the URL has to be lowercase letters, numbers and dashes.'
      using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception 'Give the icon a name.' using errcode = '22023';
  end if;

  select id into v_cat from public.icon_categories where slug = lower(btrim(p_category));
  if v_cat is null then
    raise exception 'No category called "%".', p_category using errcode = '22023';
  end if;

  v_chk := public.icon_check_svg(p_svg);
  if not (v_chk ->> 'ok')::boolean then
    raise exception '%', v_chk ->> 'error' using errcode = '22023';
  end if;

  insert into public.icons
    (slug, name, category_id, tags, body, view_box, monochrome, published, uploaded_by)
  values (
    v_slug,
    btrim(p_name),
    v_cat,
    coalesce(p_tags, '{}'),
    v_chk ->> 'body',
    v_chk ->> 'view_box',
    (v_chk ->> 'monochrome')::boolean,
    coalesce(p_publish, false),
    auth.uid()
  )
  on conflict (slug) do update set
    name        = excluded.name,
    category_id = excluded.category_id,
    tags        = excluded.tags,
    body        = excluded.body,
    view_box    = excluded.view_box,
    monochrome  = excluded.monochrome,
    published   = excluded.published
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'slug', v_slug,
                            'monochrome', (v_chk ->> 'monochrome')::boolean);
end;
$$;

create or replace function public.icon_set_published(p_slug text, p_on boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.swiftaw_rank(auth.uid()) < 2 then
    raise exception 'Only an admin can publish an icon.' using errcode = '42501';
  end if;
  update public.icons set published = coalesce(p_on, false) where slug = lower(btrim(p_slug));
  return found;
end;
$$;

-- Editing an existing icon is icon_upsert again, because it is keyed on the
-- address. That leaves one thing it cannot do: change the address. Doing it
-- through the upsert would write a second icon and leave the first one
-- standing, so moving one is its own operation, and it refuses an address
-- something else already holds instead of quietly replacing that icon.
create or replace function public.icon_rename(p_from text, p_to text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from text := lower(btrim(coalesce(p_from, '')));
  v_to   text := lower(btrim(coalesce(p_to, '')));
begin
  if public.swiftaw_rank(auth.uid()) < 2 then
    raise exception 'Only an admin can change an icon.' using errcode = '42501';
  end if;
  if v_to !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The name in the URL has to be lowercase letters, numbers and dashes.'
      using errcode = '22023';
  end if;
  if v_from = v_to then
    return true;
  end if;
  if exists (select 1 from public.icons where slug = v_to) then
    raise exception 'There is already an icon at "%".', v_to using errcode = '23505';
  end if;
  update public.icons set slug = v_to where slug = v_from;
  return found;
end;
$$;

-- Deleting is the one that cannot be undone, so it sits a rank higher than
-- adding. An admin who wants an icon gone can unpublish it.
create or replace function public.icon_delete(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.swiftaw_rank(auth.uid()) < 3 then
    raise exception 'Only a superadmin can delete an icon. Unpublish it instead.'
      using errcode = '42501';
  end if;
  delete from public.icons where slug = lower(btrim(p_slug));
  return found;
end;
$$;

-- The older three-argument shape has to go before the wider one lands, or both
-- exist at once and a call naming only the three is ambiguous rather than
-- resolved by the defaults.
drop function if exists public.icon_category_upsert(text, text, int);

create or replace function public.icon_category_upsert(
  p_slug text, p_name text, p_position int default 100,
  p_icon text default null, p_icon_source text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id    uuid;
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_check jsonb;
  v_body  text := '';
  v_vb    text := '0 0 24 24';
  v_src   text := '';
begin
  if public.swiftaw_rank(auth.uid()) < 2 then
    raise exception 'Only an admin can add a category.' using errcode = '42501';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The name in the URL has to be lowercase letters, numbers and dashes.'
      using errcode = '22023';
  end if;

  -- Three answers, not two. No icon argument at all means the caller is saving
  -- a name or an order and the mark is none of its business; an empty one means
  -- take the mark off. Without that split, renaming a shelf from the list would
  -- quietly strip the mark somebody chose for it.
  if p_icon is not null and btrim(p_icon) <> '' then
    v_check := public.icon_check_svg(p_icon);
    if not coalesce((v_check->>'ok')::boolean, false) then
      raise exception '%', coalesce(v_check->>'error', 'That file was refused.')
        using errcode = '22023';
    end if;
    v_body := v_check->>'body';
    v_vb   := v_check->>'view_box';
    v_src  := left(btrim(coalesce(p_icon_source, '')), 80);
  end if;

  insert into public.icon_categories
    (slug, name, position, icon_body, icon_view_box, icon_source)
  values
    (v_slug, btrim(p_name), coalesce(p_position, 100), v_body, v_vb, v_src)
  on conflict (slug) do update set
    name          = excluded.name,
    position      = excluded.position,
    icon_body     = case when p_icon is null
                    then icon_categories.icon_body     else excluded.icon_body end,
    icon_view_box = case when p_icon is null
                    then icon_categories.icon_view_box else excluded.icon_view_box end,
    icon_source   = case when p_icon is null
                    then icon_categories.icon_source   else excluded.icon_source end
  returning id into v_id;
  return v_id;
end;
$$;

-- revoke ... from anon, authenticated does not take EXECUTE away from PUBLIC,
-- and PUBLIC is what a new function is granted to. from public is the one that
-- closes it, so it is written first every time.
revoke all on function public.icon_upsert(text, text, text, text[], text, boolean) from public;
revoke all on function public.icon_set_published(text, boolean)                    from public;
revoke all on function public.icon_rename(text, text)                              from public;
revoke all on function public.icon_delete(text)                                    from public;
revoke all on function public.icon_category_upsert(text, text, int, text, text)    from public;

grant execute on function public.icon_upsert(text, text, text, text[], text, boolean) to authenticated;
grant execute on function public.icon_set_published(text, boolean)                    to authenticated;
grant execute on function public.icon_rename(text, text)                              to authenticated;
grant execute on function public.icon_delete(text)                                    to authenticated;
grant execute on function public.icon_category_upsert(text, text, int, text, text)    to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. The categories to start with
-- ─────────────────────────────────────────────────────────────────────────────
-- Categories are data, not a list in the code, so these are a starting set and
-- not a limit. Brand icons lead because they are the ones nobody else has.
--
-- Eight of these wear a mark drawn by Swiftaw, which is the first half of the
-- rule: look through ours first. The drawings are long, so they are set by
-- 2026-09-05-swiftaw-icon-category-marks.sql rather than inline here, and the
-- shelves are seeded bare below so that file has something to land on. Five
-- wear a FontAwesome mark, which is the second half of the rule: ours had
-- nothing that fits. Two are left with no mark at all rather than given
-- something that nearly does.
--
-- A shelf with no mark of its own borrows its first published icon, which is
-- what icon_category_list below is for. The lettered tile is the last resort,
-- for a shelf that is both unmarked and empty.
--
-- do update ... where the mark is still empty: re-running this fills a gap and
-- never argues with a mark somebody has since chosen.

-- Two shelves were named before Swiftaw named them. Renaming in place keeps
-- every icon already filed on them, where a second insert would build a second
-- shelf beside the first. Guarded so it cannot collide with a rename already
-- done, which is what makes this file safe to run twice.
update public.icon_categories c set slug = 'brand-icons', name = 'Brand icons'
 where c.slug = 'brand-marks'
   and not exists (select 1 from public.icon_categories x where x.slug = 'brand-icons');
update public.icon_categories c set slug = 'users', name = 'Users'
 where c.slug = 'people'
   and not exists (select 1 from public.icon_categories x where x.slug = 'users');

insert into public.icon_categories (slug, name, position, icon_body, icon_view_box, icon_source) values
  ('brand-icons',    'Brand icons',    10, '', '0 0 24 24', ''),
  ('users',          'Users',          40, '', '0 0 24 24', ''),
  ('emojis',         'Emojis',         50, '', '0 0 24 24', ''),
  ('editing',        'Editing',        70, '', '0 0 24 24', ''),
  ('gaming',         'Gaming',         80, '', '0 0 24 24', ''),
  ('interface',      'Interface',      20,
   '<path d="M0 55.2L0 426c0 12.2 9.9 22 22 22 6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L179.8 320l118.4 0c12.2 0 22.1-9.9 22.1-22.1 0-6.3-2.7-12.3-7.4-16.5L38.6 37.9C34.3 34.1 28.9 32 23.2 32 10.4 32 0 42.4 0 55.2z"/>',
   '0 0 320 512', 'fontawesome'),
  ('communication',  'Communication',  30,
   '<path d="M512 240c0 114.9-114.6 208-256 208-37.1 0-72.3-6.4-104.1-17.9-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9s-1.1-12.9 3.4-17.4c.4-.4 .8-.8 1.3-1.3 2.5-2.6 6.1-6.5 10.2-11.5 8.2-10.1 17.9-24.4 23.7-40.7C14.6 366.4 0 304.6 0 240 0 125.1 114.6 32 256 32s256 93.1 256 208zM128 208a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm128 0a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/>',
   '0 0 512 512', 'fontawesome'),
  ('alert',          'Alert',         100,
   '<path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32z"/>',
   '0 0 512 512', 'fontawesome'),
  ('accessibility',  'Accessibility', 120, '', '0 0 24 24', ''),
  ('coding',         'Coding',       110,
   '<path d="M80 104a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm80-24c0 32.8-19.7 61-48 73.3l0 87.8c18.8-10.9 40.7-17.1 64-17.1l96 0c35.3 0 64-28.7 64-64l0-6.7C307.7 141 288 112.8 288 80c0-44.2 35.8-80 80-80s80 35.8 80 80c0 32.8-19.7 61-48 73.3l0 6.7c0 70.7-57.3 128-128 128l-96 0c-35.3 0-64 28.7-64 64l0 6.7c28.3 12.3 48 40.5 48 73.3c0 44.2-35.8 80-80 80s-80-35.8-80-80c0-32.8 19.7-61 48-73.3l0-241.4C51.7 141 32 112.8 32 80C32 35.8 67.8 0 112 0s80 35.8 80 80zM80 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48zM368 104a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/>',
   '0 0 448 512', 'fontawesome'),
  ('business',       'Business',      90, '', '0 0 24 24', ''),
  ('buildings',      'Buildings',    140, '', '0 0 24 24', ''),
  ('construction',   'Construction',  150, '', '0 0 24 24', ''),
  ('astronomy',      'Astronomy',    130,
   '<path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>',
   '0 0 576 512', 'fontawesome'),
  ('media',          'Media',         60, '', '0 0 24 24', '')
on conflict (slug) do update set
  icon_body     = excluded.icon_body,
  icon_view_box = excluded.icon_view_box,
  icon_source   = excluded.icon_source
where icon_categories.icon_body = '' and excluded.icon_body <> '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Reading the shelves
-- ─────────────────────────────────────────────────────────────────────────────
-- A shelf that has not been given a mark wears its first icon instead. That is
-- nearly always the right picture: the first thing filed on a shelf is what
-- somebody thought the shelf was for.
--
-- It is resolved here rather than on the page so the rail and the manage screen
-- cannot come to different answers about what a shelf looks like, and so it
-- costs one round trip instead of one per bare shelf.
--
-- Invoker rights, not security definer, so the read policy on icons still
-- applies: a visitor borrows from the published icons only, and a draft can
-- never become the face of a shelf on the public rail.
--
-- mark_from is the honest part. "chosen" is a mark somebody picked, "first" is
-- one being borrowed, "none" is a shelf that is both unmarked and empty. The
-- manage screen needs that difference to count what is still waiting, and the
-- picker needs it to know whether there is a mark to take off.

create or replace function public.icon_category_list()
returns table (
  id            uuid,
  slug          text,
  name          text,
  -- Quoted: position is reserved in a parameter list, though not in a column
  -- definition, so the table above takes it bare and this one cannot.
  "position"    int,
  icon_body     text,
  icon_view_box text,
  icon_source   text,
  mark_body     text,
  mark_view_box text,
  mark_from     text
)
language sql
stable
as $$
  select c.id, c.slug, c.name, c.position,
         c.icon_body, c.icon_view_box, c.icon_source,
         coalesce(nullif(c.icon_body, ''), f.body, '')                as mark_body,
         case when c.icon_body <> ''  then c.icon_view_box
              when f.body is not null then f.view_box
              else '' end                                             as mark_view_box,
         case when c.icon_body <> ''  then 'chosen'
              when f.body is not null then 'first'
              else 'none' end                                         as mark_from
    from public.icon_categories c
    left join lateral (
      select i.body, i.view_box
        from public.icons i
       where i.category_id = c.id
       order by i.created_at, i.slug
       limit 1
    ) f on true
   order by c.position, c.name;
$$;

revoke all on function public.icon_category_list() from public;
grant execute on function public.icon_category_list() to anon, authenticated;
