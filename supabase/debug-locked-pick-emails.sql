-- Read-only: identify reminder vs. game-lock confirmation deliveries.
-- Current lock state does not establish when the pick was locked.
with owner as (
    select id from auth.users where lower(email) = 'kyle.f.harris53@gmail.com'
), deliveries as (
    select parlay_id, recipient_user_id, kind as email_type, status,
        payload ->> 'subject' as subject, sent_at, created_at, updated_at,
        provider_message_id
    from public.pick_reminders
    union all
    select n.parlay_id, n.recipient_user_id, n.notification_type, n.status,
        g.title || ' is locked', n.sent_at, n.created_at, n.updated_at,
        n.provider_message_id
    from public.game_notifications n
    join public.parlays g on g.id = n.parlay_id
)
select g.id as game_id, g.title, g.status as game_status,
    d.email_type, d.subject, d.status as delivery_status,
    d.created_at at time zone 'America/New_York' as recorded_eastern,
    d.sent_at at time zone 'America/New_York' as sent_eastern,
    d.updated_at at time zone 'America/New_York' as updated_eastern,
    p.id as your_pick_id, p.is_locked as your_pick_locked_now,
    d.provider_message_id
from deliveries d
join owner o on o.id = d.recipient_user_id
join public.parlays g on g.id = d.parlay_id
left join public.picks p on p.parlay_id = g.id and p.user_id = o.id
order by d.created_at desc
limit 20;
