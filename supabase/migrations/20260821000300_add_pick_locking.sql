alter table public.picks
    add column is_locked boolean not null default false;

create index picks_parlay_lock_status_idx
    on public.picks(parlay_id, is_locked);
