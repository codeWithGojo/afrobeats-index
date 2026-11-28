-- Phase 4: My Index (user-graded rankings) and the Community Index.
-- Nothing here is read by the official Current 50 pipeline. Apply after schema.sql and product_features.sql.

-- Default metrics shared by everyone. Custom metrics start with 'custom-' and stay personal.
create or replace function public.my_index_default_metric(k text) returns boolean language sql immutable as $$
  select k in ('streams','vocals','lyricism','live','influence','longevity','innovation','vibes','replay')
$$;

create or replace function public.my_index_is_pro(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.pro_subscriptions s where s.user_id=uid and s.expires_at>now())
$$;

-- One grade per user, artist and metric (the primary key enforces it).
create table if not exists public.index_grades(
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_slug text not null check(artist_slug ~ '^[a-z0-9-]{1,80}$'),
  metric text not null check(public.my_index_default_metric(metric) or metric ~ '^custom-[a-z0-9-]{2,30}$'),
  grade smallint not null check(grade between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key(user_id,artist_slug,metric)
);
create index if not exists index_grades_community on public.index_grades(artist_slug,metric) where metric !~ '^custom-';

-- Saved indexes and templates. metrics: [{key,label,weight}] with 3 to 8 entries.
create table if not exists public.index_sets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(name) between 2 and 60),
  metrics jsonb not null check(jsonb_typeof(metrics)='array' and jsonb_array_length(metrics) between 3 and 8),
  pool text not null default 'current' check(pool in ('current','outside-top-20')),
  is_template boolean not null default false,
  remixed_from uuid references public.index_sets(id) on delete set null,
  copies integer not null default 0 check(copies>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pro: history of your personal top 10 over time.
create table if not exists public.index_history(
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references public.index_sets(id) on delete cascade,
  taken_at timestamptz not null default now(),
  top jsonb not null check(jsonb_typeof(top)='array' and jsonb_array_length(top)<=10),
  primary key(set_id,taken_at)
);

-- Graders whose patterns look like abuse. Their grades are left out of the Community Index.
create table if not exists public.index_grader_flags(
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null,
  flagged_at timestamptz not null default now(),
  cleared boolean not null default false
);

-- Free tier: 3 metrics and 1 saved index. Pro: up to 8 metrics, unlimited indexes, templates, history.
create or replace function public.index_sets_limits() returns trigger language plpgsql security definer set search_path='' as $$
declare pro boolean := public.my_index_is_pro(new.user_id);
begin
  if not pro and jsonb_array_length(new.metrics)<>3 then raise exception 'Free My Index uses exactly 3 metrics. Pro unlocks up to 8.'; end if;
  if not pro and new.is_template then raise exception 'Publishing templates is a Pro feature.'; end if;
  if tg_op='INSERT' and not pro and exists(select 1 from public.index_sets s where s.user_id=new.user_id) then raise exception 'Free accounts can save 1 index. Pro saves as many as you like.'; end if;
  if exists(select 1 from jsonb_array_elements(new.metrics) m where not (m ? 'key' and m ? 'weight') or (m->>'weight')::numeric<0 or (m->>'weight')::numeric>100) then raise exception 'Invalid metric list.'; end if;
  new.updated_at := now(); return new;
end $$;
drop trigger if exists index_sets_limits on public.index_sets;
create trigger index_sets_limits before insert or update on public.index_sets for each row execute function public.index_sets_limits();

-- Rate limit: at most 300 grade writes per user per 10 minutes.
create or replace function public.index_grades_rate() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (select count(*) from public.index_grades g where g.user_id=new.user_id and g.updated_at>now()-interval '10 minutes')>=300 then
    raise exception 'You are grading very fast. Take a short break and try again.';
  end if;
  new.updated_at := now(); return new;
end $$;
drop trigger if exists index_grades_rate on public.index_grades;
create trigger index_grades_rate before insert or update on public.index_grades for each row execute function public.index_grades_rate();

create or replace function public.index_history_pro() returns trigger language plpgsql security definer set search_path='' as $$
begin if not public.my_index_is_pro(new.user_id) then raise exception 'Index history is a Pro feature.'; end if; return new; end $$;
drop trigger if exists index_history_pro on public.index_history;
create trigger index_history_pro before insert on public.index_history for each row execute function public.index_history_pro();

alter table public.index_grades enable row level security;
alter table public.index_sets enable row level security;
alter table public.index_history enable row level security;
alter table public.index_grader_flags enable row level security;
revoke all on public.index_grades,public.index_sets,public.index_history,public.index_grader_flags from public,anon,authenticated;
create policy index_grades_owner on public.index_grades for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy index_sets_owner on public.index_sets for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy index_sets_templates on public.index_sets for select to anon,authenticated using(is_template);
create policy index_history_owner on public.index_history for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.index_grades,public.index_sets,public.index_history to authenticated;
grant select on public.index_sets to anon;
grant all on public.index_grader_flags to service_role;

-- Copy a public template into your own indexes (counts toward the free limit).
create or replace function public.copy_index_template(p_id uuid,p_name text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare src public.index_sets; new_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to copy a template.'; end if;
  select * into src from public.index_sets where id=p_id and is_template; if not found then raise exception 'Template not found.'; end if;
  insert into public.index_sets(user_id,name,metrics,pool,remixed_from) values((select auth.uid()),coalesce(nullif(p_name,''),src.name||' (remix)'),src.metrics,src.pool,src.id) returning id into new_id;
  update public.index_sets set copies=copies+1 where id=src.id;
  return new_id;
end $$;

/* Community Index: per artist and default metric, the weighted mean of everyone's grades.
   Weight by account age: under 7 days 0.25, under 30 days 0.6, otherwise 1. Flagged graders are left out.
   n is the number of distinct graders, shown beside every score. */
create or replace function public.community_index() returns table(artist_slug text,metric text,score numeric,n bigint) language sql stable security definer set search_path='' as $$
  select g.artist_slug,g.metric,
    round(sum(g.grade*case when u.created_at>now()-interval '7 days' then .25 when u.created_at>now()-interval '30 days' then .6 else 1 end)
      /nullif(sum(case when u.created_at>now()-interval '7 days' then .25 when u.created_at>now()-interval '30 days' then .6 else 1 end),0),2) score,
    count(distinct g.user_id) n
  from public.index_grades g join auth.users u on u.id=g.user_id
  where public.my_index_default_metric(g.metric)
    and not exists(select 1 from public.index_grader_flags f where f.user_id=g.user_id and not f.cleared)
  group by g.artist_slug,g.metric;
$$;

/* Flag outlier patterns (run weekly with the service role, e.g. from the data engine):
   identical grades for everything (20+ grades), or an average distance of 4+ points from the community. */
create or replace function public.flag_outlier_graders() returns integer language plpgsql security definer set search_path='' as $$
declare added integer;
begin
  with c as (select * from public.community_index()),
  stats as (
    select g.user_id,count(*) graded,stddev_pop(g.grade) spread,avg(abs(g.grade-c.score)) distance
    from public.index_grades g join c on c.artist_slug=g.artist_slug and c.metric=g.metric and c.n>=5
    group by g.user_id having count(*)>=20
  ),bad as (
    select user_id,case when spread=0 then 'Identical grade for every artist' else 'Grades far from the community on average' end reason
    from stats where spread=0 or distance>=4
  )
  insert into public.index_grader_flags(user_id,reason) select user_id,reason from bad on conflict(user_id) do nothing;
  get diagnostics added=row_count; return added;
end $$;

revoke all on function public.community_index(),public.flag_outlier_graders(),public.copy_index_template(uuid,text),public.my_index_is_pro(uuid) from public,anon,authenticated;
grant execute on function public.community_index() to anon,authenticated;
grant execute on function public.copy_index_template(uuid,text) to authenticated;
grant execute on function public.flag_outlier_graders() to service_role;
