-- ====================================================================
-- KREATIWIT AGENCYOS — OPPORTUNITY CREATOR & CONVERSION ENHANCEMENTS
-- Migration: 20261102050000_opportunity_creator_and_conversion_enhancements.sql
-- ====================================================================

-- 1. Ensure concurrency-safe, transactional Lead-to-Opportunity conversion RPC
-- Supports explicit custom client fields, duplicate protection, source-lead row locking,
-- and strict idempotency.

create or replace function public.rpc_convert_lead_to_opportunity_and_client(
  p_lead_id uuid,
  p_actor text default 'User',
  p_target_client_id uuid default null,
  p_initial_opp_stage text default 'Qualified',
  p_opportunity_title text default null,
  p_estimated_value numeric default null,
  p_expected_close_date date default null,
  p_new_client_name text default null,
  p_new_client_contact text default null,
  p_new_client_email text default null,
  p_new_client_notes text default null,
  p_opportunity_owner text default null,
  p_opportunity_description text default null
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
  v_owner text;
  v_desc text;
  v_client_name text;
  v_client_contact text;
  v_client_email text;
  v_client_notes text;
begin
  -- 1. Fetch the lead with row-level locking to prevent concurrent conversion race conditions
  select * into v_lead 
  from public.leads 
  where id = p_lead_id 
  for update;

  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  -- 2. Strict Idempotency Check: if already converted, return existing records immediately
  if v_lead.converted_to_opportunity_id is not null then
    select * into v_opp from public.opportunities where id = v_lead.converted_to_opportunity_id;
    if found then
      select * into v_client from public.clients where id = v_opp.client_id;
      return jsonb_build_object(
        'lead', to_jsonb(v_lead),
        'client', to_jsonb(v_client),
        'opportunity', to_jsonb(v_opp),
        'already_converted', true
      );
    end if;
  end if;

  -- Secondary Idempotency: Check if an opportunity was already generated from this source lead
  select * into v_opp from public.opportunities where source_lead_id = v_lead.id limit 1;
  if found then
    select * into v_client from public.clients where id = v_opp.client_id;
    update public.leads
    set converted_to_opportunity_id = v_opp.id,
        converted_opportunity_no = v_opp.opportunity_no,
        converted_to_client_id = v_client.id,
        converted_at = coalesce(converted_at, now())
    where id = v_lead.id
    returning * into v_lead;

    return jsonb_build_object(
      'lead', to_jsonb(v_lead),
      'client', to_jsonb(v_client),
      'opportunity', to_jsonb(v_opp),
      'already_converted', true
    );
  end if;

  -- 3. Client Account Identification / Association
  if p_target_client_id is not null then
    -- Explicit existing client association
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
    -- Creating or matching client using form-provided values first, falling back to lead
    v_client_name := coalesce(nullif(trim(p_new_client_name), ''), v_lead.name);
    v_client_contact := coalesce(nullif(trim(p_new_client_contact), ''), v_lead.contact_person);
    v_client_email := coalesce(nullif(trim(p_new_client_email), ''), v_lead.email);
    v_client_notes := coalesce(nullif(trim(p_new_client_notes), ''), v_lead.notes, 'Created via Opportunity conversion.');

    -- Match by exact email or trimmed case-insensitive name within org
    select id into v_client_id from public.clients
    where organization_id = v_lead.organization_id
      and (
        (v_client_email is not null and length(trim(v_client_email)) > 0 and lower(email) = lower(trim(v_client_email)))
        or lower(trim(name)) = lower(trim(v_client_name))
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
        v_client_name,
        v_client_contact,
        v_client_email,
        v_client_notes,
        'active'
      )
      returning * into v_client;
      v_client_id := v_client.id;
    else
      select * into v_client from public.clients where id = v_client_id;
    end if;
  end if;

  -- 4. Create Primary Contact if contact_person exists and contact not already present
  v_client_contact := coalesce(nullif(trim(p_new_client_contact), ''), v_lead.contact_person);
  v_client_email := coalesce(nullif(trim(p_new_client_email), ''), v_lead.email);

  if v_client_contact is not null and length(trim(v_client_contact)) > 0 then
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
      v_client_contact,
      'Lead Liaison',
      v_client_email,
      true
    where not exists (
      select 1 from public.contacts
      where client_id = v_client_id
        and lower(trim(name)) = lower(trim(v_client_contact))
    );
  end if;

  -- 5. Calculate Stage, Values & Owner
  -- Default stage to 'Qualified', never forcing 'Won'
  v_opp_stage := coalesce(p_initial_opp_stage, 'Qualified');
  if v_opp_stage not in ('Open', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Hold') then
    v_opp_stage := 'Qualified';
  end if;

  v_title := coalesce(
    nullif(trim(p_opportunity_title), ''),
    v_client.name || ' / ' || coalesce(v_lead.service, 'Commercial Engagement')
  );

  v_val := coalesce(p_estimated_value, v_lead.estimated_value, 0);
  v_owner := coalesce(nullif(trim(p_opportunity_owner), ''), v_lead.owner_name, 'Abhishek');
  v_desc := coalesce(nullif(trim(p_opportunity_description), ''), v_lead.notes);

  -- 6. Create Opportunity with permanent human-readable opportunity_no
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
    v_desc,
    v_val,
    'INR',
    v_opp_stage,
    v_owner,
    coalesce(p_expected_close_date, current_date + interval '30 days'),
    'active'
  )
  returning * into v_opp;

  -- 7. Atomically update the source lead
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

  -- 8. Log Activity Event
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
