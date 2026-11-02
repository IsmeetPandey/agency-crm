-- ====================================================================
-- KREATIWIT AGENCYOS — OPPORTUNITY LIFECYCLE REFINEMENT & IMMUTABILITY
-- Migration: 20261102040000_opportunity_lifecycle_refinement.sql
-- ====================================================================

-- 1. Ensure tasks and handoffs have cross-department opportunity tracking columns
alter table public.tasks
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists opportunity_no text;

alter table public.handoffs
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists opportunity_no text;

create index if not exists idx_tasks_opportunity on public.tasks(opportunity_id);
create index if not exists idx_handoffs_opportunity on public.handoffs(opportunity_id);

-- 2. Enforce strict immutability of opportunity_no
create or replace function public.prevent_opportunity_no_mutation()
returns trigger as $$
begin
  if new.opportunity_no is distinct from old.opportunity_no then
    raise exception 'Opportunity reference number (%) is immutable and cannot be changed.', old.opportunity_no;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_prevent_opportunity_no_mutation on public.opportunities;
create trigger tr_prevent_opportunity_no_mutation
  before update of opportunity_no on public.opportunities
  for each row execute function public.prevent_opportunity_no_mutation();

-- 3. Refined Atomic Lead-to-Opportunity Conversion RPC
-- Supports explicit client association or creation, user-selected stage (default: Qualified, NOT forced Won),
-- and absolute idempotency.
create or replace function public.rpc_convert_lead_to_opportunity_and_client(
  p_lead_id uuid,
  p_actor text default 'User',
  p_target_client_id uuid default null,
  p_initial_opp_stage text default 'Qualified',
  p_opportunity_title text default null,
  p_estimated_value numeric default null,
  p_expected_close_date date default null
)
returns jsonb as $$
declare
  v_lead public.leads%rowtype;
  v_client_id uuid;
  v_client public.clients%rowtype;
  v_opp public.opportunities%rowtype;
  v_opp_stage text;
  v_title text;
  v_val numeric;
begin
  -- Fetch the lead
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  -- 1. Idempotency Check: if already converted to an opportunity, return existing records
  if v_lead.converted_to_opportunity_id is not null then
    select * into v_opp from public.opportunities where id = v_lead.converted_to_opportunity_id;
    select * into v_client from public.clients where id = v_opp.client_id;
    return jsonb_build_object(
      'lead', to_jsonb(v_lead),
      'client', to_jsonb(v_client),
      'opportunity', to_jsonb(v_opp),
      'already_converted', true
    );
  end if;

  -- 2. Client Account Identification / Association
  if p_target_client_id is not null then
    -- Verify client belongs to same organization
    select * into v_client from public.clients 
    where id = p_target_client_id and organization_id = v_lead.organization_id;
    if not found then
      raise exception 'Target client % not found in organization', p_target_client_id;
    end if;
    v_client_id := v_client.id;
  elsif v_lead.converted_to_client_id is not null then
    v_client_id := v_lead.converted_to_client_id;
    select * into v_client from public.clients where id = v_client_id;
  else
    -- Match by exact email or trimmed case-insensitive name
    select id into v_client_id from public.clients
    where organization_id = v_lead.organization_id
      and (
        (v_lead.email is not null and length(trim(v_lead.email)) > 0 and lower(email) = lower(trim(v_lead.email)))
        or lower(trim(name)) = lower(trim(v_lead.name))
      )
    limit 1;

    if v_client_id is null then
      insert into public.clients (
        organization_id,
        name,
        contact_person,
        email,
        notes,
        status
      ) values (
        v_lead.organization_id,
        v_lead.name,
        v_lead.contact_person,
        v_lead.email,
        coalesce(v_lead.notes, 'Created via Opportunity conversion.'),
        'active'
      )
      returning * into v_client;
      v_client_id := v_client.id;
    else
      select * into v_client from public.clients where id = v_client_id;
    end if;
  end if;

  -- 3. Create Primary Contact if contact_person exists and contact does not already exist
  if v_lead.contact_person is not null and length(trim(v_lead.contact_person)) > 0 then
    insert into public.contacts (
      organization_id,
      client_id,
      name,
      role,
      email,
      is_primary
    )
    select 
      v_lead.organization_id,
      v_client_id,
      v_lead.contact_person,
      'Lead Liaison',
      v_lead.email,
      true
    where not exists (
      select 1 from public.contacts
      where client_id = v_client_id
        and lower(trim(name)) = lower(trim(v_lead.contact_person))
    );
  end if;

  -- 4. Calculate Stage & Values
  -- Default stage to 'Qualified', never forcing 'Won'
  v_opp_stage := coalesce(p_initial_opp_stage, 'Qualified');
  if v_opp_stage not in ('Open', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Hold') then
    v_opp_stage := 'Qualified';
  end if;

  v_title := coalesce(
    p_opportunity_title,
    v_client.name || ' / ' || coalesce(v_lead.service, 'Commercial Engagement')
  );

  v_val := coalesce(p_estimated_value, v_lead.estimated_value, 0);

  -- 5. Create Opportunity with permanent human-readable opportunity_no
  insert into public.opportunities (
    organization_id,
    client_id,
    source_lead_id,
    title,
    service,
    description,
    estimated_value,
    currency,
    stage,
    owner_name,
    expected_close_date,
    status
  ) values (
    v_lead.organization_id,
    v_client_id,
    v_lead.id,
    v_title,
    coalesce(v_lead.service, 'Consulting & Engineering'),
    v_lead.notes,
    v_val,
    'INR',
    v_opp_stage,
    coalesce(v_lead.owner_name, 'Abhishek'),
    coalesce(p_expected_close_date, current_date + interval '30 days'),
    'active'
  )
  returning * into v_opp;

  -- 6. Atomically update the source lead
  -- Mark relationship, set stage to Qualified or Proposal if it was New/Contacted, without forcing Won
  update public.leads
  set stage = case when v_opp_stage = 'Won' then 'Won' 
                   when stage in ('New', 'Contacted') then 'Qualified'
                   else stage end,
      converted_to_client_id = v_client_id,
      converted_to_opportunity_id = v_opp.id,
      converted_opportunity_no = v_opp.opportunity_no,
      converted_at = now(),
      updated_at = now()
  where id = p_lead_id
  returning * into v_lead;

  -- 7. Log Activity Event
  insert into public.activity_events (
    organization_id,
    actor_name,
    entity_type,
    entity_id,
    action,
    summary,
    metadata
  ) values (
    v_lead.organization_id,
    p_actor,
    'opportunity',
    v_opp.id::text,
    'converted',
    format('Lead "%s" converted to Opportunity %s (%s) and linked to Client "%s"', 
           v_lead.name, v_opp.opportunity_no, v_opp.stage, v_client.name),
    jsonb_build_object(
      'lead_id', v_lead.id,
      'client_id', v_client_id,
      'opportunity_id', v_opp.id,
      'opportunity_no', v_opp.opportunity_no,
      'stage', v_opp.stage
    )
  );

  return jsonb_build_object(
    'lead', to_jsonb(v_lead),
    'client', to_jsonb(v_client),
    'opportunity', to_jsonb(v_opp),
    'already_converted', false
  );
end;
$$ language plpgsql security definer set search_path = public;

