-- ====================================================================
-- KREATIWIT AGENCYOS — FULL PRODUCTION SUPABASE SCHEMA & RLS
-- ====================================================================

-- 1. Helper function for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

-- 3. Profiles (Auth linked user profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 4. Organization Memberships (RBAC: owner, admin, manager, member)
create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_org_memberships_user_org on public.organization_memberships(user_id, organization_id);

-- Security helper functions
create or replace function public.current_user_org_ids()
returns setof uuid as $$
  select organization_id from public.organization_memberships where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$ language sql stable security definer;

-- 5. Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null default '#007AFF',
  dot text not null default '#007AFF',
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

-- 6. Team Members (Agency personnel, independently of whether they have a login)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  role_title text not null,
  initials text not null,
  accent text not null default '#007AFF',
  avail_hours numeric(5,2) not null default 4 check (avail_hours >= 0),
  focus_hours numeric(5,2) not null default 3 check (focus_hours >= 0),
  slot_raw text,
  is_overloaded boolean not null default false,
  status text not null default 'active' check (status in ('active', 'hiring', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, legacy_id)
);

create trigger tr_team_members_updated_at
  before update on public.team_members
  for each row execute function public.handle_updated_at();

-- 7. Team Member Departments
create table if not exists public.team_member_departments (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  is_learning boolean not null default false,
  unique (team_member_id, department_id, is_learning)
);

-- 8. Team Member Skills
create table if not exists public.team_member_skills (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  skill text not null,
  unique (team_member_id, skill)
);

-- 9. Availability Windows
create table if not exists public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  start_hour numeric(4,2) not null check (start_hour >= 0 and start_hour <= 24),
  end_hour numeric(4,2) not null check (end_hour >= 0 and end_hour <= 24)
);

-- 10. Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_person text,
  email text,
  phone text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

-- 11. Client Contacts
create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_person text,
  email text,
  service text,
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  stage text not null default 'New' check (stage in ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')),
  owner_id uuid references public.team_members(id) on delete set null,
  owner_name text,
  next_followup date,
  notes text,
  converted_to_client_id uuid references public.clients(id) on delete set null,
  converted_at timestamptz,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- 13. Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  phase text not null default 'Discovery' check (phase in ('Kickoff', 'Discovery', 'Design', 'Prototype', 'Build', 'QA', 'UAT', 'Launch', 'Close')),
  stack_needed text,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  due_date date,
  owner_id uuid references public.team_members(id) on delete set null,
  owner_name text,
  scope text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 14. Project Members
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  role_in_project text default 'Contributor',
  created_at timestamptz not null default now(),
  unique (project_id, team_member_id)
);

-- 15. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  department_code text not null,
  assigned_to_id uuid references public.team_members(id) on delete set null,
  assigned_to_name text,
  status text not null default 'In progress' check (status in ('Todo', 'In progress', 'Blocked', 'Completed')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- 16. Project Gates
create table if not exists public.project_gates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_number integer not null check (step_number >= 1 and step_number <= 9),
  name text not null,
  owner_dept text not null,
  status text not null default 'Pending' check (status in ('Pending', 'In Review', 'Approved', 'Rejected')),
  notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, step_number)
);

-- 17. Project Checklists & Checklist Items
create table if not exists public.project_checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  department_code text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.project_checklists(id) on delete cascade,
  item_index integer not null,
  title text not null,
  is_completed boolean not null default false,
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 18. Handoffs
create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  from_dept text not null,
  to_dept text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Rejected', 'Changes Requested', 'Completed')),
  due_date date,
  accepted_by text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_handoffs_updated_at
  before update on public.handoffs
  for each row execute function public.handle_updated_at();

-- 19. Approval Requests
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  gate_id uuid references public.project_gates(id) on delete cascade,
  title text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Changes Requested')),
  requested_by text not null,
  assigned_approver text,
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- 20. Scope Changes
create table if not exists public.scope_changes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  category text not null default 'Scope' check (category in ('Scope', 'Timeline', 'Budget', 'Stack', 'Other')),
  description text not null,
  cost_delta numeric(12,2) not null default 0,
  days_delta integer not null default 0,
  mitigation text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  requested_by text not null,
  created_at timestamptz not null default now()
);

-- 21. RACI Matrix Assignments
create table if not exists public.project_raci_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  deliverable text not null,
  role_code text not null,
  assignment text not null default '—' check (assignment in ('R', 'A', 'C', 'I', '—', 'A/R')),
  updated_at timestamptz not null default now(),
  unique (project_id, deliverable, role_code)
);

-- 22. Activity Events
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_name text not null,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  summary text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 23. Organization Settings
create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.departments enable row level security;
alter table public.team_members enable row level security;
alter table public.team_member_departments enable row level security;
alter table public.team_member_skills enable row level security;
alter table public.availability_windows enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.project_gates enable row level security;
alter table public.project_checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.handoffs enable row level security;
alter table public.approval_requests enable row level security;
alter table public.scope_changes enable row level security;
alter table public.project_raci_assignments enable row level security;
alter table public.activity_events enable row level security;
alter table public.organization_settings enable row level security;

-- Organizations policies
create policy "Org members can view their organization"
  on public.organizations for select
  using (id in (select public.current_user_org_ids()));

create policy "Org owners can update organization details"
  on public.organizations for update
  using (public.has_org_role(id, array['owner', 'admin']));

-- Profiles policies
create policy "Users can view profiles in their organizations"
  on public.profiles for select
  using (
    id = auth.uid() or
    exists (
      select 1 from public.organization_memberships m1
      join public.organization_memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Organization memberships policies
create policy "Members can view membership in their organizations"
  on public.organization_memberships for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Admins and Owners can manage memberships"
  on public.organization_memberships for all
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- Generic Org-scoped read/write macro for modules
-- Departments
create policy "Org members can view departments"
  on public.departments for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org admins can manage departments"
  on public.departments for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Team members
create policy "Org members can view team directory"
  on public.team_members for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org admins can manage team directory"
  on public.team_members for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Team member relations (dept, skills, avail)
create policy "View team member skills"
  on public.team_member_skills for select
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and tm.organization_id in (select public.current_user_org_ids())));

create policy "Manage team member skills"
  on public.team_member_skills for all
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and public.has_org_role(tm.organization_id, array['owner', 'admin', 'manager'])));

create policy "View team member departments"
  on public.team_member_departments for select
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and tm.organization_id in (select public.current_user_org_ids())));

create policy "Manage team member departments"
  on public.team_member_departments for all
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and public.has_org_role(tm.organization_id, array['owner', 'admin', 'manager'])));

create policy "View availability windows"
  on public.availability_windows for select
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and tm.organization_id in (select public.current_user_org_ids())));

create policy "Manage availability windows"
  on public.availability_windows for all
  using (exists (select 1 from public.team_members tm where tm.id = team_member_id and public.has_org_role(tm.organization_id, array['owner', 'admin', 'manager'])));

-- Clients & Client Contacts
create policy "Org members can view clients"
  on public.clients for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage clients"
  on public.clients for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

create policy "View client contacts"
  on public.client_contacts for select
  using (exists (select 1 from public.clients c where c.id = client_id and c.organization_id in (select public.current_user_org_ids())));

create policy "Manage client contacts"
  on public.client_contacts for all
  using (exists (select 1 from public.clients c where c.id = client_id and public.has_org_role(c.organization_id, array['owner', 'admin', 'manager', 'member'])));

-- Leads
create policy "Org members can view leads"
  on public.leads for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage leads"
  on public.leads for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

-- Projects & Project Members
create policy "Org members can view projects"
  on public.projects for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage projects"
  on public.projects for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

create policy "View project members"
  on public.project_members for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.organization_id in (select public.current_user_org_ids())));

create policy "Manage project members"
  on public.project_members for all
  using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, array['owner', 'admin', 'manager', 'member'])));

-- Tasks
create policy "Org members can view tasks"
  on public.tasks for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage tasks"
  on public.tasks for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

-- Project Gates, Checklists, Items
create policy "View project gates"
  on public.project_gates for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.organization_id in (select public.current_user_org_ids())));

create policy "Manage project gates"
  on public.project_gates for all
  using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, array['owner', 'admin', 'manager', 'member'])));

create policy "View project checklists"
  on public.project_checklists for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.organization_id in (select public.current_user_org_ids())));

create policy "Manage project checklists"
  on public.project_checklists for all
  using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, array['owner', 'admin', 'manager', 'member'])));

create policy "View checklist items"
  on public.checklist_items for select
  using (exists (
    select 1 from public.project_checklists pc
    join public.projects p on p.id = pc.project_id
    where pc.id = checklist_id and p.organization_id in (select public.current_user_org_ids())
  ));

create policy "Manage checklist items"
  on public.checklist_items for all
  using (exists (
    select 1 from public.project_checklists pc
    join public.projects p on p.id = pc.project_id
    where pc.id = checklist_id and public.has_org_role(p.organization_id, array['owner', 'admin', 'manager', 'member'])
  ));

-- Handoffs
create policy "Org members can view handoffs"
  on public.handoffs for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage handoffs"
  on public.handoffs for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

-- Approval Requests
create policy "Org members can view approvals"
  on public.approval_requests for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage approvals"
  on public.approval_requests for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

-- Scope Changes
create policy "Org members can view scope changes"
  on public.scope_changes for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can manage scope changes"
  on public.scope_changes for all
  using (public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'member']));

-- RACI Assignments
create policy "View project raci assignments"
  on public.project_raci_assignments for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.organization_id in (select public.current_user_org_ids())));

create policy "Manage project raci assignments"
  on public.project_raci_assignments for all
  using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, array['owner', 'admin', 'manager', 'member'])));

-- Activity Events
create policy "Org members can view activity"
  on public.activity_events for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Org members can insert activity"
  on public.activity_events for insert
  with check (organization_id in (select public.current_user_org_ids()));

-- Organization Settings
create policy "Org members can view settings"
  on public.organization_settings for select
  using (organization_id in (select public.current_user_org_ids()));

create policy "Admins can update settings"
  on public.organization_settings for all
  using (public.has_org_role(organization_id, array['owner', 'admin']));

