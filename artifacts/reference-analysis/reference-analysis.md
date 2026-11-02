# Reference CRM/ERP UI/UX Architectural Analysis & Blueprint

## 1. Source Material Authentication
- **Canonical YouTube URL**: `https://www.youtube.com/watch?v=3pPdgSYf9Sw` / `https://www.youtube.com/shorts/3pPdgSYf9Sw`
- **Format Inspection**: Downloaded native 1080p stream (`reference-video.mp4`, 1080x1920, 30.0 FPS, 27.37s).
- **Orientation Correction**: The interface is published sideways inside a vertical phone recording. Rotated 90° counter-clockwise (`cv2.ROTATE_90_COUNTERCLOCKWISE`) to reconstruct the true desktop landscape ERP application (1920x1080).
- **Extracted Frames Available In**: `artifacts/reference-analysis/reference-keyframes/`
  - `frame_04_rot_ccw_7.0s.png`: Full desktop shell with pale periwinkle sidebar and pastel KPI cards.
  - `frame_06_rot_ccw_11.0s.png`: Sales Invoices screen with 3 KPI strip cards, search pill, date range filter, and ERP data table.
  - `detail_12.5s.png`: Invoice Creation form with dynamic line items, dashed `+ Add Item` button, taxes, and auto round-off.
  - `frame_08_rot_ccw_15.0s.png`: Expandable nested navigation with deep navy active state and submenus.
  - `frame_10_rot_ccw_21.0s.png`: Transaction menu expansion and hover state.
  - `late_23.0s.png`: Financial Statements (Balance Sheet & Profit & Loss tabs, dual-column accounting statement, and PDF download).

---

## 2. Key Visual Differences from Current Kreatiwit CRM

| Dimension | Current Kreatiwit CRM | Reference CRM/ERP Target | Action Required |
|---|---|---|---|
| **Sidebar Theme** | Dark charcoal / near-black sidebar (`#0F172A` / `#0B0F19`) | Pale lavender-blue / periwinkle rail (`#DCE7F6` / `#E2EAF8`) with deep navy active state | Rebuild Sidebar with pale blue container, expandable categories, deep navy active indicator, and smooth accordion transitions. |
| **Workspace Feel** | Dark borders, monochromatic glass styling | Clean crisp white workspace (`#FFFFFF`) with soft neutral background (`#F8FAFC`) | Clean up excessive glassmorphism and apply crisp ERP layout. |
| **KPI & Summary Cards** | White border cards with monochrome numbers | 4 distinctive pastel summary cards (Mint Green, Pastel Yellow, Pastel Rose, Soft Periwinkle) with category icons and progress bars | Implement reusable `PastelKpiCard` component and integrate onto Dashboard & overview views. |
| **Navigation Hierarchy** | Flat icon list | Expandable grouped accordion navigation with chevrons and indented nested sub-items | Organize into expandable groups (`Sales & Deals`, `Delivery & Projects`, `Finance & Invoicing`, `Governance & Team`, `System`) while preserving all existing routes and views. |
| **Tables & Lists** | Transparent / dark bordered tables | Distinct soft blue-gray header band (`#EBF2FB`), clean white rows, status tags, and action buttons | Style shared table component with ERP header band and clean row styling. |
| **Financial Reporting** | Simple invoice ledger | Professional statements with Date Range Filter, Balance Sheet / Profit & Loss tabs, and dual-column accounting ledger | Upgrade FinanceView with Financial Statements tab, dual-column view, date filters, and ledger summaries. |

---

## 3. Preservation Commitments
1. **Zero Data Loss**: Maintain all 16 business domains in Supabase and local store (Leads, Opportunities, Clients, Contacts, Projects, Tasks, Finance, Team, Gates, RACI, Approvals, Scope Changes, Activity, Notes).
2. **Opportunity & SKU Engine**: Retain the complete monotonic SKU allocation (`KW-OPP-XXXXXX`), lead conversion journey, duplicate prevention, and atomic locking completed in previous stages.
3. **Dual Theme Continuity**: Ensure both Light mode and an accessible Dark mode counterpart are fully functional.
