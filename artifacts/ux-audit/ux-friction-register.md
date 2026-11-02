# UX Friction Register: KREATIWIT AgencyOS

**Audit Methodology:** Adversarial real-world testing across desktop, tablet, and mobile breakpoints.

---

## Registered Friction Items

| ID | Location | Friction Description | Severity | Root Cause | Proposed Solution | Status |
|---|---|---|---|---|---|---|
| **FR-01** | Topbar Action Cluster | Multiple disparate button colors (`#49B3FC` vs `#1A253C`) creating visual tension | Medium | Separate ad-hoc classes on quick action buttons | Unify topbar buttons: single dark navy primary `+ Deal` (`#1A253C`) with subtle neutral secondaries | **RESOLVED** |
| **FR-02** | Dashboard Specialist Capacity | Team member avatar badges use `bg-slate-900` which blends into dark mode card background | Low | Hardcoded dark background class on avatar | Use `bg-slate-800 dark:bg-slate-700` and clear border for contrast | **RESOLVED** |
| **FR-03** | Opportunity SKU Copy | Clicking SKU copy icon did not show immediate inline micro-feedback | Medium | Async clipboard call without instant visual state toggle | Add visual `Copied!` tooltip or checkmark state on chip with 1.5s timeout | **RESOLVED** |
| **FR-04** | Table Row Hover Feedback | ERP table rows had subtle hover that was barely discernible in dark mode | Low | Low opacity background tint on dark theme | Enhance `.erp-table-row:hover` background with `--erp-table-row-hover: rgba(255,255,255,0.04)` | **RESOLVED** |
| **FR-05** | Lead to Opportunity Conversion | Custom client fields needed guarantee of persistence under all paths | High | Form state resetting if parent modal re-rendered | Verified and locked atomic client conversion repository with transactional guarantees | **RESOLVED** |
| **FR-06** | Financial Statement Print / Export | Browser print lacked dedicated print stylesheet margins | Low | Default media print styles without margins | Add `@media print` rules in `theme.css` to hide sidebar/topbar and expand ledger | **RESOLVED** |
| **FR-07** | Mobile Navigation Drawer | Menu overlay needed smooth sliding transition and backdrop dismissal | Medium | Abrupt show/hide without transition | Added smooth translate transition and backdrop touch dismiss | **RESOLVED** |
