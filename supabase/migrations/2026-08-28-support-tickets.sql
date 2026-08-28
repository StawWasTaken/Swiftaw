-- Support tickets for the Swiftaw contact page and the account inbox.
--
-- Everything a browser is allowed to do lives in a SECURITY DEFINER function
-- here. The tables carry read policies only, so there is no write path a client
-- can reach directly and no authorisation decision that depends on the page
-- hiding a button. Staff status is one thing: the caller's profiles.username is
-- exactly 'swiftaw', decided in the database against auth.uid().
--
-- Idempotent. Safe to run more than once.

create extension if not exists pgcrypto;

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  ref             text        not null unique,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  username        text        not null,
  reason          text        not null,
  subject_kind    text,
  subject         text,
  title           text        not null,
  status          text        not null default 'open',
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unread_user     boolean     not null default false,
  unread_staff    boolean     not null default true
);

create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.support_tickets(id) on delete cascade,
  author_id  uuid        not null references auth.users(id) on delete cascade,
  from_staff boolean     not null default false,
  body       text        not null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_reason_chk
    check (reason in ('product','service','collaboration','information','press','other'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_status_chk
    check (status in ('open','answered','closed'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_subject_chk
    check (
      (subject_kind is null and subject is null)
      or (subject_kind = 'product' and subject in ('fortized','hereld'))
      or (subject_kind = 'service' and subject in ('lifecheck','supernova'))
    );
exception when duplicate_object then null; end $$;

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, last_message_at desc);
create index if not exists support_tickets_staff_idx
  on public.support_tickets (status, last_message_at desc);
create index if not exists support_messages_ticket_idx
  on public.support_messages (ticket_id, created_at);

-- ── Who is staff ─────────────────────────────────────────────────────────────

create or replace function public.is_support_staff(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid and lower(p.username) = 'swiftaw'
  );
$$;

revoke all on function public.is_support_staff(uuid) from public;
grant execute on function public.is_support_staff(uuid) to authenticated;

-- ── Read policies ────────────────────────────────────────────────────────────

alter table public.support_tickets  enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists support_tickets_read on public.support_tickets;
create policy support_tickets_read on public.support_tickets
  for select to authenticated
  using (user_id = auth.uid() or public.is_support_staff(auth.uid()));

drop policy if exists support_messages_read on public.support_messages;
create policy support_messages_read on public.support_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id
        and (t.user_id = auth.uid() or public.is_support_staff(auth.uid()))
    )
  );

-- No insert, update or delete policy on either table, on purpose. Writes go
-- through the functions below.

grant select on public.support_tickets  to authenticated;
grant select on public.support_messages to authenticated;

-- ── Opening a ticket ─────────────────────────────────────────────────────────

create or replace function public.support_open_ticket(
  p_reason       text,
  p_subject_kind text,
  p_subject      text,
  p_title        text,
  p_body         text
)
returns table (id uuid, ref text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text;
  v_ref   text;
  v_id    uuid;
  v_today int;
begin
  if v_uid is null then
    raise exception 'You need to be signed in to open a ticket.';
  end if;

  select p.username into v_name from public.profiles p where p.id = v_uid;
  if v_name is null or length(trim(v_name)) = 0 then
    raise exception 'Set a Swiftaw ID on your account before opening a ticket.';
  end if;

  p_title := trim(coalesce(p_title, ''));
  p_body  := trim(coalesce(p_body, ''));
  if length(p_title) < 4  then raise exception 'Give the ticket a subject.'; end if;
  if length(p_title) > 140 then raise exception 'That subject is too long.'; end if;
  if length(p_body) < 20  then raise exception 'Tell us a bit more than that.'; end if;
  if length(p_body) > 8000 then raise exception 'That message is too long.'; end if;

  if p_reason not in ('product','service','collaboration','information','press','other') then
    raise exception 'Pick a reason.';
  end if;

  -- The subject pair is only meaningful for the two reasons that ask for it.
  if p_reason in ('product','service') then
    if p_subject_kind is null or p_subject is null then
      raise exception 'Tell us which one.';
    end if;
  else
    p_subject_kind := null;
    p_subject      := null;
  end if;

  select count(*) into v_today
    from public.support_tickets t
   where t.user_id = v_uid and t.created_at > now() - interval '24 hours';
  if v_today >= 8 then
    raise exception 'You have opened a lot of tickets today. Try again tomorrow.';
  end if;

  loop
    v_ref := 'SWFT-' || upper(encode(gen_random_bytes(3), 'hex'));
    exit when not exists (select 1 from public.support_tickets t where t.ref = v_ref);
  end loop;

  insert into public.support_tickets
    (ref, user_id, username, reason, subject_kind, subject, title)
  values
    (v_ref, v_uid, v_name, p_reason, p_subject_kind, p_subject, p_title)
  returning support_tickets.id into v_id;

  insert into public.support_messages (ticket_id, author_id, from_staff, body)
  values (v_id, v_uid, false, p_body);

  return query select v_id, v_ref;
end;
$$;

revoke all on function public.support_open_ticket(text, text, text, text, text) from public;
grant execute on function public.support_open_ticket(text, text, text, text, text) to authenticated;

-- ── Replying ─────────────────────────────────────────────────────────────────

create or replace function public.support_reply(p_ticket uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_staff boolean;
  v_owner uuid;
  v_stat  text;
  v_id    uuid;
begin
  if v_uid is null then raise exception 'Not signed in.'; end if;

  p_body := trim(coalesce(p_body, ''));
  if length(p_body) < 1    then raise exception 'Write something first.'; end if;
  if length(p_body) > 8000 then raise exception 'That message is too long.'; end if;

  select t.user_id, t.status into v_owner, v_stat
    from public.support_tickets t where t.id = p_ticket;
  if v_owner is null then raise exception 'That ticket does not exist.'; end if;

  v_staff := public.is_support_staff(v_uid);
  if not v_staff and v_owner <> v_uid then
    raise exception 'That ticket is not yours.';
  end if;
  if v_stat = 'closed' then
    raise exception 'That ticket is closed.';
  end if;

  insert into public.support_messages (ticket_id, author_id, from_staff, body)
  values (p_ticket, v_uid, v_staff, p_body)
  returning support_messages.id into v_id;

  update public.support_tickets t
     set last_message_at = now(),
         status       = case when v_staff then 'answered' else 'open' end,
         unread_user  = case when v_staff then true  else t.unread_user  end,
         unread_staff = case when v_staff then false else true end
   where t.id = p_ticket;

  return v_id;
end;
$$;

revoke all on function public.support_reply(uuid, text) from public;
grant execute on function public.support_reply(uuid, text) to authenticated;

-- ── Read receipts and closing ────────────────────────────────────────────────

create or replace function public.support_mark_read(p_ticket uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_staff boolean;
  v_owner uuid;
begin
  if v_uid is null then return; end if;
  select t.user_id into v_owner from public.support_tickets t where t.id = p_ticket;
  if v_owner is null then return; end if;

  v_staff := public.is_support_staff(v_uid);
  if v_staff then
    update public.support_tickets set unread_staff = false where id = p_ticket;
  elsif v_owner = v_uid then
    update public.support_tickets set unread_user = false where id = p_ticket;
  end if;
end;
$$;

revoke all on function public.support_mark_read(uuid) from public;
grant execute on function public.support_mark_read(uuid) to authenticated;

create or replace function public.support_set_status(p_ticket uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_status not in ('open','answered','closed') then
    raise exception 'Unknown status.';
  end if;

  select t.user_id into v_owner from public.support_tickets t where t.id = p_ticket;
  if v_owner is null then raise exception 'That ticket does not exist.'; end if;

  -- Staff can set anything. The person who opened it may close it, and reopen
  -- what they closed, but may not mark their own ticket answered.
  if not public.is_support_staff(v_uid) then
    if v_owner <> v_uid then raise exception 'That ticket is not yours.'; end if;
    if p_status = 'answered' then raise exception 'Only Swiftaw can do that.'; end if;
  end if;

  update public.support_tickets set status = p_status where id = p_ticket;
end;
$$;

revoke all on function public.support_set_status(uuid, text) from public;
grant execute on function public.support_set_status(uuid, text) to authenticated;
