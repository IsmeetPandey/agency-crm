# Reference CRM/ERP Component & Design System Specifications

Based on real frame-by-frame video extraction from `reference-video.mp4` (1080p, rotated 90° counter-clockwise):

---

## 1. Color Palette Tokens

| Token Name | Sampled Color | Semantic Usage |
|---|---|---|
| `--erp-sidebar-bg` | `#DCE7F6` / `#E2EAF8` | Pale periwinkle/lavender navigation rail |
| `--erp-sidebar-active` | `#1A253C` | Deep navy dark blue container for selected navigation row |
| `--erp-sidebar-active-text` | `#FFFFFF` | Crisp white typography for active item |
| `--erp-sidebar-text` | `#1E293B` | Deep slate/navy for navigation labels |
| `--erp-sidebar-muted` | `#64748B` | Subtle icons, chevrons, secondary labels |
| `--erp-workspace-bg` | `#F8FAFC` / `#FFFFFF` | Clean white/off-white main stage |
| `--erp-kpi-green-bg` | `#D4F8E2` | Pastel Mint Green summary card background |
| `--erp-kpi-green-bar` | `#10B981` | Accent progress indicator for green card |
| `--erp-kpi-yellow-bg` | `#FEF3B4` | Pastel Yellow summary card background |
| `--erp-kpi-yellow-bar` | `#F59E0B` | Accent progress indicator for yellow card |
| `--erp-kpi-pink-bg` | `#FED8E8` | Pastel Soft Rose summary card background |
| `--erp-kpi-pink-bar` | `#F43F5E` | Accent progress indicator for pink card |
| `--erp-kpi-blue-bg` | `#D0E0FD` | Pastel Soft Blue summary card background |
| `--erp-kpi-blue-bar` | `#3B82F6` | Accent progress indicator for blue card |
| `--erp-table-header-bg` | `#EBF2FB` | Soft light blue tinted table header band |
| `--erp-btn-primary` | `#0066FF` / `#2563EB` | Vibrant blue filled pill button |
| `--erp-btn-success` | `#059669` | Emerald green button (e.g. Download PDF) |
| `--erp-btn-purple` | `#7C3AED` | Purple accent button (e.g. Create Sales Invoice) |

---

## 2. Component Design Specifications

### 2.1 Pastel Summary Cards (Dashboard KPI Row)
- **Geometry**: Border radius ~ `16px` (`rounded-2xl`), subtle soft elevation (`shadow-sm` / `shadow-md`).
- **Internal Spacing**: `p-5` (approx 20px padding).
- **Layout**:
  - Row 1: Title (`text-[13px] font-medium text-slate-800`) on left, category icon (`18px`) on right.
  - Row 2: Progress track bar (light translucent track with bright filled progress segment).
  - Row 3: Metric Value (`text-3xl font-extrabold text-slate-900 tracking-tight`).
  - Row 4: Supporting text (`text-[11px] text-slate-600 font-medium`, e.g. "out of 100", "+12% vs last month").

### 2.2 ERP Table System
- **Header Band**: Soft blue-gray tinted background (`#EBF2FB`), deep navy bold text (`text-[12px] font-bold text-slate-800`), clean padding (`py-3 px-4`).
- **Rows**: Pure white background (`#FFFFFF`), subtle bottom divider (`border-b border-slate-100`), hover state (`hover:bg-slate-50/80 transition`).
- **Text Alignment**: Left-aligned for text/dates/IDs, right-aligned for currency/amounts, centered for status badges and action icons.
- **Status Badges**:
  - `Paid` / `Won` / `Completed`: Soft green badge (`bg-emerald-100 text-emerald-800 border border-emerald-200`).
  - `Pending` / `Proposal` / `Draft`: Soft amber/coral badge (`bg-amber-100 text-amber-800 border border-amber-200`).
  - `Unpaid` / `Lost`: Soft red badge (`bg-rose-100 text-rose-800 border border-rose-200`).

### 2.3 Financial Statements (Balance Sheet & Profit & Loss)
- **Top Actions**: Action buttons on top right (`Show Filters` with filter funnel, `Download PDF` with PDF badge).
- **Statement Tabs**: Clean underline tabs (`Balance Sheet`, `Profit & Loss`).
- **Document Header**: Centered entity name (`KREATIWIT AGENCYOS`), subtitle (`Balance Sheet`), and active date range (`01 Apr 25 to 31 Mar 26`).
- **Dual-Column Ledger Layout**:
  - Left column: Liabilities / Expenses (`Liabilities as at ...`).
  - Right column: Assets / Income (`Assets as at ...`).
  - Subtotals and balancing row (`Total Liabilities`, `Total Assets`, `Difference in opening balances: ₹0.00`).

### 2.4 Invoice & Estimate Line Item Form
- **Line Item Row**: Inputs for Item Description, Scope/Code, Quantity, Rate (₹), Discount (%), Tax (%), Amount (₹), and Remove button.
- **Add Item Action**: Dashed blue outline button (`+ Add Item`).
- **Financial Calculation Summary**: Subtotal, CGST, SGST, Auto Round-Off, Net Total.
