grant delete on public.parlays to authenticated;

create policy "Authenticated users can delete games"
on public.parlays
for delete
to authenticated
using (true);

create table public.dismissed_games (
    game_date date not null,
    title text not null,
    dismissed_by uuid references auth.users(id),
    dismissed_at timestamptz not null default now(),
    primary key (game_date, title)
);

alter table public.dismissed_games enable row level security;

grant select, insert, update on public.dismissed_games to authenticated;

create policy "Authenticated users can view dismissed games"
on public.dismissed_games
for select
to authenticated
using (true);

create policy "Authenticated users can dismiss games"
on public.dismissed_games
for insert
to authenticated
with check (auth.uid() = dismissed_by);

create policy "Authenticated users can update dismissed games"
on public.dismissed_games
for update
to authenticated
using (true)
with check (auth.uid() = dismissed_by);
