-- Future Supabase schema. Not executed by the local prototype.
create extension if not exists pgcrypto;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, email text not null, profile_image text,
  headline text, about text, created_at timestamptz not null default now()
);
create table public.experiences (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, type text not null check (type in ('프로젝트','인턴','연구','공모전','동아리','아르바이트','개인 활동','기타')),
  organization text, start_date date, end_date date, description text not null, role text not null,
  team_size int check (team_size > 0), status text not null default 'draft' check (status in ('draft','review','approved')),
  created_at timestamptz not null default now(), check (end_date is null or start_date is null or end_date >= start_date)
);
create table public.experience_analyses (
  experience_id uuid primary key references public.experiences(id) on delete cascade,
  problem text, role text, action text, result text, learning text,
  approved_at timestamptz, version int not null default 1
);
create table public.skills (id uuid primary key default gen_random_uuid(), name text unique not null, category text not null);
create table public.experience_skills (
  experience_id uuid references public.experiences(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  confidence numeric not null check (confidence between 0 and 1),
  confirmed boolean not null default false, primary key (experience_id, skill_id)
);
create table public.evidence (
  id uuid primary key default gen_random_uuid(), experience_id uuid not null references public.experiences(id) on delete cascade,
  type text not null check (type in ('manual','pdf','github','document','image')),
  source text not null, content text, source_url text, reference text,
  status text not null default 'unverified' check (status in ('unverified','user_confirmed','source_verified')),
  unique (experience_id, id)
);
-- Claims link to exact sources; attaching a URL alone is not verification.
create table public.analysis_claims (
  id uuid primary key default gen_random_uuid(), experience_id uuid not null references public.experiences(id) on delete cascade,
  section text not null check (section in ('problem','role','action','result','learning')),
  content text not null, evidence_id uuid,
  quote text, status text not null default 'needs_review' check (status in ('needs_review','user_confirmed','source_verified')),
  foreign key (experience_id, evidence_id) references public.evidence(experience_id, id) on delete set null (evidence_id)
);
create table public.experience_skill_evidence (
  experience_id uuid not null, skill_id uuid not null, evidence_id uuid not null,
  primary key (experience_id, skill_id, evidence_id),
  foreign key (experience_id, skill_id) references public.experience_skills(experience_id, skill_id) on delete cascade,
  foreign key (experience_id, evidence_id) references public.evidence(experience_id, id) on delete cascade
);
create table public.job_postings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null, position text not null, description text not null, url text,
  created_at timestamptz not null default now()
);
create table public.job_skills (
  job_id uuid references public.job_postings(id) on delete cascade, skill text not null,
  importance int not null check (importance between 1 and 5), requirement text not null check (requirement in ('required','preferred')),
  primary key (job_id, skill)
);
create table public.experience_matches (
  job_id uuid references public.job_postings(id) on delete cascade,
  experience_id uuid references public.experiences(id) on delete cascade,
  match_score numeric not null check (match_score between 0 and 100), reason jsonb not null,
  primary key (job_id, experience_id)
);
create table public.portfolios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.job_postings(id) on delete set null,
  title text not null, slug text not null unique, visibility text not null default 'private' check (visibility in ('private','link','public')),
  created_at timestamptz not null default now()
);
create table public.portfolio_experiences (
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  experience_id uuid references public.experiences(id) on delete cascade,
  sort_order int not null check (sort_order >= 0), primary key (portfolio_id, experience_id), unique (portfolio_id, sort_order)
);

-- Default deny, then enable ownership policies on all user data.
do $$ declare t text; begin
  foreach t in array array['profiles','experiences','experience_analyses','experience_skills','experience_skill_evidence','evidence','analysis_claims','job_postings','job_skills','experience_matches','portfolios','portfolio_experiences'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
create policy own_profile on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy own_experiences on public.experiences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_jobs on public.job_postings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_portfolios on public.portfolios for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
do $$ declare t text; begin
  foreach t in array array['experience_analyses','experience_skills','experience_skill_evidence','evidence','analysis_claims'] loop
    execute format('create policy own_parent on public.%I for all to authenticated using (exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid())) with check (exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()))', t);
  end loop;
end $$;
create policy own_job_skills on public.job_skills for all to authenticated using (exists (select 1 from public.job_postings j where j.id = job_id and j.user_id = auth.uid())) with check (exists (select 1 from public.job_postings j where j.id = job_id and j.user_id = auth.uid()));
create policy own_matches on public.experience_matches for all to authenticated using (exists (select 1 from public.job_postings j where j.id = job_id and j.user_id = auth.uid()) and exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid())) with check (exists (select 1 from public.job_postings j where j.id = job_id and j.user_id = auth.uid()) and exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()));
create policy own_portfolio_items on public.portfolio_experiences for all to authenticated using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()) and exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid())) with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()) and exists (select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()));
alter table public.skills enable row level security;
create policy read_skills on public.skills for select to authenticated using (true);
create index experiences_user on public.experiences(user_id);
create index jobs_user on public.job_postings(user_id);
create index evidence_experience on public.evidence(experience_id);
-- No anonymous public policies: publish through a server endpoint that selects
-- only an explicitly published portfolio and approved claims, never raw evidence.
