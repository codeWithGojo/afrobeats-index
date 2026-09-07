-- Afri Index shared data. No provider access tokens are stored in these tables.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null check(username ~ '^[a-z0-9_]{3,30}$'),
 board_public boolean not null default false,
 board jsonb not null default '[]' check(jsonb_typeof(board)='array' and jsonb_array_length(board)<=10),
 created_at timestamptz not null default now()
);
create table public.receipts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null check(octet_length(payload::text)<100000),
 image text not null check(length(image)<2800000 and image like 'data:image/png;base64,%'),
 public boolean not null default false,
 created_at timestamptz not null default now()
);
create index receipts_owner_date on public.receipts(user_id,created_at desc);
create table public.corrections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 artist_slug text not null check(length(artist_slug)<100),
 note text not null check(length(note) between 5 and 2000),
 source_url text not null check(source_url ~ '^https://[^ ]+$' and length(source_url)<2000),
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now()
);
create table public.comments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 artist_slug text not null check(length(artist_slug)<100),
 body text not null check(length(body) between 1 and 1000),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.comment_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 comment_id uuid not null references public.comments(id) on delete cascade,
 reason text not null check(length(reason) between 3 and 500),
 unique(user_id,comment_id)
);
create table public.brackets (
 week text primary key check(week ~ '^\d{4}-W\d{2}$'),
 artist_a text not null,
 artist_b text not null,
 closes_at timestamptz not null
);
create table public.votes (
 user_id uuid not null references auth.users(id) on delete cascade,
 week text not null references public.brackets(week),
 choice text not null,
 primary key(user_id,week)
);
create table public.chart_editions (
 week text primary key check(week ~ '^\d{4}-W\d{2}$'),
 data jsonb not null,
 published_at timestamptz not null default now()
);
create table public.editorial_events (
 id uuid primary key default gen_random_uuid(),
 artist_slug text not null,
 kind text not null check(kind in ('certification','tour','award','nomination','festival')),
 title text not null,
 event_date date,
 details jsonb not null default '{}',
 source_url text not null check(source_url like 'https://%'),
 verified_at timestamptz not null default now()
);
create table public.artist_metrics (
 artist_slug text primary key,
 monthly_listeners bigint,
 observed_at timestamptz,
 source_url text,
 factors jsonb,
 territories jsonb,
 credits jsonb,
 career_started integer,
 gender text,
 evidence jsonb
);
create table public.push_subscriptions (
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text primary key,
 subscription jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.receipts enable row level security;
alter table public.corrections enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.brackets enable row level security;
alter table public.votes enable row level security;
alter table public.chart_editions enable row level security;
alter table public.editorial_events enable row level security;
alter table public.artist_metrics enable row level security;
alter table public.push_subscriptions enable row level security;
create policy profiles_owner on public.profiles for all to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy profiles_public on public.profiles for select to anon,authenticated using(board_public);
create policy receipts_read on public.receipts for select to anon,authenticated using(public or (select auth.uid())=user_id);
create policy receipts_insert on public.receipts for insert to authenticated with check((select auth.uid())=user_id);
create policy receipts_delete on public.receipts for delete to authenticated using((select auth.uid())=user_id);
create policy corrections_owner_read on public.corrections for select to authenticated using((select auth.uid())=user_id);
create policy corrections_submit on public.corrections for insert to authenticated with check((select auth.uid())=user_id and status='pending');
create policy comments_read on public.comments for select to anon,authenticated using(approved or (select auth.uid())=user_id);
create policy comments_submit on public.comments for insert to authenticated with check((select auth.uid())=user_id and not approved);
create policy comments_delete on public.comments for delete to authenticated using((select auth.uid())=user_id);
create policy reports_owner on public.comment_reports for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy brackets_read on public.brackets for select to anon,authenticated using(true);
create policy votes_read on public.votes for select to authenticated using((select auth.uid())=user_id);
create policy votes_cast on public.votes for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.brackets b where b.week=votes.week and now()<b.closes_at and votes.choice in (b.artist_a,b.artist_b)));
create policy editions_read on public.chart_editions for select to anon,authenticated using(true);
create policy events_read on public.editorial_events for select to anon,authenticated using(true);
create policy metrics_read on public.artist_metrics for select to anon,authenticated using(true);
create policy push_owner on public.push_subscriptions for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant select on public.profiles,public.receipts,public.comments,public.brackets,public.chart_editions,public.editorial_events,public.artist_metrics to anon,authenticated;
grant insert,update on public.profiles to authenticated;
grant insert,delete on public.receipts,public.comments to authenticated;
grant select,insert on public.corrections,public.votes to authenticated;
grant select,insert,update,delete on public.comment_reports,public.push_subscriptions to authenticated;
-- Moderation and editorial publishing use the Supabase dashboard, not a browser role.
