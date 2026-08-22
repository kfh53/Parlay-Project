alter table public.parlays
    add column primetime_type text;

update public.parlays
set primetime_type = case
    when stage is distinct from 'regular' then 'special'
    when extract(isodow from game_date) = 1 then 'MNF'
    when extract(isodow from game_date) = 4 then 'TNF'
    when extract(isodow from game_date) = 7 then 'SNF'
    else 'special'
end;

alter table public.parlays
    alter column primetime_type set not null,
    add constraint parlays_primetime_type_check
        check (primetime_type in ('MNF', 'TNF', 'SNF', 'special'));
