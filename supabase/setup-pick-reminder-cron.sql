-- Run AFTER applying migrations and deploying the reminder endpoint.
-- Enable pg_cron and pg_net in the Supabase dashboard first.
-- In Supabase Vault, create these named secrets:
--   pick_reminder_url: https://YOUR-APP.example/api/cron/pick-reminders
--   pick_reminder_cron_secret: the same value as the app's CRON_SECRET
-- Keep credentials out of the SQL job text and repository.

do $$
begin
    if not exists (select 1 from vault.decrypted_secrets where name = 'pick_reminder_url')
        or not exists (select 1 from vault.decrypted_secrets where name = 'pick_reminder_cron_secret')
    then
        raise exception 'Create pick_reminder_url and pick_reminder_cron_secret in Vault first';
    end if;
end $$;

select cron.schedule(
    'pick-reminders-every-minute',
    '* * * * *',
    $job$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'pick_reminder_url'),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'pick_reminder_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
    );
    $job$
);

-- Pause scheduling:
-- select cron.unschedule('pick-reminders-every-minute');
-- Monitor HTTP outcomes (cron success alone only means the HTTP request was queued):
-- select id, status_code, timed_out, error_msg, created
-- from net._http_response order by created desc limit 20;
