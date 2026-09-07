-- Run this entire block together. It is atomic and safe to rerun.
-- Acquire all table locks before changing permissions. NOWAIT aborts immediately
-- if a live request holds a conflicting lock, avoiding a table-lock wait cycle.
-- If the tables are busy (55P03), retry the whole block after traffic subsides.
do $guest_access$
begin
    lock table public.parlays, public.picks, public.profiles,
        public.game_notifications, public.pick_reminders, public.dismissed_games
        in access exclusive mode nowait;

    -- Public guests use the anon role, not a shared authenticated account.
    -- Expose only the display fields queried by games and stats.
    revoke all on public.parlays, public.picks, public.profiles from anon;
    grant select (id, title, game_date, starts_at, status, created_by, total_odds,
        notes, season, week, primetime_type) on public.parlays to anon;
    grant select (id, parlay_id, user_id, selection, player_name, bet_type, team_name,
        odds, is_locked, result, parlay_killer) on public.picks to anon;
    grant select (id, display_name) on public.profiles to anon;

    drop policy if exists "Guests can view current and completed games" on public.parlays;
    create policy "Guests can view current and completed games"
    on public.parlays for select to anon
    using (status in ('open', 'locked', 'complete'));

    -- Unlocked picks are intentionally public too.
    drop policy if exists "Guests can view submitted picks" on public.picks;
    create policy "Guests can view submitted picks"
    on public.picks for select to anon
    using (exists (
        select 1 from public.parlays p
        where p.id = picks.parlay_id and p.status in ('open', 'locked', 'complete')
    ));

    drop policy if exists "Guests can view participant display names" on public.profiles;
    create policy "Guests can view participant display names"
    on public.profiles for select to anon using (true);

    -- Existing participant permissions remain unchanged. Guests cannot mutate data.
    revoke all on public.game_notifications, public.pick_reminders, public.dismissed_games from anon;

end;
$guest_access$;
