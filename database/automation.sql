-- Automated data engine (phase 1). Additive and re-runnable: no existing table is altered or dropped.
-- Snapshots are append-only; writes come from the scheduled collector using the service role only.

-- Shared vocabulary ---------------------------------------------------------
-- metric_class keeps different kinds of evidence apart; they are never summed together.
do $$ begin
  create type public.metric_class as enum ('verified_count','estimated_count','chart_position','popularity','airplay','calculated_score');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.data_confidence as enum ('first_party','third_party_ledger','official_chart','estimate','editorial');
exception when duplicate_object then null; end $$;

-- Providers -------------------------------------------------------------------
create table if not exists public.data_sources(
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  kind text not null check (kind in ('streaming_ledger','chart','video','popularity','metadata','certification','editorial')),
  base_url text,
  access text not null check (access in ('public_page','public_api','api_key','developer_token','manual')),
  enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
insert into public.data_sources(id,name,kind,base_url,access,enabled,notes) values
 ('kworb-spotify','Kworb Spotify ledgers','streaming_ledger','https://kworb.net/spotify/','public_page',true,'Third-party ledger of Spotify public play counts. Updated about once a day.'),
 ('turntable','TurnTable Charts','chart','https://www.turntablecharts.com/','public_page',true,'Official Nigerian charts. Publisher week kept separately from check time.'),
 ('youtube','YouTube Data API v3','video','https://www.googleapis.com/youtube/v3/','api_key',false,'Video views only. Never added to audio streams.'),
 ('deezer','Deezer public API','popularity','https://api.deezer.com/','public_api',false,'Rank and fan counts are popularity indicators, not streams.'),
 ('spotify-api','Spotify Web API','metadata','https://api.spotify.com/v1/','api_key',false,'Metadata and popularity only. No stream counts.'),
 ('apple-music','Apple Music API','chart','https://api.music.apple.com/v1/','developer_token',false,'Storefront charts and catalogue metadata. No stream counts.'),
 ('turntable-certifications','TurnTable certifications','certification','https://www.turntablecharts.com/','public_page',false,'Certification level and date.'),
 ('afri-index','AFR/INDEX published editions','editorial',null,'manual',true,'Calculated scores exactly as published. Method version stored per row.')
on conflict (id) do nothing;

-- Catalogue identities ----------------------------------------------------------
create table if not exists public.artists(
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  spotify_id text unique,
  deezer_id text unique,
  youtube_channel_id text unique,
  apple_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.tracks(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  spotify_id text unique,
  isrc text,
  deezer_id text unique,
  youtube_video_id text unique,
  apple_id text unique,
  created_at timestamptz not null default now()
);
create index if not exists tracks_isrc on public.tracks(isrc) where isrc is not null;
create table if not exists public.track_artists(
  track_id uuid not null references public.tracks(id) on delete cascade,
  artist_slug text not null references public.artists(slug) on delete cascade,
  primary key(track_id,artist_slug)
);
create table if not exists public.albums(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  primary_artist_slug text references public.artists(slug),
  spotify_id text unique,
  upc text,
  deezer_id text unique,
  apple_id text unique,
  release_date date,
  created_at timestamptz not null default now()
);

-- Jobs and logs -------------------------------------------------------------------
create table if not exists public.ingestion_jobs(
  id uuid primary key default gen_random_uuid(),
  job text not null check (job in ('collect','daily','weekly','monthly','yearly','backfill')),
  period_key text not null,
  status text not null check (status in ('running','succeeded','partial','failed')),
  trigger text not null default 'schedule' check (trigger in ('schedule','manual','retry')),
  attempt integer not null default 1,
  started_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}',
  error text,
  unique(job,period_key)
);
create table if not exists public.ingestion_logs(
  id bigint generated always as identity primary key,
  job_id uuid references public.ingestion_jobs(id) on delete cascade,
  provider text references public.data_sources(id),
  level text not null check (level in ('info','warn','error')),
  entity text,
  message text not null check (length(message)<=2000),
  created_at timestamptz not null default now()
);
create index if not exists ingestion_logs_job on public.ingestion_logs(job_id,created_at);

-- Claims a job period atomically. A period runs once; a failed or stalled run may be retried.
create or replace function public.claim_ingestion_job(p_job text,p_period text,p_trigger text default 'schedule')
returns public.ingestion_jobs language plpgsql security definer set search_path=public as $$
declare claimed public.ingestion_jobs;
begin
  insert into public.ingestion_jobs(job,period_key,status,trigger) values(p_job,p_period,'running',p_trigger)
  on conflict (job,period_key) do nothing returning * into claimed;
  if claimed.id is not null then return claimed; end if;
  update public.ingestion_jobs set status='running',trigger=p_trigger,attempt=attempt+1,started_at=now(),heartbeat_at=now(),finished_at=null,error=null
   where job=p_job and period_key=p_period
     and (status='failed' or (status='running' and heartbeat_at<now()-interval '2 hours'))
  returning * into claimed;
  return claimed;
end $$;
revoke all on function public.claim_ingestion_job(text,text,text) from public,anon,authenticated;
grant execute on function public.claim_ingestion_job(text,text,text) to service_role;

-- Snapshots (append-only) ------------------------------------------------------------
create table if not exists public.track_stream_snapshots(
  id bigint generated always as identity primary key,
  track_id uuid not null references public.tracks(id),
  provider text not null references public.data_sources(id),
  metric text not null,
  metric_class public.metric_class not null,
  confidence public.data_confidence not null,
  value numeric not null check (value>=0),
  source_date date not null,
  observed_at timestamptz not null,
  source_url text,
  job_id uuid references public.ingestion_jobs(id),
  unique(track_id,provider,metric,source_date)
);
create table if not exists public.album_stream_snapshots(
  id bigint generated always as identity primary key,
  album_id uuid not null references public.albums(id),
  provider text not null references public.data_sources(id),
  metric text not null,
  metric_class public.metric_class not null,
  confidence public.data_confidence not null,
  value numeric not null check (value>=0),
  source_date date not null,
  observed_at timestamptz not null,
  source_url text,
  job_id uuid references public.ingestion_jobs(id),
  unique(album_id,provider,metric,source_date)
);
create table if not exists public.artist_statistics(
  id bigint generated always as identity primary key,
  artist_slug text not null references public.artists(slug),
  provider text not null references public.data_sources(id),
  metric text not null,
  metric_class public.metric_class not null,
  confidence public.data_confidence not null,
  period text not null check (period in ('lifetime','daily','weekly','monthly')),
  value numeric not null check (value>=0),
  source_date date not null,
  observed_at timestamptz not null,
  source_url text,
  job_id uuid references public.ingestion_jobs(id),
  unique(artist_slug,provider,metric,period,source_date)
);
create table if not exists public.chart_positions(
  id bigint generated always as identity primary key,
  chart text not null,
  provider text not null references public.data_sources(id),
  week_start date not null,
  week_end date not null,
  rank integer not null check (rank between 1 and 500),
  title text not null,
  artist_credit text not null,
  last_rank integer,
  peak integer,
  weeks_on integer,
  status text,
  track_id uuid references public.tracks(id),
  album_id uuid references public.albums(id),
  source_url text,
  observed_at timestamptz not null,
  job_id uuid references public.ingestion_jobs(id),
  unique(chart,week_end,rank)
);
create index if not exists chart_positions_title on public.chart_positions(chart,lower(title),lower(artist_credit));
create table if not exists public.ranking_snapshots(
  id bigint generated always as identity primary key,
  board text not null,
  edition_date date not null,
  rank integer not null,
  artist_slug text not null references public.artists(slug),
  score numeric,
  previous_rank integer,
  breakdown jsonb,
  method_version text not null,
  observed_at timestamptz not null default now(),
  job_id uuid references public.ingestion_jobs(id),
  unique(board,edition_date,artist_slug)
);
create index if not exists ranking_snapshots_job_id_idx on public.ranking_snapshots(job_id);
create table if not exists public.regional_rankings(
  id bigint generated always as identity primary key,
  region text not null,
  edition_date date not null,
  rank integer not null,
  artist_slug text not null references public.artists(slug),
  score numeric,
  method_version text not null,
  unique(region,edition_date,artist_slug)
);
create table if not exists public.certifications(
  id bigint generated always as identity primary key,
  certifier text not null,
  artist_slug text references public.artists(slug),
  title text not null,
  format text not null,
  level text not null,
  certified_on date,
  source_url text not null,
  observed_at timestamptz not null,
  unique(certifier,title,format,level)
);

-- History view: one row per charting entry with its run, peak and weeks.
create or replace view public.chart_history with (security_invoker=true) as
select chart,lower(title) as title_key,min(title) as title,min(artist_credit) as artist_credit,
       min(week_end) as first_week,max(week_end) as last_week,min(rank) as peak,count(*) as weeks_recorded
  from public.chart_positions group by chart,lower(title),lower(artist_credit);

-- Historical rows are never rewritten.
create or replace function public.forbid_history_mutation() returns trigger language plpgsql set search_path=public as $$
begin raise exception 'History rows are append-only (%).',tg_table_name; end $$;
do $$ declare t text; begin
  foreach t in array array['track_stream_snapshots','album_stream_snapshots','artist_statistics','chart_positions','ranking_snapshots','regional_rankings'] loop
    execute format('drop trigger if exists %I on public.%I',t||'_append_only',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.forbid_history_mutation()',t||'_append_only',t);
  end loop;
end $$;

-- Access -------------------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['data_sources','artists','tracks','track_artists','albums','ingestion_jobs','ingestion_logs','track_stream_snapshots','album_stream_snapshots','artist_statistics','chart_positions','ranking_snapshots','regional_rankings','certifications'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
  end loop;
  -- Published evidence is readable by everyone; job internals are not.
  foreach t in array array['data_sources','artists','tracks','track_artists','albums','track_stream_snapshots','album_stream_snapshots','artist_statistics','chart_positions','ranking_snapshots','regional_rankings','certifications'] loop
    execute format('drop policy if exists %I on public.%I',t||'_public_read',t);
    execute format('create policy %I on public.%I for select to anon,authenticated using(true)',t||'_public_read',t);
    execute format('grant select on public.%I to anon,authenticated',t);
  end loop;
end $$;
grant select on public.chart_history to anon,authenticated;
