-- ====================================================================
-- SUPABASE DATABASE & RLS VERIFICATION TESTS
-- ====================================================================

begin;

-- Test 1: Verify organization creation and constraints
select plan(7);

-- 1. Check table existence
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'leads', 'leads table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'team_members', 'team_members table exists');

-- 2. Verify RLS is enabled
select tests.rls_enabled('public', 'leads');
select tests.rls_enabled('public', 'projects');
select tests.rls_enabled('public', 'organizations');

rollback;

