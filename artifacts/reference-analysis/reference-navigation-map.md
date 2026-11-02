# Reference CRM/ERP Navigation Map

Extracted directly from genuine 1080p video inspection (`https://www.youtube.com/watch?v=3pPdgSYf9Sw`, `reference-video.mp4`, frames rotated 90° counter-clockwise to desktop landscape orientation).

---

## 1. Primary Left Navigation Rail (Pale Periwinkle `#DDE6F5`)

| Top-Level Nav Item | Icon Type | Expandable? | Nested Sub-Navigation Items |
|---|---|---|---|
| **Dashboard** | Grid / Window | No | — |
| **Setting** | Gear | Yes (or single) | General Settings, Organization Profile, Branch Config |
| **Sales** | Document / Sheet | Yes (`v` / `^`) | • `Sales Invoices`<br>• `Quotation / Estimate`<br>• `Payment In`<br>• `Sales Return`<br>• `Credit Note` |
| **Purchase** | Shopping Tag | Yes (`v` / `^`) | • `Purchase Orders`<br>• `Bills / Vendor Invoices`<br>• `Payment Out`<br>• `Debit Note` |
| **Transaction** | Banknote / Cards | Yes (`v` / `^`) | • `Expense`<br>• `Investment`<br>• `Bank`<br>• `Expense Entry`<br>• `Loan`<br>• `Loan Repayment` |
| **Inventory** | 3D Cube / Box | No | Stock summary, product catalog |
| **Technician Request List** | Checkmark Shield | No | Service requests, field operations, delivery queue |
| **Ledger** | Ledger Book | No | Account statement, transaction journal, debit/credit audit |
| **Balance Salesheet** | Accounting Sheet | No | Balance Sheet, Profit & Loss, financial statements |

---

## 2. Topbar Navigation & Context Controls

- **Left Brand Header**: Company Logo + Name (Reference: `VIVEKASOFTEK / INNOVATION AHEAD`; KREATIWIT target: `KREATIWIT / AGENCYOS STUDIO`).
- **Module Indicator**: Bold CRM pill (`CRM`).
- **Branch / Entity Selector**: Rounded dropdown selector (`Select Branch v` / e.g. `Kalavasal v` / in our case agency organization / workspace selector).
- **User Avatar**: Circular colored avatar (e.g. orange background with user profile / role badge).
- **Global Actions**: Search, theme toggle, fast action triggers.

---

## 3. Mapping to KREATIWIT AgencyOS Operations

To preserve 100% of existing business data and features while faithfully replicating this ERP navigation grammar:

| Reference Section | KREATIWIT Modules Mapped |
|---|---|
| **Dashboard** | `Command Center` (Overview with Pastel KPI cards) |
| **Sales** (Expandable) | • `Sales Pipeline` (Leads & Qualification)<br>• `Commercial Deals` (Opportunities with SKU `KW-OPP-XXXXXX`)<br>• `Client Accounts` (Enterprise CRM Clients)<br>• `Key Contacts` (Stakeholder Directory) |
| **Delivery & Projects** | • `Projects & Cockpit` (Active Deliverables)<br>• `Tasks Masterboard` (Delivery Kanban & List)<br>• `Handoff Transit` (Phase & Department Handoffs) |
| **Finance & Reports** (Expandable) | • `Sales Invoices & Proposals` (Commercial Invoices & Estimates)<br>• `Ledger & Statements` (Balance Sheet, P&L, Transaction Journal) |
| **Governance & Team** | • `Team & Capacity` (Specialist roster & schedules)<br>• `Approval Center` (Gates & signoffs)<br>• `RACI Matrix` (Accountability governance) |
| **System** | • `Recycle & Archive` (Archived records)<br>• `Settings & Organization` (Org profile & theme) |
