# Guest access

The home page continues to open the login page, now with a Continue as guest link.
Guests can open /dashboard and /stats directly without an account. Navigation shows
Guest and a Sign in link. No shared guest login or Supabase anonymous sign-in is used.

Guests see current (open/locked) games and all submitted picks, including unlocked
picks. Completed game cards appear below current games, newest first, with the same
read-only controls. Upcoming games remain in the participant dashboard.
Public fields include display names, selections, odds, lock status, kickoff times,
game notes, and results. Account emails and notification records are not exposed.

The normal Supabase client uses the anon database role for guests. The new migration
grants SELECT on explicit columns and adds SELECT-only row policies. It grants no
writes. Existing server actions still check authentication before mutations. Guest
page loads do not call the game seeding action, and their UI omits every game/pick
editing control.

Apply supabase/migrations/20260907000300_add_guest_read_access.sql after the existing
migrations, then deploy the app. Do not replay the baseline migration on production.
No new environment variables or authentication settings are required.

Verification: open the deployed site in a private browser window, choose Continue
as guest, confirm unlocked picks and Stats are visible, and confirm no add/edit/
delete/lock/result controls appear. Sign in as a participant to check normal controls.
Automated rendering and action tests cover those boundaries; the SQL permissions
also need verification against the deployed Supabase database.

If the SQL editor reports a deadlock (40P01), use the updated migration block.
It obtains all required table locks with NOWAIT before changing permissions and
replaces only the three guest policies, so rerunning is safe after partial manual
execution too. Run the entire DO block, not selected statements. If a table is
busy (55P03), it makes no changes; close active Games/Stats or Table Editor tabs,
wait briefly, and retry. There is no need to delete data or terminate sessions.
