alter table public.parlays add column starts_at timestamptz;
alter table public.parlays add constraint parlays_kickoff_date_check
    check (starts_at is null or (starts_at at time zone 'America/New_York')::date = game_date);
create index parlays_reminder_kickoff_idx on public.parlays(starts_at)
    where status in ('upcoming', 'open');

-- A separate ledger keeps reminder retries independent of game-lock emails.
create table public.pick_reminders (
    id uuid primary key default gen_random_uuid(),
    parlay_id uuid not null references public.parlays(id) on delete cascade,
    recipient_user_id uuid not null references public.profiles(id) on delete cascade,
    kind text not null check (kind in ('morning', 'kickoff')),
    starts_at timestamptz not null,
    due_at timestamptz not null,
    status text not null check (status in ('sending', 'sent', 'failed', 'skipped')),
    lease_token uuid not null,
    lease_until timestamptz not null,
    payload jsonb not null,
    attempts integer not null default 1,
    provider_message_id text,
    error_message text,
    sent_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (parlay_id, recipient_user_id, kind, starts_at)
);
alter table public.pick_reminders enable row level security;
revoke all on public.pick_reminders from anon, authenticated;
grant select, insert, update, delete on public.pick_reminders to service_role;

-- Only the service role may claim a delivery. The unique key and conditional
-- conflict update ensure overlapping workers cannot own the same live lease.
create function public.claim_pick_reminder(
    p_parlay_id uuid, p_user_id uuid, p_kind text, p_starts_at timestamptz,
    p_due_at timestamptz, p_payload jsonb, p_token uuid
) returns setof public.pick_reminders
language sql security invoker set search_path = '' as $$
    insert into public.pick_reminders as r (
        parlay_id, recipient_user_id, kind, starts_at, due_at, status,
        lease_token, lease_until, payload
    )
    select p_parlay_id, p_user_id, p_kind, p_starts_at, p_due_at, 'sending',
        p_token, now() + interval '2 minutes', p_payload
    where now() >= p_due_at and now() < p_due_at + interval '15 minutes'
        and p_starts_at > now()
        and exists (
            select 1 from public.parlays g
            where g.id = p_parlay_id and g.starts_at = p_starts_at
                and g.status in ('upcoming', 'open')
        )
        and exists (select 1 from public.profiles where id = p_user_id)
        and not exists (
            select 1 from public.picks p
            where p.parlay_id = p_parlay_id and p.user_id = p_user_id and p.is_locked
        )
    on conflict (parlay_id, recipient_user_id, kind, starts_at) do update
        set status = 'sending', lease_token = p_token,
            lease_until = now() + interval '2 minutes',
            attempts = r.attempts + 1, updated_at = now(), error_message = null
        where r.status in ('sending', 'failed') and r.lease_until <= now()
    returning r.*;
$$;
revoke all on function public.claim_pick_reminder(uuid, uuid, text, timestamptz, timestamptz, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.claim_pick_reminder(uuid, uuid, text, timestamptz, timestamptz, jsonb, uuid) to service_role;
