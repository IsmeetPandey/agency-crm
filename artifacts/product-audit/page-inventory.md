# KREATIWIT AgencyOS: Complete Navigable Page Inventory

**Date:** 2026-11-02  
**Commit Inspected:** `f688b20`  
**Auditor Roles:** Business Owner, Principal Product Architect, Senior UX Critic, Staff Full-Stack Engineer  

---

## 1. Navigable View & Screen Inventory

| # | View Key | Screen Name | Category | Primary Source File(s) | Business Purpose & Key Actions | Responsive Viewports Verified | Status |
|---|---|---|---|---|---|---|---|
| **01** | `overview` | **Executive Operations Dashboard** | Overview | `src/features/dashboard/DashboardOverview.tsx`, `PastelKpiCard.tsx` | Instant health check of active deals, pipeline, cash collected, on-duty specialists, priority action inbox, workload chart | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **02** | `pipeline` | **Sales Pipeline** | Sales & Deals | `src/features/leads/PipelineView.tsx`, `LeadModal.tsx` | Lead tracking across 7 stages, deal qualification, owner assignment, 1-click conversion to Commercial Opportunity | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **03** | `opportunities` | **Commercial Deals** | Sales & Deals | `src/features/opportunities/OpportunitiesView.tsx`, `OpportunityModal.tsx` | Dual-mode (Table list & Kanban pipeline) tracking of permanent SKU deals (`KW-OPP-XXXXXX`), multi-currency filters | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **04** | `opportunity` | **Opportunity Detail Cockpit** | Sales & Deals | `src/features/opportunities/OpportunityDetailView.tsx` | End-to-end deal dossier: client context, origin lead attribution, linked projects, issued invoices/proposals, internal audit notes | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **05** | `clients` | **Client Accounts** | Sales & Deals | `src/features/clients/ClientsView.tsx`, `ClientModal.tsx` | Account registry, company directory, active opportunity count, linked projects, direct contact metadata | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **06** | `contacts` | **Key Stakeholder Contacts** | Sales & Deals | `src/features/contacts/ContactsView.tsx`, `ContactModal.tsx` | Stakeholder directory, client account grouping, primary decision-maker designations, email/phone links | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **07** | `projects` | **Projects Cockpit** | Delivery | `src/features/projects/ProjectsView.tsx`, `ProjectModal.tsx` | Project directory, stage tracking, phase progress bars, budget tracking, opportunity linkage, automated team matching | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **08** | `project` | **Project Cockpit Detail** | Delivery | `src/features/projects/ProjectDetailView.tsx` | Deep delivery dossier: 5-stage phase gate governance, scope changes, milestone tracking, team allocations | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **09** | `tasks` | **Tasks Masterboard** | Delivery | `src/features/tasks/TasksView.tsx`, `TaskModal.tsx` | Dual-mode (Kanban & Table) workflow tracker across Todo, In Progress, Blocked, Completed; department & priority filters | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **10** | `handoffs` | **Handoff Transit** | Delivery | `src/features/handoffs/HandoffsView.tsx`, `HandoffModal.tsx` | Inter-departmental deliverable handoff protocol, acceptance gating, asset link handoffs, audit logging | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **11** | `finance` (invoices) | **Sales Invoices & Billing** | Finance | `src/features/finance/FinanceView.tsx`, `FinanceModal.tsx` | Accounts receivable ledger: invoices, proposals, quotations, payment status (Paid, Sent, Draft, Overdue), PDF export | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **12** | `finance` (statements) | **Financial Statements** | Finance | `src/features/finance/FinanceView.tsx` | Dual financial statements (Balance Sheet & Profit/Loss) with 40% retained earnings rule, asset/liability reconciliation, PDF export | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **13** | `team` | **Team & Capacity Matrix** | Governance | `src/features/team/TeamView.tsx` | Staff roster, hourly availability, department skill tags, live IST operational duty status indicator | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **14** | `approvals` | **Executive Approval Center** | Governance | `src/features/approvals/ApprovalsView.tsx` | Critical decision queue: phase gate sign-offs, scope revisions, budget alterations; approve/reject actions | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **15** | `raci` | **RACI Governance Matrix** | Governance | `src/features/raci/RaciView.tsx` | Project deliverable responsibility matrix (Responsible, Accountable, Consulted, Informed) across agency roles | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **16** | `archive` | **Recycle & Archive Center** | System | `src/features/archive/ArchiveView.tsx` | Decommissioned record management: leads, opportunities, clients, projects; 1-click restore or permanent purge | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **17** | `settings` | **Studio Settings & Storage** | System | `src/features/settings/SettingsView.tsx` | Theme selection (Light/Dark/System), Supabase cloud diagnostic sync, JSON full-agency backup download, cache reset | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |
| **18** | `auth` | **Authentication & Resilient Engine** | System | `src/features/auth/AuthView.tsx` | Secure Supabase sign in/up/recovery, offline resilient engine fallback switch, connection diagnostics | Desktop (1440), Tablet (768), Mobile (390) | **AUDITED** |

---

## 2. Modal Dialogs & Overlay Inventory

| # | Modal Key | Component Name | Trigger Location(s) | Business Function |
|---|---|---|---|---|
| **M1** | `convert-lead` | `ConvertLeadModal.tsx` | Sales Pipeline ("Convert to Opportunity →") | Converts qualified prospect into client + opportunity with SKU allocation |
| **M2** | `opportunity` | `OpportunityModal.tsx` | Topbar, Opportunities, Command Palette | Direct manual commercial deal creation with client linkage & currency selection |
| **M3** | `lead` | `LeadModal.tsx` | Topbar, Pipeline, Command Palette | Inbound lead intake, estimated value, service category, owner assignment |
| **M4** | `client` | `ClientModal.tsx` | Clients, Command Palette | Client brand account creation, contact info, commercial notes |
| **M5** | `contact` | `ContactModal.tsx` | Contacts, Command Palette | Client personnel stakeholder creation, primary contact flag |
| **M6** | `project` | `ProjectModal.tsx` | Projects, Opportunity Detail, Command Palette | Delivery project setup with automated team matching and phase gate initialization |
| **M7** | `task` | `TaskModal.tsx` | Tasks, Project Cockpit, Command Palette | Deliverable item assignment, department tag, due date |
| **M8** | `finance` | `FinanceModal.tsx` | Finance, Opportunity Detail, Command Palette | Invoice, proposal, or quotation issuance with opportunity SKU linkage |
| **M9** | `handoff` | `HandoffModal.tsx` | Handoffs, Project Cockpit | Cross-department deliverable transit package submission |
| **M10** | `scope-change`| `ScopeChangeModal.tsx` | Project Detail Cockpit | Formal delivery scope modification with timeline delta & cost impact |
| **M11** | `cmd-palette` | `CommandPalette.tsx` | Global (`⌘K` / `Ctrl+K`), Topbar Search | Global spotlight search across deals, projects, leads, team with quick action dispatch |

