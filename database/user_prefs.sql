-- Phase 5: onboarding preferences synced across devices. Owner-only.
create table if not exists public.user_prefs(
  user_id uuid primary key references auth.users(id) on delete cascade,
  artists text[] not null default '{}' check(cardinality(artists)<=3),
  genres text[] not null default '{}' check(cardinality(genres)<=3),
  region text check(region is null or region ~ '^[a-z0-9-]{1,30}$'),
  updated_at timestamptz not null default now()
);
alter table public.user_prefs enable row level security;
revoke all on public.user_prefs from public,anon,authenticated;
create policy user_prefs_owner on public.user_prefs for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.user_prefs to authenticated;
