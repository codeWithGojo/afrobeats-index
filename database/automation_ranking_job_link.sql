-- Link ranking snapshots to the collector run that recorded them.
-- Existing rows stay intact and have a null job_id.
alter table public.ranking_snapshots
  add column if not exists job_id uuid references public.ingestion_jobs(id);

create index if not exists ranking_snapshots_job_id_idx
  on public.ranking_snapshots(job_id);
