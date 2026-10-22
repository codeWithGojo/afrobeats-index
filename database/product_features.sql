-- Product feature schema. The only new public writes are owner-bound predictions,
-- consent settings, API-key digests and seasonal ballots. Provider observations stay editorial.
create table public.chart_predictions(user_id uuid not null references auth.users(id) on delete cascade,week text not null,picks text[] not null check(cardinality(picks)=5),submitted_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,week));
alter table public.chart_predictions enable row level security;
create policy predictions_read on public.chart_predictions for select to authenticated using(user_id=(select auth.uid()));
create policy predictions_insert on public.chart_predictions for insert to authenticated with check(user_id=(select auth.uid()) and week=to_char(date_trunc('week',now() at time zone 'UTC')+interval '1 week','IYYY-"W"IW'));
create policy predictions_update on public.chart_predictions for update to authenticated using(user_id=(select auth.uid()) and week=to_char(date_trunc('week',now() at time zone 'UTC')+interval '1 week','IYYY-"W"IW')) with check(user_id=(select auth.uid()) and week=to_char(date_trunc('week',now() at time zone 'UTC')+interval '1 week','IYYY-"W"IW'));
grant select on public.chart_predictions to authenticated;
grant insert(user_id,week,picks),update(picks) on public.chart_predictions to authenticated;
create schema if not exists private;
create function private.validate_prediction() returns trigger language plpgsql set search_path='' as $$
declare eligible text[];
begin
 if (select count(distinct p) from unnest(new.picks) p)<>5 then raise exception 'Choose five different artists';end if;
 select array_agg(a->>'slug') into eligible from jsonb_array_elements((select data->'artists' from public.chart_editions order by week desc limit 1)) a;
 if eligible is null or not(new.picks<@eligible) then raise exception 'Choose artists from the published chart';end if;
 if TG_OP='INSERT' then new.submitted_at=now();end if;new.updated_at=now();return new;
end $$;
create trigger predictions_valid before insert or update on public.chart_predictions for each row execute function private.validate_prediction();
create table public.newsletter_subscriptions(user_id uuid primary key references auth.users(id) on delete cascade,consent boolean not null default true,created_at timestamptz not null default now());
alter table public.newsletter_subscriptions enable row level security;
create policy newsletter_owner on public.newsletter_subscriptions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,delete on public.newsletter_subscriptions to authenticated;grant insert(user_id,consent),update(consent) on public.newsletter_subscriptions to authenticated;
create table public.signal_observations(id uuid primary key default gen_random_uuid(),artist_slug text not null,platform text not null check(platform in ('tiktok','shazam')),metric text not null check(metric in ('video_creations','views','shazams','city_shazams')),value numeric not null check(value>=0),territory text not null,city text,period_start date not null,period_end date not null,observed_at timestamptz not null,source_url text not null check(source_url like 'https://%'),reviewed boolean not null default false,check(period_end>=period_start),unique(artist_slug,platform,metric,territory,city,period_start,period_end,observed_at));
alter table public.signal_observations enable row level security;create policy signals_read on public.signal_observations for select to anon,authenticated using(reviewed);grant select on public.signal_observations to anon,authenticated;grant all on public.signal_observations to service_role;
create index signal_artist on public.signal_observations(artist_slug,observed_at desc);
create table public.summer_observations(season integer not null,track_id text not null,title text not null,artist_slug text not null,daily_streams bigint not null check(daily_streams>=0),observed_at date not null,source_url text not null check(source_url like 'https://%'),primary key(track_id,observed_at),check(observed_at>=make_date(season,6,1) and observed_at<=make_date(season,8,31)));
alter table public.summer_observations enable row level security;create policy summer_read on public.summer_observations for select to anon,authenticated using(true);grant select on public.summer_observations to anon,authenticated;grant all on public.summer_observations to service_role;
create table public.summer_ballots(user_id uuid not null references auth.users(id) on delete cascade,season integer not null,track_id text not null check(track_id~'^[A-Za-z0-9]{22}$'),primary key(user_id,season));
alter table public.summer_ballots enable row level security;
create policy summer_ballot_owner on public.summer_ballots for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and season=extract(year from now() at time zone 'UTC') and (now() at time zone 'UTC')::date between make_date(season,6,1) and make_date(season,8,31));grant select,insert,update,delete on public.summer_ballots to authenticated;
create table public.pro_subscriptions(user_id uuid primary key references auth.users(id) on delete cascade,expires_at timestamptz not null,payment_reference text unique not null);
alter table public.pro_subscriptions enable row level security;create policy pro_owner_read on public.pro_subscriptions for select to authenticated using(user_id=(select auth.uid()));grant select on public.pro_subscriptions to authenticated;grant all on public.pro_subscriptions to service_role;
create table public.api_keys(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,label text not null check(length(label) between 1 and 80),key_hash text not null unique check(key_hash~'^[a-f0-9]{64}$'),prefix text not null check(length(prefix)<20),created_at timestamptz not null default now(),revoked_at timestamptz);
alter table public.api_keys enable row level security;
create policy keys_owner on public.api_keys for select to authenticated using(user_id=(select auth.uid()));create policy keys_insert on public.api_keys for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.pro_subscriptions s where s.user_id=(select auth.uid()) and s.expires_at>now()));create policy keys_revoke on public.api_keys for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));grant select on public.api_keys to authenticated;grant insert(user_id,label,key_hash,prefix),update(revoked_at) on public.api_keys to authenticated;
create table private.api_usage(user_id uuid not null references auth.users(id) on delete cascade,day date not null default current_date,hits integer not null default 0,primary key(user_id,day));alter table private.api_usage enable row level security;
-- The server calls this as service_role only. The API key itself never goes to PostgREST.
create function public.consume_api_quota(digest text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare k public.api_keys; n integer;
begin
 select * into k from public.api_keys where key_hash=digest and revoked_at is null;
 if not found or not exists(select 1 from public.pro_subscriptions s where s.user_id=k.user_id and s.expires_at>now()) then return jsonb_build_object('allowed',false,'reason','unauthorized');end if;
 insert into private.api_usage(user_id,day,hits) values(k.user_id,(now() at time zone 'UTC')::date,1) on conflict(user_id,day) do update set hits=private.api_usage.hits+1 returning hits into n;
 return jsonb_build_object('allowed',n<=10000,'remaining',greatest(0,10000-n),'reason',case when n>10000 then 'quota' else 'ok' end);
end $$;
revoke all on function public.consume_api_quota(text) from public,anon,authenticated;grant execute on function public.consume_api_quota(text) to service_role;
grant usage on schema private to service_role;grant all on private.api_usage to service_role;
grant all on public.newsletter_subscriptions to service_role;
create table private.email_deliveries(week text not null,user_id uuid not null references auth.users(id) on delete cascade,provider_id text,delivered_at timestamptz,primary key(week,user_id));alter table private.email_deliveries enable row level security;grant all on private.email_deliveries to service_role;
revoke all on function private.validate_prediction() from public,anon,authenticated;

create table private.billing_orders(reference text primary key,user_id uuid not null references auth.users(id) on delete cascade,amount bigint not null check(amount>0),currency text not null,created_at timestamptz not null default now(),fulfilled_at timestamptz);
alter table private.billing_orders enable row level security;grant all on private.billing_orders to service_role;
create function public.fulfill_pro_payment(ref text,paid_amount bigint,paid_currency text) returns boolean language plpgsql security invoker set search_path='' as $$
declare o private.billing_orders;
begin
 select * into o from private.billing_orders where reference=ref for update;
 if not found or o.amount<>paid_amount or o.currency<>paid_currency then return false;end if;
 if o.fulfilled_at is not null then return true;end if;
 insert into public.pro_subscriptions(user_id,expires_at,payment_reference) values(o.user_id,now()+interval '30 days',ref) on conflict(user_id) do update set expires_at=greatest(public.pro_subscriptions.expires_at,now())+interval '30 days',payment_reference=ref;
 update private.billing_orders set fulfilled_at=now() where reference=ref;return true;
end $$;
revoke all on function public.fulfill_pro_payment(text,bigint,text) from public,anon,authenticated;grant execute on function public.fulfill_pro_payment(text,bigint,text) to service_role;

create function public.create_pro_order(ref text,owner uuid,price bigint,ccy text) returns void language sql security invoker set search_path='' as $$insert into private.billing_orders(reference,user_id,amount,currency) values(ref,owner,price,ccy);$$;
revoke all on function public.create_pro_order(text,uuid,bigint,text) from public,anon,authenticated;grant execute on function public.create_pro_order(text,uuid,bigint,text) to service_role;
create function public.newsletter_recipients() returns table(user_id uuid,email text) language sql security invoker set search_path='' as $$select s.user_id,u.email::text from public.newsletter_subscriptions s join auth.users u on u.id=s.user_id where s.consent and u.email_confirmed_at is not null;$$;
revoke all on function public.newsletter_recipients() from public,anon,authenticated;grant execute on function public.newsletter_recipients() to service_role;
create function public.record_newsletter_delivery(issue text,owner uuid,provider text) returns void language sql security invoker set search_path='' as $$insert into private.email_deliveries(week,user_id,provider_id,delivered_at) values(issue,owner,provider,now()) on conflict(week,user_id) do nothing;$$;
revoke all on function public.record_newsletter_delivery(text,uuid,text) from public,anon,authenticated;grant execute on function public.record_newsletter_delivery(text,uuid,text) to service_role;
create or replace function private.newsletter_recipient_list() returns table(user_id uuid,email text) language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Service role required';end if;
 return query select s.user_id,u.email::text from public.newsletter_subscriptions s join auth.users u on u.id=s.user_id where s.consent and u.email_confirmed_at is not null;
end $$;
revoke all on function private.newsletter_recipient_list() from public,anon,authenticated;grant execute on function private.newsletter_recipient_list() to service_role;
create or replace function public.newsletter_recipients() returns table(user_id uuid,email text) language sql security invoker set search_path='' as $$select * from private.newsletter_recipient_list();$$;
create function public.claim_newsletter_delivery(issue text,owner uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed integer;
begin
 insert into private.email_deliveries(week,user_id,provider_id) values(issue,owner,'pending') on conflict(week,user_id) do nothing;
 get diagnostics claimed=row_count;return claimed=1;
end $$;
revoke all on function public.claim_newsletter_delivery(text,uuid) from public,anon,authenticated;grant execute on function public.claim_newsletter_delivery(text,uuid) to service_role;
create or replace function public.record_newsletter_delivery(issue text,owner uuid,provider text) returns void language sql security invoker set search_path='' as $$update private.email_deliveries set provider_id=provider,delivered_at=now() where week=issue and user_id=owner;$$;
create or replace function public.newsletter_batch(issue text) returns table(user_id uuid,email text) language sql security invoker set search_path='' as $$select r.user_id,r.email from private.newsletter_recipient_list() r where not exists(select 1 from private.email_deliveries d where d.week=issue and d.user_id=r.user_id) order by r.user_id limit 10;$$;
revoke all on function public.newsletter_batch(text) from public,anon,authenticated;grant execute on function public.newsletter_batch(text) to service_role;
-- The project has broad default table grants. Remove those before granting the
-- precise operations supported by these new product features.
revoke all on public.chart_predictions,public.newsletter_subscriptions,public.api_keys,public.pro_subscriptions,public.signal_observations,public.summer_observations,public.summer_ballots from public,anon,authenticated;
grant select on public.chart_predictions to authenticated;
grant insert(user_id,week,picks),update(picks) on public.chart_predictions to authenticated;
grant select,delete on public.newsletter_subscriptions to authenticated;
grant insert(user_id,consent),update(consent) on public.newsletter_subscriptions to authenticated;
grant select on public.api_keys to authenticated;
grant insert(user_id,label,key_hash,prefix),update(revoked_at) on public.api_keys to authenticated;
grant select on public.pro_subscriptions to authenticated;
grant select on public.signal_observations,public.summer_observations to anon,authenticated;
grant select,delete on public.summer_ballots to authenticated;
grant insert(user_id,season,track_id),update(track_id) on public.summer_ballots to authenticated;
revoke all on private.api_usage,private.billing_orders,private.email_deliveries from public,anon,authenticated;
