-- Supabase projects may grant table privileges by default. RLS does not govern TRUNCATE.
revoke all on public.touring_editors,public.touring_drafts,public.touring_publications,public.touring_audit from anon,authenticated;
grant select on public.touring_editors,public.touring_audit to authenticated;
grant select,insert on public.touring_drafts to authenticated;
create index touring_drafts_created_at_idx on public.touring_drafts(created_at desc);
create index touring_audit_created_at_idx on public.touring_audit(created_at desc);
create function public.audit_touring_draft() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.touring_audit(actor,action,note) values(new.created_by,'save_draft',new.note);
 return new;
end $$;
revoke all on function public.audit_touring_draft() from public,anon,authenticated;
create trigger touring_draft_audit after insert on public.touring_drafts for each row execute function public.audit_touring_draft();
