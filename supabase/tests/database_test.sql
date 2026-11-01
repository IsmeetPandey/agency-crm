-- ====================================================================
-- SUPABASE DATABASE, RPC & RLS VERIFICATION TESTS
-- ====================================================================

begin;

select plan(14);

-- 1. Table existence verification
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'organization_memberships', 'organization_memberships table exists');
select has_table('public', 'departments', 'departments table exists');
select has_table('public', 'team_members', 'team_members table exists');
select has_table('public', 'clients', 'clients table exists');
select has_table('public', 'leads', 'leads table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'tasks', 'tasks table exists');
select has_table('public', 'handoffs', 'handoffs table exists');
select has_table('public', 'approval_requests', 'approval_requests table exists');

-- 2. Verify RLS is enabled on critical tables
select tests.rls_enabled('public', 'leads');
select tests.rls_enabled('public', 'projects');
select tests.rls_enabled('public', 'organizations');

-- 3. Verify RPC function definitions
select has_function('public', 'rpc_convert_lead_to_client', array['uuid', 'text']);
select has_function('public', 'rpc_initialize_project_milestones', array['uuid', 'text']);

rollback;
