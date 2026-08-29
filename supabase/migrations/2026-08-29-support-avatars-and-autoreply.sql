-- ═══════════════════════════════════════════════════════════════════════════
--  SUPPORT, ROUND TWO
--
--  Two things on top of 2026-08-28-support-tickets.sql:
--
--    1. Opening a ticket now gets an immediate acknowledgement from the
--       Swiftaw account, so nobody is left wondering whether the form worked.
--       It is marked as automatic in the data, not only in its wording, so
--       the interface can label it and nobody mistakes it for a person.
--
--    2. Two read functions that carry the avatar of whoever wrote each line.
--       They exist because the profiles table is not necessarily readable row
--       by row from the browser, and a ticket list should not depend on that.
--       Both apply the same visibility rule as the policies: your own tickets,
--       or all of them if you are staff.
--
--  Safe to run more than once. Safe to run before or after the first file.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.support_messages
  add column if not exists automated boolean not null default false;

-- ── Who answers ──────────────────────────────────────────────────────────────
-- One place that knows which account is Swiftaw, so the acknowledgement and
-- is_support_staff can never end up pointing at different rows.

create or replace function public.support_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id from public.profiles p
   where lower(p.username) = 'swiftaw'
   limit 1;
$$;

revoke all on function public.support_staff_id() from public;
grant execute on function public.support_staff_id() to authenticated;

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
  v_staff uuid;
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
    -- md5 of random text rather than pgcrypto's gen_random_bytes: on hosted
    -- Postgres pgcrypto lives in the extensions schema, which is not on this
    -- function's search_path, so calling it here fails at runtime.
    v_ref := 'SWFT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.support_tickets t where t.ref = v_ref);
  end loop;

  insert into public.support_tickets
    (ref, user_id, username, reason, subject_kind, subject, title)
  values
    (v_ref, v_uid, v_name, p_reason, p_subject_kind, p_subject, p_title)
  returning support_tickets.id into v_id;

  insert into public.support_messages (ticket_id, author_id, from_staff, body)
  values (v_id, v_uid, false, p_body);

  -- The acknowledgement. It is written by the Swiftaw account, so it carries
  -- that name and avatar in the thread, and flagged automated so the interface
  -- can say plainly that no one has read it yet.
  --
  -- The status stays 'open'. Calling a ticket answered because a robot spoke
  -- would empty the word of meaning and hide real work from the queue.
  v_staff := public.support_staff_id();
  if v_staff is not null then
    insert into public.support_messages (ticket_id, author_id, from_staff, automated, body)
    values (
      v_id, v_staff, true, true,
      'Thanks for writing in. Your ticket is ' || v_ref || ' and it is now in our queue.' || E'\n\n' ||
      'This part is automatic, so nobody has read your message yet. A person will, ' ||
      'and the reply lands right here in this thread. We are a small team, so give ' ||
      'us a few days rather than a few minutes. Anything that looks like a security ' ||
      'problem jumps the queue.' || E'\n\n' ||
      'You can add to the ticket at any time by replying below.'
    );

    update public.support_tickets t
       set unread_user     = true,
           last_message_at = now()
     where t.id = v_id;
  end if;

  return query select v_id, v_ref;
end;
$$;

revoke all on function public.support_open_ticket(text, text, text, text, text) from public;
grant execute on function public.support_open_ticket(text, text, text, text, text) to authenticated;

-- ── Reading, with faces ──────────────────────────────────────────────────────

create or replace function public.support_list()
returns table (
  id              uuid,
  ref             text,
  username        text,
  avatar_url      text,
  reason          text,
  subject_kind    text,
  subject         text,
  title           text,
  status          text,
  created_at      timestamptz,
  last_message_at timestamptz,
  unread_user     boolean,
  unread_staff    boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id, t.ref, t.username, p.avatar_url, t.reason, t.subject_kind, t.subject,
         t.title, t.status, t.created_at, t.last_message_at, t.unread_user, t.unread_staff
    from public.support_tickets t
    left join public.profiles p on p.id = t.user_id
   where auth.uid() is not null
     and (t.user_id = auth.uid() or public.is_support_staff(auth.uid()))
   order by t.last_message_at desc
   limit 200;
$$;

revoke all on function public.support_list() from public;
grant execute on function public.support_list() to authenticated;

create or replace function public.support_thread(p_ticket uuid)
returns table (
  id         uuid,
  from_staff boolean,
  automated  boolean,
  username   text,
  avatar_url text,
  body       text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id, m.from_staff, m.automated, p.username, p.avatar_url, m.body, m.created_at
    from public.support_messages m
    left join public.profiles p on p.id = m.author_id
   where m.ticket_id = p_ticket
     and auth.uid() is not null
     and exists (
       select 1 from public.support_tickets t
        where t.id = p_ticket
          and (t.user_id = auth.uid() or public.is_support_staff(auth.uid()))
     )
   order by m.created_at;
$$;

revoke all on function public.support_thread(uuid) from public;
grant execute on function public.support_thread(uuid) to authenticated;
