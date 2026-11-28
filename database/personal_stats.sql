-- Phase 3: personal stats. Apply after schema.sql and product_features.sql.
-- Only African-artist matches are stored. Raw listening files never reach the server.
-- Every table is owner-only; taste profiles are readable by others only when the owner opts in.

create table if not exists public.personal_profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check(provider in ('spotify','lastfm','import')),
  lastfm_user text check(lastfm_user is null or lastfm_user ~ '^[A-Za-z][A-Za-z0-9_-]{1,14}$'),
  consent_at timestamptz not null,
  tracking_since timestamptz not null default now(),
  last_synced_at timestamptz,
  unmatched_plays bigint not null default 0 check(unmatched_plays>=0),
  handle text unique check(handle is null or handle ~ '^[a-z0-9_]{3,24}$'),
  publish_taste boolean not null default false,
  taste jsonb not null default '[]'::jsonb check(jsonb_typeof(taste)='array' and jsonb_array_length(taste)<=50),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_plays(
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check(provider in ('spotify','lastfm')),
  played_at timestamptz not null check(played_at<=now()+interval '1 day'),
  artist_slug text not null check(artist_slug ~ '^[a-z0-9-]{1,80}$'),
  track_title text not null check(length(track_title) between 1 and 300),
  primary key(user_id,provider,played_at,artist_slug)
);
create index if not exists personal_plays_user_time on public.personal_plays(user_id,played_at desc);

-- Pro: aggregated lifetime stats from a Spotify Extended Streaming History import (never the raw file).
create table if not exists public.personal_lifetime(
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary jsonb not null check(pg_column_size(summary)<200000),
  imported_at timestamptz not null default now()
);

-- Apple Music waitlist (written by the server with the service role only).
create table if not exists public.feature_waitlist(
  id uuid primary key default gen_random_uuid(),
  feature text not null check(feature in ('apple-music')),
  email text not null check(email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email)<=254),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(feature,email)
);

alter table public.personal_profiles enable row level security;
alter table public.personal_plays enable row level security;
alter table public.personal_lifetime enable row level security;
alter table public.feature_waitlist enable row level security;
revoke all on public.personal_profiles,public.personal_plays,public.personal_lifetime,public.feature_waitlist from public,anon,authenticated;

create policy personal_profiles_owner on public.personal_profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy personal_plays_owner on public.personal_plays for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy personal_lifetime_read on public.personal_lifetime for select to authenticated using(user_id=(select auth.uid()));
create policy personal_lifetime_delete on public.personal_lifetime for delete to authenticated using(user_id=(select auth.uid()));
-- Saving lifetime stats is a Pro feature.
create policy personal_lifetime_write on public.personal_lifetime for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.pro_subscriptions s where s.user_id=(select auth.uid()) and s.expires_at>now()));
create policy personal_lifetime_update on public.personal_lifetime for update to authenticated using(user_id=(select auth.uid())) with check(exists(select 1 from public.pro_subscriptions s where s.user_id=(select auth.uid()) and s.expires_at>now()));

grant select,insert,update,delete on public.personal_profiles,public.personal_plays to authenticated;
grant select,insert,update,delete on public.personal_lifetime to authenticated;
grant all on public.feature_waitlist to service_role;

-- A published taste profile, by handle. Returns nothing unless the owner opted in.
create or replace function public.public_taste(p_handle text) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('handle',p.handle,'taste',p.taste,'updatedAt',p.updated_at)
  from public.personal_profiles p where p.handle=lower(p_handle) and p.publish_taste;
$$;

-- African music soulmates: cosine similarity between the caller's taste and other opted-in profiles.
-- The caller must also have opted in. Only handles, scores and shared artists are returned.
create or replace function public.taste_soulmates(p_limit integer default 10) returns table(handle text,score numeric,shared text[]) language sql stable security definer set search_path='' as $$
  with me as (
    select p.user_id,(x->>'slug') slug,(x->>'weight')::numeric w from public.personal_profiles p,jsonb_array_elements(p.taste) x
    where p.user_id=(select auth.uid()) and p.publish_taste
  ),them as (
    select p.user_id,p.handle,(x->>'slug') slug,(x->>'weight')::numeric w from public.personal_profiles p,jsonb_array_elements(p.taste) x
    where p.publish_taste and p.handle is not null and p.user_id<>(select auth.uid())
  ),dot as (
    select t.user_id,t.handle,sum(t.w*m.w) d,array_agg(t.slug order by t.w*m.w desc) shared from them t join me m using(slug) group by t.user_id,t.handle
  ),norms as (
    select user_id,sqrt(sum(w*w)) n from them group by user_id
  )
  select d.handle,round(d.d/nullif(n.n*(select sqrt(sum(w*w)) from me),0),4) score,d.shared[1:5]
  from dot d join norms n using(user_id) order by score desc nulls last limit least(greatest(p_limit,1),25);
$$;

-- Delete everything this feature stored for the caller.
create or replace function public.delete_personal_data() returns void language sql volatile security definer set search_path='' as $$
  delete from public.personal_plays where user_id=(select auth.uid());
  delete from public.personal_lifetime where user_id=(select auth.uid());
  delete from public.personal_profiles where user_id=(select auth.uid());
$$;

revoke all on function public.public_taste(text),public.taste_soulmates(integer),public.delete_personal_data() from public,anon;
grant execute on function public.public_taste(text) to anon,authenticated;
grant execute on function public.taste_soulmates(integer),public.delete_personal_data() to authenticated;
