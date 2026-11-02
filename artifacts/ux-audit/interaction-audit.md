# Interaction Design & Micro-Interaction Audit

**Target:** KREATIWIT AgencyOS Micro-Interactions  
**Auditor:** Interaction Designer & Micro-Interaction Specialist  

---

## 1. Audited Interaction States

### 1.1 Buttons & Controls
- **Hover State**: Smooth background transition (150ms ease) with subtle brightness increase.
- **Active / Pressed State**: Tactile depression via `:active:scale-[0.98]` gives clear feedback of registered clicks.
- **Focus Ring**: Accessible 2px outline in `--accent` with 2px offset (`:focus-visible`).
- **Loading State**: Buttons transition to disabled state with animated spinner or inline text change.

### 1.2 Data Tables
- **Header Band**: Pale blue tint `#EBF2FB` (light) / `#1E293B` (dark) with crisp bold typography.
- **Row Interaction**: Hover state with subtle highlight; clicking row opens item details where supported.
- **Multi-Select Checkboxes**: Select-all header checkbox with bulk actions toolbar.
- **Action Buttons**: Visible `Edit`, `Mark Paid`, and PDF export icons.

### 1.3 Modals & Dialogs
- **Entry & Exit**: Smooth fade-in with backdrop blur.
- **Focus Management**: Auto-focus on primary form field upon opening.
- **Dismissal**: `Escape` key capture, top-right `×` close button, and backdrop click outside.
- **Form Retention**: Validated data is preserved if validation errors occur.

### 1.4 Notification & Toast System
- **Placement**: Fixed bottom-right viewport (`z-50`).
- **Semantic Types**: Success (emerald), Error (rose), Info (blue), Warning (amber).
- **Auto-dismiss**: 4000ms duration with smooth exit animation.
- **Truthfulness**: Toasts only announce real persisted changes, never false positives.

### 1.5 SKU Copy Chip Micro-interaction
- **Default**: Pill with copy icon and opportunity sequence number (`KW-OPP-XXXXXX`).
- **On Click**: Copies sequence to clipboard, shows green checkmark and "Copied!" feedback, reverts in 1500ms.

