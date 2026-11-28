-- Phase 8: sponsors. Three fixed slots only. Admins switch a sponsor on or off by editing a row (dates or
-- `active`) in the Supabase dashboard; the site picks it up within 5 minutes, no deploy.
-- Sponsors never touch rankings, scores or movement explanations.

create table if not exists public.sponsor_slots(
  id uuid primary key default gen_random_uuid(),
  slot text not null check(slot in ('newsletter-header','watch-inline','board-presented-by')),
  board text check(board is null or board in ('heat','current-100')),          -- only for board-presented-by
  sponsor_name text not null check(length(sponsor_name) between 2 and 80),
  headline text check(headline is null or length(headline)<=90),
  copy text check(copy is null or length(copy)<=240),
  cta_label text check(cta_label is null or length(cta_label)<=30),
  url text not null check(url ~ '^https://'),
  logo_url text check(logo_url is null or logo_url ~ '^https://'),
  starts_on date not null,
  ends_on date not null check(ends_on>=starts_on),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check(slot<>'board-presented-by' or board is not null)
);
-- One sponsor per slot at a time: active date ranges for the same slot (and board) may not overlap.
create or replace function public.sponsor_slots_no_overlap() returns trigger language plpgsql set search_path='' as $$
begin
  if new.active and exists(select 1 from public.sponsor_slots s where s.id<>new.id and s.active and s.slot=new.slot
     and coalesce(s.board,'')=coalesce(new.board,'') and s.starts_on<=new.ends_on and new.starts_on<=s.ends_on) then
    raise exception 'Another sponsor already holds this slot for overlapping dates.';
  end if;
  return new;
end $$;
drop trigger if exists sponsor_slots_no_overlap on public.sponsor_slots;
create trigger sponsor_slots_no_overlap before insert or update on public.sponsor_slots for each row execute function public.sponsor_slots_no_overlap();

create table if not exists public.sponsor_events(
  day date not null default current_date,
  slot_id uuid not null references public.sponsor_slots(id) on delete cascade,
  kind text not null check(kind in ('impression','click')),
  count bigint not null default 0 check(count>=0),
  primary key(day,slot_id,kind)
);

create table if not exists public.sponsor_inquiries(
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 2 and 100),
  company text check(company is null or length(company)<=120),
  email text not null check(email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email)<=254),
  slots text[] not null default '{}',
  budget text check(budget is null or length(budget)<=60),
  message text not null check(length(message) between 10 and 2000),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.sponsor_slots enable row level security;
alter table public.sponsor_events enable row level security;
alter table public.sponsor_inquiries enable row level security;
revoke all on public.sponsor_slots,public.sponsor_events,public.sponsor_inquiries from public,anon,authenticated;
-- The public sees only live slots. Everything else goes through the server with the service role.
create policy sponsor_slots_live on public.sponsor_slots for select to anon,authenticated using(active and current_date between starts_on and ends_on);
grant select on public.sponsor_slots to anon,authenticated;
grant all on public.sponsor_slots,public.sponsor_events,public.sponsor_inquiries to service_role;

create or replace function public.sponsor_event(p_slot uuid,p_kind text) returns void language sql volatile security definer set search_path='' as $$
  insert into public.sponsor_events(day,slot_id,kind,count)
  select current_date,s.id,p_kind,1 from public.sponsor_slots s
  where s.id=p_slot and s.active and current_date between s.starts_on and s.ends_on and p_kind in ('impression','click')
  on conflict(day,slot_id,kind) do update set count=public.sponsor_events.count+1;
$$;
revoke all on function public.sponsor_event(uuid,text) from public,anon,authenticated;
grant execute on function public.sponsor_event(uuid,text) to service_role;

-- Report for sponsors: impressions, clicks and click-through rate per slot and day.
create or replace view public.sponsor_report with (security_invoker=true) as
  select s.sponsor_name,s.slot,s.board,e.day,
    sum(e.count) filter(where e.kind='impression') impressions,
    sum(e.count) filter(where e.kind='click') clicks,
    round(100.0*sum(e.count) filter(where e.kind='click')/nullif(sum(e.count) filter(where e.kind='impression'),0),2) ctr_percent
  from public.sponsor_events e join public.sponsor_slots s on s.id=e.slot_id group by 1,2,3,4;
revoke all on public.sponsor_report from public,anon,authenticated;
grant select on public.sponsor_report to service_role;
