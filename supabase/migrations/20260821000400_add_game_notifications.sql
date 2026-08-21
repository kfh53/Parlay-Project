create table public.game_notifications (
    parlay_id uuid not null references public.parlays(id) on delete cascade,
    recipient_user_id uuid not null references public.profiles(id) on delete cascade,
    notification_type text not null,
    status text not null default 'sending',
    provider_message_id text,
    error_message text,
    sent_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (parlay_id, recipient_user_id, notification_type),
    constraint game_notifications_status_check
        check (status in ('sending', 'sent', 'failed'))
);

alter table public.game_notifications enable row level security;

-- Notification delivery uses the server-only service role. No browser-facing
-- grants or policies are intentionally added for this table.
