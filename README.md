# Kreatiwit AgencyOS — Production CRM & Operations Operating System

> **Liquid Glass Edition** • Built with React 18, Vite 5, TypeScript, Tailwind CSS, Recharts, and Supabase PostgreSQL.

---

## 1. Architectural Overview

The application has been modularized from a monolithic prototype into a feature-first architecture:

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Collapsible macOS Liquid Glass navigation (⌘B)
│   │   ├── Topbar.tsx            # Sticky 52px topbar with search pill & quick actions
│   │   └── CommandPalette.tsx    # ⌘K Spotlight global search & quick commands
│   └── modals/
│       ├── LeadModal.tsx         # New sales opportunity modal
│       ├── ClientModal.tsx       # New client account modal
│       ├── ProjectModal.tsx      # Project creation with real-time team auto-suggest
│       ├── TaskModal.tsx         # Deliverable task creation
│       ├── HandoffModal.tsx      # Department transition modal
│       └── ScopeChangeModal.tsx  # Scope variance & schedule impact modal
├── features/
│   ├── dashboard/                # Real operational metrics & stage distribution charts
│   ├── leads/                    # 6-stage Kanban sales pipeline with drag & drop
│   ├── clients/                  # Client accounts, contacts & linked project delivery
│   ├── projects/                 # Projects grid & detailed tabbed operational workspace
│   ├── handoffs/                 # Cross-department asset delivery & status tracking
│   ├── approvals/                # Approval Center for milestone signoffs & gates
│   ├── team/                     # 8-member directory, focus hours & 24h IST schedule
│   ├── raci/                     # Global interactive RACI governance matrix
│   └── settings/                 # Infrastructure status, RBAC role switcher, JSON backup
├── lib/
│   ├── auth/                     # Supabase Auth context with role management
│   ├── constants/                # Agency constants, stages, leadership & color tokens
│   ├── permissions/              # RBAC permission matrix (owner, admin, manager, member)
│   ├── repositories/             # Centralized typed data access layer (Supabase / local fallback)
│   └── supabase/                 # Typed Supabase client, database types, RLS helpers
├── styles/
│   └── awwwards-light.css        # Awwwards light tokens (Inter Tight, #49B3FC accent, #F8F8F8 canvas)
└── types/                        # Core TypeScript domain entities
```

---

## 2. Supabase Database & Security

### Schema & Migrations
- **SQL Migration**: `supabase/migrations/20261102000000_initial_agencyos_schema.sql`
- **Idempotent Seed**: `supabase/seed.sql`
- **CLI Configuration**: `supabase/config.toml`
- **Database Verification Tests**: `supabase/tests/database_test.sql`

### Row Level Security (RLS)
All exposed tables have Row Level Security enabled with explicit tenant isolation and role-based policies:
- `organizations`
- `profiles`
- `organization_memberships`
- `departments`
- `team_members`
- `clients` & `client_contacts`
- `leads`
- `projects` & `project_members`
- `tasks`
- `project_gates` & `project_checklists`
- `handoffs` & `approval_requests`
- `scope_changes`
- `project_raci_assignments`
- `activity_events`
- `organization_settings`

---

## 3. Data Protection & Legacy Migration

All original agency records (team, clients, leads, projects, tasks, schedules) are safely backed up in a protected, gitignored location:
- `.data-backup/legacy-agency-data.json`

To run the idempotent migration dry-run:
```bash
bun run scripts/import-legacy-data.ts --dry-run
```

To migrate records to a live Supabase project:
```bash
bun run migrate
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_TIMEZONE=Asia/Kolkata
```

*Note: If no Supabase credentials are configured, the application automatically runs in preview mode with local persistence, ensuring zero disruptions.*

---

## 5. Development & Testing Commands

```bash
# Start development server
bun run dev

# Run unit & integration test suite
bun test

# Run Biome code quality & formatting checks
bun run lint
bun run format

# Run production build
bun run build
```

---

## 6. Keyboard Shortcuts

- `⌘K` or `Ctrl+K`: Open Spotlight Command Palette
- `⌘B` or `Ctrl+B`: Toggle Liquid Glass Sidebar
- `Esc`: Close open modal or command palette
