-- Phase 11: first-party feature usage counts (daily totals only, no user, IP or device data).
-- Lets the team cut unused features even without paid analytics. Written only by the server.
create table if not exists public.usage_events(
  day date not null default current_date,
  name text not null check(name ~ '^[a-z0-9_]{2,40}$'),
  detail text not null default '' check(length(detail)<=40),
  count bigint not null default 0 check(count>=0),
  primary key(day,name,detail)
);
alter table public.usage_events enable row level security;
revoke all on public.usage_events from public,anon,authenticated;
grant all on public.usage_events to service_role;
create or replace function public.usage_event(p_name text,p_detail text default '') returns void language sql volatile security definer set search_path='' as $$
  insert into public.usage_events(day,name,detail,count) values(current_date,p_name,coalesce(p_detail,''),1)
  on conflict(day,name,detail) do update set count=public.usage_events.count+1;
$$;
revoke all on function public.usage_event(text,text) from public,anon,authenticated;
grant execute on function public.usage_event(text,text) to service_role;
