-- Baseline representation of the existing Parlay Tracker database.
-- Do not execute this migration against the existing production project.

create extension if not exists pgcrypto;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    created_at timestamptz not null default now()
);

create table public.parlays (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    game_date date not null,
    title text,
    status text not null default 'open',
    total_odds integer,
    result text,
    notes text,
    created_by uuid references auth.users(id),
    season integer,
    week integer,
    stage text
);

create table public.picks (
    id uuid primary key default gen_random_uuid(),
    parlay_id uuid not null
        references public.parlays(id)
        on delete cascade,
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    created_at timestamptz not null default now(),
    selection text not null,
    odds integer not null,
    result text,
    notes text,
    parlay_killer boolean not null default false,

    constraint picks_parlay_id_user_id_key
        unique (parlay_id, user_id)
);

alter table public.parlays
    add constraint parlays_status_check
    check (status in ('open', 'locked', 'complete'));

alter table public.parlays
    add constraint parlays_result_check
    check (
        result is null
        or result in ('win', 'loss', 'push')
    );

alter table public.picks
    add constraint picks_result_check
    check (
        result is null
        or result in ('win', 'loss', 'push')
    );

alter table public.parlays
    add constraint parlays_stage_check
    check (
        stage is null
        or stage in (
            'regular',
            'wild_card',
            'divisional',
            'conference',
            'super_bowl'
        )
    );

create index picks_user_id_idx
    on public.picks(user_id);

create index picks_parlay_id_idx
    on public.picks(parlay_id);

create index parlays_game_date_idx
    on public.parlays(game_date);

create index parlays_status_idx
    on public.parlays(status);

grant select on public.profiles to authenticated;

grant select, insert, update
on public.parlays
to authenticated;

grant select, insert, update
on public.picks
to authenticated;


alter table public.profiles enable row level security;
alter table public.parlays enable row level security;
alter table public.picks enable row level security;


create policy "Authenticated users can view profiles"
on public.profiles
for select
to authenticated
using (true);


create policy "Authenticated users can view parlays"
on public.parlays
for select
to authenticated
using (true);


create policy "Authenticated users can create parlays"
on public.parlays
for insert
to authenticated
with check (true);


create policy "Authenticated users can update parlays"
on public.parlays
for update
to authenticated
using (true)
with check (true);


create policy "Authenticated users can view picks"
on public.picks
for select
to authenticated
using (true);


create policy "Users can insert their own picks"
on public.picks
for insert
to authenticated
with check (
    auth.uid() = user_id
);


create policy "Users can update their own picks"
on public.picks
for update
to authenticated
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);