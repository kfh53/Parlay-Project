-- The dashboard allows a parlay creator to enter or edit picks for participants.
-- These policies keep that workflow compatible with Row Level Security.
create policy "Parlay creators can insert participant picks"
on public.picks
for insert
to authenticated
with check (
    exists (
        select 1
        from public.parlays
        where parlays.id = picks.parlay_id
          and parlays.created_by = auth.uid()
    )
);

create policy "Parlay creators can update participant picks"
on public.picks
for update
to authenticated
using (
    exists (
        select 1
        from public.parlays
        where parlays.id = picks.parlay_id
          and parlays.created_by = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.parlays
        where parlays.id = picks.parlay_id
          and parlays.created_by = auth.uid()
    )
);
