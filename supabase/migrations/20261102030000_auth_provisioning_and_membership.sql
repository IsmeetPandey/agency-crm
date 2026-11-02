-- ====================================================================
-- KREATIWIT AGENCYOS — AUTH PROVISIONING, MEMBERSHIP LIFECYCLE & RLS
-- Migration: 20261102030000_auth_provisioning_and_membership.sql
-- ====================================================================

-- 1. Ensure Profile Insert Policy exists for newly authenticated users
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- 2. Direct Membership Select Policy (prevents recursive lookup locks)
drop policy if exists "Members can view membership in their organizations" on public.organization_memberships;
drop policy if exists "Users can view their own membership or same org" on public.organization_memberships;

create policy "Users can view their own membership or same org"
  on public.organization_memberships for select
  using (
    user_id = auth.uid()
    or organization_id in (select public.current_user_org_ids())
  );

-- 3. Idempotent User Provisioning Function & Trigger
create or replace function public.handle_new_user_provisioning()
returns trigger as $$
declare
  v_default_org_id uuid := '11111111-1111-1111-1111-111111111111';
  v_org_count integer;
  v_owner_count integer;
  v_role text := 'member';
  v_full_name text;
begin
  -- Resolve user full name from metadata or email username
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Agency Specialist'
  );

  -- 3A. Provision Profile idempotently
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    v_full_name,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    updated_at = now();

  -- 3B. Ensure default organization exists
  select count(*) into v_org_count from public.organizations where id = v_default_org_id;
  if v_org_count = 0 then
    insert into public.organizations (id, name, slug, currency, timezone)
    values (v_default_org_id, 'Kreatiwit Agency', 'kreatiwit', 'INR', 'Asia/Kolkata')
    on conflict (slug) do nothing;
  end if;

  -- 3C. Determine Role: Bootstrap first owner or assign 'member'
  -- Never trust untrusted client metadata for elevated privileges.
  select count(*) into v_owner_count
  from public.organization_memberships
  where organization_id = v_default_org_id and role = 'owner';

  if v_owner_count = 0 then
    v_role := 'owner';
  else
    v_role := 'member';
  end if;

  -- 3D. Provision Membership idempotently
  insert into public.organization_memberships (organization_id, user_id, role)
  values (v_default_org_id, new.id, v_role)
  on conflict (organization_id, user_id) do nothing;

  -- 3E. Link to team directory if email matches
  update public.team_members
  set user_id = new.id,
      updated_at = now()
  where lower(email) = lower(new.email)
    and organization_id = v_default_org_id
    and user_id is null;

  return new;
exception when others then
  -- Do not block auth signup if background linkage fails; log warning
  raise warning 'handle_new_user_provisioning warning: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Wire trigger to auth.users if auth schema is accessible
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user_provisioning();
  end if;
end $$;

-- 4. Secure Transactional RPC for Frontend Self-Provisioning / Recovery
create or replace function public.rpc_provision_user_membership(
  p_org_id uuid default '11111111-1111-1111-1111-111111111111'
)
returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_full_name text;
  v_existing_role text;
  v_owner_count integer;
  v_role text := 'member';
begin
  if v_user_id is null then
    raise exception 'Unauthorized: Must be authenticated to provision membership';
  end if;

  -- Fetch user email from auth context or profile
  select email, raw_user_meta_data->>'full_name'
  into v_user_email, v_full_name
  from auth.users
  where id = v_user_id;

  if v_full_name is null then
    v_full_name := split_part(v_user_email, '@', 1);
  end if;

  -- Upsert profile
  insert into public.profiles (id, full_name, email)
  values (v_user_id, coalesce(v_full_name, 'Agency Specialist'), coalesce(v_user_email, 'user@kreatiwit.io'))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  -- Check existing membership
  select role into v_existing_role
  from public.organization_memberships
  where organization_id = p_org_id and user_id = v_user_id;

  if v_existing_role is not null then
    return jsonb_build_object(
      'status', 'existing',
      'organization_id', p_org_id,
      'user_id', v_user_id,
      'role', v_existing_role
    );
  end if;

  -- Determine role safely
  select count(*) into v_owner_count
  from public.organization_memberships
  where organization_id = p_org_id and role = 'owner';

  if v_owner_count = 0 then
    v_role := 'owner';
  else
    v_role := 'member';
  end if;

  -- Insert membership
  insert into public.organization_memberships (organization_id, user_id, role)
  values (p_org_id, v_user_id, v_role)
  on conflict (organization_id, user_id) do nothing;

  -- Link team member if matching email
  if v_user_email is not null then
    update public.team_members
    set user_id = v_user_id,
        updated_at = now()
    where lower(email) = lower(v_user_email)
      and organization_id = p_org_id;
  end if;

  return jsonb_build_object(
    'status', 'provisioned',
    'organization_id', p_org_id,
    'user_id', v_user_id,
    'role', v_role
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 5. Organization Invitations Table & Workflow
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'manager', 'member')),
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invitations_email_status on public.organization_invitations(lower(email), status);
create index if not exists idx_invitations_token on public.organization_invitations(token);

alter table public.organization_invitations enable row level security;

create policy "Admins can manage invitations"
  on public.organization_invitations for all
  using (public.has_org_role(organization_id, array['owner', 'admin']));

create policy "Users can view invitations matching their email"
  on public.organization_invitations for select
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid() and lower(u.email) = lower(organization_invitations.email)
    )
  );

-- RPC to accept an invitation
create or replace function public.rpc_accept_invitation(p_token text)
returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invitation public.organization_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required to accept invitation';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_invitation
  from public.organization_invitations
  where token = p_token and status = 'pending' and expires_at > now();

  if not found then
    raise exception 'Invalid, revoked or expired invitation token';
  end if;

  if lower(v_user_email) != lower(v_invitation.email) then
    raise exception 'Invitation email (%) does not match authenticated user email (%)', v_invitation.email, v_user_email;
  end if;

  -- Insert/update membership with the invited role
  insert into public.organization_memberships (organization_id, user_id, role)
  values (v_invitation.organization_id, v_user_id, v_invitation.role)
  on conflict (organization_id, user_id) do update set
    role = excluded.role;

  -- Mark invitation as accepted
  update public.organization_invitations
  set status = 'accepted', updated_at = now()
  where id = v_invitation.id;

  return jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role
  );
end;
$$ language plpgsql security definer set search_path = public;
