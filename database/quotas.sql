create function public.limit_community_writes() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 perform pg_advisory_xact_lock(hashtext(new.user_id::text));
 execute format('select count(*) from public.%I where user_id=$1 and created_at>now()-interval ''1 day''',TG_TABLE_NAME) into n using new.user_id;
 if n>=30 then raise exception 'Daily limit reached. Please try again tomorrow.';end if;
 return new;
end $$;
create trigger receipts_quota before insert on public.receipts for each row execute function public.limit_community_writes();
create trigger comments_quota before insert on public.comments for each row execute function public.limit_community_writes();
create trigger corrections_quota before insert on public.corrections for each row execute function public.limit_community_writes();
alter table public.receipts add constraint receipt_payload_shape check(jsonb_typeof(payload)='object' and jsonb_typeof(payload->'tracks')='array' and jsonb_typeof(payload->'artists')='array' and jsonb_array_length(payload->'tracks')<=10 and jsonb_array_length(payload->'artists')<=10);
