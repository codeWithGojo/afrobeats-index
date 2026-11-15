-- Additive touring document editions, matching the existing chart_editions pattern.
-- Nested models and cross-references are validated by touring-model.js before publication.
create table public.touring_editors (
 user_id uuid primary key references auth.users(id), created_at timestamptz not null default now()
);
alter table public.touring_editors enable row level security;
grant select on public.touring_editors to authenticated;
create policy touring_editor_self on public.touring_editors for select to authenticated using ((select auth.uid())=user_id);

create table public.touring_drafts (
 id uuid primary key default gen_random_uuid(), payload jsonb not null check(octet_length(payload::text)<1500000),
 note text not null check(length(note) between 10 and 4000), created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.touring_drafts enable row level security;
grant select,insert on public.touring_drafts to authenticated;
create policy touring_draft_read on public.touring_drafts for select to authenticated using (exists(select 1 from public.touring_editors where user_id=(select auth.uid())));
create policy touring_draft_insert on public.touring_drafts for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.touring_editors where user_id=(select auth.uid())));

create table public.touring_publications (
 id bigint generated always as identity primary key,
 payload jsonb not null check(octet_length(payload::text)<1500000 and payload->>'schemaVersion'='1'),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
alter table public.touring_publications enable row level security;
-- Raw source-permission evidence is private; only sanitized API responses are public.
revoke all on public.touring_publications from anon,authenticated;
create table public.touring_audit (
 id bigint generated always as identity primary key, actor uuid not null references auth.users(id),
 action text not null, publication_id bigint references public.touring_publications(id), note text not null,
 created_at timestamptz not null default now()
);
alter table public.touring_audit enable row level security;
grant select on public.touring_audit to authenticated;
create policy touring_audit_read on public.touring_audit for select to authenticated using (exists(select 1 from public.touring_editors where user_id=(select auth.uid())));
grant all on public.touring_editors,public.touring_drafts,public.touring_publications,public.touring_audit to service_role;
grant usage,select on sequence public.touring_publications_id_seq,public.touring_audit_id_seq to service_role;
create function public.publish_touring(p_payload jsonb,p_expected bigint,p_actor uuid,p_note text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare latest bigint; result bigint;
begin
 if not exists(select 1 from public.touring_editors where user_id=p_actor) then raise exception 'Editor access revoked'; end if;
 perform pg_advisory_xact_lock(74687123);
 select coalesce(max(id),0) into latest from public.touring_publications;
 if latest<>p_expected then raise exception 'Publication changed; reload before publishing'; end if;
 if length(p_note)<10 or length(p_note)>4000 then raise exception 'Review note required'; end if;
 insert into public.touring_publications(payload,created_by) values(p_payload,p_actor) returning id into result;
 insert into public.touring_audit(actor,action,publication_id,note) values(p_actor,'publish',result,p_note);
 return result;
end $$;
revoke execute on function public.publish_touring(jsonb,bigint,uuid,text) from public,anon,authenticated;
grant execute on function public.publish_touring(jsonb,bigint,uuid,text) to service_role;
