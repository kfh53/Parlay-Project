-- Add structured pick details so stats can be grouped by the player,
-- type of bet, and team bet on. These columns remain nullable because some
-- bets do not target a player or team and existing rows need to remain valid.

alter table public.picks
    add column player_name text,
    add column bet_type text,
    add column team_name text;

-- Partial indexes keep null-only entries out of the index while supporting
-- grouping and filtering on each stats dimension.
create index picks_player_name_idx
    on public.picks(player_name)
    where player_name is not null;

create index picks_bet_type_idx
    on public.picks(bet_type)
    where bet_type is not null;

create index picks_team_name_idx
    on public.picks(team_name)
    where team_name is not null;

comment on column public.picks.player_name is
    'Player the pick is about, when applicable (for example, Josh Allen).';

comment on column public.picks.bet_type is
    'Normalized pick category (for example, passing_yards, rushing_yards, or anytime_td).';

comment on column public.picks.team_name is
    'Team the pick is about, when applicable (prefer a consistent abbreviation such as BUF).';
