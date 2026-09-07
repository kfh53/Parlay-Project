# Kickoff times and pick reminders

Games store `starts_at` as a PostgreSQL timestamp with timezone (UTC). Dates and editable start times use America/New_York. The database checks that kickoff's Eastern date equals `game_date`. Summer and winter offsets are automatic. Nonexistent and ambiguous DST transition times are rejected instead of silently guessing.

Delivery is currently restricted to **kyle.f.harris53@gmail.com**, matching game-lock emails. Other participants are skipped, not redirected to the owner. Only the owner's missing or unlocked pick triggers a reminder. Stored retry payloads are checked against the same restriction before sending.

The owner (a row in `profiles` with a confirmed account email) is eligible for:
- One reminder at 8 a.m. New York time on the game's Eastern date.
- One reminder two hours before kickoff.
- Only when their pick is missing or unlocked and the game is upcoming or open.
- No reminder at or after kickoff, or for a locked/completed game. Upcoming emails explain how to move the game to Current Games.
- If both reminders coincide at 8 a.m., only the kickoff reminder is sent.

This adds reminders; it does not automatically open games, lock picks, or enforce a kickoff deadline. Existing game-lock emails retain their current recipient behavior.

## Application and database changes

The creation form requires a start time. Upcoming/current game cards have a Set time/Edit control; completed cards display kickoff without editing. Editing uses the same authenticated game-management access as existing game actions.

Apply both new migrations before deploying:
1. `supabase/migrations/20260907000100_add_kickoff_reminders.sql`
2. `supabase/migrations/20260907000200_backfill_scheduled_kickoffs.sql`

The backfill uses the schedule already bundled in this repository, matching title and game date. It does not fetch or verify live NFL scheduling. Check flexed games and update their times manually. Unknown/custom games remain without a time until edited, and receive no reminders until then.

Do not replay the baseline migration against an existing production project. Use the project's established migration workflow, or apply only the two new migrations in order through the Supabase SQL editor.

## Configuration and activation

Set these server environment variables on the deployed application:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Supabase project URL |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only admin credential |
| `RESEND_API_KEY` | Resend API key with email sending permission |
| `EMAIL_FROM` | Sender address on a verified Resend domain |
| `APP_URL` | Canonical application URL, such as https://your-app.example |
| `CRON_SECRET` | A long random secret shared only with the scheduler |
| `PICK_REMINDERS_ENABLED` | `true` to enable live delivery; absent/false disables sending |

Use a verified sender that can send to all participants, rather than Resend's restricted test sender.

The endpoint is `GET` or `POST /api/cron/pick-reminders`. It always requires `Authorization: Bearer <CRON_SECRET>`; application login cookies do not authorize it. Do not put the secret in a query string.

Start with an authenticated request to `/api/cron/pick-reminders?dryRun=true`. It counts currently eligible candidates without looking up email addresses, creating delivery records, or sending messages. It works while delivery is disabled; counts can include already delivered reminders and users without a confirmed email. Zero candidates is expected outside a reminder's 15-minute window.

To schedule without depending on Vercel Pro:
1. Enable Supabase Cron (pg_cron) and pg_net.
2. Create Vault secrets `pick_reminder_url` (the full deployed endpoint URL) and `pick_reminder_cron_secret` (matching CRON_SECRET).
3. Run `supabase/setup-pick-reminder-cron.sql`.
4. Verify HTTP outcomes in `net._http_response` and application logs.
5. Enable `PICK_REMINDERS_ENABLED=true` in the production app and redeploy/restart it.

An existing scheduler can instead call this endpoint every minute with the same authorization header. Only one scheduler is needed. Vercel Hobby's once-daily cron frequency cannot meet this requirement.

## Delivery and operational behavior

A one-minute poll means delivery normally starts within about a minute of the target time; neither scheduling nor inbox arrival is exact. Jobs retry within 15 minutes of the target, then stop rather than sending stale reminders. An outage longer than that can miss a reminder.

The service-role-only `pick_reminders` table holds delivery state. An atomic database claim provides a two-minute lease, and sent/skipped deliveries cannot be reclaimed. A stable Resend key and stored email payload allow retries after a timeout or database failure without changing the provider request. Resend retains idempotency keys for 24 hours; the retry window is deliberately much shorter.

The worker rechecks game status, kickoff, and the user's lock after claiming. There is still an unavoidable small gap between that check and the external email request: locking at that instant may coincide with an email already being sent.

Rescheduling creates a separate reminder identity for the new kickoff. Old reminder times are ignored. If a reminder was already sent before a reschedule, the new schedule may generate a replacement reminder. Previously sent email cannot be withdrawn.

Each invocation attempts at most 20 deliveries and starts no new delivery after 40 seconds, leaving room within the 60-second route limit. Failed deliveries retain the two-minute retry delay. This is intended for the existing small group; large groups need a queue and throughput planning. Set the host's function limit to support the route's 60-second duration.

HTTP 503 indicates configuration or delivery failure; subsequent scheduled calls retry eligible work. The response includes sent, skipped, failed, and deferred counts. Inspect ledger attempts/status and provider delivery status when diagnosing issues. `sent` means accepted by Resend, not guaranteed inbox delivery. Confirmed email addresses without a profile are not participants; profiles without confirmed email addresses are skipped.

To stop delivery immediately on the next invocation, set `PICK_REMINDERS_ENABLED=false` and restart/redeploy. Also unschedule the named cron job if desired. Do not delete sent ledger entries to retry a delivery, because that changes the provider idempotency key.

## Verification

Run `npm test`, `npm run lint`, and `npx tsc --noEmit --incremental false`. Automated tests cover DST, invalid input, schedule parsing, timing windows, locked/missing picks, dry runs, concurrent worker behavior with a fake claim store, retries, and endpoint authorization.

Before production activation, validate the SQL against the target Supabase schema, then verify one real delivery using a test account/game in staging. Unit tests use fake delivery/store implementations and do not prove live Postgres concurrency or provider delivery.

References:
- [Supabase scheduled HTTP calls and Vault](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase pg_net and response monitoring](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
