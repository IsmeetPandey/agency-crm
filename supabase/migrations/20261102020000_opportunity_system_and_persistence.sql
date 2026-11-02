-- ====================================================================
-- KREATIWIT AGENCYOS — OPPORTUNITY MANAGEMENT SYSTEM & PERSISTENCE
-- Migration: 20261102020000_opportunity_system_and_persistence.sql
-- ====================================================================

-- 1. Human-Readable Opportunity Number Sequence
create sequence if not exists public.opportunity_no_seq start with 1 increment by 1;

create or replace function public.generate_opportunity_no()
returns text as $$
begin
  return format('KW-OPP-%s', lpad(nextval('public.opportunity_no_seq')::text, 6, '0'));
end;
$$ language plpgsql;

-- 2. Opportunities Table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_no text not null unique default public.generate_opportunity_no(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source_lead_id uuid unique references public.leads(id) on delete set null,
  title text not null,
  service text not null,
  description text,
  estimated_value numeric(12,2) not null default 0 check (estimated_value >= 0),
  currency text not null default 'INR',
  stage text not null default 'Open' check (stage in ('Open', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Hold')),
  owner_name text not null default 'Unassigned',
  expected_close_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.handle_updated_at();

create index if not exists idx_opportunities_org_stage on public.opportunities(organization_id, stage);
create index if not exists idx_opportunities_client on public.opportunities(client_id);
create index if not exists idx_opportunities_no on public.opportunities(opportunity_no);
create index if not exists idx_opportunities_source_lead on public.opportunities(source_lead_id);

-- 3. Contacts Table (Client Stakeholders)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role text not null default 'Representative',
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_contacts_updated_at
  before update on public.contacts
  for each row execute function public.handle_updated_at();

create index if not exists idx_contacts_org_client on public.contacts(organization_id, client_id);
create index if not exists idx_contacts_client_primary on public.contacts(client_id, is_primary);

-- 4. Finance Records Table (Proposals, Quotes, Invoices)
create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  opportunity_no text,
  type text not null check (type in ('proposal', 'quotation', 'invoice')),
  title text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Accepted', 'Paid', 'Overdue', 'Declined')),
  issued_date date not null default current_date,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_finance_records_updated_at
  before update on public.finance_records
  for each row execute function public.handle_updated_at();

create index if not exists idx_finance_org_client on public.finance_records(organization_id, client_id);
create index if not exists idx_finance_project on public.finance_records(project_id);
create index if not exists idx_finance_opportunity on public.finance_records(opportunity_id);
create index if not exists idx_finance_status on public.finance_records(status);

-- 5. Notes Table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('lead', 'client', 'opportunity', 'project', 'task')),
  entity_id text not null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notes_org_entity on public.notes(organization_id, entity_type, entity_id);

-- 6. Enhance Existing Tables with Cross-Department Opportunity References and Archive Status
alter table public.projects
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists opportunity_no text,
  add column if not exists status text not null default 'active';

alter table public.clients
  add column if not exists status text not null default 'active';

alter table public.leads
  add column if not exists converted_to_opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists converted_opportunity_no text;

-- 7. Row Level Security Policies
alter table public.opportunities enable row level security;
alter table public.contacts enable row level security;
alter table public.finance_records enable row level security;
alter table public.notes enable row level security;

-- Opportunities RLS
create policy "Opportunities: Read by org members"
  on public.opportunities for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Opportunities: Insert by org members"
  on public.opportunities for insert
  with check (organization_id in (select public.current_user_org_ids()));

create policy "Opportunities: Update by org members"
  on public.opportunities for update
  using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

create policy "Opportunities: Delete by owners/admins"
  on public.opportunities for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- Contacts RLS
create policy "Contacts: Read by org members"
  on public.contacts for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Contacts: Insert by org members"
  on public.contacts for insert
  with check (organization_id in (select public.current_user_org_ids()));

create policy "Contacts: Update by org members"
  on public.contacts for update
  using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

create policy "Contacts: Delete by owners/admins"
  on public.contacts for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- Finance Records RLS
create policy "Finance: Read by org members"
  on public.finance_records for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Finance: Insert by management"
  on public.finance_records for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

create policy "Finance: Update by management"
  on public.finance_records for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

create policy "Finance: Delete by owners/admins"
  on public.finance_records for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- Notes RLS
create policy "Notes: Read by org members"
  on public.notes for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Notes: Insert by org members"
  on public.notes for insert
  with check (organization_id in (select public.current_user_org_ids()));

create policy "Notes: Delete by author or admin"
  on public.notes for delete
  using (organization_id in (select public.current_user_org_ids()));

-- 8. Atomic Lead to Opportunity & Client Conversion RPC
create or replace function public.rpc_convert_lead_to_opportunity_and_client(
  p_lead_id uuid,
  p_actor text default 'User'
)
returns jsonb as $$
declare
  v_lead public.leads%rowtype;
  v_client_id uuid;
  v_client public.clients%rowtype;
  v_opp public.opportunities%rowtype;
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

  -- 2. Client Account Identification (Reliable match or creation)
  if v_lead.converted_to_client_id is not null then
    v_client_id := v_lead.converted_to_client_id;
    select * into v_client from public.clients where id = v_client_id;
  else
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
        coalesce(v_lead.notes, 'Converted from sales opportunity.'),
        'active'
      )
      returning * into v_client;
      v_client_id := v_client.id;
    else
      select * into v_client from public.clients where id = v_client_id;
    end if;
  end if;

  -- 3. Create Primary Contact if contact_person exists
  if v_lead.contact_person is not null and length(trim(v_lead.contact_person)) > 0 then
    insert into public.contacts (
      organization_id,
      client_id,
      name,
      role,
      email,
      is_primary
    ) values (
      v_lead.organization_id,
      v_client_id,
      v_lead.contact_person,
      'Lead Liaison',
      v_lead.email,
      true
    ) on conflict do nothing;
  end if;

  -- 4. Create Opportunity with permanent human-readable opportunity_no
  insert into public.opportunities (
    organization_id,
    client_id,
    source_lead_id,
    title,
    service,
    description,
    estimated_value,
    stage,
    owner_name,
    expected_close_date,
    status
  ) values (
    v_lead.organization_id,
    v_client_id,
    v_lead.id,
    coalesce(v_lead.service, v_lead.name || ' Commercial Engagement'),
    coalesce(v_lead.service, 'Consulting & Engineering'),
    v_lead.notes,
    coalesce(v_lead.estimated_value, 0),
    'Won',
    coalesce(v_lead.owner_name, 'Abhishek'),
    current_date,
    'active'
  )
  returning * into v_opp;

  -- 5. Atomically update the source lead
  update public.leads
  set stage = 'Won',
      converted_to_client_id = v_client_id,
      converted_to_opportunity_id = v_opp.id,
      converted_opportunity_no = v_opp.opportunity_no,
      converted_at = now(),
      updated_at = now()
  where id = p_lead_id
  returning * into v_lead;

  -- 6. Log Activity Event
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
    format('Lead "%s" converted to Opportunity %s and Account "%s"', v_lead.name, v_opp.opportunity_no, v_client.name),
    jsonb_build_object(
      'lead_id', v_lead.id,
      'client_id', v_client_id,
      'opportunity_id', v_opp.id,
      'opportunity_no', v_opp.opportunity_no
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

-- 9. Idempotent historical backfill of opportunities for previously converted leads
do $$
declare
  r record;
  v_opp_id uuid;
  v_opp_no text;
begin
  for r in
    select l.*, c.name as client_name
    from public.leads l
    join public.clients c on c.id = l.converted_to_client_id
    where l.converted_to_opportunity_id is null
  loop
    v_opp_no := public.generate_opportunity_no();
    insert into public.opportunities (
      organization_id,
      client_id,
      source_lead_id,
      opportunity_no,
      title,
      service,
      description,
      estimated_value,
      stage,
      owner_name,
      expected_close_date,
      status
    ) values (
      r.organization_id,
      r.converted_to_client_id,
      r.id,
      v_opp_no,
      coalesce(r.service, r.name || ' Engagement'),
      coalesce(r.service, 'Consulting & Engineering'),
      r.notes,
      coalesce(r.estimated_value, 0),
      'Won',
      coalesce(r.owner_name, 'Abhishek'),
      coalesce(r.converted_at::date, current_date),
      'active'
    )
    returning id into v_opp_id;

    update public.leads
    set converted_to_opportunity_id = v_opp_id,
        converted_opportunity_no = v_opp_no
    where id = r.id;
  end loop;
end;
$$;
