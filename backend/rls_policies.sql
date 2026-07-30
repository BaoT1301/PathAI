-- PathAI — Row-Level Security (RLS) policies  [defense-in-depth]
-- Run ONCE in the Supabase SQL editor. Read the warning first.
--
-- WHY: your Supabase anon key ships in the frontend bundle (it's public by
-- design). Without RLS, anyone with that key could read/write these tables
-- directly via the Supabase REST API and see OTHER users' data. RLS closes that.
--
-- HOW IT AFFECTS THE APP: none, IF your backend's DATABASE_URL connects as the
-- Supabase `postgres`/service role (the default), which BYPASSES RLS. The
-- FastAPI backend does all reads/writes over that connection, so the app keeps
-- working; these policies only constrain direct anon-key access.
--
-- ⚠️  BEFORE RUNNING ON PRODUCTION: confirm the backend still works. Safest path:
--   1) Run ONLY the `jobs` block below first, reload the app, confirm jobs load.
--   2) Then run ONE per-user table (e.g. saved_jobs), confirm save/unsave works.
--   3) If both are fine, your role bypasses RLS -> run the rest.
-- If the app breaks after step 1/2, your DB role is subject to RLS; STOP and
-- tell me (we'd grant the backend role BYPASSRLS or use the service role).

-- ── Public content: jobs are readable by anyone, no writes via anon ──
alter table public.jobs enable row level security;
drop policy if exists "jobs readable by anyone" on public.jobs;
create policy "jobs readable by anyone" on public.jobs
  for select using (true);

-- ── Per-user tables: a user may only touch their own rows ──
-- user_id holds the Supabase auth uid as text, compared to auth.uid()::text.
do $$
declare t text;
begin
  foreach t in array array[
    'applications','saved_jobs','user_profiles','job_alerts','job_events','ai_usage'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "owner can read" on public.%I;', t);
    execute format('drop policy if exists "owner can write" on public.%I;', t);
    execute format(
      'create policy "owner can read" on public.%I for select using (user_id = auth.uid()::text);', t);
    execute format(
      'create policy "owner can write" on public.%I for all using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);', t);
  end loop;
end $$;
