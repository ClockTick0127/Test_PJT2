-- Account storage adapter. Apply after 001_initial_schema.sql.
alter table public.experiences add column skills text[] not null default '{}',
  add column competencies text[] not null default '{}',
  add column color text not null default 'blue', add column icon text not null default 'code';
alter table public.evidence add column supported_skills text[] not null default '{}';
alter table public.job_postings add column responsibilities text[] not null default '{}';
alter table public.profiles add constraint profile_name_length check(length(btrim(name)) between 1 and 40);
alter table public.experiences add constraint experience_title_length check (length(title) between 1 and 100),
  add constraint experience_body_length check (length(description) between 1 and 5000),
  add constraint experience_role_length check (length(role) between 1 and 500),
  add constraint experience_icon check (icon in ('code','heart','brain','design','briefcase','users'));
alter table public.analysis_claims add constraint claim_section_unique unique(experience_id, section),
  add constraint claim_identity unique(experience_id, id);
create table public.claim_sources (
  experience_id uuid not null, claim_id uuid not null, evidence_id uuid not null,
  primary key(claim_id, evidence_id),
  foreign key(experience_id, claim_id) references public.analysis_claims(experience_id, id) on delete cascade,
  foreign key(experience_id, evidence_id) references public.evidence(experience_id, id) on delete cascade
);
alter table public.claim_sources enable row level security;
create policy own_claim_sources on public.claim_sources for all to authenticated
  using (exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()))
  with check (exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()));

-- Only a future trusted collector may mark raw sources or claims as verified.
drop policy own_parent on public.evidence;
create policy own_evidence on public.evidence for all to authenticated
  using (exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()))
  with check (status <> 'source_verified' and exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()));
drop policy own_parent on public.analysis_claims;
create policy own_claims on public.analysis_claims for all to authenticated
  using (exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()))
  with check (status <> 'source_verified' and exists(select 1 from public.experiences e where e.id = experience_id and e.user_id = auth.uid()));
drop policy own_portfolios on public.portfolios;
create policy own_portfolios on public.portfolios for all to authenticated using(user_id = auth.uid())
  with check(user_id = auth.uid() and (job_id is null or exists(select 1 from public.job_postings j where j.id = job_id and j.user_id = auth.uid())));

create function public.folio_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name,email,headline,about)
    values(new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), split_part(new.email,'@',1),'새로운 사용자'),40),
      coalesce(new.email,''), '경험으로 나를 소개합니다.', '')
    on conflict(id) do update set email = excluded.email;
  return new;
end $$;
revoke all on function public.folio_create_profile() from public, anon, authenticated;
create trigger folio_auth_profile after insert or update of email on auth.users
  for each row execute function public.folio_create_profile();
insert into public.profiles(id,name,email,headline,about)
  select id,left(coalesce(nullif(btrim(raw_user_meta_data->>'name'),''),split_part(email,'@',1),'새로운 사용자'),40),
    coalesce(email,''),'경험으로 나를 소개합니다.','' from auth.users on conflict(id) do nothing;

-- RLS remains in force: every save is executed as the signed-in caller.
create function public.folio_save_experience(doc jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare eid uuid := (doc->>'id')::uuid; item jsonb; cid uuid; sid uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce((doc->>'isDemo')::boolean,false) then raise exception 'Demo records cannot be uploaded'; end if;
  insert into public.experiences(id,user_id,title,type,organization,start_date,end_date,description,role,status,skills,competencies,color,icon,created_at)
    values(eid,auth.uid(),doc->>'title',doc->>'type',doc->>'organization',
      (nullif(doc->>'startDate','')||'-01')::date,(nullif(doc->>'endDate','')||'-01')::date,
      doc->>'description',doc->>'role',doc->>'status',
      array(select jsonb_array_elements_text(doc->'skills')),array(select jsonb_array_elements_text(doc->'competencies')),
      coalesce(doc->>'color','blue'),coalesce(doc->>'icon','code'),(doc->>'createdAt')::timestamptz)
    on conflict(id) do update set title=excluded.title,type=excluded.type,organization=excluded.organization,
      start_date=excluded.start_date,end_date=excluded.end_date,description=excluded.description,role=excluded.role,
      status=excluded.status,skills=excluded.skills,competencies=excluded.competencies,color=excluded.color,icon=excluded.icon;
  delete from public.analysis_claims where experience_id=eid;
  delete from public.evidence where experience_id=eid;
  for item in select * from jsonb_array_elements(doc->'evidence') loop
    insert into public.evidence(id,experience_id,type,source,content,source_url,reference,status,supported_skills)
      values((item->>'id')::uuid,eid,item->>'type',item->>'source',item->>'content',item->>'url',item->>'reference',
        case when item->>'status'='needs_review' then 'unverified' else item->>'status' end,
        array(select jsonb_array_elements_text(item->'supportedSkills')));
  end loop;
  for item in select * from jsonb_array_elements(doc->'claims') loop
    cid := gen_random_uuid();
    insert into public.analysis_claims(id,experience_id,section,content,status)
      values(cid,eid,item->>'section',item->>'content',item->>'status');
    for sid in select value::uuid from jsonb_array_elements_text(item->'evidenceIds') loop
      insert into public.claim_sources(experience_id,claim_id,evidence_id) values(eid,cid,sid);
    end loop;
  end loop;
  insert into public.experience_analyses(experience_id,problem,role,action,result,learning,approved_at)
    select eid, max(content) filter(where section='problem'),max(content) filter(where section='role'),
      max(content) filter(where section='action'),max(content) filter(where section='result'),max(content) filter(where section='learning'),
      case when doc->>'status'='approved' then now() else null end from public.analysis_claims where experience_id=eid
    on conflict(experience_id) do update set problem=excluded.problem,role=excluded.role,action=excluded.action,
      result=excluded.result,learning=excluded.learning,approved_at=excluded.approved_at,version=public.experience_analyses.version+1;
end $$;

create function public.folio_save_job(doc jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare jid uuid := (doc->>'id')::uuid; item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce((doc->>'isDemo')::boolean,false) then raise exception 'Demo records cannot be uploaded'; end if;
  insert into public.job_postings(id,user_id,company,position,description,url,responsibilities,created_at)
    values(jid,auth.uid(),doc->>'company',doc->>'position',doc->>'description',doc->>'url',
      array(select jsonb_array_elements_text(doc->'responsibilities')),(doc->>'createdAt')::timestamptz)
    on conflict(id) do update set company=excluded.company,position=excluded.position,description=excluded.description,
      url=excluded.url,responsibilities=excluded.responsibilities;
  delete from public.job_skills where job_id=jid;
  for item in select * from jsonb_array_elements(doc->'skills') loop
    insert into public.job_skills(job_id,skill,importance,requirement)
      values(jid,item->>'name',(item->>'importance')::int,item->>'kind');
  end loop;
end $$;

create function public.folio_save_portfolio(doc jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare pid uuid := (doc->>'id')::uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  insert into public.portfolios(id,user_id,job_id,title,slug,visibility,created_at)
    values(pid,auth.uid(),nullif(doc->>'jobId','')::uuid,doc->>'title',doc->>'slug',doc->>'visibility',(doc->>'createdAt')::timestamptz)
    on conflict(id) do update set title=excluded.title,slug=excluded.slug,visibility=excluded.visibility,job_id=excluded.job_id;
  delete from public.portfolio_experiences where portfolio_id=pid;
  insert into public.portfolio_experiences(portfolio_id,experience_id,sort_order)
    select pid,value::uuid,(ordinality-1)::int from jsonb_array_elements_text(doc->'experienceIds') with ordinality;
end $$;

create function public.folio_apply_changes(changes jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare item jsonb; row_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if (changes->>'userId')::uuid is distinct from auth.uid() then
    raise exception 'Account changed during save' using errcode='42501';
  end if;
  if changes ? 'profile' then
    update public.profiles set name=changes->'profile'->>'name',headline=changes->'profile'->>'headline',about=changes->'profile'->>'about'
      where id=auth.uid();
  end if;
  for row_id in select value::uuid from jsonb_array_elements_text(changes->'deletedPortfolios') loop
    delete from public.portfolios where id=row_id;
  end loop;
  for row_id in select value::uuid from jsonb_array_elements_text(changes->'deletedJobs') loop
    delete from public.job_postings where id=row_id;
  end loop;
  for row_id in select value::uuid from jsonb_array_elements_text(changes->'deletedExperiences') loop
    delete from public.experiences where id=row_id;
  end loop;
  for item in select * from jsonb_array_elements(changes->'experiences') loop perform public.folio_save_experience(item); end loop;
  for item in select * from jsonb_array_elements(changes->'jobs') loop perform public.folio_save_job(item); end loop;
  for item in select * from jsonb_array_elements(changes->'portfolios') loop perform public.folio_save_portfolio(item); end loop;
end $$;

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.profiles,public.experiences,public.experience_analyses,
  public.evidence,public.analysis_claims,public.claim_sources,public.job_postings,public.job_skills,
  public.portfolios,public.portfolio_experiences to authenticated;
revoke all on function public.folio_save_experience(jsonb),public.folio_save_job(jsonb),
  public.folio_save_portfolio(jsonb),public.folio_apply_changes(jsonb) from public,anon;
grant execute on function public.folio_save_experience(jsonb),public.folio_save_job(jsonb),
  public.folio_save_portfolio(jsonb),public.folio_apply_changes(jsonb) to authenticated;
