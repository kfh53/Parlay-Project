-- Result entry is performed by authenticated server actions after confirming
-- that the caller has a profile. The server-only client needs enough access
-- to update every pick in a locked game regardless of per-user RLS policies.
grant select, update on table public.parlays to service_role;
grant select, update on table public.picks to service_role;
grant select on table public.profiles to service_role;
