# Design Audit — Teleport OS Vendor

> Audited against `vendor/DESIGN.md` + `admin/DESIGN.md`.
> Date: 2026-05-15 (updated)

## Findings

### [HIGH] JobDetailPage.tsx — Status Action Bar missing per-state tinted backgrounds

**File:** `vendor/src/pages/JobDetailPage.tsx` line 425  
**Current:**
```tsx
<div style={{ border: '1px solid #e5e7eb', borderRadius: 4, ... }}>
  <StateCell ... />
  {/* action buttons */}
</div>
```
**Spec** (`vendor/DESIGN.md` → Status Action Bar table):

| Status | Bar Background |
|--------|----------------|
| Pending | `#f9fafb` |
| In Progress | `rgba(21,44,255,0.04)` |
| Completed | `#fefce8` |
| Verified | `#f0fdf4` |
| Cancelled | `#fef2f2` |

**Regression guard note** in `vendor/DESIGN.md` says "do not reintroduce: Single bordered action row in Status Action Bar (no stacked tinted containers)". The current implementation IS the flat-bordered single row — i.e., the pattern the guard prohibits. The correct pattern is one tinted container per status, with no second container stacked below it for the reason text (reason stays inline as plain text, as currently implemented).

**Fix:** Add a `background` property to the action bar container, derived from `job.status` and `job.verificationStatus`. Keep the border and radius. The reason sublines (cancel, rejection, completion remark) correctly remain as flat inline text below the bar — do not tint those.

```tsx
function getActionBarBg(job: { status: string; verificationStatus: string }): string {
  if (job.status === 'Cancelled') return '#fef2f2';
  if (job.verificationStatus === 'Verified') return '#f0fdf4';
  if (job.status === 'Completed') return '#fefce8';
  if (job.status === 'In Progress') return 'rgba(21,44,255,0.04)';
  return '#f9fafb'; // Pending
}
```

---

### [HIGH] FleetPage.tsx — Non-standard blue-tinted surface `#fafbff`

**File:** `vendor/src/pages/FleetPage.tsx` lines 430, 490, 636, 688  
**Current:** Add-form table rows use `background: '#fafbff'` — a slightly blue-tinted white not in the approved surface palette.  
**Approved surfaces:** `#ffffff` (cards/table), `#f9fafb` (raised/headers/expanded), `#f3f4f6` (page). No blue-tinted surface.  
**Fix:** Replace `#fafbff` with `#f9fafb` (the standard raised/secondary surface).

```tsx
// Before
<tr style={{ background: '#fafbff' }}>
// After
<tr style={{ background: '#f9fafb' }}>
```

---

### [MEDIUM] FleetPage.tsx — Blue icon container on empty states

**File:** `vendor/src/pages/FleetPage.tsx` lines 607, 792  
**Current:** Empty-state icon box uses `background: 'rgba(21,44,255,0.08)'` with a `Truck` icon in `#152CFF`.  
**Rule** (`admin/DESIGN.md` → Colors): `#152CFF` is **interactive only** — primary buttons, links, active nav, the In-Progress dot. Decorative icon containers are not an interactive context.  
**Fix:** Replace with a neutral surface. Options:
- Remove the icon container entirely — use only the `<p>` text (simplest, most consistent with the sparse empty-state pattern in `vendor/DESIGN.md`)
- OR use `background: '#f3f4f6'` with a `color: '#9ca3af'` icon (neutral, no accent)

---

### [LOW] JobDetailPage.tsx — Lucide Truck icon embedded in section title

**File:** `vendor/src/pages/JobDetailPage.tsx` line 269  
**Current:**
```tsx
<div style={sectionTitle}>
  <Truck size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
  Driver &amp; Vehicle
</div>
```
**Rule** (`admin/DESIGN.md` → Spacing): Section titles are `9px/700 uppercase` plain text — no icon components.  
**Fix:** Remove the `<Truck />` import and icon from the section title. The label "DRIVER & VEHICLE" at 9px uppercase is already unambiguous.

---

### [LOW] JobDetailPage.tsx — Proof upload `+ Add` button visible in Completed state

**File:** `vendor/src/pages/JobDetailPage.tsx` line 100  
**Current:**
```tsx
const canUpload = job.status === 'Pending' || job.status === 'In Progress' || job.status === 'Completed';
```
**Spec** (`vendor/DESIGN.md` → Proof of Service): "Upload available in Pending and In Progress only. Hidden/disabled in Completed, Verified, Cancelled."

The `canUpload` flag is used in `renderProofs()` to show the `+ Add` button. Including `'Completed'` lets vendors add more proof files after the job is already complete — a state where the admin is reviewing the existing proof. The re-upload path (when `verificationStatus === 'Rejected'`) is correctly handled separately in the action bar.

**Fix:**
```tsx
const canUpload = job.status === 'Pending' || job.status === 'In Progress';
```

---

### [LOW] MyJobsPage.tsx — Service label shown alongside service code in table

**File:** `vendor/src/pages/MyJobsPage.tsx` lines 319–323  
**Current:** Service column shows both `job.service.code` (bold mono gray) and `job.service.label` (lighter mono gray) side by side, e.g., "FM FM Trucking".  
**Spec** (`vendor/DESIGN.md` → Job List): "Service tag: mono gray (`#6b7280`, 10px JetBrains Mono) — no pill, no blue". Implies code only.  
**Fix:** Remove the `{job.service.label && ...}` span. The code alone (FM / EC / CS / CR / OH) is sufficient; the label is visible in the job detail header and adds visual noise in the compact table.

---

## Non-Issues (confirmed correct)

- **No shadow usage** — all three pages use borders only (confirmed by grep). ✓
- **Segment pill border-radius: 4px** — correct per spec. ✓
- **Service filter pills: 99px border-radius** — correct (the only full-round exception). ✓
- **Status/Verification cells** — `StatusCell` + `VerificationCell` components correctly implement dot + label + timestamp + optional reason subline. ✓
- **No row tinting** — no background colors on table rows for status states. ✓
- **Export button border-radius: 6px** — correct for buttons. ✓
- **Fleet table border-radius: 6px** — correct for table containers. ✓
- **Segment pill active states** — To verify/Verified/Cancelled use state-colored borders/backgrounds; All/Pending/In Progress use dark fill. ✓
