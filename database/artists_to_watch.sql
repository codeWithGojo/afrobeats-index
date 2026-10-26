-- Phase 6 additive schema. Apply after schema.sql/product_features.sql; no existing rows are removed.
create schema if not exists private;
create table public.watch_artists(slug text primary key check(slug ~ '^[a-z0-9-]{1,80}$'),name text not null);
create table public.watch_follows(user_id uuid references auth.users(id) on delete cascade,artist_slug text references public.watch_artists(slug),created_at timestamptz not null default now(),primary key(user_id,artist_slug));
create table public.watch_counts(artist_slug text primary key references public.watch_artists(slug),watched_by bigint not null default 0 check(watched_by>=0));
create table public.watch_events(id uuid primary key default gen_random_uuid(),artist_slug text not null references public.watch_artists(slug),delta smallint not null check(delta in (-1,1)),created_at timestamptz not null default now());
create index watch_events_week on public.watch_events(created_at,artist_slug);
create index watch_follows_artist on public.watch_follows(artist_slug);
create table public.watch_nominations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null check(length(name) between 2 and 100),links text[] not null check(cardinality(links) between 1 and 5),why text not null check(length(why) between 10 and 2000),status text not null default 'pending' check(status in ('pending','accepted','rejected')),created_at timestamptz not null default now());
alter table public.watch_artists enable row level security;
alter table public.watch_follows enable row level security;
alter table public.watch_counts enable row level security;
alter table public.watch_events enable row level security;
alter table public.watch_nominations enable row level security;
revoke all on public.watch_artists,public.watch_follows,public.watch_counts,public.watch_events,public.watch_nominations from public,anon,authenticated;
grant select on public.watch_artists,public.watch_counts to anon,authenticated;
grant select,delete on public.watch_follows to authenticated;
grant insert(user_id,artist_slug) on public.watch_follows to authenticated;
grant select on public.watch_nominations to authenticated;
grant insert(user_id,name,links,why) on public.watch_nominations to authenticated;
grant all on public.watch_artists,public.watch_follows,public.watch_counts,public.watch_events,public.watch_nominations to service_role;
create policy watch_artists_read on public.watch_artists for select to anon,authenticated using(true);
create policy watch_counts_read on public.watch_counts for select to anon,authenticated using(true);
create policy watch_follows_read on public.watch_follows for select to authenticated using(user_id=(select auth.uid()));
create policy watch_follows_insert on public.watch_follows for insert to authenticated with check(user_id=(select auth.uid()));
create policy watch_follows_delete on public.watch_follows for delete to authenticated using(user_id=(select auth.uid()));
create policy watch_nominations_read on public.watch_nominations for select to authenticated using(user_id=(select auth.uid()));
create policy watch_nominations_insert on public.watch_nominations for insert to authenticated with check(user_id=(select auth.uid()));
-- A private trigger is the only writer of aggregate counts/events. It exposes no follower IDs.
create function private.watch_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare target text; change smallint; owner_id uuid;
begin
 target=coalesce(new.artist_slug,old.artist_slug);owner_id=coalesce(new.user_id,old.user_id);
 if auth.uid() is not null and auth.uid()<>owner_id then raise exception 'Not your watchlist';end if;
 change=case when TG_OP='INSERT' then 1 else -1 end;
 insert into public.watch_counts(artist_slug,watched_by) values(target,greatest(change,0)) on conflict(artist_slug) do update set watched_by=greatest(0,public.watch_counts.watched_by+change);
 insert into public.watch_events(artist_slug,delta) values(target,change);
 return coalesce(new,old);
end $$;
revoke all on function private.watch_changed() from public,anon,authenticated;
create trigger watch_changed after insert or delete on public.watch_follows for each row execute function private.watch_changed();
create function private.watch_nomination_limit() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.user_id::text));
 if (select count(*) from public.watch_nominations where user_id=new.user_id and created_at>now()-interval '1 day')>=5 then raise exception 'Maximum five nominations per day';end if;
 if exists(select 1 from unnest(new.links) link where link is null or link !~ '^https://[^[:space:]]+$' or length(link)>2000) then raise exception 'Use HTTPS links';end if;
 return new;
end $$;
revoke all on function private.watch_nomination_limit() from public,anon,authenticated;
create trigger watch_nomination_limit before insert on public.watch_nominations for each row execute function private.watch_nomination_limit();

-- Seed the existing directory and original watchlist, without inventing activity.
insert into public.watch_artists(slug,name) values
('artsalghul','Artsalghul'),
('blnde','BLNDE'),
('danpapa-gta','Danpapa GTA'),
('deena','Deena'),
('egertton','Egertton'),
('indi','Indi'),
('kobilou','Kobilou'),
('luwa-mp4','Luwa.Mp4'),
('monochrome','Monochrome'),
('no11','NO11'),
('onoola-sama','onoola-sama'),
('scottyolorin','scottyolorin'),
('sssoundgawd','SSSoundGawd'),
('suono-sai','Suono Sai'),
('ugazee','Ugazee'),
('wave-tar','Wave$tar'),
('zaylevelten','Zaylevelten'),
('zen-universe','Zen Universe');
insert into public.watch_counts(artist_slug) select slug from public.watch_artists;
