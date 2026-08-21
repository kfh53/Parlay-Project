alter table public.parlays
    drop constraint if exists parlays_status_check;

alter table public.parlays
    add constraint parlays_status_check
    check (status in ('upcoming', 'open', 'locked', 'complete'));

-- Move untouched schedule rows created by the original prime-time seed into
-- the new upcoming workflow. Games that already have picks remain current.
update public.parlays
set status = 'upcoming'
where season = 2026
  and status = 'open'
  and notes ~ '^(TNF|SNF|MNF)'
  and not exists (
      select 1
      from public.picks
      where picks.parlay_id = parlays.id
  );
