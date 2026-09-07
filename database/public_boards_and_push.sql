create table public.board_editions (
 board text not null,
 week text not null references public.chart_editions(week),
 data jsonb not null,
 published_at timestamptz not null default now(),
 primary key(board,week)
);
alter table public.board_editions enable row level security;
create policy board_editions_read on public.board_editions for select to anon,authenticated using(true);
grant select on public.board_editions to anon,authenticated;
-- Background sender configuration is never exposed to browser roles.
create table public.notification_settings(id integer primary key check(id=1), public_key text not null, private_key text not null, job_token text not null);
alter table public.notification_settings enable row level security;
revoke all on public.notification_settings from public,anon,authenticated;
grant all on public.notification_settings to service_role;
create table public.notification_deliveries(week text not null,endpoint text not null,status text not null default 'sending',updated_at timestamptz default now(),primary key(week,endpoint));
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public,anon,authenticated;
grant all on public.notification_deliveries to service_role;
alter table public.push_subscriptions add constraint supported_push_endpoint check(endpoint ~ '^https://(fcm.googleapis.com|updates.push.services.mozilla.com|web.push.apple.com)/' and length(endpoint)<2000 and subscription->>'endpoint'=endpoint and jsonb_typeof(subscription->'keys')='object');
alter table public.receipts add constraint receipt_payload_keys check(payload ?& array['artists','tracks']);
-- Award ceremonies and nomination announcement dates can apply to all artists.
alter table public.editorial_events alter column artist_slug drop not null;
