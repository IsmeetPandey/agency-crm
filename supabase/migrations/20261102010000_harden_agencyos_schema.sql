-- ====================================================================
-- KREATIWIT AGENCYOS — SECOND-STAGE DATABASE HARDENING & RPC FUNCTIONS
-- ====================================================================

-- 1. Harden Security Definer Functions with strict search_path
create or replace function public.current_user_org_ids()
returns setof uuid as $$
  select organization_id from public.organization_memberships where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$ language sql stable security definer set search_path = public;

-- 2. Add High-Performance Compound Indexes for Tenant & Workflow queries
create index if not exists idx_leads_org_stage on public.leads(organization_id, stage);
create index if not exists idx_leads_org_owner on public.leads(organization_id, owner_id);
create index if not exists idx_projects_org_client on public.projects(organization_id, client_id);
create index if not exists idx_projects_org_phase on public.projects(organization_id, phase);
create index if not exists idx_tasks_org_proj_status on public.tasks(organization_id, project_id, status);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to_id);
create index if not exists idx_handoffs_org_status on public.handoffs(organization_id, status);
create index if not exists idx_approvals_org_status on public.approval_requests(organization_id, status);
create index if not exists idx_activity_org_created on public.activity_events(organization_id, created_at desc);

-- 3. Atomic Multi-Record Business Transactions via RPC

-- 3A. Idempotent Atomic Lead Conversion
create or replace function public.rpc_convert_lead_to_client(
  p_lead_id uuid,
  p_actor text default 'User'
)
returns jsonb as $$
declare
  v_lead public.leads%rowtype;
  v_client_id uuid;
  v_client public.clients%rowtype;
begin
  -- Fetch the lead
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  -- Check if already converted
  if v_lead.converted_to_client_id is not null then
    select * into v_client from public.clients where id = v_lead.converted_to_client_id;
    return jsonb_build_object(
      'lead', to_jsonb(v_lead),
      'client', to_jsonb(v_client),
      'already_converted', true
    );
  end if;

  -- Check if a client with the same name or email already exists in the same org
  select id into v_client_id from public.clients
  where organization_id = v_lead.organization_id
    and (lower(name) = lower(v_lead.name) or (v_lead.email is not null and lower(email) = lower(v_lead.email)))
  limit 1;

  if v_client_id is null then
    -- Create the new client
    insert into public.clients (
      organization_id,
      name,
      contact_person,
      email,
      notes
    ) values (
      v_lead.organization_id,
      v_lead.name,
      v_lead.contact_person,
      v_lead.email,
      coalesce(v_lead.notes, 'Converted from sales opportunity.')
    )
    returning * into v_client;
    v_client_id := v_client.id;
  else
    select * into v_client from public.clients where id = v_client_id;
  end if;

  -- Update the lead atomically
  update public.leads
  set stage = 'Won',
      converted_to_client_id = v_client_id,
      converted_at = now(),
      updated_at = now()
  where id = p_lead_id
  returning * into v_lead;

  -- Log the activity event
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
    'client',
    v_client_id::text,
    'converted',
    format('Opportunity "%s" converted to Client "%s"', v_lead.name, v_client.name),
    jsonb_build_object('lead_id', v_lead.id, 'client_id', v_client_id)
  );

  return jsonb_build_object(
    'lead', to_jsonb(v_lead),
    'client', to_jsonb(v_client),
    'already_converted', false
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 3B. Atomic Project Milestones Initialization
create or replace function public.rpc_initialize_project_milestones(
  p_project_id uuid,
  p_actor text default 'System'
)
returns integer as $$
declare
  v_proj public.projects%rowtype;
  v_gate_count integer := 0;
begin
  select * into v_proj from public.projects where id = p_project_id;
  if not found then
    raise exception 'Project % not found', p_project_id;
  end if;

  -- Insert 9 standard gates if they do not exist
  insert into public.project_gates (project_id, step_number, name, owner_dept, status)
  values
    (p_project_id, 1, 'Kickoff', 'PM', 'Approved'),
    (p_project_id, 2, 'Discovery', 'PM', 'Approved'),
    (p_project_id, 3, 'Design', 'Design', 'Approved'),
    (p_project_id, 4, 'Prototype', 'Frontend', 'Pending'),
    (p_project_id, 5, 'Build', 'Frontend', 'Pending'),
    (p_project_id, 6, 'QA', 'Testing', 'Pending'),
    (p_project_id, 7, 'UAT', 'PM', 'Pending'),
    (p_project_id, 8, 'Launch', 'DevOps', 'Pending'),
    (p_project_id, 9, 'Close', 'PM', 'Pending')
  on conflict (project_id, step_number) do nothing;

  get diagnostics v_gate_count = row_count;
  return v_gate_count;
end;
$$ language plpgsql security definer set search_path = public;

