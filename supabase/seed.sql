-- ====================================================================
-- KREATIWIT AGENCYOS — SEED DATA (IDEMPOTENT)
-- ====================================================================

-- 1. Default Organization
insert into public.organizations (id, name, slug, currency, timezone)
values (
  '11111111-1111-1111-1111-111111111111',
  'Kreatiwit Agency',
  'kreatiwit',
  'INR',
  'Asia/Kolkata'
)
on conflict (slug) do update set
  name = excluded.name,
  currency = excluded.currency,
  timezone = excluded.timezone;

-- 2. Departments
insert into public.departments (organization_id, code, name, color, dot)
values
  ('11111111-1111-1111-1111-111111111111', 'PM', 'Client Facing / PM', '#6D28D9', '#6D28D9'),
  ('11111111-1111-1111-1111-111111111111', 'Design', 'Design / UI UX', '#FF4D6A', '#FF4D6A'),
  ('11111111-1111-1111-1111-111111111111', 'Frontend', 'Frontend', '#007AFF', '#007AFF'),
  ('11111111-1111-1111-1111-111111111111', 'Backend', 'Backend', '#6D28D9', '#6D28D9'),
  ('11111111-1111-1111-1111-111111111111', 'App', 'App Development', '#00C7BE', '#00C7BE'),
  ('11111111-1111-1111-1111-111111111111', 'SEO', 'SEO', '#FF9500', '#FF9500'),
  ('11111111-1111-1111-1111-111111111111', 'Testing', 'Testing', '#30D158', '#30D158'),
  ('11111111-1111-1111-1111-111111111111', 'DevOps', 'DevOps', '#5856D6', '#5856D6'),
  ('11111111-1111-1111-1111-111111111111', 'Marketing', 'Digital Marketing / Brand', '#FF2D55', '#FF2D55'),
  ('11111111-1111-1111-1111-111111111111', 'AI', 'AI / ML', '#AF52DE', '#AF52DE'),
  ('11111111-1111-1111-1111-111111111111', 'Accounts', 'Accounts', '#8E8E93', '#8E8E93')
on conflict (organization_id, code) do update set
  name = excluded.name,
  color = excluded.color,
  dot = excluded.dot;

-- 3. Team Members
insert into public.team_members (id, legacy_id, organization_id, name, email, role_title, initials, accent, avail_hours, focus_hours, slot_raw, is_overloaded)
values
  ('22222222-2222-2222-2222-222222220001', 'ansul', '11111111-1111-1111-1111-111111111111', 'Ansul', 'ansul@kreatiwit.io', 'CTO • Fullstack Lead', 'AN', '#6D28D9', 4, 3, '10pm-1am +1hr random', true),
  ('22222222-2222-2222-2222-222222220002', 'shradha', '11111111-1111-1111-1111-111111111111', 'Shradha', 'shradha@kreatiwit.io', 'PM • Design Lead', 'SH', '#FF2D55', 4, 2, '9-11:30am 2-4pm 9-11pm', true),
  ('22222222-2222-2222-2222-222222220003', 'ismeet', '11111111-1111-1111-1111-111111111111', 'Ishmeet', 'ismeet@kreatiwit.io', 'Frontend • 3D Dev', 'IS', '#30D158', 3, 2, '10pm-12am 6-7pm', false),
  ('22222222-2222-2222-2222-222222220004', 'rahul', '11111111-1111-1111-1111-111111111111', 'Rahul', 'rahul@kreatiwit.io', 'Fullstack • WordPress', 'RH', '#AF52DE', 3, 2, '10pm-1am random', true),
  ('22222222-2222-2222-2222-222222220005', 'vipul', '11111111-1111-1111-1111-111111111111', 'Vipul', 'vipul@kreatiwit.io', 'Frontend • Night Ops', 'VI', '#007AFF', 6, 5, '12am-6am', false),
  ('22222222-2222-2222-2222-222222220006', 'darshan', '11111111-1111-1111-1111-111111111111', 'Darshan', 'darshan@kreatiwit.io', 'App Dev • Flutter', 'DA', '#00C7BE', 4, 3, '11pm-2am random', false),
  ('22222222-2222-2222-2222-222222220007', 'arnav', '11111111-1111-1111-1111-111111111111', 'Arnav', 'arnav@kreatiwit.io', 'CMO • Brand', 'AR', '#FF9500', 3, 2, '10pm-12am 1:30-2:30pm Mon-Fri', false),
  ('22222222-2222-2222-2222-222222220008', 'abhishek', '11111111-1111-1111-1111-111111111111', 'Abhishek', 'abhishek@kreatiwit.io', 'COO • Ops & SEO', 'AB', '#8E8E93', 8, 6, 'Flexible - Ops', false)
on conflict (organization_id, legacy_id) do update set
  name = excluded.name,
  email = excluded.email,
  role_title = excluded.role_title,
  initials = excluded.initials,
  accent = excluded.accent,
  avail_hours = excluded.avail_hours,
  focus_hours = excluded.focus_hours,
  slot_raw = excluded.slot_raw,
  is_overloaded = excluded.is_overloaded;

-- 4. Clients
insert into public.clients (id, legacy_id, organization_id, name, contact_person, email, notes)
values
  ('33333333-3333-3333-3333-333333330001', 'c1', '11111111-1111-1111-1111-111111111111', 'Orbit Technologies', 'Avery Quinn', 'avery@orbit.example', 'B2B tech client'),
  ('33333333-3333-3333-3333-333333330002', 'c2', '11111111-1111-1111-1111-111111111111', 'Serein Studio', 'Taylor Reed', 'taylor@serein.example', 'Commerce brand'),
  ('33333333-3333-3333-3333-333333330003', 'c3', '11111111-1111-1111-1111-111111111111', 'Northstar Ventures', 'Jamie Ellis', 'jamie@northstar.example', 'Campaign client')
on conflict (id) do nothing;

-- 5. Leads
insert into public.leads (id, legacy_id, organization_id, name, contact_person, email, service, estimated_value, stage, owner_name, next_followup, notes)
values
  ('44444444-4444-4444-4444-444444440001', 'l1', '11111111-1111-1111-1111-111111111111', 'Aster Living', 'Casey Morgan', 'casey@aster.example', 'Website & branding', 260000, 'New', 'Riya Kapoor', '2025-09-12', 'Discovery call requested.'),
  ('44444444-4444-4444-4444-444444440002', 'l2', '11111111-1111-1111-1111-111111111111', 'Meridian Health', 'Parker Blake', 'parker@meridian.example', 'Next.js Commerce', 420000, 'Qualified', 'Arnav', '2025-09-10', 'React + Node required'),
  ('44444444-4444-4444-4444-444444440003', 'l3', '11111111-1111-1111-1111-111111111111', 'Arc Collective', 'Drew Lane', 'drew@arc.example', 'Flutter App', 185000, 'Proposal', 'Darshan', '2025-09-14', 'Flutter + Firebase'),
  ('44444444-4444-4444-4444-444444440004', 'l4', '11111111-1111-1111-1111-111111111111', 'Vela Systems', 'Skyler Drew', 'skyler@vela.example', 'AI workflow', 350000, 'Contacted', 'Shradha', '2025-09-11', 'AI/ML + Research'),
  ('44444444-4444-4444-4444-444444440005', 'l5', '11111111-1111-1111-1111-111111111111', 'Northpeak', 'Alex Kim', 'alex@north.example', 'Brand + SEO', 125000, 'Won', 'Abhishek', '2025-09-09', 'Won!')
on conflict (id) do nothing;

-- 6. Projects
insert into public.projects (id, legacy_id, organization_id, client_id, name, phase, stack_needed, budget, due_date, owner_name, scope, progress)
values
  ('55555555-5555-5555-5555-555555550001', 'p1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333330001', 'Orbit / Digital Experience', 'Design', 'React, Next.js, Figma', 240000, '2025-10-20', 'Shradha', 'Enterprise website with commerce.', 45),
  ('55555555-5555-5555-5555-555555550002', 'p2', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333330002', 'Serein / Brand & commerce', 'Build', 'Next.js, Shopify, three.js', 180000, '2025-10-05', 'Ansul', 'Brand + storefront.', 68)
on conflict (id) do nothing;

-- 7. Tasks
insert into public.tasks (id, legacy_id, organization_id, project_id, title, department_code, assigned_to_name, status, due_date)
values
  ('66666666-6666-6666-6666-666666660001', 't1', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555550001', 'Product page implementation', 'Frontend', 'Ansul', 'In progress', '2025-09-13'),
  ('66666666-6666-6666-6666-666666660002', 't2', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555550001', 'CRM integration credentials', 'Backend', 'Rahul', 'Blocked', '2025-09-10'),
  ('66666666-6666-6666-6666-666666660003', 't3', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555550002', 'Checkout interaction states', 'Design', 'Shradha', 'In progress', '2025-09-12')
on conflict (id) do nothing;

-- 8. Handoffs
insert into public.handoffs (id, legacy_id, organization_id, project_id, title, from_dept, to_dept, status, due_date)
values
  ('77777777-7777-7777-7777-777777770001', 'h1', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555550001', 'Product templates / implementation review', 'Design', 'Frontend', 'Pending', '2025-09-13'),
  ('77777777-7777-7777-7777-777777770002', 'h2', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555550002', 'Strategy / experience direction', 'PM', 'Design', 'Accepted', '2025-09-09')
on conflict (id) do nothing;

-- 9. Activity Events
insert into public.activity_events (id, organization_id, actor_name, entity_type, action, summary, created_at)
values
  ('88888888-8888-8888-8888-888888880001', '11111111-1111-1111-1111-111111111111', 'System', 'system', 'initialized', 'Workspace initialized - AgencyOS v3 Liquid Glass live', '2025-09-01T08:00:00.000Z'),
  ('88888888-8888-8888-8888-888888880002', '11111111-1111-1111-1111-111111111111', 'Shradha', 'lead', 'created', 'Lead created: Aster Living - Website & branding', '2025-09-01T09:00:00.000Z'),
  ('88888888-8888-8888-8888-888888880003', '11111111-1111-1111-1111-111111111111', 'Abhishek', 'client', 'created', 'Client added: Orbit Technologies', '2025-09-01T10:00:00.000Z'),
  ('88888888-8888-8888-8888-888888880004', '11111111-1111-1111-1111-111111111111', 'Ansul', 'project', 'created', 'Project created: Serein / Brand & commerce with auto-team', '2025-09-01T11:00:00.000Z')
on conflict (id) do nothing;

